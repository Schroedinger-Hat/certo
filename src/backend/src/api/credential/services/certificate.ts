/**
 * Certificate service for generating visual certificates
 */

import { generateCertificateSvg } from '../../../utils/certificate-template'
import fs from 'fs'
import path from 'path'

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
          status: 'published',
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
      
      // Determine badge image as data URI
      let badgeImageDataUri = null
      if (credential.achievement?.image?.url) {
        // Get the absolute path to the image file
        const uploadPath = path.join(strapi.dirs.static.public, credential.achievement.image.url)
        try {
          const ext = path.extname(uploadPath).toLowerCase()
          const mimeType = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ''
          if (mimeType) {
            const imageBuffer = fs.readFileSync(uploadPath)
            const base64 = imageBuffer.toString('base64')
            badgeImageDataUri = `data:${mimeType};base64,${base64}`
          }
        } catch (e) {
          // If reading fails, fallback to null
          badgeImageDataUri = null
        }
      }
      
      // Generate the certificate SVG
      return generateCertificateSvg({
        recipientName,
        achievementName,
        issuerName,
        issueDate,
        credentialId: credential.credentialId,
        badgeImageUrl: badgeImageDataUri
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