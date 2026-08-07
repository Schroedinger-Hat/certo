import React, { useEffect, useState } from 'react';
import { Box, Text, useApp } from 'ink';
import { Spinner } from '@inkjs/ui';
import { apiRequest, ApiError } from '../utils/api.js';
import { getConfig } from '../utils/config.js';

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

interface Props {
  credentialId: string;
  flags: Record<string, string | boolean>;
}

export function Verify({ credentialId, flags }: Props) {
  const { exit } = useApp();
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const cfg = getConfig(flags);
    apiRequest<VerifyResult>(cfg, 'GET', `/api/credentials/${encodeURIComponent(credentialId)}/verify`)
      .then(r => {
        setResult(r);
        setState('done');
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : String(err));
        setState('error');
      });
  }, []);

  useEffect(() => {
    if (state === 'done' || state === 'error') {
      if (!result?.verified) process.exitCode = 1;
      exit();
    }
  }, [state]);

  if (state === 'loading') {
    return (
      <Box>
        <Spinner label={`Verifying ${credentialId}…`} />
      </Box>
    );
  }

  if (state === 'error') {
    return (
      <Box flexDirection="column">
        <Text color="red">✗ Error: {error}</Text>
      </Box>
    );
  }

  const valid = result!.verified;

  return (
    <Box flexDirection="column" gap={1}>
      {/* Header */}
      <Box>
        <Text bold color={valid ? 'green' : 'red'}>
          {valid ? '✓ VALID' : '✗ INVALID'}
        </Text>
        {result!.credential?.name && (
          <Text> — {result!.credential.name}</Text>
        )}
      </Box>

      {/* Credential details */}
      {result!.credential && (
        <Box flexDirection="column" marginLeft={2}>
          {result!.credential.issuer?.name && (
            <Text dimColor>Issuer:  {result!.credential.issuer.name}</Text>
          )}
          {result!.credential.issuanceDate && (
            <Text dimColor>Issued:  {new Date(result!.credential.issuanceDate).toLocaleDateString()}</Text>
          )}
          {result!.credential.expirationDate && (
            <Text dimColor>Expires: {new Date(result!.credential.expirationDate).toLocaleDateString()}</Text>
          )}
        </Box>
      )}

      {/* Checks */}
      {result!.checks && result!.checks.length > 0 && (
        <Box flexDirection="column">
          <Text dimColor>── Checks ──────────────────</Text>
          {result!.checks.map(c => (
            <Box key={c.check} marginLeft={2}>
              <Text color={c.result === 'success' ? 'green' : 'red'}>
                {c.result === 'success' ? '✓' : '✗'}{' '}
              </Text>
              <Text>{CHECK_LABELS[c.check] ?? c.check}</Text>
              {c.message && (
                <Text dimColor> — {c.message}</Text>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
