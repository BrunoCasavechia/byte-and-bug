// All settings come from environment variables, like a real deployed service.
// Each environment (dev, qa) has its own .env file in the project root.
const env = process.env;

export const config = {
  appEnv: env.APP_ENV || 'dev',
  port: Number(env.PORT || 3333),
  databaseUrl: env.DATABASE_URL || 'postgres://bytebug:bytebug@localhost:5432/bytebug',
  jwtSecret: env.JWT_SECRET || 'dev-secret-change-me',
  // Short on purpose so tests can exercise token expiry. Seconds.
  accessTokenTtl: Number(env.ACCESS_TOKEN_TTL_SECONDS || 120),
  refreshTokenTtl: Number(env.REFRESH_TOKEN_TTL_SECONDS || 60 * 60 * 24),
  corsOrigin: env.CORS_ORIGIN || 'http://localhost:3000',
  enableQaRoutes: (env.ENABLE_QA_ROUTES || 'true') === 'true',
  uploadDir: env.UPLOAD_DIR || './uploads',
};
