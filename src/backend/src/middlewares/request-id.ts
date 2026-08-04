/**
 * Assigns a correlation id to every request (reusing an incoming
 * `X-Request-Id` from a reverse proxy if present, generating one otherwise),
 * echoes it back as a response header, and runs the rest of the middleware
 * chain inside requestContextStorage.run() so config/logger.ts's format can
 * attach it to every log line produced during this request - including
 * strapi::logger's own access-log line - with no changes needed to any of
 * the existing strapi.log.*() call sites elsewhere in the app.
 *
 * Registered as 'global::request-id', positioned first in
 * config/middlewares.ts (before strapi::errors) so the async context covers
 * the entire request lifecycle.
 */
import { randomUUID } from 'node:crypto';
import { requestContextStorage } from '../utils/request-context';

export default () => {
  return async (ctx: any, next: any) => {
    const incoming = ctx.request.header['x-request-id'];
    const requestId = (Array.isArray(incoming) ? incoming[0] : incoming) || randomUUID();

    ctx.state.requestId = requestId;
    ctx.set('X-Request-Id', requestId);

    await requestContextStorage.run({ requestId }, next);
  };
};
