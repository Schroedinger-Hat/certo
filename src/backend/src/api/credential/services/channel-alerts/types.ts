/**
 * Channel Alert types — admin/team channel notifications for Slack, Teams, Discord.
 * Distinct from NotificationProvider (which sends emails to credential holders).
 *
 * These alerts notify your organization's channels when credentials are issued,
 * revoked, or expiring — useful for audit trails and ops visibility.
 */

export interface CredentialIssuedAlert {
  credentialId: string
  credentialUrl: string
  achievementName: string
  recipientEmail: string
  issuerName?: string
}

export interface CredentialRevokedAlert {
  credentialId: string
  achievementName?: string
  recipientEmail: string
  reason: string
  revokedBy?: string
}

export interface ExpirationDigestAlert {
  count: number
  items: Array<{
    credentialId: string
    recipientEmail: string
    achievementName?: string
    daysLeft: number
  }>
}

export interface ChannelAlertProvider {
  name: string
  sendCredentialIssued(alert: CredentialIssuedAlert): Promise<void>
  sendCredentialRevoked(alert: CredentialRevokedAlert): Promise<void>
  sendExpirationDigest(alert: ExpirationDigestAlert): Promise<void>
}
