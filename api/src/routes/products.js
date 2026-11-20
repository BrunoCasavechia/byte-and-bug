import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { config } from '../config.js';
import { query } from '../db/pool.js';
import { ApiError, badRequest, notFound, wrap } from '../lib/errors.js';
import { required, validate } from '../lib/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

fs.mkdirSync(config.uploadDir, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: config.uploadDir,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype);
    cb(ok ? null : new ApiError(415, 'UNSUPPORTED_FILE', 'Envie uma imagem PNG, JPG ou WEBP'), ok);
  },
});

const SELECT = `SELECT p.*, c.slug AS category_slug, c.name AS category_name
                FROM products p JOIN categories c ON c.id = p.category_id`;

export const toProduct = (r) => ({
  id: r.id,
  sku: r.sku,
  name: r.name,
  description: r.description,
  brand: r.brand,
  category: { slug: r.category_slug, name: r.category_name },
  price: r.price_cents / 100,
  stock: r.stock,
  inStock: r.stock > 0,
  colors: r.colors,
  imageUrl: r.image_url,
});

const SORTS = {
  relevance: 'p.id ASC',
  price_asc: 'p.price_cents ASC, p.id ASC',
  price_desc: 'p.price_cents DESC, p.id ASC',
  name_asc: 'p.name ASC',
  name_desc: 'p.name DESC',
};

// GET /products?q=&category=&brand=&minPrice=&maxPrice=&inStock=true&sort=price_asc&page=1&limit=12
router.get('/', wrap(async (req, res) => {
  const { q, category, brand, minPrice, maxPrice, inStock } = req.query;
  const sort = req.query.sort || 'relevance';
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 12);

  const details = [];
  if (!SORTS[sort]) details.push({ field: 'sort', message: `use um de: ${Object.keys(SORTS).join(', ')}` });
  if (!Number.isInteger(page) || page < 1) details.push({ field: 'page', message: 'deve ser inteiro >= 1' });
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) details.push({ field: 'limit', message: 'deve ser inteiro entre 1 e 50' });
  if (minPrice !== undefined && Number.isNaN(Number(minPrice))) details.push({ field: 'minPrice', message: 'deve ser número' });
  if (maxPrice !== undefined && Number.isNaN(Number(maxPrice))) details.push({ field: 'maxPrice', message: 'deve ser número' });
  if (details.length) throw badRequest('Parâmetros de busca inválidos', details);

  const where = [];
  const params = [];
  const add = (sql, value) => { params.push(value); where.push(sql.replaceAll('?', `$${params.length}`)); };
  if (q) add('(p.name ILIKE ? OR p.brand ILIKE ? OR p.sku ILIKE ?)', `%${q}%`);
  if (category) add('c.slug = ?', category);
  if (brand) add('p.brand = ?', brand);
  if (minPrice !== undefined) add('p.price_cents >= ?', Math.round(Number(minPrice) * 100));
  if (maxPrice !== undefined) add('p.price_cents <= ?', Math.round(Number(maxPrice) * 100));
  if (inStock === 'true') where.push('p.stock > 0');
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = (await query(`SELECT count(*)::int AS n FROM products p JOIN categories c ON c.id = p.category_id ${whereSql}`, params)).rows[0].n;
  params.push(limit, (page - 1) * limit);
  const { rows } = await query(
    `${SELECT} ${whereSql} ORDER BY ${SORTS[sort]} LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  res.json({ items: rows.map(toProduct), page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
}));

router.get('/brands', wrap(async (_req, res) => {
  const { rows } = await query('SELECT DISTINCT brand FROM products ORDER BY brand');
  res.json(rows.map((r) => r.brand));
}));

router.get('/:id', wrap(async (req, res) => {
  const { rows } = await query(`${SELECT} WHERE p.id = $1`, [Number(req.params.id) || 0]);
  if (!rows[0]) throw notFound('Produto');
  res.json(toProduct(rows[0]));
}));

// ---------- Admin only ----------

const productRules = {
  sku: [required, (v) => (/^[A-Z]\d{2,3}$/.test(String(v)) ? null : 'formato: letra maiúscula + 2 ou 3 dígitos (ex.: U12)')],
  name: [required, (v) => (String(v).trim().length >= 3 ? null : 'mínimo de 3 caracteres')],
  brand: [required],
  category: [required],
  price: [required, (v) => (Number(v) > 0 ? null : 'deve ser maior que zero')],
  stock: [(v) => (v === undefined || (Number.isInteger(Number(v)) && Number(v) >= 0) ? null : 'deve ser inteiro >= 0')],
};

async function categoryId(slug) {
  const { rows } = await query('SELECT id FROM categories WHERE slug = $1', [slug]);
  if (!rows[0]) throw badRequest('Categoria inexistente', [{ field: 'category', message: 'categoria não existe' }]);
  return rows[0].id;
}

function conflictFrom(err) {
  if (err.code === '23505') {
    const field = err.constraint?.includes('sku') ? 'sku' : 'name';
    return new ApiError(409, 'DUPLICATE_PRODUCT', `Já existe um produto com este ${field === 'sku' ? 'SKU' : 'nome'}`);
  }
  return err;
}

router.post('/', requireAuth, requireRole('admin'), wrap(async (req, res) => {
  const details = validate(req.body, productRules);
  if (details.length) throw badRequest('Dados do produto inválidos', details);
  const b = req.body;
  try {
    const { rows } = await query(
      `INSERT INTO products (sku, name, description, brand, category_id, price_cents, stock, colors)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [b.sku, String(b.name).trim(), b.description || '', b.brand, await categoryId(b.category),
        Math.round(Number(b.price) * 100), Number(b.stock || 0), Array.isArray(b.colors) ? b.colors : []]
    );
    const created = (await query(`${SELECT} WHERE p.id = $1`, [rows[0].id])).rows[0];
    res.status(201).json(toProduct(created));
  } catch (err) { throw conflictFrom(err); }
}));

