import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { Spinner, TextInput, ConfirmInput } from '@inkjs/ui';
import { apiRequest, ApiError } from '../utils/api.js';
import type { Config } from '../utils/config.js';

type Step = 'input-id' | 'confirm' | 'revoking' | 'done' | 'error';

interface Props {
  cfg: Config;
  initialId?: string;
  onBack: () => void;
}

export function RevokeScreen({ cfg, initialId, onBack }: Props) {
  const [step, setStep] = useState<Step>(initialId ? 'confirm' : 'input-id');
  const [credentialId, setCredentialId] = useState(initialId ?? '');
  const [reason, setReason] = useState('Revoked via CLI');
  const [error, setError] = useState('');

  async function doRevoke() {
    setStep('revoking');
    try {
      await apiRequest(cfg, 'POST', `/api/credentials/${encodeURIComponent(credentialId)}/revoke`, { reason });
      setStep('done');
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : String(err));
      setStep('error');
    }
  }

  if (step === 'input-id') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold>Credential ID to revoke:</Text>
        <TextInput
          placeholder="numeric ID or urn:uuid:..."
          onSubmit={id => { if (id) { setCredentialId(id); setStep('confirm'); } }}
        />
      </Box>
    );
  }

  if (step === 'confirm') {
    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column">
          <Text bold color="yellow">⚠ Revoke credential?</Text>
          <Text>ID: <Text color="yellow">{credentialId}</Text></Text>
          <Text>Reason: <Text dimColor>{reason}</Text></Text>
        </Box>
        <ConfirmInput onConfirm={doRevoke} onCancel={onBack} />
      </Box>
    );
  }

  if (step === 'revoking') return <Box><Spinner label="Revoking…" /></Box>;

  if (step === 'done') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text color="green" bold>✓ Credential revoked</Text>
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
