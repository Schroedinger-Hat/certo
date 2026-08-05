/**
 * Makes /api/v1/* a transparent, zero-maintenance alias for the existing
 * /api/* routes. Strapi's entire content-API router is mounted once under
 * a single global prefix (config/api.ts's rest.prefix, default '/api') -
 * there's no per-route versioning mechanism, and changing that one prefix
 * outright would break every existing consumer, which hardcodes literal
 * `/api/...` paths (src/frontend/api/api-client.ts,
 * netlify/functions/og-credential/og-credential.tsx). Rewriting the
 * incoming path here means every current *and future* route automatically
 * gets an equivalent /api/v1/... alias with no per-route registration, and
 * the unversioned /api/* path keeps working unchanged, indefinitely.
 *
 * Registered as 'global::api-version-alias', first in
 * config/middlewares.ts - downstream middleware/routing only ever sees the
 * already-normalized path.
 */
export default () => {
  return async (ctx: any, next: any) => {
    if (ctx.path.startsWith('/api/v1/') || ctx.path === '/api/v1') {
      ctx.path = ctx.path.replace(/^\/api\/v1/, '/api');
    }

    await next();
  };
};
