import { query } from '../db/pool.js';

export const SHIPPING_CENTS = 2490;
export const FREE_SHIPPING_FROM_CENTS = 29900;

// Builds the cart with totals. Business rules live here so the API and the
// checkout use exactly the same math.
export async function loadCart(userId, db = { query }) {
  const { rows } = await db.query(
    `SELECT ci.product_id, ci.color, ci.quantity, p.name, p.sku, p.price_cents, p.stock, p.image_url
     FROM cart_items ci JOIN products p ON p.id = ci.product_id
     WHERE ci.user_id = $1 ORDER BY p.name, ci.color`,
    [userId]
  );
  const items = rows.map((r) => ({
    productId: r.product_id,
    sku: r.sku,
    name: r.name,
    color: r.color || null,
    quantity: r.quantity,
    unitPrice: r.price_cents / 100,
    lineTotal: (r.price_cents * r.quantity) / 100,
    stock: r.stock,
    imageUrl: r.image_url,
    ...(r.quantity > r.stock ? { warning: r.stock === 0 ? 'Produto esgotado' : `Só restam ${r.stock} em estoque` } : {}),
  }));
  const subtotalCents = rows.reduce((s, r) => s + r.price_cents * r.quantity, 0);

  const couponRow = (await db.query(
    'SELECT c.* FROM cart_coupons cc JOIN coupons c ON c.code = cc.code WHERE cc.user_id = $1',
    [userId]
  )).rows[0];

  let discountCents = 0;
  let freeShipping = false;
  let coupon = null;
  if (couponRow) {
    const meetsMin = subtotalCents >= couponRow.min_subtotal_cents;
    coupon = { code: couponRow.code, applied: meetsMin };
    if (!meetsMin) coupon.warning = `Cupom exige subtotal mínimo de R$ ${(couponRow.min_subtotal_cents / 100).toFixed(2)}`;
    else if (couponRow.kind === 'percent') discountCents = Math.round((subtotalCents * couponRow.value) / 100);
    else if (couponRow.kind === 'free_shipping') freeShipping = true;
  }

  const afterDiscount = subtotalCents - discountCents;
  const shippingCents = items.length === 0 || freeShipping || afterDiscount >= FREE_SHIPPING_FROM_CENTS ? 0 : SHIPPING_CENTS;

  return {
    items,
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    coupon,
    subtotal: subtotalCents / 100,
    discount: discountCents / 100,
    shipping: shippingCents / 100,
    total: (afterDiscount + shippingCents) / 100,
    cents: { subtotalCents, discountCents, shippingCents, totalCents: afterDiscount + shippingCents },
  };
}

export const publicCart = ({ cents, ...cart }) => cart;
