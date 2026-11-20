import { Router } from 'express';
import { query } from '../db/pool.js';
import { ApiError, badRequest, notFound, wrap } from '../lib/errors.js';
import { loadCart, publicCart } from '../lib/cart.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const MAX_PER_ITEM = 10;

const send = async (req, res, status = 200) => res.status(status).json(publicCart(await loadCart(req.user.id)));

router.get('/', wrap((req, res) => send(req, res)));

async function checkProduct(productId, color, newQuantity) {
  const { rows } = await query('SELECT * FROM products WHERE id = $1', [productId]);
  const p = rows[0];
  if (!p) throw notFound('Produto');
  if (p.colors.length && !color) throw badRequest('Escolha uma cor', [{ field: 'color', message: 'obrigatório para este produto' }]);
  if (color && !p.colors.includes(color)) throw badRequest('Cor indisponível', [{ field: 'color', message: `use uma de: ${p.colors.join(', ') || 'nenhuma'}` }]);
  if (p.stock === 0) throw new ApiError(409, 'OUT_OF_STOCK', 'Produto esgotado');
  if (newQuantity > MAX_PER_ITEM) throw new ApiError(422, 'QUANTITY_LIMIT', `Máximo de ${MAX_PER_ITEM} unidades por item`);
  if (newQuantity > p.stock) throw new ApiError(409, 'INSUFFICIENT_STOCK', `Só temos ${p.stock} em estoque`);
}

// POST /cart/items { productId, quantity = 1, color? }  -> adds to existing quantity
router.post('/items', wrap(async (req, res) => {
  const productId = Number(req.body?.productId);
  const quantity = req.body?.quantity === undefined ? 1 : Number(req.body.quantity);
  const color = req.body?.color || '';
  if (!Number.isInteger(productId) || productId < 1) throw badRequest('productId inválido', [{ field: 'productId', message: 'obrigatório' }]);
  if (!Number.isInteger(quantity) || quantity < 1) throw badRequest('Quantidade inválida', [{ field: 'quantity', message: 'deve ser inteiro >= 1' }]);

  const current = (await query('SELECT quantity FROM cart_items WHERE user_id=$1 AND product_id=$2 AND color=$3', [req.user.id, productId, color])).rows[0];
  await checkProduct(productId, color, (current?.quantity || 0) + quantity);
  await query(
    `INSERT INTO cart_items (user_id, product_id, color, quantity) VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, product_id, color) DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`,
    [req.user.id, productId, color, quantity]
  );
  await send(req, res, 201);
}));

// PATCH /cart/items/:productId { quantity, color? } -> sets the quantity
router.patch('/items/:productId', wrap(async (req, res) => {
  const productId = Number(req.params.productId);
  const quantity = Number(req.body?.quantity);
  const color = req.body?.color || '';
  if (!Number.isInteger(quantity) || quantity < 1) throw badRequest('Quantidade inválida', [{ field: 'quantity', message: 'deve ser inteiro >= 1' }]);
  const exists = await query('SELECT 1 FROM cart_items WHERE user_id=$1 AND product_id=$2 AND color=$3', [req.user.id, productId, color]);
  if (!exists.rowCount) throw notFound('Item do carrinho');
  await checkProduct(productId, color, quantity);
  await query('UPDATE cart_items SET quantity=$4 WHERE user_id=$1 AND product_id=$2 AND color=$3', [req.user.id, productId, color, quantity]);
  await send(req, res);
}));

// DELETE /cart/items/:productId?color=Preto
router.delete('/items/:productId', wrap(async (req, res) => {
  const { rowCount } = await query(
    'DELETE FROM cart_items WHERE user_id=$1 AND product_id=$2 AND color=$3',
    [req.user.id, Number(req.params.productId) || 0, req.query.color || '']
  );
  if (!rowCount) throw notFound('Item do carrinho');
  await send(req, res);
}));

router.delete('/', wrap(async (req, res) => {
  await query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
  await query('DELETE FROM cart_coupons WHERE user_id = $1', [req.user.id]);
  await send(req, res);
}));

// POST /cart/coupon { code }
router.post('/coupon', wrap(async (req, res) => {
  const code = String(req.body?.code || '').trim().toUpperCase();
  if (!code) throw badRequest('Informe o cupom', [{ field: 'code', message: 'obrigatório' }]);
  const coupon = (await query('SELECT * FROM coupons WHERE code = $1', [code])).rows[0];
  if (!coupon) throw new ApiError(404, 'COUPON_NOT_FOUND', 'Cupom não encontrado');
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) throw new ApiError(422, 'COUPON_EXPIRED', 'Cupom expirado');

  const cart = await loadCart(req.user.id);
  if (!cart.items.length) throw new ApiError(422, 'CART_EMPTY', 'Adicione produtos antes de usar um cupom');
  if (cart.cents.subtotalCents < coupon.min_subtotal_cents) {
    throw new ApiError(422, 'COUPON_MIN_SUBTOTAL', `Cupom válido para compras a partir de R$ ${(coupon.min_subtotal_cents / 100).toFixed(2)}`);
  }
  await query(
    'INSERT INTO cart_coupons (user_id, code) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET code = EXCLUDED.code',
    [req.user.id, code]
  );
  await send(req, res);
}));

router.delete('/coupon', wrap(async (req, res) => {
  await query('DELETE FROM cart_coupons WHERE user_id = $1', [req.user.id]);
  await send(req, res);
}));

export default router;
