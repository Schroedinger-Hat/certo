/**
 * /api/health and /api/metrics. Neither is tied to a content type, so
 * rather than forcing a fake content-type-less `api/` folder (Strapi's
 * api-loader indexes by content type - there's no precedent for that in
 * this repo), these are registered directly via `strapi.server.routes()`
 * inside src/index.ts's `register()` lifecycle hook - the same internal
 * mechanism Strapi's own core routers use
 * (@strapi/core/dist/services/server/register-routes.js). This MUST happen
 * from `register()`, not `bootstrap()`: Strapi finalizes routing
 * (`server.initRouting()`) partway through its own `bootstrap()`, before
 * this app's `bootstrap({ strapi })` hook ever runs - routes added there
 * would silently never get mounted.
 *
 * Unauthenticated by design, matching Prometheus/health-check convention
 * and Strapi's own built-in `/_health` (204, no body) - see
 * docs/monitoring.md for the recommendation to restrict access at the
 * reverse-proxy/network level instead of app auth.
 */

import { register as metricsRegistry } from './metrics';

export function healthCheckHandler(strapi: any) {
  return async (ctx: any) => {
    let databaseOk = true;
    try {
      await strapi.db.connection.raw('SELECT 1');
    } catch {
      databaseOk = false;
    }

    ctx.status = databaseOk ? 200 : 503;
    ctx.body = {
      status: databaseOk ? 'ok' : 'error',
      database: databaseOk ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
    };
  };
}

export async function metricsHandler(ctx: any) {
  ctx.set('Content-Type', metricsRegistry.contentType);
  ctx.body = await metricsRegistry.metrics();
}

export function registerMonitoringRoutes(strapi: any) {
  strapi.server.routes({
    type: 'content-api',
    routes: [
      {
        method: 'GET',
        path: '/health',
        handler: healthCheckHandler(strapi),
        config: { auth: false, policies: [], middlewares: [] },
      },
      {
        method: 'GET',
        path: '/metrics',
        handler: metricsHandler,
        config: { auth: false, policies: [], middlewares: [] },
      },
    ],
  });
}
