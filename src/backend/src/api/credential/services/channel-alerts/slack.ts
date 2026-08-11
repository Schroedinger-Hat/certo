/**
 * Slack Incoming Webhook provider.
 *
 * Configure via SLACK_WEBHOOK_URL environment variable.
 * Create a webhook at: https://api.slack.com/messaging/webhooks
 *
 * Sends rich Block Kit messages with credential details and a verify link.
 */
import type { ChannelAlertProvider, CredentialIssuedAlert, CredentialRevokedAlert, ExpirationDigestAlert } from './types';

async function post(webhookUrl: string, body: unknown): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Slack webhook failed: HTTP ${res.status}`);
  }
}

export function createSlackProvider(webhookUrl: string): ChannelAlertProvider {
  return {
    name: 'slack',

    async sendCredentialIssued(alert: CredentialIssuedAlert) {
      await post(webhookUrl, {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `✅ *Credential issued*\n*Achievement:* ${alert.achievementName}\n*Recipient:* ${alert.recipientEmail}${alert.issuerName ? `\n*Issuer:* ${alert.issuerName}` : ''}`,
            },
          },
          {
            type: 'actions',
            elements: [{
              type: 'button',
              text: { type: 'plain_text', text: 'View credential' },
              url: alert.credentialUrl,
              style: 'primary',
            }],
          },
          {
            type: 'context',
            elements: [{ type: 'mrkdwn', text: `ID: \`${alert.credentialId}\`` }],
          },
        ],
      });
    },

    async sendCredentialRevoked(alert: CredentialRevokedAlert) {
      await post(webhookUrl, {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `🚫 *Credential revoked*${alert.achievementName ? `\n*Achievement:* ${alert.achievementName}` : ''}\n*Recipient:* ${alert.recipientEmail}\n*Reason:* ${alert.reason}${alert.revokedBy ? `\n*Revoked by:* ${alert.revokedBy}` : ''}`,
            },
          },
          {
            type: 'context',
            elements: [{ type: 'mrkdwn', text: `ID: \`${alert.credentialId}\`` }],
          },
        ],
      });
    },

    async sendExpirationDigest(alert: ExpirationDigestAlert) {
      const lines = alert.items
        .map(i => `• \`${i.credentialId.slice(-8)}\` — ${i.recipientEmail}${i.achievementName ? ` (${i.achievementName})` : ''} — *${i.daysLeft}d left*`)
        .join('\n');

      await post(webhookUrl, {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `⏰ *${alert.count} credential${alert.count === 1 ? '' : 's'} expiring soon*\n\n${lines}`,
            },
          },
        ],
      });
    },
  };
}
