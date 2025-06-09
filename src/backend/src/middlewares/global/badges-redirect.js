/**
 * Badges redirect middleware
 * 
 * This middleware redirects requests from /api/badges to /api/achievements
 * to maintain backward compatibility with existing frontend code
 */

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Check if this is a request to /api/badges
    if (ctx.url.startsWith('/api/badges')) {
      // Log the redirect for debugging
      strapi.log.info(`Redirecting ${ctx.method} from ${ctx.url} to /api/achievements`);
      
      // Rewrite the URL to use achievements instead
      ctx.url = ctx.url.replace('/api/badges', '/api/achievements');
      
      // Log the new URL
      strapi.log.info(`Redirected to: ${ctx.url}`);
    }
    
    // Continue to the next middleware
    return next();
  };
}; 