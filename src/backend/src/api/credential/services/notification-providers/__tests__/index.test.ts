import { getNotificationProvider } from '../index'

function fakeStrapiWithProviderConfig(name?: string) {
  return {
    config: { get: (_key: string, fallback: string) => name ?? fallback },
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
})
