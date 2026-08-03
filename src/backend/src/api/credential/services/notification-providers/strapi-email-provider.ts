import { generateCredentialIssuanceEmail } from '../../templates/credential-issuance'
import type { NotificationPayload, NotificationProvider } from './types'

/**
 * Default notification provider: sends via Strapi's own email plugin
 * (nodemailer under the hood, see config/plugins.ts), using the existing
 * credential-issuance email template. This is exactly what credential.ts
 * did inline before this provider existed - no behavior change.
 */
export function createStrapiEmailProvider(strapi: any): NotificationProvider {
  return {
    async sendCredentialIssued({ to, achievement, credential, frontendUrl, user }: NotificationPayload) {
      const emailTemplate = generateCredentialIssuanceEmail({ achievement, credential, frontendUrl, user })

      await strapi.plugins['email'].services.email.send({
        to,
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html,
      })
    },
  }
}
