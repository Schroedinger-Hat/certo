/**
 * Per-issuer signing keypairs.
 *
 * Each issuer profile gets its own Ed25519 keypair the first time it's
 * needed (find-or-create, mirroring credential.ts's findOrCreateUser). The
 * private key is encrypted at rest in the issuer-key content type (which has
 * no REST routes at all - see its schema.json); the public key is also
 * mirrored onto profile.publicKey so it's discoverable the normal Open
 * Badges way.
 *
 * Key material is managed through the pluggable signing-key-provider
 * abstraction (src/utils/signing-key-provider.ts), so deployments can
 * switch from local encrypted-at-rest keys to a KMS/HSM-backed provider
 * by setting SIGNING_KEY_PROVIDER=kms.
 */

import type { CryptoKey, JWK } from 'jose'
import signingKeyProvider from '../../../utils/signing-key-provider'

interface KeyPairResult {
  privateKey: CryptoKey
  publicKeyJwk: JWK
}

export default ({ strapi }: { strapi: any }) => ({
  /**
   * Returns the issuer's signing keypair, generating and persisting one on
   * first use. Delegates to the configured signing-key provider.
   */
  async getOrCreateKeyPair(profileId: number | string): Promise<KeyPairResult> {
    return signingKeyProvider.getOrCreateKeyPair(strapi, profileId)
  },

  /**
   * Returns the issuer's public key (for verification), or null if the
   * issuer has never signed anything yet. Delegates to the configured
   * signing-key provider.
   */
  async getPublicKey(profileId: number | string) {
    return signingKeyProvider.getPublicKey(strapi, profileId)
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
