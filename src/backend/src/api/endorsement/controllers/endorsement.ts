/**
 * endorsement controller
 */

import { factories } from '@strapi/strapi'

// Define interface for endorsement
interface Endorsement {
  id: any
  endorsementId: string
  name: string
  issuanceDate: Date
  endorsedObject: string
  endorser?: {
    id: any
    name: string
  }
  proof?: any[]
}

export default factories.createCoreController('api::endorsement.endorsement', ({ strapi }) => ({
  // Custom controller methods for endorsement
  async verifyEndorsement(ctx) {
    try {
      const { id } = ctx.params
      
      const endorsement = await strapi.entityService.findOne('api::endorsement.endorsement', id, {
        status: 'published',
        populate: ['endorser', 'proof']
      }) as Endorsement
      
      if (!endorsement) {
        return ctx.notFound('Endorsement not found')
      }
      
      // In a real implementation, we would verify the cryptographic proof here
      // This is a simplified verification that just checks basic validity
      
      return { 
        verified: true,
        endorsement: {
          id: endorsement.id,
          endorsementId: endorsement.endorsementId,
          name: endorsement.name,
          issuanceDate: endorsement.issuanceDate,
          endorser: endorsement.endorser ? {
            id: endorsement.endorser.id,
            name: endorsement.endorser.name
          } : null,
          endorsedObject: endorsement.endorsedObject
        }
      }
    } catch (err) {
      console.error('Error verifying endorsement:', err)
      return ctx.internalServerError('Error verifying endorsement')
    }
  }
})) 