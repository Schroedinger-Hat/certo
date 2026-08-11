/**
 * Discord Incoming Webhook provider.
 *
 * Configure via DISCORD_WEBHOOK_URL environment variable.
 * Create a webhook in Discord: Channel Settings → Integrations → Webhooks → New Webhook
 *
 * Uses Discord embeds for rich formatting with colour-coded status.
 */
import type { ChannelAlertProvider, CredentialIssuedAlert, CredentialRevokedAlert, ExpirationDigestAlert } from './types';

async function post(webhookUrl: string, body: unknown): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Discord webhook failed: HTTP ${res.status}`);
}

export function createDiscordProvider(webhookUrl: string): ChannelAlertProvider {
  return {
    name: 'discord',

    async sendCredentialIssued(alert: CredentialIssuedAlert) {
      await post(webhookUrl, {
        embeds: [{
          title: '✅ Credential issued',
          color: 0x48bb78, // green
          fields: [
            { name: 'Achievement', value: alert.achievementName, inline: true },
            { name: 'Recipient',   value: alert.recipientEmail,  inline: true },
            ...(alert.issuerName ? [{ name: 'Issuer', value: alert.issuerName, inline: true }] : []),
            { name: 'ID',          value: `\`${alert.credentialId}\``, inline: false },
          ],
          url: alert.credentialUrl,
        }],
      });
    },

    async sendCredentialRevoked(alert: CredentialRevokedAlert) {
      await post(webhookUrl, {
        embeds: [{
          title: '🚫 Credential revoked',
          color: 0xf56565, // red
          fields: [
            ...(alert.achievementName ? [{ name: 'Achievement', value: alert.achievementName, inline: true }] : []),
            { name: 'Recipient',  value: alert.recipientEmail, inline: true },
            { name: 'Reason',     value: alert.reason,         inline: false },
            ...(alert.revokedBy ? [{ name: 'Revoked by', value: alert.revokedBy, inline: true }] : []),
            { name: 'ID',         value: `\`${alert.credentialId}\``, inline: false },
          ],
        }],
      });
    },

    async sendExpirationDigest(alert: ExpirationDigestAlert) {
      const description = alert.items
        .map(i => `• \`${i.credentialId.slice(-8)}\` — ${i.recipientEmail}${i.achievementName ? ` *(${i.achievementName})*` : ''} — **${i.daysLeft}d left**`)
        .join('\n');

      await post(webhookUrl, {
        embeds: [{
          title: `⏰ ${alert.count} credential${alert.count === 1 ? '' : 's'} expiring soon`,
          color: 0xed8936, // orange
          description: description.slice(0, 4096), // Discord embed description limit
        }],
      });
    },
  };
}
