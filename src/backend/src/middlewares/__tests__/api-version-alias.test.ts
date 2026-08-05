import apiVersionAliasFactory from '../api-version-alias'

function createFakeCtx(path: string) {
  return { path }
}

describe('api-version-alias middleware', () => {
  it('rewrites /api/v1/<resource> to /api/<resource>', async () => {
    const middleware = apiVersionAliasFactory()
    const ctx = createFakeCtx('/api/v1/credentials')

    await middleware(ctx, async () => {})

    expect(ctx.path).toBe('/api/credentials')
  })

  it('rewrites the bare /api/v1 path to /api', async () => {
    const middleware = apiVersionAliasFactory()
    const ctx = createFakeCtx('/api/v1')

    await middleware(ctx, async () => {})

    expect(ctx.path).toBe('/api')
  })

  it('rewrites nested paths (e.g. /api/v1/profiles/me/export)', async () => {
    const middleware = apiVersionAliasFactory()
    const ctx = createFakeCtx('/api/v1/profiles/me/export')

    await middleware(ctx, async () => {})

    expect(ctx.path).toBe('/api/profiles/me/export')
  })

  it('leaves an unversioned /api path untouched', async () => {
    const middleware = apiVersionAliasFactory()
    const ctx = createFakeCtx('/api/credentials')

    await middleware(ctx, async () => {})

    expect(ctx.path).toBe('/api/credentials')
  })

  it('does not rewrite a path that merely starts with "v1" as a different segment (e.g. /api/v1foo)', async () => {
    const middleware = apiVersionAliasFactory()
    const ctx = createFakeCtx('/api/v1foo/bar')

    await middleware(ctx, async () => {})

    expect(ctx.path).toBe('/api/v1foo/bar')
  })

  it('leaves unrelated paths (e.g. /admin, /_health) untouched', async () => {
    const middleware = apiVersionAliasFactory()
    const ctx = createFakeCtx('/admin')

    await middleware(ctx, async () => {})

    expect(ctx.path).toBe('/admin')
  })

  it('calls next()', async () => {
    const middleware = apiVersionAliasFactory()
    const ctx = createFakeCtx('/api/v1/credentials')
    const next = jest.fn(async () => {})

    await middleware(ctx, next)

    expect(next).toHaveBeenCalledTimes(1)
  })
})
