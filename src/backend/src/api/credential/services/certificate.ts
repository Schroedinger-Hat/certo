/**
 * Certificate service for generating visual certificates
 */

import { generateCertificateSvg } from '../../../utils/certificate-template'

export default ({ strapi }) => ({
  /**
   * Generate a certificate for a credential
   * @param {number|string} credentialId - The ID of the credential
   * @returns {string} The SVG certificate
   */
  async generateCertificate(credentialId: number | string): Promise<string> {
    try {
      // Get the credential with all necessary relationships
      const credential = await strapi.entityService.findOne(
        'api::credential.credential',
        credentialId,
        {
          populate: [
            'achievement',
            'achievement.image',
            'issuer',
            'issuer.image',
            'recipient'
          ]
        }
      )

      if (!credential) {
        throw new Error('Credential not found')
      }

      // Get required data
      const recipientName = credential.recipient?.name || 'Recipient'
      const achievementName = credential.achievement?.name || credential.name || 'Achievement'
      const issuerName = credential.issuer?.name || 'Issuer'
      const issueDate = credential.issuanceDate
      
      // Determine badge image URL
      const baseUrl = strapi.config.get('server.url', 'http://localhost:1337')
      let badgeImageUrl = null
      
      if (credential.achievement?.image?.url) {
        badgeImageUrl = credential.achievement.image.url.startsWith('http')
          ? credential.achievement.image.url
          : `${baseUrl}${credential.achievement.image.url}`
      }
      
      // Generate the certificate SVG
      return generateCertificateSvg({
        recipientName,
        achievementName,
        issuerName,
        issueDate,
        credentialId: credential.credentialId,
        badgeImageUrl
      })
    } catch (error) {
      console.error('Error generating certificate:', error)
      throw error
    }
  },

  /**
   * Generate a data URI for the certificate SVG
   * @param {number|string} credentialId - The ID of the credential
   * @returns {string} The data URI
   */
  async generateCertificateDataUri(credentialId: number | string): Promise<string> {
    try {
      const svg = await this.generateCertificate(credentialId)
      // Convert to a data URI
      const svgBase64 = Buffer.from(svg).toString('base64')
      return `data:image/svg+xml;base64,${svgBase64}`
    } catch (error) {
      console.error('Error generating certificate data URI:', error)
      throw error
    }
  }
}) 