import { Hono, type Context } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { requestLogger } from './middlewares/logger.middleware.js';
import { competitionsRoutes } from './modules/competitions/competitions.routes.js';
import { circuitsEventsRoutes } from './modules/circuits-events/circuits-events.routes.js';
import { paddockRoutes } from './modules/paddock/paddock.routes.js';
import { racingRoutes } from './modules/racing/racing.routes.js';

const healthHandler = (c: Context) =>
  c.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  });

export const app = new Hono()
  // Global Middlewares
  .use('*', cors())
  .use('*', requestLogger)

  // Healthcheck (accessible directly on /health or via API proxy /api/health)
  .get('/health', healthHandler)
  .get('/api/health', healthHandler)

  // Feature Modules Mounts
  .route('/api/competitions', competitionsRoutes)
  .route('/api', circuitsEventsRoutes) // /api/circuits, /api/events, /api/sessions
  .route('/api/paddock', paddockRoutes) // /api/paddock/brands, /cars, /teams, /pilots
  .route('/api/racing', racingRoutes); // /api/racing/events/.../entries, /sessions/.../results

// Global Handlers
app.onError(errorHandler);
app.notFound(notFoundHandler);

// Server startup (only if executed directly, avoiding port conflicts during tests)
if (process.env.NODE_ENV !== 'test') {
  serve(
    {
      fetch: app.fetch,
      port: env.PORT,
    },
    (info) => {
      console.log(`🏎️  Motorsport API running on http://localhost:${info.port}`);
    }
  );
}

export default app;
