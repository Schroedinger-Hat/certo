/**
 * Request logger middleware
 * 
 * This middleware logs incoming requests to help with debugging
 */

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    const start = Date.now();
    
    // Log the incoming request
    strapi.log.debug(`Request: ${ctx.method} ${ctx.url}`);
    
    // Continue to the next middleware
    await next();
    
    // Log the response time
    const ms = Date.now() - start;
    strapi.log.debug(`Response: ${ctx.method} ${ctx.url} - ${ctx.status} (${ms}ms)`);
  };
}; 