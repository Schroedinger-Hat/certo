import { createHmac } from 'crypto'
import createDispatcher from '../dispatch'

function createFakeStrapi(subscriptions: any[]) {
  return {
    entityService: {
      findMany: async (contentType: string, { filters }: any) => {
        if (contentType !== 'api::webhook-subscription.webhook-subscription') {
          throw new Error(`Unexpected content type: ${contentType}`)
        }
        return subscriptions.filter((s) => (filters.enabled === undefined ? true : s.enabled === filters.enabled))
      },
    },
    log: { warn: jest.fn() },
  }
}

describe('webhook dispatch', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  it('does nothing when no subscription matches the event', async () => {
    global.fetch = jest.fn()
    const strapi = createFakeStrapi([{ url: 'https://example.com/hook', events: ['credential.revoked'], secret: 's', enabled: true }])
    const service = createDispatcher({ strapi })

    await service.dispatch('credential.issued', { credentialId: 'urn:uuid:1' })

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('ignores disabled subscriptions', async () => {
    global.fetch = jest.fn()
    const strapi = createFakeStrapi([{ url: 'https://example.com/hook', events: ['credential.issued'], secret: 's', enabled: false }])
    const service = createDispatcher({ strapi })

    await service.dispatch('credential.issued', { credentialId: 'urn:uuid:1' })

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('POSTs a signed payload to each matching, enabled subscription', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 })
    global.fetch = fetchMock as any
    const strapi = createFakeStrapi([
      { url: 'https://example.com/hook', events: ['credential.issued'], secret: 'topsecret', enabled: true },
    ])
    const service = createDispatcher({ strapi })

    await service.dispatch('credential.issued', { credentialId: 'urn:uuid:1' })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('https://example.com/hook')
    expect(options.method).toBe('POST')
    expect(options.headers['X-Certo-Event']).toBe('credential.issued')

    const expectedSignature = createHmac('sha256', 'topsecret').update(options.body).digest('hex')
    expect(options.headers['X-Certo-Signature']).toBe(expectedSignature)

    const body = JSON.parse(options.body)
    expect(body.event).toBe('credential.issued')
    expect(body.data).toEqual({ credentialId: 'urn:uuid:1' })
  })

  it('delivers to every subscription registered for the event, independently', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 })
    global.fetch = fetchMock as any
    const strapi = createFakeStrapi([
      { url: 'https://a.example.com/hook', events: ['credential.issued'], secret: 'a', enabled: true },
      { url: 'https://b.example.com/hook', events: ['credential.issued', 'credential.revoked'], secret: 'b', enabled: true },
    ])
    const service = createDispatcher({ strapi })

    await service.dispatch('credential.issued', { credentialId: 'urn:uuid:1' })

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('does not throw when a delivery fails, and logs a warning', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('connection refused'))
    const strapi = createFakeStrapi([
      { url: 'https://example.com/hook', events: ['credential.issued'], secret: 's', enabled: true },
    ])
    const service = createDispatcher({ strapi })

    await expect(service.dispatch('credential.issued', {})).resolves.toBeUndefined()
    expect(strapi.log.warn).toHaveBeenCalledWith(expect.stringContaining('connection refused'))
  })

  it('logs a warning (without throwing) on a non-ok HTTP response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 })
    const strapi = createFakeStrapi([
      { url: 'https://example.com/hook', events: ['credential.issued'], secret: 's', enabled: true },
    ])
    const service = createDispatcher({ strapi })

    await expect(service.dispatch('credential.issued', {})).resolves.toBeUndefined()
    expect(strapi.log.warn).toHaveBeenCalledWith(expect.stringContaining('HTTP 500'))
  })
})
