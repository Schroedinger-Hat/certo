/**
 * A notification provider is anything that can tell a recipient they've
 * been issued a credential. The default (and only, for now) implementation
 * sends email via Strapi's own email plugin - this interface exists so
 * alternate providers (SES, Mailgun, Slack, ...) can be added later without
 * touching credential.ts's issuance logic.
 */

export interface NotificationPayload {
  to: string
  achievement: { name: string; description?: string }
  credential: { credentialId: string; id: number | string }
  frontendUrl: string
  user: { username: string; email: string } | null
}

export interface NotificationProvider {
  sendCredentialIssued(payload: NotificationPayload): Promise<void>
}
