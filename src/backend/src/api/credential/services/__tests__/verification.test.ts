import verificationService from '../verification'

async function makeSignedProof(privateKey: any, payload: Record<string, unknown> = { hello: 'world' }) {
  const { SignJWT } = await import('jose')
  const jws = await new SignJWT(payload).setProtectedHeader({ alg: 'EdDSA' }).sign(privateKey)
  return {
    type: 'Ed25519Signature2020',
    created: new Date().toISOString(),
    verificationMethod: 'http://localhost:1337/api/profiles/1/keys',
    proofPurpose: 'assertionMethod',
    jws,
  }
}

function setFakeStrapi(getPublicKey: (profileId: number) => Promise<any>) {
  ;(global as any).strapi = {
    service: (name: string) => {
      if (name !== 'api::profile.issuer-keys') throw new Error(`Unexpected service: ${name}`)
      return { getPublicKey }
    },
  }
}

describe('verification.verifyProof', () => {
  let keypairA: { privateKey: any; publicKey: any }
  let keypairB: { privateKey: any; publicKey: any }

  beforeAll(async () => {
    const { generateKeyPair } = await import('jose')
    keypairA = await generateKeyPair('EdDSA', { crv: 'Ed25519', extractable: true })
    keypairB = await generateKeyPair('EdDSA', { crv: 'Ed25519', extractable: true })
  })

  it('verifies a correctly signed proof against the matching public key', async () => {
    setFakeStrapi(async () => keypairA.publicKey)
    const proof = await makeSignedProof(keypairA.privateKey)
    const credential: any = { proof: [proof], issuer: { id: 1 } }

    const result = await verificationService.verifyProof(credential)
    expect(result).toEqual({ valid: true })
  })

  it('rejects a tampered JWS', async () => {
    setFakeStrapi(async () => keypairA.publicKey)
    const proof = await makeSignedProof(keypairA.privateKey)
    proof.jws = proof.jws.slice(0, -2) + (proof.jws.slice(-2) === 'aa' ? 'bb' : 'aa')
    const credential: any = { proof: [proof], issuer: { id: 1 } }

    const result = await verificationService.verifyProof(credential)
    expect(result.valid).toBe(false)
    expect(result.message).toMatch(/signature verification failed/i)
  })

  it('rejects a proof signed by a different key than the issuer\'s', async () => {
    setFakeStrapi(async () => keypairA.publicKey) // issuer's real key
    const proof = await makeSignedProof(keypairB.privateKey) // signed by someone else
    const credential: any = { proof: [proof], issuer: { id: 1 } }

    const result = await verificationService.verifyProof(credential)
    expect(result.valid).toBe(false)
  })

  it('rejects when there is no proof at all', async () => {
    setFakeStrapi(async () => keypairA.publicKey)
    const result = await verificationService.verifyProof({ proof: [] } as any)
    expect(result).toEqual({ valid: false, message: 'No proof found on credential' })
  })

  it('rejects a proofValue-only proof (nothing to cryptographically verify)', async () => {
    setFakeStrapi(async () => keypairA.publicKey)
    const credential: any = {
      proof: [{
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        verificationMethod: 'http://localhost:1337/api/profiles/1/keys',
        proofPurpose: 'assertionMethod',
        proofValue: 'zNotARealSignature',
      }],
      issuer: { id: 1 },
    }
    const result = await verificationService.verifyProof(credential)
    expect(result.valid).toBe(false)
    expect(result.message).toMatch(/not cryptographically verifiable/i)
  })

  it('rejects when the credential has no issuer', async () => {
    setFakeStrapi(async () => keypairA.publicKey)
    const proof = await makeSignedProof(keypairA.privateKey)
    const result = await verificationService.verifyProof({ proof: [proof] } as any)
    expect(result.valid).toBe(false)
    expect(result.message).toMatch(/no issuer/i)
  })

  it('rejects when the issuer has no signing key on record', async () => {
    setFakeStrapi(async () => null)
    const proof = await makeSignedProof(keypairA.privateKey)
    const credential: any = { proof: [proof], issuer: { id: 1 } }

    const result = await verificationService.verifyProof(credential)
    expect(result).toEqual({ valid: false, message: 'Issuer has no signing key on record' })
  })

  it('falls back to the issuer profile\'s publicKey component when there is no issuer-key record', async () => {
    setFakeStrapi(async () => null)
    const { exportJWK } = await import('jose')
    const publicKeyJwk = await exportJWK(keypairA.publicKey)
    const proof = await makeSignedProof(keypairA.privateKey)
    const credential: any = {
      proof: [proof],
      issuer: { id: 1, publicKey: [{ revoked: false, publicKeyJwk }] },
    }

    const result = await verificationService.verifyProof(credential)
    expect(result).toEqual({ valid: true })
  })

  it('skips revoked entries in the issuer profile\'s publicKey component fallback', async () => {
    setFakeStrapi(async () => null)
    const { exportJWK } = await import('jose')
    const publicKeyJwk = await exportJWK(keypairA.publicKey)
    const proof = await makeSignedProof(keypairA.privateKey)
    const credential: any = {
      proof: [proof],
      issuer: { id: 1, publicKey: [{ revoked: true, publicKeyJwk }] },
    }

    const result = await verificationService.verifyProof(credential)
    expect(result).toEqual({ valid: false, message: 'Issuer has no signing key on record' })
  })

  it('verifies against a malformed-but-real-world publicKey entry (wrapped { jwk: [...] } with a DER SPKI "x", duplicated into publicKeyMultibase)', async () => {
    setFakeStrapi(async () => null)
    const { exportSPKI } = await import('jose')
    const spkiPem = await exportSPKI(keypairA.publicKey)
    const derBase64 = spkiPem
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/\s/g, '')
    const proof = await makeSignedProof(keypairA.privateKey)
    const credential: any = {
      proof: [proof],
      issuer: {
        id: 1,
        publicKey: [{
          revoked: false,
          publicKeyJwk: { jwk: [{ crv: 'Ed25519', kty: 'OKP', x: derBase64 }] },
          publicKeyMultibase: derBase64,
        }],
      },
    }

    const result = await verificationService.verifyProof(credential)
    expect(result).toEqual({ valid: true })
  })

  it('rejects when the profile publicKey fallback has no matching key either', async () => {
    setFakeStrapi(async () => null)
    const { exportJWK } = await import('jose')
    const publicKeyJwkB = await exportJWK(keypairB.publicKey)
    const proof = await makeSignedProof(keypairA.privateKey) // signed with A, only B on record
    const credential: any = {
      proof: [proof],
      issuer: { id: 1, publicKey: [{ revoked: false, publicKeyJwk: publicKeyJwkB }] },
    }

    const result = await verificationService.verifyProof(credential)
    expect(result).toEqual({ valid: false, message: 'Issuer has no signing key on record' })
  })
})
