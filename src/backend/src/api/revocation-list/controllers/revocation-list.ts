/**
 * revocation-list controller
 */

import { factories } from '@strapi/strapi'

interface Credential {
  id: any
  credentialId: string
  revoked: boolean
  revocationReason?: string
  issuer: {
    id: any
  }
}

interface RevocationList {
  id: any
  revokedCredentials: Record<string, { reason: string, date: string }>
  lastUpdated: Date
}

export default factories.createCoreController('api::revocation-list.revocation-list', ({ strapi }) => ({
  // Custom controller methods for revocation list
  async checkStatus(ctx) {
    try {
      const { credentialId } = ctx.params
      
      if (!credentialId) {
        return ctx.badRequest('Credential ID is required')
      }
      
      // Find the credential
      const credential = await strapi.db.query('api::credential.credential').findOne({
        where: { credentialId },
        populate: ['issuer']
      }) as Credential
      
      if (!credential) {
        return ctx.notFound('Credential not found')
      }
      
      // If revoked directly, return that status
      if (credential.revoked) {
        return {
          revoked: true,
          reason: credential.revocationReason || 'No reason provided'
        }
      }
      
      // Otherwise check the revocation lists for this issuer
      const revocationLists = await strapi.db.query('api::revocation-list.revocation-list').findMany({
        where: { issuer: credential.issuer.id },
        orderBy: { lastUpdated: 'desc' },
        limit: 1
      }) as RevocationList[]
      
      if (revocationLists.length === 0) {
        return { revoked: false }
      }
      
      const list = revocationLists[0]
      const revokedCredentials = list.revokedCredentials || {}
      
      if (revokedCredentials[credentialId]) {
        return {
          revoked: true,
          reason: revokedCredentials[credentialId].reason || 'No reason provided',
          date: revokedCredentials[credentialId].date
        }
      }
      
      return { revoked: false }
    } catch (err) {
      console.error('Error checking credential status:', err)
      return ctx.internalServerError('Error checking credential status')
    }
  }
})) 