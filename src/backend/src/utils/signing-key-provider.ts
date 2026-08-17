/**
 * Signing key provider abstraction.
 *
 * Pluggable interface for issuer signing-key material. The default provider
 * ("local") is the current implementation: Ed25519 keys generated in-app,
 * encrypted at rest with ENCRYPTION_KEY (see key-encryption.ts).
 *
 * A "kms" provider can be implemented to delegate key generation and
 * signing to a remote KMS/HSM (AWS KMS, Google Cloud KMS, HashiCorp Vault,
 * etc.). The interface stays the same, so switching only requires setting
 * SIGNING_KEY_PROVIDER=kms and implementing the provider module.
 *
 * Interface:
 *   getOrCreateKeyPair(profileId) → { privateKey: CryptoKey, publicKeyJwk: JWK }
 *   getPublicKey(profileId)       → Promise<CryptoKey | null>
 *
 * Env:
 *   SIGNING_KEY_PROVIDER  — "local" (default) or "kms"
 *   ENCRYPTION_KEY        — required for "local" provider (current behavior)
 */

import type { CryptoKey, JWK } from 'jose'
import { encrypt, decrypt } from './key-encryption'

const PROVIDER = process.env.SIGNING_KEY_PROVIDER || 'local'

interface KeyPairResult {
  privateKey: CryptoKey
  publicKeyJwk: JWK
}

/**
 * Local provider: Ed25519 keys generated in-app, private key encrypted at
 * rest with AES-256-GCM keyed by ENCRYPTION_KEY.
 */
async function localGetOrCreateKeyPair(strapi: any, profileId: number | string): Promise<KeyPairResult> {
  const { importPKCS8 } = await import('jose')

  const existing = await strapi.db.query('api::issuer-key.issuer-key').findOne({
    where: { profile: profileId },
  })

  if (existing) {
    const pkcs8 = decrypt(existing.privateKeyEncrypted)
    const privateKey = await importPKCS8(pkcs8, 'EdDSA')
    return { privateKey, publicKeyJwk: existing.publicKeyJwk }
  }

  const { generateKeyPair, exportJWK, exportPKCS8 } = await import('jose')
  const { publicKey, privateKey } = await generateKeyPair('EdDSA', {
    crv: 'Ed25519',
    extractable: true,
  })

  const publicKeyJwk = await exportJWK(publicKey)
  const pkcs8 = await exportPKCS8(privateKey)

  await strapi.db.query('api::issuer-key.issuer-key').create({
    data: {
      profile: profileId,
      algorithm: 'Ed25519',
      publicKeyJwk,
      privateKeyEncrypted: encrypt(pkcs8),
    },
  })

  await mirrorPublicKeyOntoProfile(strapi, profileId, publicKeyJwk)

  return { privateKey, publicKeyJwk }
}

/**
 * Local provider: return the issuer's stored public key, or null.
 */
async function localGetPublicKey(strapi: any, profileId: number | string) {
  const record = await strapi.db.query('api::issuer-key.issuer-key').findOne({
    where: { profile: profileId },
  })
  if (!record) return null

  const { importJWK } = await import('jose')
  return importJWK(record.publicKeyJwk, 'EdDSA')
}

/**
 * Mirror a public key onto the profile so it's discoverable via
 * /api/profiles/:id per Open Badges 3.0.
 */
async function mirrorPublicKeyOntoProfile(strapi: any, profileId: number | string, publicKeyJwk: JWK) {
  const profile = await strapi.entityService.findOne('api::profile.profile', profileId, {
    populate: ['publicKey'],
  })
  if (!profile) return

  const baseUrl = strapi.config.get('server.url', 'http://localhost:1337')
  const existingKeys = profile.publicKey || []

  await strapi.entityService.update('api::profile.profile', profileId, {
    data: {
      publicKey: [
        ...existingKeys,
        {
          identifier: `${baseUrl}/api/profiles/${profileId}/keys#${Date.now()}`,
          type: 'Ed25519VerificationKey2020',
          controller: profile.did || `${baseUrl}/api/profiles/${profileId}/issuer`,
          publicKeyJwk,
        },
      ],
    },
  })
}

/**
 * KMS provider stub. Requires implementing getOrCreateKeyPair and
 * getPublicKey against your KMS/HSM's SDK. When SIGNING_KEY_PROVIDER=kms
 * is set and this isn't implemented, getOrCreateKeyPair throws.
 */
async function kmsGetOrCreateKeyPair(strapi: any, profileId: number | string): Promise<KeyPairResult> {
  throw new Error(
    'SIGNING_KEY_PROVIDER=kms is not implemented yet. ' +
    'Implement kmsGetOrCreateKeyPair in src/utils/signing-key-provider.ts ' +
    'using your KMS/HSM SDK (e.g. @aws-sdk/client-kms).'
  )
}

async function kmsGetPublicKey(strapi: any, profileId: number | string) {
  throw new Error('SIGNING_KEY_PROVIDER=kms is not implemented yet.')
}

/**
 * Public API — delegates to the configured provider.
 */
export default {
  /**
   * Returns the issuer's signing keypair, generating and persisting one on
   * first use.
   */
  async getOrCreateKeyPair(strapi: any, profileId: number | string): Promise<KeyPairResult> {
    if (PROVIDER === 'kms') return kmsGetOrCreateKeyPair(strapi, profileId)
    return localGetOrCreateKeyPair(strapi, profileId)
  },

  /**
   * Returns the issuer's public key for verification, or null.
   */
  async getPublicKey(strapi: any, profileId: number | string) {
    if (PROVIDER === 'kms') return kmsGetPublicKey(strapi, profileId)
    return localGetPublicKey(strapi, profileId)
  },

  /** Current provider name ("local" or "kms"). */
  get provider(): string {
    return PROVIDER
  },
}