import { createStrapiEmailProvider } from '../strapi-email-provider'

function createFakeStrapi() {
  const sentEmails: any[] = []
  return {
    strapi: {
      plugins: {
        email: {
          services: {
            email: {
              send: async (options: any) => {
                sentEmails.push(options)
              },
            },
          },
        },
      },
    },
    sentEmails,
  }
}

describe('strapi-email-provider', () => {
  it('sends via the Strapi email plugin using the credential-issuance template', async () => {
    const { strapi, sentEmails } = createFakeStrapi()
    const provider = createStrapiEmailProvider(strapi)

    await provider.sendCredentialIssued({
      to: 'recipient@example.com',
      achievement: { name: 'Test Badge', description: 'A test badge' },
      credential: { id: 1, credentialId: 'urn:uuid:abc' },
      frontendUrl: 'http://localhost:3000',
      user: { username: 'recipient', email: 'recipient@example.com' },
    })

    expect(sentEmails).toHaveLength(1)
    expect(sentEmails[0].to).toBe('recipient@example.com')
    expect(sentEmails[0].subject).toMatch(/Test Badge/)
    expect(sentEmails[0].html).toMatch(/urn:uuid:abc/)
  })

  it('propagates errors from the underlying email plugin', async () => {
    const provider = createStrapiEmailProvider({
      plugins: { email: { services: { email: { send: async () => { throw new Error('SMTP down') } } } } },
    })

    await expect(
      provider.sendCredentialIssued({
        to: 'recipient@example.com',
        achievement: { name: 'Test Badge' },
        credential: { id: 1, credentialId: 'urn:uuid:abc' },
        frontendUrl: 'http://localhost:3000',
        user: null,
      })
    ).rejects.toThrow('SMTP down')
  })
})
