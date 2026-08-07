#!/usr/bin/env node
'use strict';

/**
 * certo — command-line interface for the Certo credential platform
 *
 * Configuration (via env or flags):
 *   CERTO_API_URL   Base URL of the Certo backend  (default: http://localhost:1337)
 *   CERTO_API_TOKEN Strapi API token with the required permissions
 *
 * Usage:
 *   certo <command> [options]
 *
 * Commands:
 *   verify <id>                     Verify a credential by ID or URN
 *   issue                           Issue a new credential
 *   revoke <id>                     Revoke a credential
 *   renew <id>                      Renew a credential with a new expiry date
 *   list                            List credentials for the authenticated user
 *   export [--output <file>]        Export all data for the authenticated profile
 *   backup [--output <dir>]         Full-instance DB + uploads backup
 *   restore --from <dir>            Restore a previous backup
 *   expiration-check                Run the expiration notification scan
 *   help [command]                  Show help
 */

const https = require('https');
const http = require('http');
const path = require('path');
const fs = require('fs');

// ─── Argument parsing (no external deps) ─────────────────────────────────────

function parseArgs(argv) {
  const args = { _: [], flags: {} };
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        args.flags[key] = next;
        i += 2;
      } else {
        args.flags[key] = true;
        i++;
      }
    } else {
      args._.push(arg);
      i++;
    }
  }
  return args;
}

// ─── Config ──────────────────────────────────────────────────────────────────

