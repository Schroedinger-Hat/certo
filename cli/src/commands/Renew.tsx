import React, { useEffect, useState } from 'react';
import { Box, Text, useApp } from 'ink';
import { Spinner, ConfirmInput, TextInput } from '@inkjs/ui';
import { apiRequest, ApiError } from '../utils/api.js';
import { getConfig } from '../utils/config.js';

interface Props {
  credentialId: string;
  flags: Record<string, string | boolean>;
}

type Step = 'enter-date' | 'confirm' | 'renewing' | 'done' | 'error';

export function Renew({ credentialId, flags }: Props) {
  const { exit } = useApp();
  const [step, setStep] = useState<Step>(flags['expiration'] ? 'confirm' : 'enter-date');
  const [expiry, setExpiry] = useState((flags['expiration'] as string) || '');
  const [error, setError] = useState('');
  const [newId, setNewId] = useState('');

  useEffect(() => {
    if (step === 'done' || step === 'error') exit();
  }, [step]);

  async function doRenew() {
    setStep('renewing');
    try {
      const cfg = getConfig(flags);
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

  if (step === 'enter-date') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold>New expiration date <Text dimColor>(YYYY-MM-DD)</Text>:</Text>
        <TextInput
          placeholder="2027-12-31"
          onSubmit={value => {
            if (!value || isNaN(Date.parse(value))) return;
            setExpiry(value);
            setStep('confirm');
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
          <Text>  Credential:  <Text color="yellow">{credentialId}</Text></Text>
          <Text>  New expiry:  <Text color="cyan">{expiry}</Text></Text>
        </Box>
        <ConfirmInput onConfirm={doRenew} onCancel={() => { process.exitCode = 1; exit(); }} />
      </Box>
    );
  }

  if (step === 'renewing') {
    return <Box><Spinner label="Renewing…" /></Box>;
  }

  if (step === 'done') {
    return (
      <Box flexDirection="column">
        <Text color="green" bold>✓ Credential renewed</Text>
        {newId && <Text dimColor>  New ID: {newId}</Text>}
      </Box>
    );
  }

  return <Box><Text color="red">✗ {error}</Text></Box>;
}