router.put('/:id', requireAuth, requireRole('admin'), wrap(async (req, res) => {
  const details = validate(req.body, productRules);
  if (details.length) throw badRequest('Dados do produto inválidos', details);
  const b = req.body;
  try {
    const { rowCount } = await query(
      `UPDATE products SET sku=$1, name=$2, description=$3, brand=$4, category_id=$5, price_cents=$6, stock=$7, colors=$8 WHERE id=$9`,
      [b.sku, String(b.name).trim(), b.description || '', b.brand, await categoryId(b.category),
        Math.round(Number(b.price) * 100), Number(b.stock || 0), Array.isArray(b.colors) ? b.colors : [], Number(req.params.id) || 0]
    );
    if (!rowCount) throw notFound('Produto');
  } catch (err) { throw conflictFrom(err); }
  res.json(toProduct((await query(`${SELECT} WHERE p.id = $1`, [Number(req.params.id)])).rows[0]));
}));

// PATCH only changes stock or price, handy for quick test setup.
router.patch('/:id', requireAuth, requireRole('admin'), wrap(async (req, res) => {
  const sets = [];
  const params = [];
  if (req.body.stock !== undefined) {
    if (!Number.isInteger(Number(req.body.stock)) || Number(req.body.stock) < 0) throw badRequest('Estoque inválido', [{ field: 'stock', message: 'deve ser inteiro >= 0' }]);
    params.push(Number(req.body.stock)); sets.push(`stock = $${params.length}`);
  }
  if (req.body.price !== undefined) {
    if (!(Number(req.body.price) > 0)) throw badRequest('Preço inválido', [{ field: 'price', message: 'deve ser maior que zero' }]);
    params.push(Math.round(Number(req.body.price) * 100)); sets.push(`price_cents = $${params.length}`);
  }
  if (!sets.length) throw badRequest('Envie stock e/ou price');
  params.push(Number(req.params.id) || 0);
  const { rowCount } = await query(`UPDATE products SET ${sets.join(', ')} WHERE id = $${params.length}`, params);
  if (!rowCount) throw notFound('Produto');
  res.json(toProduct((await query(`${SELECT} WHERE p.id = $1`, [Number(req.params.id)])).rows[0]));
}));

router.delete('/:id', requireAuth, requireRole('admin'), wrap(async (req, res) => {
  const id = Number(req.params.id) || 0;
  const used = await query('SELECT 1 FROM order_items WHERE product_id = $1 LIMIT 1', [id]);
  if (used.rowCount) throw new ApiError(409, 'PRODUCT_HAS_ORDERS', 'Produto já tem pedidos e não pode ser excluído. Zere o estoque');
  const { rowCount } = await query('DELETE FROM products WHERE id = $1', [id]);
  if (!rowCount) throw notFound('Produto');
  res.status(204).end();
}));

// multipart/form-data with a field named "image"
router.post('/:id/image', requireAuth, requireRole('admin'), upload.single('image'), wrap(async (req, res) => {
  if (!req.file) throw badRequest('Envie o arquivo no campo "image"', [{ field: 'image', message: 'obrigatório' }]);
  const url = `/uploads/${req.file.filename}`;
  const { rowCount } = await query('UPDATE products SET image_url = $1 WHERE id = $2', [url, Number(req.params.id) || 0]);
  if (!rowCount) throw notFound('Produto');
  res.json(toProduct((await query(`${SELECT} WHERE p.id = $1`, [Number(req.params.id)])).rows[0]));
}));

export default router;
