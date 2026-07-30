import { encrypt, decrypt } from '../key-encryption'

describe('key-encryption', () => {
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = 'test-encryption-key-do-not-use-in-prod'
  })

  it('round-trips plaintext through encrypt/decrypt', () => {
    const plaintext = '-----BEGIN PRIVATE KEY-----\nfake-pkcs8-data\n-----END PRIVATE KEY-----'
    const ciphertext = encrypt(plaintext)
    expect(ciphertext).not.toEqual(plaintext)
    expect(decrypt(ciphertext)).toEqual(plaintext)
  })

  it('produces different ciphertext for the same plaintext each time (random IV)', () => {
    const plaintext = 'same input'
    expect(encrypt(plaintext)).not.toEqual(encrypt(plaintext))
  })

  it('throws when the ciphertext has been tampered with', () => {
    const ciphertext = encrypt('sensitive data')
    const buffer = Buffer.from(ciphertext, 'base64')
    buffer[buffer.length - 1] ^= 0xff // flip bits in the ciphertext tail
    const tampered = buffer.toString('base64')
    expect(() => decrypt(tampered)).toThrow()
  })

  it('throws when ENCRYPTION_KEY is not set', () => {
    const original = process.env.ENCRYPTION_KEY
    delete process.env.ENCRYPTION_KEY
    expect(() => encrypt('x')).toThrow('ENCRYPTION_KEY env var not set')
    process.env.ENCRYPTION_KEY = original
  })
})
