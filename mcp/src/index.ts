#!/usr/bin/env node
/**
 * Certo MCP Server
 *
 * Exposes the Certo credential platform as MCP tools, letting AI assistants
 * (Claude Desktop, Cursor, Copilot, etc.) issue, verify, and manage
 * Open Badges 3.0 credentials via natural language.
 *
 * Configuration (env vars):
 *   CERTO_API_URL    Base URL of your Certo backend  (default: http://localhost:1337)
 *   CERTO_API_TOKEN  Strapi API token with the required permissions
 *
 * Usage in Claude Desktop (claude_desktop_config.json):
 *   {
 *     "mcpServers": {
 *       "certo": {
 *         "command": "npx",
 *         "args": ["-y", "@certo/mcp"],
 *         "env": {
 *           "CERTO_API_URL": "https://your-certo-instance.example.com",
 *           "CERTO_API_TOKEN": "your-api-token"
 *         }
 *       }
 *     }
 *   }
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// ─── Config ──────────────────────────────────────────────────────────────────

const API_URL = process.env['CERTO_API_URL'] ?? 'http://localhost:1337';
const API_TOKEN = process.env['CERTO_API_TOKEN'] ?? '';

// ─── HTTP helper ─────────────────────────────────────────────────────────────

async function certo<T = unknown>(
  method: string,
  pathname: string,
  body?: unknown,
): Promise<T> {
  const url = new URL(pathname, API_URL).toString();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_TOKEN) headers['Authorization'] = `Bearer ${API_TOKEN}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let json: unknown;
  try { json = await res.json(); } catch { json = null; }

  if (!res.ok) {
    const msg = (json as any)?.error?.message ?? (json as any)?.message ?? `HTTP ${res.status}`;
    throw new Error(`Certo API error: ${msg}`);
  }
  return json as T;
}

// ─── Server ──────────────────────────────────────────────────────────────────

const server = new McpServer({
  name: 'certo',
  version: '0.1.0',
});

// ── verify_credential ────────────────────────────────────────────────────────
server.tool(
  'verify_credential',
  'Verify an Open Badges 3.0 / Verifiable Credential by its ID or URN. ' +
  'Returns validity status and per-check details (proof, not_revoked, not_expired, etc.). ' +
  'No authentication required.',
  {
    credential_id: z.string().describe('Credential URN (urn:uuid:...) or numeric ID'),
  },
  async ({ credential_id }) => {
    const result = await certo<any>(
      'GET',
      `/api/credentials/${encodeURIComponent(credential_id)}/verify`,
    );
    const valid = result.verified;
    const cred = result.credential ?? result.rawCredential;
    const lines = [
      `Status: ${valid ? '✓ VALID' : '✗ INVALID'}`,
      cred?.name ? `Name: ${cred.name}` : null,
      cred?.issuer?.name ? `Issuer: ${cred.issuer.name}` : null,
      cred?.issuanceDate ? `Issued: ${new Date(cred.issuanceDate).toLocaleDateString()}` : null,
      cred?.expirationDate ? `Expires: ${new Date(cred.expirationDate).toLocaleDateString()}` : null,
      '',
      'Checks:',
      ...(result.checks ?? []).map((c: any) =>
        `  ${c.result === 'success' ? '✓' : '✗'} ${c.check}${c.message ? `: ${c.message}` : ''}`
      ),
    ].filter(l => l !== null);

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
      isError: !valid,
    };
  },
);

// ── list_achievements ────────────────────────────────────────────────────────
server.tool(
  'list_achievements',
  'List all available achievement/badge definitions that credentials can be issued against. ' +
  'Returns ID, name, description, and criteria for each achievement.',
  {},
  async () => {
    const result = await certo<any>('GET', '/api/achievements?populate=*&status=published');
    const items: any[] = result.data ?? result ?? [];
    if (items.length === 0) return { content: [{ type: 'text', text: 'No achievements found.' }] };

    const text = items.map((a: any) => [
      `[${a.id}] ${a.achievementType ?? a.name ?? 'Untitled'}`,
      a.description ? `  Description: ${a.description}` : null,
      a.criteria ? `  Criteria: ${a.criteria}` : null,
    ].filter(Boolean).join('\n')).join('\n\n');

    return { content: [{ type: 'text', text }] };
  },
);

// ── list_credentials ─────────────────────────────────────────────────────────
server.tool(
  'list_credentials',
  'List credentials accessible to the authenticated user. ' +
  'Requires CERTO_API_TOKEN to be set. ' +
  'Returns credential IDs, names, recipients, and status.',
  {
    status: z.enum(['all', 'active', 'revoked', 'expired']).optional()
      .describe('Filter by status (default: all)'),
  },
  async ({ status = 'all' }) => {
    const result = await certo<any>('GET', '/api/credentials?populate=*');
    let items: any[] = result.data ?? result ?? [];

    if (status === 'active') items = items.filter((c: any) => !c.revoked && (!c.expirationDate || new Date(c.expirationDate) > new Date()));
    if (status === 'revoked') items = items.filter((c: any) => c.revoked);
    if (status === 'expired') items = items.filter((c: any) => !c.revoked && c.expirationDate && new Date(c.expirationDate) <= new Date());

    if (items.length === 0) return { content: [{ type: 'text', text: `No ${status} credentials found.` }] };

    const text = items.map((c: any) => {
      const st = c.revoked ? 'revoked' : (c.expirationDate && new Date(c.expirationDate) < new Date() ? 'expired' : 'active');
      return [
        `[${c.id}] ${c.credentialId}`,
        `  Status: ${st}`,
        c.achievement ? `  Achievement: ${c.achievement.achievementType ?? c.achievement.name}` : null,
        c.recipient ? `  Recipient: ${c.recipient.email ?? c.recipient.name}` : null,
        c.expirationDate ? `  Expires: ${new Date(c.expirationDate).toLocaleDateString()}` : null,
      ].filter(Boolean).join('\n');
    }).join('\n\n');

    return { content: [{ type: 'text', text: `${items.length} credential(s):\n\n${text}` }] };
  },
);

// ── issue_credential ─────────────────────────────────────────────────────────
server.tool(
  'issue_credential',
  'Issue an Open Badges 3.0 credential to a recipient. ' +
  'Requires CERTO_API_TOKEN. The recipient will receive an email notification.',
  {
    achievement_id: z.number().describe('Numeric ID of the achievement to issue'),
    recipient_email: z.string().email().describe('Email address of the credential recipient'),
    recipient_name: z.string().optional().describe('Display name of the recipient'),
    expiration_date: z.string().optional().describe('Expiration date in YYYY-MM-DD format (leave empty for no expiry)'),
  },
  async ({ achievement_id, recipient_email, recipient_name, expiration_date }) => {
    const result = await certo<any>('POST', '/api/credentials/issue', {
      data: {
        achievementId: achievement_id,
        recipient: { email: recipient_email, ...(recipient_name ? { name: recipient_name } : {}) },
        ...(expiration_date ? { expirationDate: expiration_date } : {}),
      },
    });
    const id = result.credentialId ?? result.data?.credentialId ?? '(issued)';
    return {
      content: [{ type: 'text', text: `✓ Credential issued successfully\nID: ${id}\nRecipient: ${recipient_email}` }],
    };
  },
);

// ── revoke_credential ────────────────────────────────────────────────────────
server.tool(
  'revoke_credential',
  'Revoke a credential, rendering it invalid. ' +
  'Requires CERTO_API_TOKEN. This action cannot be undone automatically.',
  {
    credential_id: z.union([z.string(), z.number()]).describe('Numeric ID or URN of the credential to revoke'),
    reason: z.string().optional().describe('Reason for revocation (e.g. "Role change", "Error in issuance")'),
  },
  async ({ credential_id, reason }) => {
    await certo('POST', `/api/credentials/${encodeURIComponent(String(credential_id))}/revoke`, {
      reason: reason ?? 'Revoked via MCP',
    });
    return { content: [{ type: 'text', text: `✓ Credential ${credential_id} revoked` }] };
  },
);

// ── renew_credential ─────────────────────────────────────────────────────────
server.tool(
  'renew_credential',
  'Renew a credential with a new expiration date. ' +
  'Re-issues the credential and only the original issuer can call this. Requires CERTO_API_TOKEN.',
  {
    credential_id: z.union([z.string(), z.number()]).describe('Numeric ID or URN of the credential to renew'),
    new_expiration_date: z.string().describe('New expiration date in YYYY-MM-DD format'),
  },
  async ({ credential_id, new_expiration_date }) => {
    const result = await certo<any>(
      'POST',
      `/api/credentials/${encodeURIComponent(String(credential_id))}/renew`,
      { newExpirationDate: new_expiration_date },
    );
    const newId = result.credential?.credentialId ?? '(renewed)';
    return { content: [{ type: 'text', text: `✓ Credential renewed\nNew ID: ${newId}\nNew expiry: ${new_expiration_date}` }] };
  },
);

// ── get_credential ───────────────────────────────────────────────────────────
server.tool(
  'get_credential',
  'Get full details of a specific credential including verification status, ' +
  'achievement description, issuer, and recipient.',
  {
    credential_id: z.string().describe('Credential URN (urn:uuid:...) or numeric ID'),
  },
  async ({ credential_id }) => {
    const result = await certo<any>(
      'GET',
      `/api/credentials/${encodeURIComponent(credential_id)}/verify`,
    );
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  },
);

// ── run_expiration_check ─────────────────────────────────────────────────────
server.tool(
  'run_expiration_check',
  'Trigger the expiration notification scan. ' +
  'Finds credentials expiring within 30, 7, and 1 day(s) and sends email warnings. ' +
  'Requires CERTO_API_TOKEN with admin permissions.',
  {},
  async () => {
    const result = await certo<any>('POST', '/api/credentials/expiration-check', {});
    return {
      content: [{
        type: 'text',
        text: `Expiration check complete:\n  Checked: ${result.checked}\n  Notified: ${result.notified}\n  Errors: ${result.errors}`,
      }],
    };
  },
);

// ── export_profile_data ──────────────────────────────────────────────────────
server.tool(
  'export_profile_data',
  'Export all data for the authenticated issuer profile: achievements, issued credentials, received credentials. ' +
  'Requires CERTO_API_TOKEN.',
  {},
  async () => {
    const result = await certo<any>('GET', '/api/profiles/me/export');
    const summary = [
      '✓ Profile data exported',
      result.profile ? `Profile: ${result.profile.name ?? 'unnamed'}` : null,
      result.achievements ? `Achievements: ${result.achievements.length}` : null,
      result.issuedCredentials ? `Issued credentials: ${result.issuedCredentials.length}` : null,
      result.receivedCredentials ? `Received credentials: ${result.receivedCredentials.length}` : null,
    ].filter(Boolean).join('\n');

    return { content: [{ type: 'text', text: summary }] };
  },
);

// ─── Start ────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
