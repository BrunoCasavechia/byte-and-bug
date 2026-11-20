import { brl } from './api.js';

// Retail conventions: 5% off on Pix, up to 10 interest-free installments.
export const PIX_DISCOUNT = 0.05;
export const pixPrice = (price) => Math.round(price * (1 - PIX_DISCOUNT) * 100) / 100;
export const installments = (price) => {
  const n = price >= 100 ? 10 : Math.max(1, Math.floor(price / 10));
  return { n, value: Math.round((price / n) * 100) / 100, label: `${n}x de ${brl(price / n)} sem juros` };
};
export const discountPct = (price, oldPrice) => (oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : 0);
