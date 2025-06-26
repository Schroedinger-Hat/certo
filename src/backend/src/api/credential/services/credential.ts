/**
 * Credential service
 */

import { generateCredentialIssuanceEmail } from '../templates/credential-issuance'

export default ({ strapi }) => ({
  /**
   * Issue a new credential
   * @param {Object} achievement - The achievement to issue
   * @param {Object} recipient - The recipient profile
   * @param {Array} evidence - Optional evidence items
   */
  async issue(achievement, recipient, evidence = []) {
    try {
      // Find or create recipient profile
      let recipientEntity = null

      if (recipient.id && recipient.id !== 0) {
        // Find existing recipient by ID
        recipientEntity = await strapi.entityService.findOne(
          'api::profile.profile',
          recipient.id,
          { status: 'published' }
        )
      } else if (recipient.email) {
        // Find or create by email
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
          // Create new recipient profile
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
        issuer: achievement.creator?.id || await this.getDefaultIssuerId(),
        recipient: recipientEntity.id,
        issuanceDate: new Date(),
        revoked: false,
        publishedAt: new Date()
      }
      // Generate cryptographic proof (JWS)
      const proof = await this.generateProof(credentialId, achievement.creator?.id || await this.getDefaultIssuerId(), credentialPayload)

      // Create the credential
      const credential = await strapi.entityService.create('api::credential.credential', {
        data: {
          credentialId,
          name: achievement.name,
          description: achievement.description,
          type: ['VerifiableCredential', 'OpenBadgeCredential'],
          achievement: achievement.id,
          issuer: achievement.creator?.id || await this.getDefaultIssuerId(),
          recipient: recipientEntity.id,
          issuanceDate: new Date(),
          revoked: false,
          publishedAt: new Date(),
          proof: [proof]
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
          
          const emailTemplate = generateCredentialIssuanceEmail({
            achievement,
            credential,
            frontendUrl,
            user,
          })

          await strapi.plugins['email'].services.email.send({
            to: recipientEntity.email,
            subject: emailTemplate.subject,
            text: emailTemplate.text,
            html: emailTemplate.html,
          })

          emailSent = true
        }
      } catch (e) {
        console.error('Failed to send notification email:', e)
        emailError = e.message
      }

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
   * Find or create a user associated with a profile
   * @param {Object} profile - The profile to associate with a user
   */
  async findOrCreateUser(profile) {
    try {
      if (!profile.email) {
        console.log('Profile has no email, skipping user creation')
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
        console.log(`User already exists for email ${profile.email}`)
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

      console.log(`Created new user for email ${profile.email}`)
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
   * Generate cryptographic proof for a credential
   * @param {string} credentialId - The ID of the credential
   * @param {string} issuerId - The ID of the issuer profile
   */
  async generateProof(credentialId, issuerId, credentialPayload) {
    try {
      const baseUrl = strapi.config.get('server.url', 'http://localhost:1337')
      const payload = { ...credentialPayload }
      delete payload.proof
      const pkcs8 = process.env.ED25519_PRIVATE_KEY_PKCS8
      if (!pkcs8) throw new Error('ED25519_PRIVATE_KEY_PKCS8 env var not set')
      const { importPKCS8, SignJWT } = await import('jose')
      console.log(pkcs8)
      const privateKey = await importPKCS8(Buffer.from(pkcs8, 'base64').toString('utf8'), 'EdDSA')
      const jws = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'EdDSA' })
        .sign(privateKey)
      const proof = {
        type: "Ed25519Signature2020",
        created: new Date().toISOString(),
        verificationMethod: `${baseUrl}/api/profiles/${issuerId}/keys`,
        proofPurpose: "assertionMethod",
        jws
      }
      return proof
    } catch (error) {
      console.error('Error generating proof:', error)
      return {
        type: "Ed25519Signature2020",
        created: new Date().toISOString(),
        verificationMethod: `http://example.org/keys/1`,
        proofPurpose: "assertionMethod",
        proofValue: "z" + this.generateUUID().replace(/-/g, '')
      }
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

  /**
   * Generate a simple proof value for a credential ID
   * This is a simplified version for demonstration purposes
   * In a real implementation, this would use a proper cryptographic algorithm
   * @param {string} credentialId - The credential ID
   * @returns {string} A simulated proof value
   */
  generateProofValue(credentialId) {
    // In a real implementation, this would be an actual cryptographic signature
    // Here we're just creating a dummy value for demonstration
    const dummySignature = Buffer.from(`${credentialId}-${Date.now()}`).toString('base64')
    return `z${dummySignature}${this.generateUUID().replace(/-/g, '')}`
  }
}) 