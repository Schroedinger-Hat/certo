/**
 * Prometheus metrics registry for /api/metrics (see routes.ts). One shared
 * registry + counters for the whole process, imported by whichever service/
 * controller records the corresponding domain event.
 */

import { Registry, Counter, collectDefaultMetrics } from 'prom-client';

export const register = new Registry();
collectDefaultMetrics({ register, prefix: 'certo_' });

export const credentialsIssuedTotal = new Counter({
  name: 'certo_credentials_issued_total',
  help: 'Total number of credentials issued',
  registers: [register],
});

export const credentialsRevokedTotal = new Counter({
  name: 'certo_credentials_revoked_total',
  help: 'Total number of credentials revoked',
  registers: [register],
});

export const credentialsVerifiedTotal = new Counter({
  name: 'certo_credentials_verified_total',
  help: 'Total number of credential verification checks performed',
  labelNames: ['result'] as const,
  registers: [register],
});

export const achievementsCreatedTotal = new Counter({
  name: 'certo_achievements_created_total',
  help: 'Total number of achievements (badge classes) created',
  registers: [register],
});
