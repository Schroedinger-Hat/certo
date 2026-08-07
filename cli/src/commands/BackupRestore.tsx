import React, { useEffect, useState } from 'react';
import { Box, Text, useApp } from 'ink';
import { Spinner } from '@inkjs/ui';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

interface Props {
  flags: Record<string, string | boolean>;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

export function Backup({ flags }: Props) {
  const { exit } = useApp();
  const [state, setState] = useState<'running' | 'done' | 'error'>('running');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Delegate to the existing scripts/backup.js module
    const backupScript = join(__dirname, '../../../src/backend/scripts/backup.js');
    try {
      const { runBackup } = require(backupScript) as { runBackup: () => void };
      // Capture stdout temporarily to show success message
      const origLog = console.log;
      const lines: string[] = [];
      console.log = (...args) => lines.push(args.join(' '));
      runBackup();
      console.log = origLog;
      setMessage(lines.find(l => l.includes('Done')) ?? 'Backup complete');
      setState('done');
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : String(err));
      setState('error');
    }
  }, []);

  useEffect(() => {
    if (state === 'done' || state === 'error') exit();
  }, [state]);

  if (state === 'running') return <Box><Spinner label="Backing up…" /></Box>;
  if (state === 'done') return <Box><Text color="green" bold>✓ {message}</Text></Box>;
  return <Box><Text color="red">✗ {message}</Text></Box>;
}

export function Restore({ flags }: Props) {
  const { exit } = useApp();
  const [state, setState] = useState<'running' | 'done' | 'error'>('running');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!flags['from'] || !flags['yes']) {
      setMessage(!flags['from'] ? '--from <dir> is required' : 'Add --yes to confirm data overwrite');
      setState('error');
      return;
    }

    const restoreScript = join(__dirname, '../../../src/backend/scripts/restore.js');
    try {
      const { runRestore } = require(restoreScript) as { runRestore: () => void };
      // Patch argv for restore.js to pick up --from and --yes
      const orig = process.argv;
      process.argv = ['node', 'restore.js', '--from', flags['from'] as string, '--yes'];
      const origLog = console.log;
      const lines: string[] = [];
      console.log = (...args) => lines.push(args.join(' '));
      runRestore();
      process.argv = orig;
      console.log = origLog;
      setMessage(lines.find(l => l.includes('Done')) ?? 'Restore complete');
      setState('done');
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : String(err));
      setState('error');
    }
  }, []);

  useEffect(() => {
    if (state === 'done' || state === 'error') {
      if (state === 'error') process.exitCode = 1;
      exit();
    }
  }, [state]);

  if (state === 'running') return <Box><Spinner label="Restoring…" /></Box>;
  if (state === 'done') return <Box><Text color="green" bold>✓ {message}</Text></Box>;
  return <Box><Text color="red">✗ {message}</Text></Box>;
}
