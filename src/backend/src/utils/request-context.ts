/**
 * Per-request correlation id, made available to any code running within a
 * request's async execution (controllers, services, the winston format in
 * config/logger.ts) without threading it through every function call or
 * touching the ~40 existing `strapi.log.*()` call sites across the app.
 *
 * Populated by middlewares/request-id.ts, which wraps the rest of the
 * middleware chain in `requestContextStorage.run(...)`.
 */
import { AsyncLocalStorage } from 'node:async_hooks';

interface RequestContext {
  requestId: string;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export function getRequestId(): string | undefined {
  return requestContextStorage.getStore()?.requestId;
}
