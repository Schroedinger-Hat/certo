import { healthCheckHandler, metricsHandler } from '../routes'

function createFakeCtx() {
  const headers: Record<string, string> = {}
  return {
    status: 0,
    body: undefined as any,
    set: (key: string, value: string) => { headers[key] = value },
    headers,
  }
}

describe('healthCheckHandler', () => {
  it('returns 200 and status ok when the database is reachable', async () => {
    const strapi = { db: { connection: { raw: async () => [] } } }
    const ctx = createFakeCtx()

    await healthCheckHandler(strapi)(ctx)

    expect(ctx.status).toBe(200)
    expect(ctx.body.status).toBe('ok')
    expect(ctx.body.database).toBe('ok')
    expect(typeof ctx.body.timestamp).toBe('string')
  })

  it('returns 503 and status error when the database is unreachable', async () => {
    const strapi = { db: { connection: { raw: async () => { throw new Error('connection refused') } } } }
    const ctx = createFakeCtx()

    await healthCheckHandler(strapi)(ctx)

    expect(ctx.status).toBe(503)
    expect(ctx.body.status).toBe('error')
    expect(ctx.body.database).toBe('error')
  })
})

describe('metricsHandler', () => {
  it('sets the Prometheus content type and serializes the registry', async () => {
    const ctx = createFakeCtx()

    await metricsHandler(ctx)

    expect(ctx.headers['Content-Type']).toMatch(/^text\/plain/)
    expect(ctx.body).toContain('certo_credentials_issued_total')
  })
})
