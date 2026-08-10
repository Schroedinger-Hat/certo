import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { Spinner } from '@inkjs/ui';
import { apiRequest, ApiError } from '../utils/api.js';
import type { Config } from '../utils/config.js';

interface Credential {
  id: number;
  credentialId: string;
  revoked?: boolean;
  expirationDate?: string;
  achievement?: { achievementType?: string; name?: string };
  recipient?: { name?: string; email?: string };
}

function statusLabel(c: Credential): { text: string; color: string } {
  if (c.revoked) return { text: 'revoked', color: 'red' };
  if (c.expirationDate && new Date(c.expirationDate) < new Date()) return { text: 'expired', color: 'yellow' };
  return { text: 'active ', color: 'green' };
}

interface Props {
  cfg: Config;
  columns?: number;
  onBack: () => void;
}

export function ListScreen({ cfg, columns = 80, onBack }: Props) {
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');
  const [items, setItems] = useState<Credential[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<{ data: Credential[] }>(cfg, 'GET', '/api/credentials')
      .then(res => {
        setItems((res.data ?? res) as Credential[]);
        setState('done');
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : String(err));
        setState('error');
      });
  }, []);

  if (state === 'loading') return <Box><Spinner label="Fetching credentials…" /></Box>;
  if (state === 'error') return <Box flexDirection="column"><Text color="red">✗ {error}</Text><Text dimColor>Press Esc to go back</Text></Box>;

  if (items.length === 0) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text dimColor>No credentials found.</Text>
        <Text dimColor>Press Esc to go back</Text>
      </Box>
    );
  }

  const urnW = 44;
  const achieveW = 26;
  const recipientW = 24;
  const pad = (s: string, w: number) => s.length > w ? s.slice(0, w - 1) + '…' : s.padEnd(w);

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold dimColor>{'ID  '}{pad('Credential URN', urnW)} {pad('Achievement', achieveW)} {pad('Recipient', recipientW)} Status</Text>
      </Box>
      <Text dimColor>{'─'.repeat(6 + urnW + achieveW + recipientW + 10)}</Text>

      {items.map(c => {
        const { text, color } = statusLabel(c);
        const achieve = c.achievement?.achievementType ?? c.achievement?.name ?? '—';
        const recv = c.recipient?.email ?? c.recipient?.name ?? '—';
        return (
          <Box key={c.id}>
            <Text dimColor>{String(c.id).padEnd(4)}</Text>
            <Text>{pad(c.credentialId ?? '', urnW)} </Text>
            <Text color="cyan">{pad(achieve, achieveW)} </Text>
            <Text>{pad(recv, recipientW)} </Text>
            <Text color={color as any}>{text}</Text>
            {c.expirationDate && <Text dimColor> {new Date(c.expirationDate).toLocaleDateString()}</Text>}
          </Box>
        );
      })}

      <Box marginTop={1}>
        <Text dimColor>{items.length} credential{items.length === 1 ? '' : 's'} — Press Esc to go back</Text>
      </Box>
    </Box>
  );
}
