/**
 * Microsoft Teams Incoming Webhook provider.
 *
 * Configure via TEAMS_WEBHOOK_URL environment variable.
 * Create a workflow-based webhook in Teams:
 *   Channel → … → Connectors → Incoming Webhook  OR
 *   Power Automate → Post to a Teams channel when a webhook is received
 *
 * Uses Adaptive Card format (Teams Workflow webhooks) with graceful
 * fallback to the older MessageCard format for legacy connectors.
 */
import type { ChannelAlertProvider, CredentialIssuedAlert, CredentialRevokedAlert, ExpirationDigestAlert } from './types';

async function post(webhookUrl: string, body: unknown): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Teams webhook failed: HTTP ${res.status}`);
}

/** Adaptive Card wrapper for Teams Workflow webhooks */
function adaptiveCard(body: unknown[]): unknown {
  return {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.4',
        body,
      },
    }],
  };
}

export function createTeamsProvider(webhookUrl: string): ChannelAlertProvider {
  return {
    name: 'teams',

    async sendCredentialIssued(alert: CredentialIssuedAlert) {
      await post(webhookUrl, adaptiveCard([
        { type: 'TextBlock', text: '✅ Credential issued', weight: 'Bolder', size: 'Medium', color: 'Good' },
        { type: 'FactSet', facts: [
          { title: 'Achievement', value: alert.achievementName },
          { title: 'Recipient',   value: alert.recipientEmail },
          ...(alert.issuerName ? [{ title: 'Issuer', value: alert.issuerName }] : []),
          { title: 'ID', value: alert.credentialId },
        ]},
        { type: 'ActionSet', actions: [{
          type: 'Action.OpenUrl', title: 'View credential', url: alert.credentialUrl,
        }]},
      ]));
    },

    async sendCredentialRevoked(alert: CredentialRevokedAlert) {
      await post(webhookUrl, adaptiveCard([
        { type: 'TextBlock', text: '🚫 Credential revoked', weight: 'Bolder', size: 'Medium', color: 'Attention' },
        { type: 'FactSet', facts: [
          ...(alert.achievementName ? [{ title: 'Achievement', value: alert.achievementName }] : []),
          { title: 'Recipient', value: alert.recipientEmail },
          { title: 'Reason',    value: alert.reason },
          ...(alert.revokedBy ? [{ title: 'Revoked by', value: alert.revokedBy }] : []),
          { title: 'ID', value: alert.credentialId },
        ]},
      ]));
    },

    async sendExpirationDigest(alert: ExpirationDigestAlert) {
      const rows = alert.items.map(i => ({
        type: 'TextBlock',
        text: `• ${i.recipientEmail}${i.achievementName ? ` (${i.achievementName})` : ''} — **${i.daysLeft}d left**`,
        wrap: true,
      }));

      await post(webhookUrl, adaptiveCard([
        { type: 'TextBlock', text: `⏰ ${alert.count} credential${alert.count === 1 ? '' : 's'} expiring soon`, weight: 'Bolder', size: 'Medium', color: 'Warning' },
        ...rows,
      ]));
    },
  };
}
