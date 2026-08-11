/**
 * Channel Alerts service
 *
 * Dispatches admin/team alerts to all configured channel providers
 * (Slack, Microsoft Teams, Discord) based on environment variables.
 *
 * Configuration:
 *   SLACK_WEBHOOK_URL    — Slack Incoming Webhook URL
 *   TEAMS_WEBHOOK_URL    — Microsoft Teams Incoming Webhook URL
 *   DISCORD_WEBHOOK_URL  — Discord Incoming Webhook URL
 *
 * Any subset can be configured; unconfigured providers are silently skipped.
 * All providers run in parallel; individual failures are logged but do not
 * block each other or the main application flow.
 */
import { createSlackProvider } from './slack';
import { createTeamsProvider } from './teams';
import { createDiscordProvider } from './discord';
import type { ChannelAlertProvider, CredentialIssuedAlert, CredentialRevokedAlert, ExpirationDigestAlert } from './types';

export type { CredentialIssuedAlert, CredentialRevokedAlert, ExpirationDigestAlert };

function buildProviders(): ChannelAlertProvider[] {
  const providers: ChannelAlertProvider[] = [];

  const slack   = process.env['SLACK_WEBHOOK_URL'];
  const teams   = process.env['TEAMS_WEBHOOK_URL'];
  const discord = process.env['DISCORD_WEBHOOK_URL'];

  if (slack)   providers.push(createSlackProvider(slack));
  if (teams)   providers.push(createTeamsProvider(teams));
  if (discord) providers.push(createDiscordProvider(discord));

  return providers;
}

async function fanOut<T>(
  providers: ChannelAlertProvider[],
  fn: (p: ChannelAlertProvider) => Promise<void>,
  label: string,
): Promise<void> {
  const results = await Promise.allSettled(providers.map(fn));
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      const name = providers[i]?.name ?? 'unknown';
      // Log but never throw — channel alerts are best-effort
      console.error(`[channel-alerts] ${label} failed for ${name}:`, r.reason?.message ?? r.reason);
    }
  });
}

export const channelAlerts = {
  async sendCredentialIssued(alert: CredentialIssuedAlert): Promise<void> {
    const providers = buildProviders();
    if (providers.length === 0) return;
    await fanOut(providers, p => p.sendCredentialIssued(alert), 'sendCredentialIssued');
  },

  async sendCredentialRevoked(alert: CredentialRevokedAlert): Promise<void> {
    const providers = buildProviders();
    if (providers.length === 0) return;
    await fanOut(providers, p => p.sendCredentialRevoked(alert), 'sendCredentialRevoked');
  },

  async sendExpirationDigest(alert: ExpirationDigestAlert): Promise<void> {
    const providers = buildProviders();
    if (providers.length === 0) return;
    await fanOut(providers, p => p.sendExpirationDigest(alert), 'sendExpirationDigest');
  },
};
