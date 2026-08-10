import React from 'react';
import { render } from 'ink';
import { App, type Screen } from './App.js';

function parseArgs(argv: string[]) {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i] as string;
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

const KNOWN_SCREENS = new Set<Screen>(['verify', 'issue', 'list', 'revoke', 'renew', 'backup', 'restore']);

const { positional, flags } = parseArgs(process.argv.slice(2));
const [command, id] = positional;

let initialScreen: Screen | undefined;
let initialParams: Record<string, string> = {};

if (command && KNOWN_SCREENS.has(command as Screen)) {
  initialScreen = command as Screen;
  if (id) initialParams['id'] = id;
  if (flags['expiration']) initialParams['expiration'] = flags['expiration'] as string;
} else if (command === 'help' || flags['help'] || flags['h']) {
  console.log([
    '',
    'Certo CLI (Ink TUI)',
    '',
    'Usage:',
    '  certo              Open the interactive TUI (recommended)',
    '  certo <command>    Jump directly to a command screen',
    '',
    'Commands:',
    '  verify [id]       Verify a credential',
    '  issue             Issue a credential (interactive form)',
    '  list              List credentials',
    '  revoke [id]       Revoke a credential',
    '  renew [id]        Renew a credential',
    '  backup            Full-instance backup',
    '  restore           Restore from backup',
    '',
    'Options:',
    '  --url <url>       Backend URL (default: $CERTO_API_URL or localhost:1337)',
    '  --token <token>   API token   (default: $CERTO_API_TOKEN)',
    '',
  ].join('\n'));
  process.exit(0);
} else if (command) {
  console.error('Unknown command: ' + command);
  console.error("Run 'certo help' or just 'certo' to open the interactive TUI.");
  process.exitCode = 1;
  process.exit();
}

render(
  <App
    initialScreen={initialScreen}
    initialParams={initialParams}
    flags={flags}
  />
);
