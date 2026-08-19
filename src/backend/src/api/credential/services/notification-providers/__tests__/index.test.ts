import { getNotificationProvider } from '../index'

function fakeStrapiWithProviderConfig(name?: string): any {
  return {
    config: {
      get: (key: string, fallback: string) => key === 'custom.notificationProvider'
        ? name ?? fallback
        : fallback,
    },
    plugins: { email: { services: { email: { send: async () => {} } } } },
  }
}

describe('getNotificationProvider', () => {
  it('defaults to the strapi-email provider when unconfigured', () => {
    const provider = getNotificationProvider(fakeStrapiWithProviderConfig())
    expect(typeof provider.sendCredentialIssued).toBe('function')
  })

  it('resolves the strapi-email provider explicitly', () => {
    const provider = getNotificationProvider(fakeStrapiWithProviderConfig('strapi-email'))
    expect(typeof provider.sendCredentialIssued).toBe('function')
  })

  it('falls back to strapi-email for an unknown provider name', () => {
    const provider = getNotificationProvider(fakeStrapiWithProviderConfig('some-unimplemented-provider'))
    expect(typeof provider.sendCredentialIssued).toBe('function')
  })

  it('loads a configured provider module when it implements the interface', () => {
    const strapi = fakeStrapiWithProviderConfig()
    strapi.config.get = (key: string, fallback: string) => key === 'custom.notificationProviderModule'
      ? './custom-provider.fixture'
      : fallback

    const provider = getNotificationProvider(strapi)
    expect(typeof provider.sendCredentialIssued).toBe('function')
    expect(typeof provider.sendExpirationWarning).toBe('function')
  })

  it('falls back when a configured provider module cannot be loaded', () => {
    const strapi = fakeStrapiWithProviderConfig()
    const warnings: string[] = []
    strapi.config.get = (key: string, fallback: string) => key === 'custom.notificationProviderModule'
      ? './does-not-exist'
      : fallback
    strapi.log = { warn: (message: string) => warnings.push(message) }

    const provider = getNotificationProvider(strapi)
    expect(typeof provider.sendCredentialIssued).toBe('function')
    expect(warnings).toHaveLength(1)
  })
})
