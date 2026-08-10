import React, { useEffect, useState } from 'react';
import { Box, Text, useApp } from 'ink';
import { Spinner, ConfirmInput } from '@inkjs/ui';
import { apiRequest, ApiError } from '../utils/api.js';
import { getConfig } from '../utils/config.js';

interface Props {
  credentialId: string;
  flags: Record<string, string | boolean>;
}

type Step = 'confirm' | 'revoking' | 'done' | 'error';

export function Revoke({ credentialId, flags }: Props) {
  const { exit } = useApp();
  const [step, setStep] = useState<Step>('confirm');
  const [error, setError] = useState('');
  const reason = (flags['reason'] as string) || 'Revoked via CLI';

  useEffect(() => {
    if (step === 'done' || step === 'error') exit();
  }, [step]);

  async function doRevoke() {
    setStep('revoking');
    try {
      const cfg = getConfig(flags);
      await apiRequest(cfg, 'POST', `/api/credentials/${encodeURIComponent(credentialId)}/revoke`, { reason });
      setStep('done');
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : String(err));
      setStep('error');
    }
  }

  if (step === 'confirm') {
    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column">
          <Text bold>Revoke credential?</Text>
          <Text>  ID:     <Text color="yellow">{credentialId}</Text></Text>
          <Text>  Reason: <Text dimColor>{reason}</Text></Text>
        </Box>
        <ConfirmInput
          onConfirm={doRevoke}
          onCancel={() => {
            process.exitCode = 1;
            exit();
          }}
        />
      </Box>
    );
  }

  if (step === 'revoking') {
    return <Box><Spinner label="Revoking…" /></Box>;
  }

  if (step === 'done') {
    return <Box><Text color="green" bold>✓ Credential revoked</Text></Box>;
  }

  return <Box><Text color="red">✗ {error}</Text></Box>;
}
