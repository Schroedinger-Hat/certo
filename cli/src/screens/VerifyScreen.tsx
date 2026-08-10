import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { Spinner, TextInput } from '@inkjs/ui';
import { apiRequest, ApiError } from '../utils/api.js';
import type { Config } from '../utils/config.js';

interface Check {
  check: string;
  result: 'success' | 'error' | 'warning';
  message?: string;
}

interface VerifyResult {
  verified: boolean;
  credential?: {
    name?: string;
    issuanceDate?: string;
    expirationDate?: string;
    issuer?: { name?: string };
  };
  checks?: Check[];
}

const CHECK_LABELS: Record<string, string> = {
  proof: 'Cryptographic proof',
  not_revoked: 'Not revoked',
  not_expired: 'Not expired',
  issuer: 'Issuer',
  structure: 'Structure',
};

type Step = 'input' | 'loading' | 'done' | 'error';

interface Props {
  cfg: Config;
  /** Pre-filled credential ID (from command-line one-shot mode) */
  initialId?: string;
  onBack: () => void;
}

export function VerifyScreen({ cfg, initialId, onBack }: Props) {
  const [step, setStep] = useState<Step>(initialId ? 'loading' : 'input');
  const [credentialId, setCredentialId] = useState(initialId ?? '');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState('');

  async function doVerify(id: string) {
    setCredentialId(id);
    setStep('loading');
    try {
      const r = await apiRequest<VerifyResult>(cfg, 'GET', `/api/credentials/${encodeURIComponent(id)}/verify`);
      setResult(r);
      setStep('done');
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : String(err));
      setStep('error');
    }
  }

  useEffect(() => {
    if (initialId) doVerify(initialId);
  }, []);

  if (step === 'input') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold>Credential ID or URN:</Text>
        <TextInput
          placeholder="urn:uuid:..."
          onSubmit={id => { if (id) doVerify(id); }}
        />
      </Box>
    );
  }

  if (step === 'loading') {
    return <Box><Spinner label={`Verifying ${credentialId}…`} /></Box>;
  }

  const valid = result?.verified ?? false;

  return (
    <Box flexDirection="column" gap={1}>
      <Box>
        <Text bold color={valid ? 'green' : 'red'}>
          {valid ? '✓ VALID' : '✗ INVALID'}
        </Text>
        {result?.credential?.name && <Text> — {result.credential.name}</Text>}
      </Box>

      {result?.credential && (
        <Box flexDirection="column" marginLeft={2}>
          {result.credential.issuer?.name && <Text dimColor>Issuer:  {result.credential.issuer.name}</Text>}
          {result.credential.issuanceDate && <Text dimColor>Issued:  {new Date(result.credential.issuanceDate).toLocaleDateString()}</Text>}
          {result.credential.expirationDate && <Text dimColor>Expires: {new Date(result.credential.expirationDate).toLocaleDateString()}</Text>}
        </Box>
      )}

      {step === 'error' && <Text color="red">✗ {error}</Text>}

      {result?.checks && (
        <Box flexDirection="column">
          <Text dimColor>── Checks ───────────────────</Text>
          {result.checks.map(c => (
            <Box key={c.check} marginLeft={2}>
              <Text color={c.result === 'success' ? 'green' : 'red'}>{c.result === 'success' ? '✓' : '✗'} </Text>
              <Text>{CHECK_LABELS[c.check] ?? c.check}</Text>
              {c.message && <Text dimColor> — {c.message}</Text>}
            </Box>
          ))}
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>Press Esc to go back</Text>
      </Box>
    </Box>
  );
}
