import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { query } from '../db/pool.js';
import { ApiError, badRequest, wrap } from '../lib/errors.js';
import { isEmail, required, validate } from '../lib/validate.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

async function issueTokens(user) {
  const accessToken = jwt.sign({ sub: String(user.id), email: user.email, role: user.role }, config.jwtSecret, {
    expiresIn: config.accessTokenTtl,
  });
  const refreshToken = crypto.randomBytes(32).toString('hex');
  await query(
    `INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, now() + ($3 || ' seconds')::interval)`,
    [refreshToken, user.id, String(config.refreshTokenTtl)]
  );
  return { accessToken, refreshToken, tokenType: 'Bearer', expiresIn: config.accessTokenTtl, user: publicUser(user) };
}

router.post('/register', wrap(async (req, res) => {
  const details = validate(req.body, {
    name: [required],
    email: [required, isEmail],
    password: [required, (v) => (String(v).length >= 6 ? null : 'mínimo de 6 caracteres')],
  });
  if (details.length) throw badRequest('Dados inválidos', details);

  const email = String(req.body.email).toLowerCase().trim();
  const exists = await query('SELECT 1 FROM users WHERE email = $1', [email]);
  if (exists.rowCount) throw new ApiError(409, 'EMAIL_IN_USE', 'Este e-mail já está cadastrado');

  const { rows } = await query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
    [String(req.body.name).trim(), email, bcrypt.hashSync(String(req.body.password), 8)]
  );
  res.status(201).json(publicUser(rows[0]));
}));

router.post('/login', wrap(async (req, res) => {
  const details = validate(req.body, { email: [required], password: [required] });
  if (details.length) throw badRequest('Informe e-mail e senha', details);

  const { rows } = await query('SELECT * FROM users WHERE email = $1', [String(req.body.email).toLowerCase().trim()]);
  const user = rows[0];
  if (!user || !bcrypt.compareSync(String(req.body.password), user.password_hash)) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos');
  }
  if (user.locked) throw new ApiError(403, 'USER_LOCKED', 'Usuário bloqueado. Fale com o suporte');

  res.json(await issueTokens(user));
}));

// Exchanges a refresh token for a new pair. The old refresh token is revoked
// (rotation), so using it twice returns 401 REFRESH_TOKEN_REVOKED.
router.post('/refresh', wrap(async (req, res) => {
  const token = req.body?.refreshToken;
  if (!token) throw badRequest('Informe o refreshToken', [{ field: 'refreshToken', message: 'obrigatório' }]);

  const { rows } = await query('SELECT * FROM refresh_tokens WHERE token = $1', [token]);
  const stored = rows[0];
  if (!stored) throw new ApiError(401, 'REFRESH_TOKEN_INVALID', 'Refresh token inválido');
  if (stored.revoked) throw new ApiError(401, 'REFRESH_TOKEN_REVOKED', 'Refresh token já usado ou revogado');
  if (new Date(stored.expires_at) < new Date()) throw new ApiError(401, 'REFRESH_TOKEN_EXPIRED', 'Refresh token expirado');

  await query('UPDATE refresh_tokens SET revoked = true WHERE token = $1', [token]);
  const user = (await query('SELECT * FROM users WHERE id = $1', [stored.user_id])).rows[0];
  if (user.locked) throw new ApiError(403, 'USER_LOCKED', 'Usuário bloqueado. Fale com o suporte');
  res.json(await issueTokens(user));
}));

router.post('/logout', wrap(async (req, res) => {
  if (req.body?.refreshToken) {
    await query('UPDATE refresh_tokens SET revoked = true WHERE token = $1', [req.body.refreshToken]);
  }
  res.status(204).end();
}));

router.get('/me', requireAuth, wrap(async (req, res) => {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  if (!rows[0]) throw new ApiError(404, 'NOT_FOUND', 'Usuário não encontrado');
  res.json(publicUser(rows[0]));
}));

export default router;
