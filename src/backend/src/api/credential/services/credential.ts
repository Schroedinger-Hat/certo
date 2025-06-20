/**
 * Credential service
 */

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
          { populate: { receivedCredentials: true } }
        )
      } else if (recipient.email) {
        // Find or create by email
        const existingRecipients = await strapi.entityService.findMany(
          'api::profile.profile',
          {
            filters: { email: recipient.email },
            populate: { receivedCredentials: true }
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
              receivedCredentials: []
            }
          })
        }
      }

      if (!recipientEntity) {
        throw new Error('Unable to find or create recipient profile')
      }

      // Find or create user associated with the profile
      await this.findOrCreateUser(recipientEntity)

      // The existing received credentials
      const existingCredentials = recipientEntity.receivedCredentials || [];

      // Generate a unique credential ID
      const credentialId = `urn:uuid:${this.generateUUID()}`

      // Generate cryptographic proof
      const proof = await this.generateProof(credentialId)

      // Create the credential
      const credentialDraft = await strapi.entityService.create('api::credential.credential', {
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
          proof: [proof]
        }
      })
      strapi.log.debug(`[credential.issue] Created DRAFT credential: ${JSON.stringify(credentialDraft, null, 2)}`);

      // Publish the newly created credential
      const publishedCredential = await strapi.entityService.update('api::credential.credential', credentialDraft.id, {
        data: {
          publishedAt: new Date(),
        },
      });
      strapi.log.debug(`[credential.issue] Published credential: ${JSON.stringify(publishedCredential, null, 2)}`);
      
      // Update the profile with the newly created credential
      await strapi.entityService.update('api::profile.profile', recipientEntity.id, {
        data: {
          receivedCredentials: {
            connect: [{ id: credentialDraft.id }]
          }
        }
      })

      // Add evidence if provided
      if (evidence && evidence.length > 0) {
        for (const item of evidence) {
          if (item.name || item.description) {
            await strapi.entityService.create('api::evidence.evidence', {
              data: {
                name: item.name || 'Evidence',
                description: item.description || '',
                credential: credentialDraft.id,
                publishedAt: new Date(),
              }
            })
          }
        }
      }

      // Return the full credential with populated relations
      const populatedCredential = await strapi.entityService.findOne(
        'api::credential.credential',
        credentialDraft.id,
        {
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
      const serializedCredential = await openBadgeService.serializeCredential(credentialDraft.id)

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
          const backendUrl = strapi.config.get('server.url', 'http://localhost:1337')
          
          const emailTemplate = {
            subject: `You've received a new credential: ${achievement.name}`,
            text: `Congratulations! You have been awarded the "${achievement.name}" credential.

View your credential at: ${frontendUrl}/credentials/${credentialDraft.credentialId}

${user ? `
A user account has been created for you to manage your credentials.
Username: ${user.username}
Email: ${user.email}

To set your password, please visit: ${frontendUrl}/forgot-password
` : ''}

Thank you,
The Certo Team`,
            html: `<h1>Congratulations!</h1>
                  <p>You have been awarded the "${achievement.name}" credential.</p>
                  <p><a href="${frontendUrl}/credentials/${credentialDraft.credentialId}">View your credential</a></p>
                  
                  ${user ? `
                  <h2>Your Account Information</h2>
                  <p>A user account has been created for you to manage your credentials.</p>
                  <p><strong>Username:</strong> ${user.username}<br />
                  <strong>Email:</strong> ${user.email}</p>
                  
                  <p>To set your password, please <a href="${frontendUrl}/forgot-password">click here</a> and enter your email address.</p>
                  ` : ''}
                  
                  <p>Thank you,<br />
                  The Certo Team</p>`
          }

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
   */
  async generateProof(credentialId) {
    try {
      // Get the server base URL
      const baseUrl = strapi.config.get('server.url', 'http://localhost:1337')

      // In a production environment, you would:
      // 1. Use a real key pair for signing
      // 2. Implement actual cryptographic signature logic
      // 3. Store private keys securely
      
      // This is a simplified implementation for demonstration purposes
      const proofId = this.generateUUID()
      
      // Create a proof object that follows the W3C Verifiable Credentials data model
      const proof = {
        type: "Ed25519Signature2020", // A common signature type for Verifiable Credentials
        created: new Date(),
        verificationMethod: `${baseUrl}/keys/ed25519-${proofId}`,
        proofPurpose: "assertionMethod",
        proofValue: this.generateProofValue(credentialId)
      }
      
      return proof
    } catch (error) {
      console.error('Error generating proof:', error)
      
      // Fallback to a basic proof if there's an error
      return {
        type: "Ed25519Signature2020",
        created: new Date(),
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