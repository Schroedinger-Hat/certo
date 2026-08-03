/**
 * Per-issuer signing keypairs.
 *
 * Each issuer profile gets its own Ed25519 keypair the first time it's
 * needed (find-or-create, mirroring credential.ts's findOrCreateUser). The
 * private key is encrypted at rest in the issuer-key content type (which has
 * no REST routes at all - see its schema.json); the public key is also
 * mirrored onto profile.publicKey so it's discoverable the normal Open
 * Badges way.
 */

import type { CryptoKey, JWK } from 'jose'
import { encrypt, decrypt } from '../../../utils/key-encryption'

interface KeyPairResult {
  privateKey: CryptoKey
  publicKeyJwk: JWK
}

export default ({ strapi }: { strapi: any }) => ({
  /**
   * Returns the issuer's signing keypair, generating and persisting one on
   * first use.
   */
  async getOrCreateKeyPair(profileId: number | string): Promise<KeyPairResult> {
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

    await this.mirrorPublicKeyOntoProfile(profileId, publicKeyJwk)

    return { privateKey, publicKeyJwk }
  },

  /**
   * Returns the issuer's public key (for verification), or null if the
   * issuer has never signed anything yet.
   */
  async getPublicKey(profileId: number | string) {
    const record = await strapi.db.query('api::issuer-key.issuer-key').findOne({
      where: { profile: profileId },
    })
    if (!record) return null

    const { importJWK } = await import('jose')
    return importJWK(record.publicKeyJwk, 'EdDSA')
  },

  /**
   * Appends a badge.public-key component entry to the profile so the key is
   * also discoverable via /api/profiles/:id, matching Open Badges 3.0's
   * expectation that an issuer Profile lists its verification keys.
   */
  async mirrorPublicKeyOntoProfile(profileId: number | string, publicKeyJwk: JWK) {
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
  },
})
