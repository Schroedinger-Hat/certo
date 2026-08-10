import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { Spinner, TextInput, ConfirmInput } from '@inkjs/ui';
import { apiRequest, ApiError } from '../utils/api.js';
import type { Config } from '../utils/config.js';

type Step = 'input-id' | 'input-date' | 'confirm' | 'renewing' | 'done' | 'error';

interface Props {
  cfg: Config;
  initialId?: string;
  initialExpiry?: string;
  onBack: () => void;
}

export function RenewScreen({ cfg, initialId, initialExpiry, onBack }: Props) {
  const [step, setStep] = useState<Step>(
    initialId ? (initialExpiry ? 'confirm' : 'input-date') : 'input-id'
  );
  const [credentialId, setCredentialId] = useState(initialId ?? '');
  const [expiry, setExpiry] = useState(initialExpiry ?? '');
  const [error, setError] = useState('');
  const [newId, setNewId] = useState('');

  async function doRenew() {
    setStep('renewing');
    try {
      const result = await apiRequest<any>(cfg, 'POST',
        `/api/credentials/${encodeURIComponent(credentialId)}/renew`,
        { newExpirationDate: expiry },
      );
      setNewId(result.credential?.credentialId ?? '');
      setStep('done');
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : String(err));
      setStep('error');
    }
  }

  if (step === 'input-id') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold>Credential ID to renew:</Text>
        <TextInput
          placeholder="numeric ID or urn:uuid:..."
          onSubmit={id => { if (id) { setCredentialId(id); setStep('input-date'); } }}
        />
      </Box>
    );
  }

  if (step === 'input-date') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold>New expiration date <Text dimColor>(YYYY-MM-DD)</Text>:</Text>
        <TextInput
          placeholder={new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]}
          onSubmit={value => {
            if (value && !isNaN(Date.parse(value))) { setExpiry(value); setStep('confirm'); }
          }}
        />
      </Box>
    );
  }

  if (step === 'confirm') {
    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column">
          <Text bold>Renew credential?</Text>
          <Text>ID:          <Text color="cyan">{credentialId}</Text></Text>
          <Text>New expiry:  <Text color="cyan">{expiry}</Text></Text>
        </Box>
        <ConfirmInput onConfirm={doRenew} onCancel={onBack} />
      </Box>
    );
  }

  if (step === 'renewing') return <Box><Spinner label="Renewing…" /></Box>;

  if (step === 'done') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text color="green" bold>✓ Credential renewed</Text>
        {newId && <Text dimColor>  New ID: {newId}</Text>}
        <Text dimColor>Press Esc to go back</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" gap={1}>
      <Text color="red">✗ {error}</Text>
      <Text dimColor>Press Esc to go back</Text>
    </Box>
  );
}
