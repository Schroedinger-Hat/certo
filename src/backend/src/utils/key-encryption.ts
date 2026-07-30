/**
 * AES-256-GCM encryption for issuer private key material at rest.
 * Keyed by SHA-256(ENCRYPTION_KEY) so we reuse the secret Strapi already
 * requires (config/plugins.ts's ecosystem, .env.example) instead of adding
 * a new one.
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY
  if (!secret) throw new Error('ENCRYPTION_KEY env var not set')
  return createHash('sha256').update(secret).digest()
}

/**
 * Encrypts plaintext, returning base64(iv || authTag || ciphertext).
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, ciphertext]).toString('base64')
}

/**
 * Decrypts a value produced by encrypt(). Throws if ENCRYPTION_KEY doesn't
 * match or the ciphertext was tampered with (GCM auth tag check fails).
 */
export function decrypt(encoded: string): string {
  const key = getEncryptionKey()
  const buffer = Buffer.from(encoded, 'base64')
  const iv = buffer.subarray(0, IV_LENGTH)
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + 16)
  const ciphertext = buffer.subarray(IV_LENGTH + 16)
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}
