/**
 * revocation-list service
 */

import { factories } from '@strapi/strapi'
import { errors } from '@strapi/utils'
import crypto from 'crypto'
const { ApplicationError } = errors

interface RevocationList {
  id: any
  issuer: any
  statusListCredential: string
  statusPurpose: string
  encodedList: string
  lastUpdated: Date
}

export default factories.createCoreService('api::revocation-list.revocation-list', ({ strapi }) => ({
  /**
   * Check if a credential has been revoked in any revocation list
   */
  async checkCredentialStatus(credentialId: string) {
    try {
      // Find the credential to get the issuer
      const credential = await strapi.db.query('api::credential.credential').findOne({
        where: { credentialId },
        populate: ['issuer']
      })
      
      if (!credential) {
        throw new ApplicationError('Credential not found')
      }
      
      // If the credential is directly marked as revoked
      if (credential.revoked) {
        return {
          revoked: true,
          reason: credential.revocationReason || 'Credential has been revoked'
        }
      }
      
      return { revoked: false }
    } catch (error) {
      console.error('Error checking credential status:', error)
      throw new ApplicationError(`Error checking credential status: ${error.message}`)
    }
  },
  
  /**
   * Check if a credential is revoked in a specific status list
   */
  async checkStatusInList(statusList: RevocationList, statusListIndex: number) {
    try {
      // In a real implementation, this would decode the bitstring
      // and check the specific index
      // This is a simplified implementation
      const encodedList = statusList.encodedList
      
      // Simple mock implementation using a comma-separated list of indices
      const revokedIndices = encodedList.split(',').map(i => parseInt(i.trim()))
      return revokedIndices.includes(statusListIndex)
    } catch (error) {
      console.error('Error checking status in list:', error)
      return false
    }
  },
  
  /**
   * Create a new status list credential for an issuer
   */
  async createStatusListCredential(issuerId: string, purpose = 'revocation') {
    try {
      // Find the issuer
      const issuer = await strapi.entityService.findOne('api::profile.profile', issuerId)
      
      if (!issuer) {
        throw new ApplicationError('Issuer not found')
      }
      
      // Create a unique ID for the status list credential
      const statusListId = `urn:uuid:${crypto.randomUUID()}`
      
      // Create an empty status list
      const statusList = await strapi.entityService.create('api::revocation-list.revocation-list', {
        data: {
          issuer: issuerId,
          statusListCredential: statusListId,
          statusPurpose: purpose,
          encodedList: '', // Empty list to start
          lastUpdated: new Date(),
          publishedAt: new Date()
        }
      })
      
      return statusList
    } catch (error) {
      console.error('Error creating status list credential:', error)
      throw new ApplicationError(`Error creating status list credential: ${error.message}`)
    }
  },
  
  /**
   * Update a status list to revoke a credential
   */
  async revokeCredentialInStatusList(statusListId: string, statusListIndex: number) {
    try {
      // Find the status list
      const statusList = await strapi.entityService.findOne('api::revocation-list.revocation-list', statusListId)
      
      if (!statusList) {
        throw new ApplicationError('Status list not found')
      }
      
      // Update the encoded list to include the new index
      const encodedList = statusList.encodedList || ''
      const indices = encodedList ? encodedList.split(',').map(i => parseInt(i.trim())) : []
      
      if (!indices.includes(statusListIndex)) {
        indices.push(statusListIndex)
      }
      
      // Update the status list
      await strapi.entityService.update('api::revocation-list.revocation-list', statusListId, {
        data: {
          encodedList: indices.join(','),
          lastUpdated: new Date()
        }
      })
      
      return true
    } catch (error) {
      console.error('Error revoking credential in status list:', error)
      throw new ApplicationError(`Error revoking credential in status list: ${error.message}`)
    }
  }
})) 