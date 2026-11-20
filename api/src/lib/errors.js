// Every error response has the same shape:
// { "error": { "code": "SOME_CODE", "message": "...", "details": [...] } }
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message, details) => new ApiError(400, 'VALIDATION_ERROR', message, details);
export const notFound = (what) => new ApiError(404, 'NOT_FOUND', `${what} não encontrado`);

export function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Body não é um JSON válido' } });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: { code: 'FILE_TOO_LARGE', message: 'Arquivo maior que 2 MB' } });
  }
  console.error(err);
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Erro inesperado no servidor' } });
}

// Wraps async route handlers so thrown errors reach errorHandler.
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
