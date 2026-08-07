import React from 'react';
import { render, Box, Text } from 'ink';
import { Verify } from './commands/Verify.js';
import { Issue } from './commands/Issue.js';
import { List } from './commands/List.js';
import { Revoke } from './commands/Revoke.js';
import { Renew } from './commands/Renew.js';
import { Backup, Restore } from './commands/BackupRestore.js';

// ─── Argument parser ─────────────────────────────────────────────────────────

function parseArgs(argv: string[]) {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i]!;
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        flags[key] = next;
        i += 2;
      } else {
        flags[key] = true;
        i++;
      }
    } else {
      positional.push(arg);
      i++;
    }
  }
  return { positional, flags };
}

// ─── Help ─────────────────────────────────────────────────────────────────────

function Help({ topic }: { topic?: string }) {
  if (topic === 'verify') return (
    <Box flexDirection="column">
      <Text bold>certo verify {'<credential-id>'}</Text>
      <Text dimColor>  Verify a credential. No authentication required.</Text>
    </Box>
  );
  if (topic === 'issue') return (
    <Box flexDirection="column">
      <Text bold>certo issue [--achievement {'<id>'}] [--recipient {'<email>'}] [--expiration {'<YYYY-MM-DD>'}]</Text>
      <Text dimColor>  Issue a new credential (interactive if flags are omitted). Requires --token.</Text>
    </Box>
  );

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Certo CLI</Text>
      <Text dimColor>Interactive terminal UI for the Certo credential platform, powered by Ink.</Text>
      <Box flexDirection="column">
        <Text bold>Commands:</Text>
        {[
          ['verify <id>', 'Verify a credential'],
          ['issue', 'Issue a credential (interactive)'],
          ['revoke <id>', 'Revoke a credential'],
          ['renew <id>', 'Renew a credential (new expiry)'],
          ['list', 'List credentials'],
          ['backup', 'Full-instance backup'],
          ['restore', 'Restore from a backup'],
          ['help [command]', 'Show help'],
        ].map(([cmd, desc]) => (
          <Box key={cmd} marginLeft={2}>
            <Text color="cyan">{(cmd as string).padEnd(28)}</Text>
            <Text dimColor>{desc}</Text>
          </Box>
        ))}
      </Box>
      <Box flexDirection="column">
        <Text bold>Global options:</Text>
        {[
          ['--url <url>', 'Backend URL ($CERTO_API_URL, default: localhost:1337)'],
          ['--token <token>', 'API token ($CERTO_API_TOKEN)'],
        ].map(([flag, desc]) => (
          <Box key={flag} marginLeft={2}>
            <Text color="yellow">{(flag as string).padEnd(20)}</Text>
            <Text dimColor>{desc}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const { positional, flags } = parseArgs(process.argv.slice(2));
const [command, ...rest] = positional;

let app: React.ReactElement;

switch (command) {
  case 'verify': {
    const id = rest[0];
    if (!id) {
      console.error('✗ Usage: certo verify <credential-id>');
      process.exitCode = 1;
      process.exit();
    }
    app = <Verify credentialId={id!} flags={flags} />;
    break;
  }

  case 'issue':
    app = <Issue flags={flags} />;
    break;

  case 'revoke': {
    const id = rest[0];
    if (!id) {
      console.error('✗ Usage: certo revoke <id> [--reason <reason>]');
      process.exitCode = 1;
      process.exit();
    }
    app = <Revoke credentialId={id!} flags={flags} />;
    break;
  }

  case 'renew': {
    const id = rest[0];
    if (!id) {
      console.error('✗ Usage: certo renew <id> [--expiration <YYYY-MM-DD>]');
      process.exitCode = 1;
      process.exit();
    }
    app = <Renew credentialId={id!} flags={flags} />;
    break;
  }

  case 'list':
    app = <List flags={flags} />;
    break;

  case 'backup':
    app = <Backup flags={flags} />;
    break;

  case 'restore':
    app = <Restore flags={flags} />;
    break;

  case 'help':
  case undefined:
    app = <Help topic={rest[0]} />;
    break;

  default:
    console.error(`✗ Unknown command: ${command}`);
    console.error(`Run 'certo help' to see available commands.`);
    process.exitCode = 1;
    process.exit();
}

render(app!);
