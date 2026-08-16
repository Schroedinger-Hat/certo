/**
 * Rate limiting & brute-force protection middleware.
 *
 * Protects authentication endpoints (and other high-risk paths) from
 * brute-force and credential-stuffing attacks by limiting requests per
 * IP address within a sliding time window.
 *
 * In-memory only (per-instance). For multi-instance/single-process
 * horizontal scaling (Phase 6), replace the Map with a Redis-backed
 * store — the interface stays the same.
 *
 * Config (env):
 *   RATE_LIMIT_WINDOW_MS  — window length in milliseconds (default 15 min)
 *   RATE_LIMIT_MAX        — max requests per window per IP (default 50)
 *   RATE_LIMIT_WHITELIST  — comma-separated IPs to exempt (e.g. monitoring IPs)
 */
import type { Context, Next } from 'koa';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Default: 15-minute window, 50 requests per window per IP for auth paths.
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_REQUESTS = 50;

// Auth endpoints are sensitive and get a tighter default limit.
const AUTH_PATHS = [
  '/api/auth/local',
  '/api/auth/local/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/email-confirmation',
  '/api/auth/send-email-confirmation',
];

function getClientIp(ctx: Context): string {
  // Respect reverse-proxy forwarded headers if present.
  const forwarded = ctx.request.header['x-forwarded-for'];
  if (forwarded) {
    const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',')[0].trim();
    if (first) return first;
  }
  return ctx.request.ip || ctx.ip || 'unknown';
}

function cleanup(now: number) {
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

export default (config: any = {}, { strapi }: { strapi: any }) => {
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '', 10) || DEFAULT_WINDOW_MS;
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX || '', 10) || DEFAULT_MAX_REQUESTS;
  const whitelist = new Set(
    (process.env.RATE_LIMIT_WHITELIST || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );

  return async (ctx: Context, next: Next) => {
    const path = ctx.request.path;

    // Only apply rate limiting to auth endpoints by default.
    // Can be extended with RATE_LIMIT_PATHS env var (comma-separated).
    const extraPaths = (process.env.RATE_LIMIT_PATHS || '').split(',').map((s) => s.trim()).filter(Boolean);
    const isSensitivePath = AUTH_PATHS.includes(path) || extraPaths.includes(path);

    if (!isSensitivePath) {
      return next();
    }

    const ip = getClientIp(ctx);

    // Whitelisted IPs (e.g. monitoring/health checks) are exempt.
    if (whitelist.has(ip)) {
      return next();
    }

    const now = Date.now();
    cleanup(now);

    const key = `${ip}:${path}`;
    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      if (entry.count >= maxRequests) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        ctx.set('Retry-After', String(retryAfter));
        ctx.status = 429;
        ctx.body = {
          statusCode: 429,
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        };
        return;
      }
      entry.count += 1;
    }

    // Add rate limit headers.
    const current = store.get(key);
    if (current) {
      ctx.set('X-RateLimit-Limit', String(maxRequests));
      ctx.set('X-RateLimit-Remaining', String(Math.max(0, maxRequests - current.count)));
      ctx.set('X-RateLimit-Reset', String(Math.ceil(current.resetAt / 1000)));
    }

    await next();
  };
};