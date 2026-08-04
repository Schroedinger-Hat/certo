import requestIdMiddlewareFactory from '../request-id'
import { getRequestId } from '../../utils/request-context'

function createFakeCtx(headers: Record<string, string> = {}) {
  const responseHeaders: Record<string, string> = {}
  return {
    request: { header: headers },
    state: {} as any,
    set: (key: string, value: string) => { responseHeaders[key] = value },
    responseHeaders,
  }
}

describe('request-id middleware', () => {
  it('generates a UUID when there is no incoming X-Request-Id header', async () => {
    const middleware = requestIdMiddlewareFactory()
    const ctx = createFakeCtx()

    await middleware(ctx, async () => {})

    expect(ctx.state.requestId).toMatch(/^[0-9a-f-]{36}$/)
    expect(ctx.responseHeaders['X-Request-Id']).toBe(ctx.state.requestId)
  })

  it('reuses an incoming X-Request-Id header as-is', async () => {
    const middleware = requestIdMiddlewareFactory()
    const ctx = createFakeCtx({ 'x-request-id': 'upstream-provided-id' })

    await middleware(ctx, async () => {})

    expect(ctx.state.requestId).toBe('upstream-provided-id')
    expect(ctx.responseHeaders['X-Request-Id']).toBe('upstream-provided-id')
  })

  it('makes the requestId available via getRequestId() inside next()', async () => {
    const middleware = requestIdMiddlewareFactory()
    const ctx = createFakeCtx({ 'x-request-id': 'inside-next-id' })
    let seenInsideNext: string | undefined

    await middleware(ctx, async () => {
      seenInsideNext = getRequestId()
    })

    expect(seenInsideNext).toBe('inside-next-id')
    expect(getRequestId()).toBeUndefined()
  })
})
