import issuerKeysFactory from '../issuer-keys'

function createFakeStrapi() {
  const issuerKeys: any[] = []
  const profiles = new Map<number, any>([[1, { id: 1, did: null, publicKey: [] }]])
  let nextId = 1

  return {
    strapi: {
      config: { get: (_key: string, fallback: string) => fallback },
      db: {
        query: (contentType: string) => {
          if (contentType !== 'api::issuer-key.issuer-key') {
            throw new Error(`Unexpected content type: ${contentType}`)
          }
          return {
            findOne: async ({ where }: any) =>
              issuerKeys.find((k) => k.profile === where.profile) || null,
            create: async ({ data }: any) => {
              const record = { id: nextId++, ...data }
              issuerKeys.push(record)
              return record
            },
          }
        },
      },
      entityService: {
        findOne: async (contentType: string, id: number) => {
          if (contentType !== 'api::profile.profile') throw new Error('unexpected content type')
          return profiles.get(id) || null
        },
        update: async (contentType: string, id: number, { data }: any) => {
          if (contentType !== 'api::profile.profile') throw new Error('unexpected content type')
          const profile = profiles.get(id)
          const updated = { ...profile, ...data }
          profiles.set(id, updated)
          return updated
        },
      },
    },
    profiles,
    issuerKeys,
  }
}

describe('issuer-keys service', () => {
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = 'test-encryption-key-do-not-use-in-prod'
  })

  it('generates and persists a keypair on first use', async () => {
    const { strapi, issuerKeys, profiles } = createFakeStrapi()
    const service = issuerKeysFactory({ strapi } as any)

    const { privateKey, publicKeyJwk } = await service.getOrCreateKeyPair(1)

    expect(privateKey).toBeDefined()
    expect(publicKeyJwk).toMatchObject({ kty: 'OKP', crv: 'Ed25519' })
    expect(issuerKeys).toHaveLength(1)
    expect(profiles.get(1).publicKey).toHaveLength(1)
    expect(profiles.get(1).publicKey[0].publicKeyJwk).toEqual(publicKeyJwk)
  })

  it('returns the same keypair on subsequent calls (idempotent)', async () => {
    const { strapi, issuerKeys } = createFakeStrapi()
    const service = issuerKeysFactory({ strapi } as any)

    const first = await service.getOrCreateKeyPair(1)
    const second = await service.getOrCreateKeyPair(1)

    expect(issuerKeys).toHaveLength(1) // no second key was created
    expect(second.publicKeyJwk).toEqual(first.publicKeyJwk)
  })

  it('the generated key can actually sign and verify a JWS', async () => {
    const { strapi } = createFakeStrapi()
    const service = issuerKeysFactory({ strapi } as any)
    const { SignJWT, jwtVerify } = await import('jose')

    const { privateKey } = await service.getOrCreateKeyPair(1)
    const jws = await new SignJWT({ hello: 'world' }).setProtectedHeader({ alg: 'EdDSA' }).sign(privateKey)

    const publicKey = await service.getPublicKey(1)
    const { payload } = await jwtVerify(jws, publicKey as any)
    expect(payload.hello).toEqual('world')
  })

  it('getPublicKey returns null for an issuer with no key yet', async () => {
    const { strapi } = createFakeStrapi()
    const service = issuerKeysFactory({ strapi } as any)

    expect(await service.getPublicKey(999)).toBeNull()
  })
})
