import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const dir = path.dirname(fileURLToPath(import.meta.url));

// Demo data. Every product, price and person here is fictional.
export const USERS = [
  { name: 'Cliente Teste', email: 'cliente@bytebug.dev', password: 'byte123', role: 'customer' },
  { name: 'Admin Teste', email: 'admin@bytebug.dev', password: 'admin123', role: 'admin' },
  { name: 'Usuário Bloqueado', email: 'bloqueado@bytebug.dev', password: 'byte123', role: 'customer', locked: true },
];

const CATEGORIES = [
  ['teclados', 'Teclados'],
  ['mouses', 'Mouses'],
  ['headsets', 'Headsets'],
  ['monitores', 'Monitores'],
  ['webcams', 'Webcams'],
  ['acessorios', 'Acessórios'],
];

// [sku, name, brand, category, price in reais, stock, colors, description]
const PRODUCTS = [
  ['U01', 'Teclado Mecânico Flaky TKL', 'Nullpoint', 'teclados', 349.9, 12, ['Preto', 'Branco'], 'Teclado tenkeyless com switches lineares e cabo USB-C removível.'],
  ['U02', 'Teclado Retry 60%', 'Nullpoint', 'teclados', 279.0, 3, ['Preto'], 'Compacto 60% com layout ABNT2 e iluminação branca.'],
  ['U03', 'Teclado Silencioso Office', 'Stacktrace', 'teclados', 129.9, 40, [], 'Teclas de membrana silenciosas e apoio de pulso integrado.'],
  ['U04', 'Teclado Sem Fio Hotfix', 'Stacktrace', 'teclados', 199.9, 0, ['Cinza'], 'Conexão Bluetooth em até três dispositivos.'],
  ['R01', 'Mouse Gamer Timeout', 'Nullpoint', 'mouses', 189.9, 25, ['Preto', 'Branco'], 'Sensor óptico de 16.000 DPI e seis botões programáveis.'],
  ['R02', 'Mouse Vertical Ergonômico', 'Stacktrace', 'mouses', 149.0, 8, [], 'Pegada vertical que reduz a torção do punho.'],
  ['R03', 'Mouse Sem Fio Breakpoint', 'Assertiva', 'mouses', 99.9, 60, ['Preto', 'Azul', 'Rosa'], 'Receptor USB nano e bateria para 12 meses.'],
  ['R04', 'Mouse Pad Grande 90x40', 'Assertiva', 'mouses', 79.9, 2, [], 'Superfície de tecido com bordas costuradas.'],
  ['H01', 'Headset 404 Surround', 'Nullpoint', 'headsets', 429.0, 10, ['Preto'], 'Som surround virtual 7.1 e microfone removível.'],
  ['H02', 'Headset Sem Fio Rollback', 'Stacktrace', 'headsets', 599.9, 4, ['Preto', 'Branco'], 'Bateria de 30 horas e cancelamento de ruído no microfone.'],
  ['H03', 'Fone Intra-auricular Ping', 'Assertiva', 'headsets', 89.9, 0, ['Branco'], 'Fone com fio e controle de volume no cabo.'],
  ['H04', 'Headset USB Daily', 'Assertiva', 'headsets', 159.9, 30, [], 'Feito para reuniões, com botão de mudo no fio.'],
  ['M01', 'Monitor 24" Full HD Staging', 'Pixelado', 'monitores', 899.0, 7, [], 'Painel IPS de 75 Hz com bordas finas.'],
  ['M02', 'Monitor 27" QHD Release', 'Pixelado', 'monitores', 1799.0, 5, [], 'Resolução 2560x1440 e 144 Hz.'],
  ['M03', 'Monitor 34" Ultrawide Merge', 'Pixelado', 'monitores', 2899.0, 1, [], 'Tela curva 21:9 para duas janelas lado a lado.'],
  ['M04', 'Suporte Articulado Duplo', 'Assertiva', 'monitores', 249.9, 15, [], 'Braços a gás para dois monitores de até 32".'],
  ['W01', 'Webcam Full HD Standup', 'Stacktrace', 'webcams', 249.0, 18, [], 'Foco automático e microfone duplo.'],
  ['W02', 'Webcam 4K Demo Day', 'Pixelado', 'webcams', 699.0, 0, [], 'Sensor 4K com correção de luz.'],
  ['W03', 'Ring Light de Mesa', 'Assertiva', 'webcams', 119.9, 22, [], 'Três tons de luz e haste ajustável.'],
  ['A01', 'Hub USB-C 7 em 1 Pipeline', 'Nullpoint', 'acessorios', 229.9, 14, [], 'HDMI 4K, três USB-A, leitor SD e carregamento.'],
  ['A02', 'Cabo USB-C 2 m Trançado', 'Assertiva', 'acessorios', 39.9, 100, ['Preto', 'Branco'], 'Carregamento rápido de 60 W.'],
  ['A03', 'SSD Externo 1 TB Backup', 'Stacktrace', 'acessorios', 549.0, 9, [], 'Leitura de até 1.050 MB/s.'],
  ['A04', 'Mochila para Notebook Sprint', 'Assertiva', 'acessorios', 189.0, 11, ['Preto', 'Cinza'], 'Compartimento acolchoado para até 15,6".'],
  ['A05', 'Patinha Antiderrapante (kit)', 'Assertiva', 'acessorios', 19.9, 200, [], 'Kit com oito pés de silicone para notebook.'],
];

const COUPONS = [
  // code, kind, value, min subtotal (reais), expires (null = never, past date = expired)
  ['BYTE10', 'percent', 10, 0, null],
  ['FRETEGRATIS', 'free_shipping', 0, 0, null],
  ['MIN500', 'percent', 15, 500, null],
  ['EXPIRADO', 'percent', 50, 0, '2020-01-01'],
];

export async function migrate() {
  const sql = fs.readFileSync(path.join(dir, 'schema.sql'), 'utf8');
  await pool.query(sql);
}

export async function seed() {
  await pool.query(
    'TRUNCATE order_items, orders, cart_coupons, cart_items, coupons, products, categories, refresh_tokens, users RESTART IDENTITY CASCADE'
  );
  for (const u of USERS) {
    await pool.query(
      'INSERT INTO users (name, email, password_hash, role, locked) VALUES ($1, $2, $3, $4, $5)',
      [u.name, u.email, bcrypt.hashSync(u.password, 8), u.role, Boolean(u.locked)]
    );
  }
  for (const [slug, name] of CATEGORIES) {
    await pool.query('INSERT INTO categories (slug, name) VALUES ($1, $2)', [slug, name]);
  }
  for (const [sku, name, brand, cat, price, stock, colors, description] of PRODUCTS) {
    await pool.query(
      `INSERT INTO products (sku, name, brand, category_id, price_cents, stock, colors, description, image_url)
       VALUES ($1, $2, $3, (SELECT id FROM categories WHERE slug = $4), $5, $6, $7, $8, $9)`,
      [sku, name, brand, cat, Math.round(price * 100), stock, colors, description, `/products/${cat}.svg`]
    );
  }
  for (const [code, kind, value, min, expires] of COUPONS) {
    await pool.query(
      'INSERT INTO coupons (code, kind, value, min_subtotal_cents, expires_at) VALUES ($1, $2, $3, $4, $5)',
      [code, kind, value, min * 100, expires]
    );
  }
}

// Seeds only when the database is empty, so restarting the API keeps your data.
export async function seedIfEmpty() {
  const { rows } = await pool.query('SELECT count(*)::int AS n FROM users');
  if (rows[0].n === 0) await seed();
}
