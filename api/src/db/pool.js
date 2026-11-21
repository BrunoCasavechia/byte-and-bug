import pg from 'pg';
import { config } from '../config.js';

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  // Managed Postgres outside Render (Supabase, Neon) needs SSL.
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
});
export const query = (text, params) => pool.query(text, params);
