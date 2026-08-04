/**
 * Credential service
 */

import { getNotificationProvider } from './notification-providers'
import { credentialsIssuedTotal } from '../../../monitoring/metrics'

export default ({ strapi }) => ({
  /**
   * Issue a new credential
   * @param {Object} achievement - The achievement to issue
   * @param {Object} recipient - The recipient profile
   * @param {Array} evidence - Optional evidence items
   * @param {string} expirationDate - Optional expiration date for the credential
   * @param {number} [actorId] - The users-permissions user id of the caller, for the audit log
   */
  async issue(achievement, recipient, evidence = [], expirationDate = undefined, actorId = undefined) {
    try {
      const recipientEntity = await this.findOrCreateRecipientProfile(recipient)

      // Find or create user associated with the profile
      await this.findOrCreateUser(recipientEntity)

      // Generate a unique credential ID
      const credentialId = `urn:uuid:${this.generateUUID()}`

      // Prepare the credential payload for signing (excluding proof)
      const credentialPayload = {
        credentialId,
        name: achievement.name,
        description: achievement.description,
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        achievement: achievement.id,
        issuer: achievement.creator?.id,
        recipient: recipientEntity.id,
        issuanceDate: new Date(),
        revoked: false,
        publishedAt: new Date(),
        ...(expirationDate ? { expirationDate: new Date(expirationDate) } : {})
      }
      // Generate cryptographic proof (JWS)
      const proof = await this.generateProof(credentialPayload.issuer, credentialPayload)

      // Reserve a slot for this credential in the issuer's revocation
      // status list (StatusList2021), creating the list on first use.
      const revocationListService = strapi.service('api::revocation-list.revocation-list')
      const statusList = await revocationListService.getOrCreateActiveListForIssuer(credentialPayload.issuer)
      const statusListIndex = await revocationListService.assignNextIndex(statusList.id)

      // Create the credential
      const credential = await strapi.entityService.create('api::credential.credential', {
        data: {
          credentialId,
          name: achievement.name,
          description: achievement.description,
          type: ['VerifiableCredential', 'OpenBadgeCredential'],
          achievement: achievement.id,
          issuer: achievement.creator?.id,
          recipient: recipientEntity.id,
          issuanceDate: new Date(),
          revoked: false,
          publishedAt: new Date(),
          proof: [proof],
          statusList: statusList.id,
          statusListIndex,
          ...(expirationDate ? { expirationDate: new Date(expirationDate) } : {})
        }
      })

      // Explicitly connect the credential to the recipient's profile.
      // This ensures the bidirectional relationship is updated.
      if (recipientEntity && recipientEntity.id && credential && credential.id) {
        await strapi.entityService.update('api::profile.profile', recipientEntity.id, {
          data: {
            receivedCredentials: {
              connect: [{ id: credential.id }],
            },
            publishedAt: new Date(),
          },
        })
      }

      // Add evidence if provided
      if (evidence && evidence.length > 0) {
        for (const item of evidence) {
          if (item.name || item.description) {
            await strapi.entityService.create('api::evidence.evidence', {
              data: {
                name: item.name || 'Evidence',
                description: item.description || '',
                credential: credential.id,
                publishedAt: new Date(),
              }
            })
          }
        }
      }

      // Return the full credential with populated relations
      const populatedCredential = await strapi.entityService.findOne(
        'api::credential.credential',
        credential.id,
        {
          status: 'published',
          populate: [
            'achievement',
            'issuer',
            'recipient',
            'evidence',
            'proof'
          ],
        }
      )

      // Convert to Open Badge format
      const openBadgeService = strapi.service('api::credential.open-badge')
      const serializedCredential = await openBadgeService.serializeCredential(credential.id)

      // Send notification email to recipient
      let emailSent = false
      let emailError = null

      try {
        if (recipientEntity.email) {
          // Check if a user was created for this profile
          const user = await strapi.query('plugin::users-permissions.user').findOne({
            where: { email: recipientEntity.email }
          })

          const frontendUrl = strapi.config.get('frontend.url', 'http://localhost:3000')

          const notificationProvider = getNotificationProvider(strapi)
          await notificationProvider.sendCredentialIssued({
            to: recipientEntity.email,
            achievement,
            credential,
            frontendUrl,
            user,
          })

          emailSent = true
        }
      } catch (e) {
        console.error('Failed to send notification email:', e)
        emailError = e.message
      }

      // Notify any registered webhook subscriptions. Best-effort: dispatch()
      // never throws (each delivery is individually caught/logged), so this
      // can't fail the issuance itself.
      const webhookDispatcher = strapi.service('api::webhook-subscription.dispatch')
      await webhookDispatcher.dispatch('credential.issued', {
        credentialId: credential.credentialId,
        achievementId: achievement.id,
        issuerId: credentialPayload.issuer,
        recipientId: recipientEntity.id,
      })

      // Record who issued this - see known-issues-and-dev-notes.md item 5
      // (this controller path disables the normal permission check).
      const auditLog = strapi.service('api::audit-log-entry.audit-log')
      await auditLog.record({
        action: 'credential.issue',
        entityType: 'credential',
        entityId: credential.id,
        actorId,
        metadata: { achievementId: achievement.id, recipientId: recipientEntity.id },
      })
      credentialsIssuedTotal.inc()

      // Return both the populated credential record and the OBv3 serialized version
      return {
        credential: populatedCredential,
        openBadge: serializedCredential,
        notification: {
          sent: emailSent,
          error: emailError
        }
      }
    } catch (error) {
      console.error('Error issuing credential:', error)
      throw error
    }
  },

  /**
   * Find or create the recipient profile for an incoming credential -
   * either an existing profile by id, an existing one by email, or a new
   * bare Recipient profile if neither exists yet. Shared by issue() and by
   * the profile data-portability service's import path.
   * @param {Object} recipient - `{ id }` or `{ email, name }`
   */
  async findOrCreateRecipientProfile(recipient) {
    let recipientEntity = null

    if (recipient.id && recipient.id !== 0) {
      recipientEntity = await strapi.entityService.findOne(
        'api::profile.profile',
        recipient.id,
        { status: 'published' }
      )
    } else if (recipient.email) {
      const existingRecipients = await strapi.entityService.findMany(
        'api::profile.profile',
        {
          filters: { email: recipient.email },
          status: 'published',
        }
      )

      if (existingRecipients && existingRecipients.length > 0) {
        recipientEntity = existingRecipients[0]
      } else {
        recipientEntity = await strapi.entityService.create('api::profile.profile', {
          data: {
            name: recipient.name,
            email: recipient.email,
            profileType: 'Recipient',
            publishedAt: new Date(),
          }
        })
      }
    }

    if (!recipientEntity) {
      throw new Error('Unable to find or create recipient profile')
    }

    return recipientEntity
  },

  /**
   * Find or create a user associated with a profile
   * @param {Object} profile - The profile to associate with a user
   */
  async findOrCreateUser(profile) {
    try {
      if (!profile.email) {
        return null
      }

      // Check if user already exists
      const existingUser = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email: profile.email },
        populate: {
          role: true,
          createdBy: true,
          updatedBy: true,
          localizations: true,
          provider: true,
          resetPasswordToken: true,
          username: true,
          email: true,
          password: true,
          locale: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true
        }
      })

      if (existingUser) {
        return existingUser
      }

      // Get the authenticated role
      const authenticatedRole = await strapi
        .query('plugin::users-permissions.role')
        .findOne({ where: { type: 'authenticated' } })

      if (!authenticatedRole) {
        console.error('Authenticated role not found')
        return null
      }

      // Generate a random password
      const randomPassword = this.generateRandomPassword()

      // Create a new user with a random password
      const newUser = await strapi.service('plugin::users-permissions.user').add({
        username: profile.email.split('@')[0] + Date.now(),
        email: profile.email,
        password: randomPassword,
        role: authenticatedRole.id,
        confirmed: true,
        provider: 'local'
      })

      return newUser
    } catch (error) {
      console.error('Error finding or creating user:', error)
      return null
    }
  },

  /**
   * Generate a random password
   * @returns {string} A random password
   */
  generateRandomPassword() {
    const length = 12
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()'
    let password = ''
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length)
      password += charset[randomIndex]
    }
    
    return password
  },

  /**
   * Get or create a default system issuer profile
   */
  async getDefaultIssuerId() {
    try {
      // Try to find a system issuer
      const existingIssuers = await strapi.entityService.findMany('api::profile.profile', {
        filters: { name: 'System Issuer' },
        status: 'published',
      })
      
      if (existingIssuers && existingIssuers.length > 0) {
        return existingIssuers[0].id
      }
      
      // Create a default system issuer
      const systemIssuer = await strapi.entityService.create('api::profile.profile', {
        data: {
          name: 'System Issuer',
          profileType: 'Issuer',
          publishedAt: new Date(),
        }
      })
      
      return systemIssuer.id
    } catch (error) {
      console.error('Error getting default issuer:', error)
      return null
    }
  },

  /**
   * Generate cryptographic proof for a credential, signed with the
   * issuer's own keypair (generated on first use - see
   * api::profile.issuer-keys). Throws rather than falling back to a fake
   * proof: an unsigned "signed" credential is worse than a failed issuance.
   * @param {string} issuerId - The ID of the issuer profile
   * @param {Object} credentialPayload - The credential payload
   */
  async generateProof(issuerId, credentialPayload) {
    const baseUrl = strapi.config.get('server.url', 'http://localhost:1337')
    const payload = { ...credentialPayload }
    delete payload.proof

    const issuerKeys = strapi.service('api::profile.issuer-keys')
    const { privateKey } = await issuerKeys.getOrCreateKeyPair(issuerId)

    const { SignJWT } = await import('jose')
    const jws = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'EdDSA' })
      .sign(privateKey)

    return {
      type: "Ed25519Signature2020",
      created: new Date().toISOString(),
      verificationMethod: `${baseUrl}/api/profiles/${issuerId}/keys`,
      proofPurpose: "assertionMethod",
      jws
    }
  },

  /**
   * Generate a UUID v4
   * @returns {string} A UUID v4 string
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  },
}) 