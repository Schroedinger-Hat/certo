import React, { useEffect, useState } from 'react';
import { Box, Text, useApp } from 'ink';
import { Spinner } from '@inkjs/ui';
import { apiRequest, ApiError } from '../utils/api.js';
import { getConfig } from '../utils/config.js';

interface Credential {
  id: number;
  credentialId: string;
  revoked?: boolean;
  expirationDate?: string;
  achievement?: { achievementType?: string; name?: string };
  recipient?: { name?: string; email?: string };
}

interface Props {
  flags: Record<string, string | boolean>;
}

function statusLabel(c: Credential): { text: string; color: string } {
  if (c.revoked) return { text: 'revoked ', color: 'red' };
  if (c.expirationDate && new Date(c.expirationDate) < new Date()) return { text: 'expired ', color: 'yellow' };
  return { text: 'active  ', color: 'green' };
}

export function List({ flags }: Props) {
  const { exit } = useApp();
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');
  const [items, setItems] = useState<Credential[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const cfg = getConfig(flags);
    apiRequest<{ data: Credential[] }>(cfg, 'GET', '/api/credentials')
      .then(res => {
        setItems(res.data ?? (res as any) ?? []);
        setState('done');
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : String(err));
        setState('error');
      });
  }, []);

  useEffect(() => {
    if (state === 'done' || state === 'error') exit();
  }, [state]);

  if (state === 'loading') {
    return <Box><Spinner label="Fetching credentials…" /></Box>;
  }

  if (state === 'error') {
    return <Box><Text color="red">✗ {error}</Text></Box>;
  }

  if (items.length === 0) {
    return <Box><Text dimColor>No credentials found.</Text></Box>;
  }

  // Column widths
  const idW = 5;
  const urnW = 46;
  const achieveW = 28;
  const recipientW = 24;
  const statusW = 8;

  const pad = (s: string, w: number) => s.length > w ? s.slice(0, w - 1) + '…' : s.padEnd(w);

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box>
        <Text bold dimColor>{pad('ID', idW)} {pad('Credential URN', urnW)} {pad('Achievement', achieveW)} {pad('Recipient', recipientW)} {'Status'}</Text>
      </Box>
      <Box>
        <Text dimColor>{'─'.repeat(idW + urnW + achieveW + recipientW + statusW + 4)}</Text>
      </Box>

      {/* Rows */}
      {items.map(c => {
        const { text: statusText, color: statusColor } = statusLabel(c);
        const achieve = c.achievement?.achievementType ?? c.achievement?.name ?? '—';
        const recv = c.recipient?.email ?? c.recipient?.name ?? '—';
        const expiry = c.expirationDate
          ? ' ' + new Date(c.expirationDate).toLocaleDateString()
          : '';

        return (
          <Box key={c.id}>
            <Text dimColor>{pad(String(c.id), idW)} </Text>
            <Text>{pad(c.credentialId ?? '', urnW)} </Text>
            <Text color="cyan">{pad(achieve, achieveW)} </Text>
            <Text>{pad(recv, recipientW)} </Text>
            <Text color={statusColor as any}>{statusText}</Text>
            {expiry && <Text dimColor>{expiry}</Text>}
          </Box>
        );
      })}

      {/* Footer */}
      <Box marginTop={1}>
        <Text dimColor>{items.length} credential{items.length === 1 ? '' : 's'}</Text>
      </Box>
    </Box>
  );
}
