import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { Spinner, TextInput, Select, ConfirmInput } from '@inkjs/ui';
import { apiRequest, ApiError } from '../utils/api.js';
import type { Config } from '../utils/config.js';

interface Achievement {
  id: number;
  achievementType?: string;
  name?: string;
}

type Step =
  | 'loading-achievements'
  | 'pick-achievement'
  | 'enter-recipient'
  | 'enter-expiry'
  | 'confirm'
  | 'issuing'
  | 'done'
  | 'error';

interface Props {
  cfg: Config;
  onBack: () => void;
}

export function IssueScreen({ cfg, onBack }: Props) {
  const [step, setStep] = useState<Step>('loading-achievements');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [recipient, setRecipient] = useState('');
  const [expiry, setExpiry] = useState('');
  const [error, setError] = useState('');
  const [issuedId, setIssuedId] = useState('');

  useEffect(() => {
    apiRequest<{ data: Achievement[] }>(cfg, 'GET', '/api/achievements')
      .then(res => {
        setAchievements(res.data ?? []);
        setStep('pick-achievement');
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : String(err));
        setStep('error');
      });
  }, []);

  async function doIssue() {
    setStep('issuing');
    try {
      const result = await apiRequest<any>(cfg, 'POST', '/api/credentials/issue', {
        data: {
          achievementId: selectedAchievement!.id,
          recipient: { email: recipient },
          ...(expiry ? { expirationDate: expiry } : {}),
        },
      });
      setIssuedId(result.credentialId ?? result.data?.credentialId ?? '');
      setStep('done');
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : String(err));
      setStep('error');
    }
  }

  if (step === 'loading-achievements') return <Box><Spinner label="Loading achievements…" /></Box>;

  if (step === 'pick-achievement') {
    if (achievements.length === 0) {
      return (
        <Box flexDirection="column" gap={1}>
          <Text color="yellow">⚠ No achievements found. Create one in the admin panel first.</Text>
          <Text dimColor>Press Esc to go back</Text>
        </Box>
      );
    }
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold>Select achievement:</Text>
        <Select
          options={achievements.map(a => ({
            label: a.achievementType ?? a.name ?? `Achievement #${a.id}`,
            value: String(a.id),
          }))}
          onChange={value => {
            setSelectedAchievement(achievements.find(x => x.id === Number(value))!);
            setStep('enter-recipient');
          }}
        />
      </Box>
    );
  }

  if (step === 'enter-recipient') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold>Recipient email:</Text>
        <TextInput
          placeholder="alice@example.com"
          onSubmit={value => { if (value.includes('@')) { setRecipient(value); setStep('enter-expiry'); } }}
        />
      </Box>
    );
  }

  if (step === 'enter-expiry') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold>Expiration date <Text dimColor>(press Enter to skip)</Text>:</Text>
        <TextInput
          placeholder="YYYY-MM-DD"
          onSubmit={value => { setExpiry(value); setStep('confirm'); }}
        />
      </Box>
    );
  }

  if (step === 'confirm') {
    const name = selectedAchievement?.achievementType ?? selectedAchievement?.name ?? `#${selectedAchievement?.id}`;
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold>Confirm issuance:</Text>
        <Box flexDirection="column" marginLeft={2}>
          <Text>Achievement: <Text color="cyan">{name}</Text></Text>
          <Text>Recipient:   <Text color="cyan">{recipient}</Text></Text>
          {expiry && <Text>Expires:     <Text color="cyan">{expiry}</Text></Text>}
        </Box>
        <ConfirmInput onConfirm={doIssue} onCancel={onBack} />
      </Box>
    );
  }

  if (step === 'issuing') return <Box><Spinner label="Issuing credential…" /></Box>;

  if (step === 'done') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text color="green" bold>✓ Credential issued successfully</Text>
        {issuedId && <Text dimColor>  ID: {issuedId}</Text>}
        <Text dimColor>Press Esc to go back to the menu</Text>
      </Box>
    );
  }

  // error
  return (
    <Box flexDirection="column" gap={1}>
      <Text color="red">✗ {error}</Text>
      <Text dimColor>Press Esc to go back</Text>
    </Box>
  );
}
