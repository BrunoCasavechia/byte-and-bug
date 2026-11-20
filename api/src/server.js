import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { config } from './config.js';
import { migrate, seedIfEmpty } from './db/seed.js';
import { ApiError, errorHandler } from './lib/errors.js';
import { openapi } from './openapi.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import { categories, health, qa } from './routes/misc.js';

const app = express();
app.use(cors({ origin: config.corsOrigin.split(',') }));
app.use(express.json({ limit: '100kb' }));
app.use('/uploads', express.static(config.uploadDir));

app.get('/docs.json', (_req, res) => res.json(openapi));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'Byte & Bug API' }));

app.use('/health', health);
app.use('/auth', authRoutes);
app.use('/categories', categories);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
if (config.enableQaRoutes) app.use('/qa', qa);

app.use((req, _res, next) => next(new ApiError(404, 'ROUTE_NOT_FOUND', `Rota ${req.method} ${req.path} não existe`)));
app.use(errorHandler);

async function start() {
  // The database container can take a few seconds to accept connections.
  for (let attempt = 1; ; attempt++) {
    try { await migrate(); break; } catch (err) {
      if (attempt >= 30) throw err;
      console.log(`Aguardando o banco (${attempt}/30)...`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  await seedIfEmpty();
  app.listen(config.port, () => {
    console.log(`Byte & Bug API [${config.appEnv}] em http://localhost:${config.port} (docs em /docs)`);
  });
}

start().catch((err) => { console.error(err); process.exit(1); });
