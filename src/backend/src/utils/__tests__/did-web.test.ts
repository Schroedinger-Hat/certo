import { didWebDocumentUrl, resolveDidWeb } from '../did-web'

describe('did:web resolution', () => {
  it('uses the well-known location for a root did:web identifier', () => {
    expect(didWebDocumentUrl('did:web:example.com#key-1'))
      .toBe('https://example.com/.well-known/did.json')
  })

  it('maps colon-separated identifiers to a did.json path', () => {
    expect(didWebDocumentUrl('did:web:example.com:issuers:alice'))
      .toBe('https://example.com/issuers/alice/did.json')
  })

  it('decodes and safely re-encodes path segments', () => {
    expect(didWebDocumentUrl('did:web:example.com:issuers:alice%20smith'))
      .toBe('https://example.com/issuers/alice%20smith/did.json')
  })

  it('fetches the document without including the verification fragment', async () => {
    const fetcher = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'did:web:example.com', verificationMethod: [] }),
    })

    const document = await resolveDidWeb('did:web:example.com#key-1', fetcher)

    expect(fetcher).toHaveBeenCalledWith(
      'https://example.com/.well-known/did.json',
      expect.objectContaining({ headers: { Accept: 'application/did+json, application/json' } }),
    )
    expect(document.id).toBe('did:web:example.com')
  })

  it('rejects non-did:web identifiers', () => {
    expect(() => didWebDocumentUrl('did:key:z6Mkexample')).toThrow('Not a did:web identifier')
  })

  it('selects only the verification method named by the proof', async () => {
    const { generateKeyPair, exportJWK } = await import('jose')
    const keyPairA = await generateKeyPair('EdDSA', { crv: 'Ed25519' })
    const keyPairB = await generateKeyPair('EdDSA', { crv: 'Ed25519' })
    const service = (await import('../../api/credential/services/open-badge')).default({ strapi: {} })
    const keyA = await exportJWK(keyPairA.publicKey)
    const keyB = await exportJWK(keyPairB.publicKey)

    const candidates = await service.extractPublicKeysFromDocument({
      verificationMethod: [
        { id: 'did:web:example.com#key-a', publicKeyJwk: keyA },
        { id: 'did:web:example.com#key-b', publicKeyJwk: keyB },
      ],
    }, 'did:web:example.com#key-a')

    expect(candidates).toHaveLength(1)
  })
})