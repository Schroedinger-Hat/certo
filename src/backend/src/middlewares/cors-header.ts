/**
 * Custom middleware to add CORS headers to all responses
 */
export default (config, { strapi }) => {
  return async (ctx, next) => {
    // Set CORS headers
    ctx.set('Access-Control-Allow-Origin', '*')
    ctx.set('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS')
    ctx.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,Origin,Accept')
    ctx.set('Access-Control-Max-Age', '86400')
    
    // Handle OPTIONS requests
    if (ctx.method === 'OPTIONS') {
      ctx.status = 204
      return
    }
    
    // Continue processing the request
    await next()
  }
} 