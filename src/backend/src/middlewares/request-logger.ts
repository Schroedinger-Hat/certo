/**
 * Request logger middleware
 */

export default () => {
  return async (ctx, next) => {
    const start = Date.now()
    
    await next()
    
    const delta = Math.ceil(Date.now() - start)
    console.log(`${ctx.method} ${ctx.url} (${delta} ms) ${ctx.status}`)
  }
} 