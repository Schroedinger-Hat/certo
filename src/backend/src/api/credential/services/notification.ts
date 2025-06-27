/**
 * Notification service for credential operations
 */

export default ({ strapi }) => ({
  /**
   * Send a notification email to the recipient when a badge is issued
   * 
   * @param {Object} credential - The issued credential
   * @param {Object} recipient - The recipient profile
   * @param {Object} achievement - The achievement details
   */
  async sendBadgeIssuedEmail(credential, recipient, achievement) {
    try {
      
      // Handle case where recipient is provided separately or needs to be fetched
      let recipientData = recipient
      
      // If recipient is not provided directly but is available in the credential
      if (!recipientData?.email && credential?.recipient) {
        // Check if recipient is a populated object or just an ID
        if (typeof credential.recipient === 'object' && credential.recipient !== null) {
          recipientData = credential.recipient
        } else if (credential.recipient) {
          // Fetch the recipient profile if only ID is available
          try {
            recipientData = await strapi.entityService.findOne(
              'api::profile.profile',
              credential.recipient,
              { status: 'published', populate: [] }
            )
          } catch (err) {
            console.error('Error fetching recipient profile:', err)
          }
        }
      }
      
      if (!recipientData || !recipientData.email) {
        console.warn('Cannot send email: recipient or email is missing')
        return false
      }

      // Verify SMTP plugin is available
      if (!strapi.plugins || !strapi.plugins.email || !strapi.plugins.email.services || !strapi.plugins.email.services.email) {
        console.error('Email plugin is not properly configured')
        return false
      }

      const baseUrl = strapi.config.get('server.url', 'http://localhost:1337')
      const frontendUrl = strapi.config.get('custom.frontendUrl', 'http://localhost:3000')
      
      const verifyUrl = `${frontendUrl}/verify?id=${encodeURIComponent(credential.credentialId)}`
      const certificateUrl = `${baseUrl}/api/credentials/${credential.id}/certificate`
      
      // Generate certificate data URI
      let certificateDataUri = null
      try {
        const certificateService = strapi.service('api::credential.certificate')
        certificateDataUri = await certificateService.generateCertificateDataUri(credential.id)
      } catch (certError) {
        console.error('Error generating certificate for email:', certError)
        // Continue without certificate if there's an error
      }
      
      // Build email content
      const emailOptions = {
        to: recipientData.email,
        subject: `You've been awarded: ${achievement.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4a6cf7;">Congratulations!</h1>
            
            <p>You have been awarded the <strong>${achievement.name}</strong> badge!</p>
            
            <p>${achievement.description}</p>
            
            ${certificateDataUri ? `
            <div style="margin: 20px 0; text-align: center;">
              <h3 style="color: #333;">Your Certificate of Achievement</h3>
              <img src="${certificateDataUri}" alt="Certificate of Achievement" style="max-width: 100%; border: 1px solid #eee; box-shadow: 0 2px 5px rgba(0,0,0,0.1);" />
            </div>
            ` : ''}
            
            <div style="margin: 20px 0; text-align: center;">
              <a href="${verifyUrl}" style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                View Your Badge
              </a>
              
              ${certificateUrl ? `
              <div style="margin-top: 15px;">
                <a href="${certificateUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                  Download Certificate
                </a>
              </div>
              ` : ''}
            </div>
            
            <p>This badge certifies your achievement and can be shared with others.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            
            <p style="color: #666; font-size: 12px;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        `,
      }
      
      // Send the email
      try {
        await strapi.plugins.email.services.email.send(emailOptions)
        return true
      } catch (emailError) {
        console.error('Error from email provider:', emailError)
        return false
      }
    } catch (error) {
      console.error('Error sending badge issued email:', error)
      return false
    }
  }
}) 