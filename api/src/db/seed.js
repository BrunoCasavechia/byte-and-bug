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

// [sku, name, brand, category, price, stock, colors, description, oldPrice|null, rating, ratingCount]
// Brands and products are fictional; ratings are demo data.
const PRODUCTS = [
  ['U01', 'Teclado Mecânico Velkor K75 Pro TKL', 'Velkor', 'teclados', 349.9, 12, ['Preto', 'Branco'], 'Teclado mecânico tenkeyless com switches lineares pré-lubrificados, RGB por tecla e cabo USB-C removível.', 429.9, 4.8, 1284],
  ['U02', 'Teclado Mecânico Velkor K60 Compacto 60%', 'Velkor', 'teclados', 279.0, 3, ['Preto'], 'Layout 60% ABNT2, hot-swap e iluminação branca. Ideal para setups compactos.', null, 4.6, 532],
  ['U03', 'Teclado Kaori Slim K2 Silencioso', 'Kaori', 'teclados', 129.9, 40, [], 'Teclas baixas de membrana silenciosa e apoio de pulso integrado, para escritório.', 159.9, 4.4, 2105],
  ['U04', 'Teclado Sem Fio Kaori Air K5', 'Kaori', 'teclados', 199.9, 0, ['Cinza'], 'Conexão Bluetooth com até três dispositivos e bateria recarregável de 6 meses.', null, 4.5, 876],
  ['R01', 'Mouse Gamer Velkor M8 16.000 DPI', 'Velkor', 'mouses', 189.9, 25, ['Preto', 'Branco'], 'Sensor óptico de 16.000 DPI, seis botões programáveis e apenas 63 g.', 239.9, 4.7, 3410],
  ['R02', 'Mouse Vertical Kaori Ergo V1', 'Kaori', 'mouses', 159.9, 8, [], 'Pegada vertical de 57° que reduz a torção do punho em longas jornadas.', null, 4.5, 418],
  ['R03', 'Mouse Sem Fio Kaori Air M3', 'Kaori', 'mouses', 119.9, 60, ['Preto', 'Azul', 'Rosa'], 'Receptor USB nano, cliques silenciosos e bateria para 12 meses.', 139.9, 4.6, 1957],
  ['R04', 'Mousepad Velkor Glide XL 90x40', 'Velkor', 'mouses', 89.9, 2, [], 'Superfície de tecido de alta velocidade com bordas costuradas e base antiderrapante.', null, 4.8, 990],
  ['H01', 'Headset Gamer Norden H7 Surround 7.1', 'Norden', 'headsets', 429.0, 10, ['Preto'], 'Som surround virtual 7.1, drivers de 50 mm e microfone removível com cancelamento de ruído.', 499.0, 4.7, 1520],
  ['H02', 'Headset Sem Fio Norden H9 Wireless', 'Norden', 'headsets', 649.0, 4, ['Preto', 'Branco'], 'Bateria de 30 horas, conexão 2,4 GHz de baixa latência e Bluetooth simultâneo.', 749.0, 4.8, 684],
  ['H03', 'Headset Norden H3 Estéreo P2', 'Norden', 'headsets', 179.9, 0, ['Branco'], 'Leve e confortável, com conector P2 compatível com PC, console e celular.', null, 4.3, 2290],
  ['H04', 'Headset USB Kaori Call H1 com ANC', 'Kaori', 'headsets', 249.9, 30, [], 'Feito para reuniões: microfone com ANC, botão de mudo no fio e certificação para chamadas.', null, 4.5, 771],
  ['M01', 'Monitor Pixan View 24" Full HD IPS 75 Hz', 'Pixan', 'monitores', 899.0, 7, [], 'Painel IPS com bordas finas, 75 Hz e ajuste de inclinação.', 999.0, 4.6, 1843],
  ['M02', 'Monitor Gamer Pixan View 27" QHD 165 Hz', 'Pixan', 'monitores', 1799.0, 5, [], 'Resolução 2560x1440, 165 Hz e 1 ms. HDR10 e FreeSync.', 2099.0, 4.8, 962],
  ['M03', 'Monitor Pixan Curve 34" UltraWide', 'Pixan', 'monitores', 2899.0, 1, [], 'Tela curva 21:9 de 34 polegadas para duas janelas lado a lado.', null, 4.7, 311],
  ['M04', 'Monitor Pixan Work 27" 4K USB-C', 'Pixan', 'monitores', 2499.0, 6, [], 'Resolução 4K e USB-C com 65 W: um cabo só para imagem e carregamento do notebook.', 2799.0, 4.6, 205],
  ['W01', 'Webcam Pixan Cam C2 Full HD', 'Pixan', 'webcams', 249.9, 18, [], 'Full HD 1080p, foco automático e microfone duplo.', 299.9, 4.5, 1388],
  ['W02', 'Webcam Pixan Cam C4 2K Autofoco', 'Pixan', 'webcams', 449.0, 0, [], 'Sensor 2K com correção automática de luz e tampa de privacidade.', null, 4.7, 402],
  ['W03', 'Webcam Pixan Cam C1 HD 720p', 'Pixan', 'webcams', 149.9, 22, [], 'Simples e confiável para chamadas de vídeo do dia a dia.', null, 4.2, 1675],
  ['A01', 'Hub USB-C Tessel 7 em 1', 'Tessel', 'acessorios', 219.9, 14, [], 'HDMI 4K, três USB-A, leitor SD e carregamento de 100 W.', 259.9, 4.6, 1120],
  ['A02', 'Cabo USB-C Tessel Trançado 2 m', 'Tessel', 'acessorios', 49.9, 100, ['Preto', 'Branco'], 'Carregamento rápido de 60 W e capa trançada resistente.', null, 4.7, 4312],
  ['A03', 'Suporte Articulado Tessel para Monitor', 'Tessel', 'acessorios', 189.9, 9, [], 'Braço a gás para monitores de até 32" com gestão de cabos.', 229.9, 4.5, 640],
  ['A04', 'Apoio de Punho Tessel em Gel', 'Tessel', 'acessorios', 69.9, 11, ['Preto', 'Cinza'], 'Gel de memória que alivia a pressão no punho ao digitar.', null, 4.4, 851],
  ['A05', 'Suporte para Headset Norden Stand', 'Norden', 'acessorios', 99.9, 200, [], 'Base de alumínio com gancho emborrachado e organizador de cabo.', null, 4.6, 307],
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
  for (const [sku, name, brand, cat, price, stock, colors, description, oldPrice, rating, ratingCount] of PRODUCTS) {
    await pool.query(
      `INSERT INTO products (sku, name, brand, category_id, price_cents, stock, colors, description, image_url, old_price_cents, rating, rating_count)
       VALUES ($1, $2, $3, (SELECT id FROM categories WHERE slug = $4), $5, $6, $7, $8, $9, $10, $11, $12)`,
      [sku, name, brand, cat, Math.round(price * 100), stock, colors, description, `/products/${sku.toLowerCase()}.svg`,
        oldPrice ? Math.round(oldPrice * 100) : null, rating, ratingCount]
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
