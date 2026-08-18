import controller from '../webhook-subscription'

describe('webhook-subscription controller', () => {
  const entityService = {
    findMany: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global as any).strapi = { entityService }
  })

  it('creates a subscription and never returns its secret', async () => {
    entityService.create.mockResolvedValue({ id: 1, url: 'https://example.com/hook', events: ['credential.issued'], secret: 'secret-value', enabled: true })

    const result = await controller.create({
      request: { body: { data: { url: 'https://example.com/hook', events: ['credential.issued'], secret: 'a'.repeat(16) } } },
    } as any)

    expect(entityService.create).toHaveBeenCalledWith(
      'api::webhook-subscription.webhook-subscription',
      { data: { url: 'https://example.com/hook', events: ['credential.issued'], secret: 'a'.repeat(16), enabled: true } },
    )
    expect(result.data).toEqual({ id: 1, url: 'https://example.com/hook', events: ['credential.issued'], enabled: true })
  })

  it('rejects unsupported events before writing', async () => {
    const ctx = {
      request: { body: { url: 'https://example.com/hook', events: ['credential.unknown'], secret: 'a'.repeat(16) } },
      badRequest: jest.fn((message: string) => ({ error: message })),
    }

    const result = await controller.create(ctx as any)

    expect(result).toEqual({ error: 'Unsupported webhook event: credential.unknown' })
    expect(ctx.badRequest).toHaveBeenCalled()
    expect(entityService.create).not.toHaveBeenCalled()
  })

  it('rejects short secrets and non-http URLs', async () => {
    const ctx = {
      request: { body: { url: 'file:///tmp/hook', events: ['credential.issued'], secret: 'short' } },
      badRequest: jest.fn((message: string) => ({ error: message })),
    }

    await controller.create(ctx as any)

    expect(ctx.badRequest).toHaveBeenCalledWith('Webhook URL must use http or https')
    expect(entityService.create).not.toHaveBeenCalled()
  })

  it('redacts secrets from listings', async () => {
    entityService.findMany.mockResolvedValue([
      { id: 1, url: 'https://example.com/hook', events: ['credential.issued'], secret: 'secret-value', enabled: true },
    ])

    const result = await controller.find({} as any)

    expect(result.data[0]).not.toHaveProperty('secret')
    expect(result.data[0].url).toBe('https://example.com/hook')
  })
})