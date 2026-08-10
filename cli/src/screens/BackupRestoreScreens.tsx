import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { Spinner, TextInput, ConfirmInput } from '@inkjs/ui';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

interface Props {
  onBack: () => void;
}

// ─── Backup ──────────────────────────────────────────────────────────────────

export function BackupScreen({ onBack }: Props) {
  const [state, setState] = useState<'running' | 'done' | 'error'>('running');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const backupScript = join(__dirname, '../../../src/backend/scripts/backup.js');
    try {
      const { runBackup } = require(backupScript) as { runBackup: () => void };
      const lines: string[] = [];
      const origLog = console.log;
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

  if (state === 'running') return <Box><Spinner label="Backing up database and uploads…" /></Box>;

  return (
    <Box flexDirection="column" gap={1}>
      {state === 'done'
        ? <Text color="green" bold>✓ {message}</Text>
        : <Text color="red">✗ {message}</Text>}
      <Text dimColor>Press Esc to go back</Text>
    </Box>
  );
}

// ─── Restore ─────────────────────────────────────────────────────────────────

type RestoreStep = 'input-dir' | 'confirm' | 'restoring' | 'done' | 'error';

export function RestoreScreen({ onBack }: Props) {
  const [step, setStep] = useState<RestoreStep>('input-dir');
  const [fromDir, setFromDir] = useState('');
  const [message, setMessage] = useState('');

  function doRestore() {
    setStep('restoring');
    const restoreScript = join(__dirname, '../../../src/backend/scripts/restore.js');
    try {
      const { runRestore } = require(restoreScript) as { runRestore: () => void };
      const orig = process.argv;
      process.argv = ['node', 'restore.js', '--from', fromDir, '--yes'];
      const lines: string[] = [];
      const origLog = console.log;
      console.log = (...args) => lines.push(args.join(' '));
      runRestore();
      process.argv = orig;
      console.log = origLog;
      setMessage(lines.find(l => l.includes('Done')) ?? 'Restore complete');
      setStep('done');
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : String(err));
      setStep('error');
    }
  }

  if (step === 'input-dir') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold>Backup directory path:</Text>
        <TextInput
          placeholder="backups/2026-08-07T10-00-00-000Z"
          onSubmit={dir => { if (dir) { setFromDir(dir); setStep('confirm'); } }}
        />
      </Box>
    );
  }

  if (step === 'confirm') {
    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column">
          <Text bold color="yellow">⚠ Restore will overwrite your current database.</Text>
          <Text dimColor>From: {fromDir}</Text>
        </Box>
        <ConfirmInput onConfirm={doRestore} onCancel={onBack} />
      </Box>
    );
  }

  if (step === 'restoring') return <Box><Spinner label="Restoring…" /></Box>;

  return (
    <Box flexDirection="column" gap={1}>
      {step === 'done'
        ? <Text color="green" bold>✓ {message}</Text>
        : <Text color="red">✗ {message}</Text>}
      <Text dimColor>Press Esc to go back</Text>
    </Box>
  );
}
