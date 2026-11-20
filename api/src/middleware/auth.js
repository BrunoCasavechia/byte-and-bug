import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { ApiError } from '../lib/errors.js';

// Reads "Authorization: Bearer <token>" and puts the user on req.user.
// Distinguishes missing, expired and invalid tokens so tests can assert each.
export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  if (!header) return next(new ApiError(401, 'TOKEN_MISSING', 'Token não informado'));

  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'TOKEN_INVALID', 'Use o formato: Authorization: Bearer <token>'));
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: Number(payload.sub), email: payload.email, role: payload.role };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'TOKEN_EXPIRED', 'Token expirado. Use /auth/refresh ou faça login de novo'));
    }
    return next(new ApiError(401, 'TOKEN_INVALID', 'Token inválido'));
  }
}

export const requireRole = (role) => (req, _res, next) => {
  if (req.user?.role !== role) {
    return next(new ApiError(403, 'FORBIDDEN', 'Você não tem permissão para esta ação'));
  }
  return next();
};
