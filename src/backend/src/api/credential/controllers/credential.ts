/**
 * credential controller
 */

import { factories } from '@strapi/strapi'
import crypto from 'crypto'

// Define types to help with type assertions
interface Achievement {
  id: any
  name: string
  description: string
  image?: any
  creator?: {
    id: any
  }
}

interface Profile {
  id: any
  name: string
}

interface Credential {
  id: any
  credentialId: string
  name: string
  description: string
  issuanceDate: Date
  expirationDate?: Date
  revoked: boolean
  revocationReason?: string
  achievement?: Achievement
  issuer?: Profile
  recipient?: Profile
  evidence?: any[]
  proof?: any[]
}

export default factories.createCoreController('api::credential.credential', ({ strapi }) => ({
  /**
   * Custom method to issue a new Open Badge credential
   */
  async issue(ctx) {
    try {
      strapi.log.debug('[credential.issue] Request received:', ctx.request.body)
      
      // Temporarily disable auth check
      ctx.state.auth = { strategy: { name: 'public' } }
      
      const { data } = ctx.request.body
      if (!data) {
        return ctx.badRequest('Missing required data')
      }

      const { achievementId, recipientId, evidence = [] } = data
      
      if (!achievementId) {
        return ctx.badRequest('Achievement ID is required')
      }

      // Find the achievement and ensure it's published
      const achievements = await strapi.entityService.findMany('api::achievement.achievement', {
        filters: {
          id: achievementId,
          publishedAt: { $not: null },
        },
        populate: { creator: true, image: true },
      });

      if (!achievements || achievements.length === 0) {
        return ctx.notFound('Published achievement not found');
      }
      const achievement = achievements[0];

      if (!achievement) {
        return ctx.notFound('Achievement not found')
      }

      // Add recipient data if provided in the request
      const recipientData = data.recipient || {}
      const recipient = {
        id: recipientId || 0,
        ...recipientData
      }

      strapi.log.debug('[credential.issue] Processing with data:', { 
        achievementId, 
        recipientId: recipient.id,
        recipientName: recipient.name
      })

      // Create the credential
      const credential = await strapi.service('api::credential.credential').issue(
        achievement,
        recipient,
        evidence
      )

      return credential
    } catch (error) {
      strapi.log.error('[credential.issue] Error:', error)
      return ctx.badRequest(error.message || 'Failed to issue credential')
    }
  },

  /**
   * Verify a credential
   * @param {Object} ctx - The context object
   */
  async verify(ctx) {
    try {
      const { id } = ctx.params

      if (!id) {
        return ctx.badRequest('Credential ID is required')
      }

      // Attempt to use the verification service (which looks up by credentialId)
      try {
        const verificationService = strapi.service('api::credential.verification')
        const result = await verificationService.verifyCredential(id)
        return result
      } catch (error) {
        // If there's an error with the verification service, we'll attempt a fallback method
        console.warn('Using fallback verification method:', error.message)
        
        // Find the credential by credentialId field
        const credentials = await strapi.entityService.findMany('api::credential.credential', {
          filters: { credentialId: id },
          populate: [
            'achievement', 
            'achievement.image', 
            'achievement.criteria',
            'achievement.alignment',
            'achievement.skills',
            'issuer', 
            'issuer.image',
            'recipient', 
            'evidence',
            'proof'
          ],
        })

        if (!credentials || credentials.length === 0) {
          return ctx.notFound('Credential not found')
        }

        const credential = credentials[0]
        
        // Convert to Open Badge format for frontend display
        const openBadgeService = strapi.service('api::credential.open-badge')
        const serializedCredential = await openBadgeService.serializeCredential(credential.id)

        // Check if the credential is valid (not revoked and not expired)
        const isValid = !credential.revoked &&
          (!credential.expirationDate || new Date(credential.expirationDate as string) > new Date());

        // Return verification result
        return {
          verified: isValid,
          checks: [
            { check: 'existence', result: 'success', message: 'Credential exists in the system' },
            { check: 'revocation', result: !credential.revoked ? 'success' : 'error', 
              message: !credential.revoked ? null : 'Credential has been revoked' },
            { check: 'expiration', result: (!credential.expirationDate || new Date(credential.expirationDate as string) > new Date()) ? 'success' : 'error',
              message: (!credential.expirationDate || new Date(credential.expirationDate as string) > new Date()) ? null : 'Credential has expired' }
          ],
          credential: serializedCredential,
          rawCredential: credential
        }
      }
    } catch (error) {
      console.error('Error verifying credential:', error)
      return ctx.badRequest(error.message || 'Failed to verify credential')
    }
  },
  
  /**
   * Revoke a credential
   */
  async revoke(ctx) {
    try {
      const { id } = ctx.params
      const { reason } = ctx.request.body

      if (!id) {
        return ctx.badRequest('Credential ID is required')
      }

      // Update the credential to revoked status
      const updatedCredential = await strapi.entityService.update('api::credential.credential', id, {
        data: {
          revoked: true,
          revocationReason: reason || 'No reason provided'
        },
      })

      return { success: true, credential: updatedCredential }
    } catch (error) {
      console.error('Error revoking credential:', error)
      return ctx.badRequest(error.message || 'Failed to revoke credential')
    }
  },

  /**
   * Export a credential as an Open Badge Verifiable Credential
   */
  async exportOpenBadge(ctx) {
    try {
      const { id } = ctx.params
      
      // Use the open-badge service to serialize the credential
      const openBadgeService = strapi.service('api::credential.open-badge')
      const openBadgeVC = await openBadgeService.serializeCredential(id)
      
      return openBadgeVC
    } catch (err) {
      console.error('Error exporting Open Badge:', err)
      return ctx.internalServerError('Error exporting Open Badge')
    }
  },

  /**
   * Import an Open Badge Verifiable Credential
   */
  async importOpenBadge(ctx) {
    try {
      const { credential } = ctx.request.body
      
      if (!credential) {
        return ctx.badRequest('Credential data is required')
      }

      // Use the open-badge service to import the credential
      const openBadgeService = strapi.service('api::credential.open-badge')
      const importedCredential = await openBadgeService.importCredential(credential)
      
      return { 
        success: true, 
        credential: importedCredential
      }
    } catch (err) {
      console.error('Error importing Open Badge:', err)
      return ctx.badRequest('Error importing Open Badge: ' + err.message)
    }
  },

  /**
   * Validate a credential submitted in the request body
   * This is for validating external credentials not in our database
   */
  async validate(ctx) {
    try {
      const { credential } = ctx.request.body

      if (!credential) {
        return ctx.badRequest('Credential data is required')
      }

      // Use the OpenBadge service to validate the credential
      const result = await strapi.service('api::credential.open-badge').validateExternalCredential(credential)

      return result
    } catch (error) {
      console.error('Error validating credential:', error)
      return ctx.badRequest(error.message || 'Failed to validate credential')
    }
  },

  /**
   * Export a credential
   * @param {Object} ctx - The context object
   */
  async export(ctx) {
    try {
      const { id } = ctx.params

      if (!id) {
        return ctx.badRequest('Credential ID is required')
      }

      // Find the credential
      const credential = await strapi.entityService.findOne('api::credential.credential', id, {
        populate: ['achievement', 'issuer', 'recipient', 'evidence'],
      })

      if (!credential) {
        return ctx.notFound('Credential not found')
      }

      // Use the OpenBadge service to serialize the credential
      const openBadgeCredential = await strapi.service('api::credential.open-badge').serializeCredential(id)

      return {
        data: openBadgeCredential,
        meta: {
          format: 'OpenBadges3.0',
        }
      }
    } catch (error) {
      console.error('Error exporting credential:', error)
      return ctx.badRequest(error.message || 'Failed to export credential')
    }
  },

  /**
   * Import a credential
   * @param {Object} ctx - The context object
   */
  async import(ctx) {
    try {
      const { certificateData } = ctx.request.body

      if (!certificateData) {
        return ctx.badRequest('Certificate data is required')
      }

      // Use the OpenBadge service to import the credential
      const credential = await strapi.service('api::credential.open-badge').importCredential(certificateData)

      return {
        data: credential,
        meta: {
          message: 'Credential imported successfully',
        }
      }
    } catch (error) {
      console.error('Error importing credential:', error)
      return ctx.badRequest(error.message || 'Failed to import credential')
    }
  },

  /**
   * Get badge by ID
   * @param {Object} ctx - The context object
   */
  async getBadge(ctx) {
    try {
      const { id } = ctx.params

      if (!id) {
        return ctx.badRequest('Badge ID is required')
      }

      // Find the achievement
      const achievement = await strapi.entityService.findOne(
        'api::achievement.achievement',
        id,
        {
          populate: {
            issuer: true,
            image: true,
            criteria: true,
            alignment: true,
            skills: true
          },
        }
      )

      if (!achievement) {
        return ctx.notFound('Badge not found')
      }

      return {
        data: achievement,
        meta: {
          format: 'OpenBadges3.0',
        }
      }
    } catch (error) {
      console.error('Error retrieving badge:', error)
      return ctx.badRequest(error.message || 'Failed to retrieve badge')
    }
  },

  /**
   * Get a certificate for a credential
   * @param {Object} ctx - The context object
   */
  async getCertificate(ctx) {
    try {
      const { id } = ctx.params
      
      if (!id) {
        return ctx.badRequest('Credential ID is required')
      }
      
      // Get the certificate service
      const certificateService = strapi.service('api::credential.certificate')
      
      // Generate the certificate SVG
      const svg = await certificateService.generateCertificate(id)
      
      // Set the content type and return the SVG
      ctx.set('Content-Type', 'image/svg+xml')
      return svg
    } catch (error) {
      console.error('Error generating certificate:', error)
      return ctx.badRequest(error.message || 'Failed to generate certificate')
    }
  },

  /**
   * Direct certificate endpoint for /verify/:id
   * Returns the certificate image for a credential
   */
  async getDirectCertificate(ctx) {
    try {
      const { id } = ctx.params;
      
      if (!id) {
        return ctx.badRequest('Credential ID is required');
      }
      
      console.log(`Getting certificate for credential ID: ${id}`);
      
      // Find credential by ID (could be UUID or database ID)
      let credential;
      
      // First try to find by credentialId (UUID)
      credential = await strapi.db.query('api::credential.credential').findOne({
        where: { credentialId: id },
        populate: ['achievement', 'issuer', 'recipient'],
      });
      
      // If not found, try by database ID
      if (!credential && !isNaN(parseInt(id))) {
        credential = await strapi.db.query('api::credential.credential').findOne({
          where: { id: parseInt(id) },
          populate: ['achievement', 'issuer', 'recipient'],
        });
      }
      
      if (!credential) {
        return ctx.notFound('Credential not found');
      }
      
      // Generate the certificate
      const certificateService = strapi.service('api::credential.certificate');
      const { image, contentType } = await certificateService.generateCertificate(credential);
      
      // Set content type and send the image
      ctx.type = contentType;
      return image;
    } catch (error) {
      console.error('Error generating certificate:', error);
      return ctx.badRequest(error.message || 'Failed to generate certificate');
    }
  },

  /**
   * Override the default find method to filter results based on user
   */
  async find(ctx) {
    console.log('Credential find method called');
    console.log('User authenticated:', !!ctx.state.user);
    
    if (ctx.state.user) {
      console.log('User email:', ctx.state.user.email);
    }
    
    try {
      // If user is authenticated, filter credentials
      if (ctx.state.user) {
        try {
          // Find profile by user's email
          const userEmail = ctx.state.user.email
          console.log('Looking for profile with email:', userEmail);
          
          const profiles = await strapi.entityService.findMany('api::profile.profile', {
            filters: { email: userEmail },
          })

          console.log('Found profiles:', profiles?.length || 0);

          if (!profiles || profiles.length === 0) {
            console.log('No profile found for user, returning empty array');
            return { data: [] }
          }

          // Get the profile ID
          const profileId = profiles[0].id
          console.log('Profile ID:', profileId);

          // Use entityService directly instead of calling super.find
          const credentials = await strapi.entityService.findMany('api::credential.credential', {
            filters: {
              $or: [
                { recipient: { id: profileId } },
                { issuer: { id: profileId } }
              ]
            },
            populate: ['achievement', 'issuer', 'recipient']
          }) as any[];
          
          console.log('Found credentials:', credentials?.length || 0);
          
          return { 
            data: credentials.map(credential => {
              // Create a clean credential object with proper typing
              const formattedCredential = {
                id: credential.id,
                attributes: {
                  ...credential
                }
              };
              
              // Safely add related entities if they exist
              if (credential.achievement) {
                formattedCredential.attributes.achievement = {
                  data: {
                    id: credential.achievement.id,
                    attributes: credential.achievement
                  }
                };
              }
              
              if (credential.issuer) {
                formattedCredential.attributes.issuer = {
                  data: {
                    id: credential.issuer.id,
                    attributes: credential.issuer
                  }
                };
              }
              
              if (credential.recipient) {
                formattedCredential.attributes.recipient = {
                  data: {
                    id: credential.recipient.id,
                    attributes: credential.recipient
                  }
                };
              }
              
              return formattedCredential;
            }),
            meta: { 
              pagination: {
                page: 1,
                pageSize: credentials.length,
                pageCount: 1,
                total: credentials.length
              }
            }
          }
        } catch (error) {
          console.error('Error in credential find override:', error)
        }
      }

      // For non-authenticated users or if there was an error, return empty array
      return { data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } }
    } catch (error) {
      console.error('Unexpected error in credential.find:', error);
      return { data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } }
    }
  },

  /**
   * Batch issue credentials to multiple recipients
   */
  async batchIssue(ctx) {
    try {
      const { data } = ctx.request.body
      if (!data || !Array.isArray(data.recipients) || data.recipients.length === 0) {
        return ctx.badRequest('Missing or invalid recipients array')
      }

      const { achievementId, recipients, evidence = [] } = data

      if (!achievementId) {
        return ctx.badRequest('Achievement ID is required')
      }

      // Find the achievement
      const achievement = await strapi.entityService.findOne('api::achievement.achievement', achievementId, {
        populate: { creator: true }
      })

      if (!achievement) {
        return ctx.notFound('Achievement not found')
      }

      const results = []
      for (const recipientData of recipients) {
        try {
          const recipient = { ...recipientData }
          const credential = await strapi.service('api::credential.credential').issue(
            achievement,
            recipient,
            evidence
          )
          results.push({ success: true, recipient: recipientData.email, data: credential })
        } catch (error) {
          strapi.log.error(`[credential.batchIssue] Error issuing to ${recipientData.email}:`, error)
          results.push({ success: false, recipient: recipientData.email, error: error.message })
        }
      }

      return { results }
    } catch (error) {
      strapi.log.error('[credential.batchIssue] General error:', error)
      return ctx.badRequest(error.message || 'Failed to batch issue credentials')
    }
  }
})) 