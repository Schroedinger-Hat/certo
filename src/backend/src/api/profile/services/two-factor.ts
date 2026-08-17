/**
 * TOTP-based two-factor authentication (2FA).
 *
 * Uses the otplib library (v13+ TOTP class API) to generate and verify
 * Time-based One-Time Passwords (RFC 6238), compatible with Google
 * Authenticator, Authy, 1Password, and any other TOTP-compliant app.
 *
 * Env:
 *   TOTP_ISSUER — the issuer shown in authenticator apps (default "Certo")
 *   TOTP_ALGORITHM — "sha1" (default), "sha256", or "sha512"
 *   TOTP_DIGITS — code length (default 6)
 *   TOTP_PERIOD — seconds per code (default 30)
 *
 * The secret is stored encrypted at rest on the profile (using the same
 * key-encryption mechanism as issuer keys), and the profile itself carries
 * totp_verified to indicate 2FA has been enabled.
 */

import { encrypt, decrypt } from '../../../utils/key-encryption'
import { TOTP } from 'otplib'

function createTotp() {
  return new TOTP({
    algorithm: (process.env.TOTP_ALGORITHM || 'sha1') as any,
    digits: parseInt(process.env.TOTP_DIGITS || '6', 10),
    period: parseInt(process.env.TOTP_PERIOD || '30', 10),
  })
}

export default ({ strapi }) => ({
  /**
   * Generates a new TOTP secret for a profile and stores it (encrypted)
   * on the profile record. Returns the base32 secret and an otpauth://
   * URI for QR-code generation in the frontend.
   */
  async setup(profile) {
    const totp = createTotp()

    const issuer = process.env.TOTP_ISSUER || 'Certo'
    const secret = totp.generateSecret()

    // Encrypt the secret before storing it.
    const encryptedSecret = encrypt(secret)

    await strapi.entityService.update('api::profile.profile', profile.id, {
      data: {
        totpSecret: encryptedSecret,
        totpVerified: false,
      },
    })

    const otpauth = totp.toURI({
      label: profile.email || profile.name,
      issuer,
      secret,
    })

    return {
      secret,
      otpauth,
    }
  },

  /**
   * Verifies a TOTP code against the profile's stored secret.
   * Returns true if valid, false otherwise. Also marks the profile as
   * `totp_verified: true` on first successful verification (completing
   * the setup flow).
   */
  async verify(profile, code, { markVerified = false } = {}) {
    if (!profile.totpSecret) {
      throw new Error('2FA is not enabled for this profile')
    }

    const totp = createTotp()
    const secret = decrypt(profile.totpSecret)
    const result = await totp.verify(code, { secret })
    const isValid = result.valid

    if (isValid && markVerified) {
      await strapi.entityService.update('api::profile.profile', profile.id, {
        data: { totpVerified: true },
      })
    }

    return isValid
  },

  /**
   * Disables 2FA for a profile by clearing the stored secret.
   */
  async disable(profile) {
    await strapi.entityService.update('api::profile.profile', profile.id, {
      data: {
        totpSecret: null,
        totpVerified: false,
      },
    })
    return { success: true }
  },
})
