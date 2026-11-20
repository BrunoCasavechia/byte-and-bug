import { Router } from 'express';
import { config } from '../config.js';
import { query } from '../db/pool.js';
import { seed } from '../db/seed.js';
import { ApiError, wrap } from '../lib/errors.js';

export const categories = Router();
categories.get('/', wrap(async (_req, res) => {
  const { rows } = await query(
    `SELECT c.slug, c.name, count(p.id)::int AS "productCount"
     FROM categories c LEFT JOIN products p ON p.category_id = c.id GROUP BY c.id ORDER BY c.id`
  );
  res.json(rows);
}));

export const health = Router();
health.get('/', wrap(async (_req, res) => {
  await query('SELECT 1');
  res.json({ status: 'ok', environment: config.appEnv, accessTokenTtlSeconds: config.accessTokenTtl });
}));

// QA helpers. Only mounted when ENABLE_QA_ROUTES=true (the qa environment).
export const qa = Router();

// Puts the database back to the seed state. Call it in a beforeEach/fixture.
qa.post('/reset', wrap(async (_req, res) => {
  await seed();
  res.json({ status: 'reset', environment: config.appEnv });
}));

// Responds after a delay, to practise waits and timeouts. Max 15 s.
qa.get('/slow', wrap(async (req, res) => {
  const ms = Math.min(Number(req.query.ms || 2000), 15000);
  await new Promise((r) => setTimeout(r, ms));
  res.json({ waitedMs: ms });
}));

// Fails on purpose some of the time, to practise retries and flaky tests.
qa.get('/flaky', (req, res, next) => {
  const rate = Math.min(Math.max(Number(req.query.failRate ?? 0.5), 0), 1);
  if (Math.random() < rate) return next(new ApiError(503, 'FLAKY_FAILURE', 'Falha proposital (endpoint instável)'));
  res.json({ status: 'ok', failRate: rate });
});