function getConfig(flags) {
  // Support reading .env from the backend dir for convenience
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
      const m = line.match(/^([^#=\s]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    });
  }

  return {
    apiUrl: flags.url || process.env.CERTO_API_URL || 'http://localhost:1337',
    token: flags.token || process.env.CERTO_API_TOKEN || '',
  };
}

// ─── HTTP helper ─────────────────────────────────────────────────────────────

async function api(cfg, method, pathname, body) {
  const url = new URL(pathname, cfg.apiUrl);
  const transport = url.protocol === 'https:' ? https : http;

  const headers = { 'Content-Type': 'application/json' };
  if (cfg.token) headers['Authorization'] = `Bearer ${cfg.token}`;

  const payload = body ? JSON.stringify(body) : undefined;
  if (payload) headers['Content-Length'] = Buffer.byteLength(payload);

  return new Promise((resolve, reject) => {
    const req = transport.request(
      { hostname: url.hostname, port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search, method, headers },
      res => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (res.statusCode >= 400) {
              const msg = json?.error?.message || json?.message || `HTTP ${res.statusCode}`;
              reject(Object.assign(new Error(msg), { statusCode: res.statusCode, body: json }));
            } else {
              resolve(json);
            }
          } catch {
            resolve(data);
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ─── Output helpers ───────────────────────────────────────────────────────────

function print(data, flags) {
  if (flags.json) {
    process.stdout.write(JSON.stringify(data) + '\n');
  } else {
    process.stdout.write(JSON.stringify(data, null, 2) + '\n');
  }
}

function ok(msg) { console.log('\x1b[32m✓\x1b[0m ' + msg); }
function fail(msg) { console.error('\x1b[31m✗\x1b[0m ' + msg); process.exitCode = 1; }

// ─── Commands ────────────────────────────────────────────────────────────────

async function cmdVerify(args, flags) {
  const id = args[0];
  if (!id) { fail('Usage: certo verify <credential-id-or-urn>'); return; }

  const cfg = getConfig(flags);
  const result = await api(cfg, 'GET', `/api/credentials/${encodeURIComponent(id)}/verify`);

  if (flags.json) {
    print(result, flags);
  } else {
    const v = result.verified;
    console.log(v ? '\x1b[32m✓ VALID\x1b[0m' : '\x1b[31m✗ INVALID\x1b[0m');
    if (result.credential?.name) console.log('  Name:   ', result.credential.name);
    if (result.credential?.issuanceDate) console.log('  Issued: ', result.credential.issuanceDate);
    if (result.credential?.expirationDate) console.log('  Expires:', result.credential.expirationDate);
    if (result.checks) {
      result.checks.forEach(c => {
        const icon = c.result === 'success' ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
        console.log(` ${icon} ${c.check}${c.message ? ': ' + c.message : ''}`);
      });
    }
  }
}

async function cmdIssue(args, flags) {
  const cfg = getConfig(flags);

  const achievementId = flags.achievement;
  const recipient = flags.recipient;
  if (!achievementId) { fail('--achievement <id> is required'); return; }
  if (!recipient) { fail('--recipient <email> is required'); return; }
  if (!cfg.token) { fail('CERTO_API_TOKEN (or --token) is required to issue credentials'); return; }

  const body = {
    data: {
      achievementId: Number(achievementId),
      recipient: { email: recipient, name: flags.name || '' },
      ...(flags.expiration ? { expirationDate: flags.expiration } : {}),
      ...(flags.evidence ? { evidence: JSON.parse(flags.evidence) } : {}),
    }
  };

  const result = await api(cfg, 'POST', '/api/credentials/issue', body);
  ok(`Credential issued: ${result.credentialId || result.data?.credentialId || '(ok)'}`);
  if (!flags.quiet) print(result, flags);
}

async function cmdRevoke(args, flags) {
  const id = args[0];
  if (!id) { fail('Usage: certo revoke <id> [--reason <reason>]'); return; }

  const cfg = getConfig(flags);
  if (!cfg.token) { fail('CERTO_API_TOKEN (or --token) is required'); return; }

  const result = await api(cfg, 'POST', `/api/credentials/${encodeURIComponent(id)}/revoke`,
    { reason: flags.reason || 'Revoked via CLI' });
  ok('Credential revoked');
  if (!flags.quiet) print(result, flags);
}

async function cmdRenew(args, flags) {
  const id = args[0];
  if (!id) { fail('Usage: certo renew <id> --expiration <YYYY-MM-DD>'); return; }
  if (!flags.expiration) { fail('--expiration <YYYY-MM-DD> is required'); return; }

  const cfg = getConfig(flags);
  if (!cfg.token) { fail('CERTO_API_TOKEN (or --token) is required'); return; }

  const result = await api(cfg, 'POST', `/api/credentials/${encodeURIComponent(id)}/renew`,
    { newExpirationDate: flags.expiration });
  ok(`Credential renewed: ${result.credential?.credentialId || '(ok)'}`);
  if (!flags.quiet) print(result, flags);
}

async function cmdList(args, flags) {
  const cfg = getConfig(flags);
  if (!cfg.token) { fail('CERTO_API_TOKEN (or --token) is required'); return; }

  const result = await api(cfg, 'GET', '/api/credentials');
  const items = result.data || result;
  if (flags.json) {
    print(items, flags);
  } else {
    if (!Array.isArray(items) || items.length === 0) {
      console.log('No credentials found.');
      return;
    }
    console.log(`${'ID'.padEnd(6)} ${'URN / Credential ID'.padEnd(50)} ${'Status'.padEnd(10)} Expiry`);
    console.log('─'.repeat(90));
    items.forEach(c => {
      const status = c.revoked ? '\x1b[31mrevoked\x1b[0m' : '\x1b[32mactive\x1b[0m ';
      const expiry = c.expirationDate ? new Date(c.expirationDate).toLocaleDateString() : '—';
      console.log(`${String(c.id).padEnd(6)} ${(c.credentialId || '').slice(0, 50).padEnd(50)} ${status} ${expiry}`);
    });
    console.log(`\n${items.length} credential(s)`);
  }
}

async function cmdExport(args, flags) {
  const cfg = getConfig(flags);
  if (!cfg.token) { fail('CERTO_API_TOKEN (or --token) is required'); return; }

  const result = await api(cfg, 'GET', '/api/profiles/me/export');
  if (flags.output) {
    fs.writeFileSync(flags.output, JSON.stringify(result, null, 2));
    ok(`Data exported to ${flags.output}`);
  } else {
    print(result, flags);
  }
}

function cmdBackup(args, flags) {
  // Delegate to the existing backup script
  const { runBackup } = require('./backup');
  if (flags.output) process.env.CERTO_BACKUP_DIR = flags.output;
  runBackup();
}

function cmdRestore(args, flags) {
  if (!flags.from) { fail('--from <dir> is required'); return; }
  if (!flags.yes) {
    fail('This will overwrite your current database. Add --yes to confirm.');
    return;
  }
  // Delegate to the existing restore script
  const { runRestore } = require('./restore');
  // Patch process.argv so restore.js picks up --from and --yes
  process.argv = ['node', 'restore.js', '--from', flags.from, '--yes'];
  runRestore();
}

async function cmdExpirationCheck(args, flags) {
  const cfg = getConfig(flags);
  if (!cfg.token) { fail('CERTO_API_TOKEN (or --token) is required'); return; }

  const result = await api(cfg, 'POST', '/api/credentials/expiration-check', {});
  ok(`Expiration check complete: checked=${result.checked}, notified=${result.notified}, errors=${result.errors}`);
}

// ─── Help ─────────────────────────────────────────────────────────────────────

const HELP = {
  '': `
\x1b[1mCerto CLI\x1b[0m — manage your Certo credential platform

\x1b[1mUsage:\x1b[0m  certo <command> [options]

\x1b[1mCommands:\x1b[0m
  verify <id>                   Verify a credential
  issue                         Issue a new credential
  revoke <id>                   Revoke a credential
  renew <id>                    Renew a credential (new expiry)
  list                          List credentials
  export                        Export profile data (JSON)
  backup                        Full-instance backup
  restore                       Restore from a backup
  expiration-check              Run expiration notification scan
  help [command]                Show help

\x1b[1mGlobal options:\x1b[0m
  --url <url>       Backend URL  (default: $CERTO_API_URL or http://localhost:1337)
  --token <token>   API token    (default: $CERTO_API_TOKEN)
  --json            Machine-readable output (no formatting)
  --quiet           Suppress data output (only status messages)

\x1b[1mExamples:\x1b[0m
  certo verify urn:uuid:abc123
  certo issue --achievement 1 --recipient alice@example.com --expiration 2027-12-31
  certo revoke 42 --reason "Role change"
  certo renew 42 --expiration 2028-01-01
  certo list
  certo export --output my-data.json
  certo backup
  certo restore --from backups/2026-08-07T10-00-00-000Z --yes
  certo expiration-check
`,
  verify:           'certo verify <credential-id-or-urn>\n\n  Verifies a credential and shows its validity status. No auth required.',
  issue:            'certo issue --achievement <id> --recipient <email> [--name <name>] [--expiration <YYYY-MM-DD>] [--evidence <json>]\n\n  Issues a new credential. Requires --token.',
  revoke:           'certo revoke <id> [--reason <reason>]\n\n  Revokes a credential. Requires --token.',
  renew:            'certo renew <id> --expiration <YYYY-MM-DD>\n\n  Re-issues a credential with a new expiration date. Requires --token.',
  list:             'certo list\n\n  Lists credentials accessible to the authenticated user. Requires --token.',
  export:           'certo export [--output <file>]\n\n  Exports all profile data to JSON. Requires --token.',
  backup:           'certo backup [--output <dir>]\n\n  Creates a full DB + uploads backup in a timestamped directory.',
  restore:          'certo restore --from <dir> --yes\n\n  Restores a previous backup. --yes required to confirm data overwrite.',
  'expiration-check': 'certo expiration-check\n\n  Runs the daily expiration notification scan on demand. Requires --token.',
};

function cmdHelp(args) {
  const topic = args[0] || '';
  console.log(HELP[topic] || `Unknown command: ${topic}\n${HELP['']}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const COMMANDS = {
  verify: cmdVerify,
  issue: cmdIssue,
  revoke: cmdRevoke,
  renew: cmdRenew,
  list: cmdList,
  export: cmdExport,
  backup: cmdBackup,
  restore: cmdRestore,
  'expiration-check': cmdExpirationCheck,
  help: (args, flags) => cmdHelp(args),
};

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  const [command, ...rest] = parsed._;
  const flags = parsed.flags;

  if (!command || command === 'help') {
    cmdHelp(rest);
    return;
  }

  if (flags.help || flags.h) {
    cmdHelp([command]);
    return;
  }

  const handler = COMMANDS[command];
  if (!handler) {
    fail(`Unknown command: ${command}`);
    console.error(`Run 'certo help' to see available commands.`);
    return;
  }

  try {
    await handler(rest, flags);
  } catch (err) {
    fail(err.message || String(err));
    if (flags.debug) console.error(err);
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseArgs, getConfig };
