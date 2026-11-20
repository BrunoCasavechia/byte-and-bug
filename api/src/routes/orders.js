import { Router } from 'express';
import { pool, query } from '../db/pool.js';
import { ApiError, badRequest, notFound, wrap } from '../lib/errors.js';
import { loadCart } from '../lib/cart.js';
import { isCardNumber, isCep, isCpf, isExpiry, required, validate } from '../lib/validate.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// Card that always gets declined, for negative tests (same idea as payment sandboxes).
export const DECLINED_CARD = '4000000000000002';

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const toOrder = (o, items) => ({
  id: o.id,
  status: o.status,
  createdAt: o.created_at,
  couponCode: o.coupon_code,
  subtotal: o.subtotal_cents / 100,
  discount: o.discount_cents / 100,
  shipping: o.shipping_cents / 100,
  total: o.total_cents / 100,
  shippingAddress: o.shipping_address,
  cardLast4: o.card_last4,
  items: items.map((i) => ({ productId: i.product_id, name: i.name, color: i.color || null, unitPrice: i.unit_price_cents / 100, quantity: i.quantity })),
});

router.post('/', wrap(async (req, res) => {
  const shipping = req.body?.shipping || {};
  const payment = req.body?.payment || {};
  const details = [
    ...validate(shipping, {
      fullName: [required, (v) => (String(v).trim().split(/\s+/).length >= 2 ? null : 'informe nome e sobrenome')],
      cpf: [required, isCpf],
      cep: [required, isCep],
      street: [required],
      number: [required],
      city: [required],
      state: [required, (v) => (UFS.includes(String(v).toUpperCase()) ? null : 'UF inválida')],
    }).map((d) => ({ ...d, field: `shipping.${d.field}` })),
    ...validate(payment, {
      cardNumber: [required, isCardNumber],
      cardName: [required],
      expiry: [required, isExpiry],
      cvv: [required, (v) => (/^\d{3}$/.test(String(v)) ? null : 'CVV deve ter 3 dígitos')],
    }).map((d) => ({ ...d, field: `payment.${d.field}` })),
  ];
  if (details.length) throw badRequest('Revise os dados do pedido', details);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cart = await loadCart(req.user.id, client);
    if (!cart.items.length) throw new ApiError(422, 'CART_EMPTY', 'Seu carrinho está vazio');

    for (const item of cart.items) {
      const { rows } = await client.query('SELECT stock FROM products WHERE id = $1 FOR UPDATE', [item.productId]);
      if (rows[0].stock < item.quantity) {
        throw new ApiError(409, 'INSUFFICIENT_STOCK', `Estoque insuficiente para ${item.name}`, [{ productId: item.productId, available: rows[0].stock }]);
      }
    }
    const card = String(payment.cardNumber).replace(/\s/g, '');
    if (card === DECLINED_CARD) throw new ApiError(402, 'PAYMENT_DECLINED', 'Pagamento recusado pela operadora');

    const c = cart.cents;
    const { rows } = await client.query(
      `INSERT INTO orders (user_id, subtotal_cents, discount_cents, shipping_cents, total_cents, coupon_code, shipping_address, card_last4)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.id, c.subtotalCents, c.discountCents, c.shippingCents, c.totalCents,
        cart.coupon?.applied ? cart.coupon.code : null,
        { ...shipping, state: String(shipping.state).toUpperCase() }, card.slice(-4)]
    );
    const order = rows[0];
    for (const item of cart.items) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, name, color, unit_price_cents, quantity) VALUES ($1, $2, $3, $4, $5, $6)',
        [order.id, item.productId, item.name, item.color || '', Math.round(item.unitPrice * 100), item.quantity]
      );
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.productId]);
    }
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
    await client.query('DELETE FROM cart_coupons WHERE user_id = $1', [req.user.id]);
    await client.query('COMMIT');

    const items = (await query('SELECT * FROM order_items WHERE order_id = $1', [order.id])).rows;
    res.status(201).json(toOrder(order, items));
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

// GET /orders            -> your orders
// GET /orders?all=true   -> every order (admin only)
router.get('/', wrap(async (req, res) => {
  const all = req.query.all === 'true';
  if (all && req.user.role !== 'admin') throw new ApiError(403, 'FORBIDDEN', 'Só administradores veem todos os pedidos');
  const { rows } = all
    ? await query('SELECT * FROM orders ORDER BY id DESC')
    : await query('SELECT * FROM orders WHERE user_id = $1 ORDER BY id DESC', [req.user.id]);
  const out = [];
  for (const o of rows) out.push(toOrder(o, (await query('SELECT * FROM order_items WHERE order_id = $1', [o.id])).rows));
  res.json(out);
}));

router.get('/:id', wrap(async (req, res) => {
  const o = (await query('SELECT * FROM orders WHERE id = $1', [Number(req.params.id) || 0])).rows[0];
  if (!o) throw notFound('Pedido');
  if (o.user_id !== req.user.id && req.user.role !== 'admin') {
    throw new ApiError(403, 'FORBIDDEN', 'Este pedido não é seu');
  }
  res.json(toOrder(o, (await query('SELECT * FROM order_items WHERE order_id = $1', [o.id])).rows));
}));

export default router;
