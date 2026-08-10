import React, { useEffect, useState } from 'react';
import { Box, Text, useApp } from 'ink';
import { Spinner, TextInput, Select, ConfirmInput } from '@inkjs/ui';
import { apiRequest, ApiError } from '../utils/api.js';
import { getConfig } from '../utils/config.js';

interface Achievement {
  id: number;
  achievementType?: string;
  name?: string;
  description?: string;
}

type Step = 'loading-achievements' | 'pick-achievement' | 'enter-recipient' | 'enter-expiry' | 'confirm' | 'issuing' | 'done' | 'error';

interface Props {
  flags: Record<string, string | boolean>;
}

export function Issue({ flags }: Props) {
  const { exit } = useApp();
  const [step, setStep] = useState<Step>('loading-achievements');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [recipient, setRecipient] = useState((flags['recipient'] as string) || '');
  const [expiry, setExpiry] = useState((flags['expiration'] as string) || '');
  const [error, setError] = useState('');
  const [issuedId, setIssuedId] = useState('');

  const cfg = getConfig(flags);

  // If flags were passed, skip interactive steps
  useEffect(() => {
    apiRequest<{ data: Achievement[] }>(cfg, 'GET', '/api/achievements?populate=*')
      .then(res => {
        const items = res.data ?? [];
        setAchievements(items);

        // If --achievement flag was given, pre-select and skip picker
        if (flags['achievement']) {
          const id = Number(flags['achievement']);
          const found = items.find(a => a.id === id) ?? null;
          setSelectedAchievement(found ?? { id } as Achievement);
          setStep(recipient ? 'enter-expiry' : 'enter-recipient');
        } else {
          setStep('pick-achievement');
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : String(err));
        setStep('error');
      });
  }, []);

  useEffect(() => {
    if (step === 'done' || step === 'error') exit();
  }, [step]);

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

  if (step === 'loading-achievements') {
    return <Box><Spinner label="Loading achievements…" /></Box>;
  }

  if (step === 'pick-achievement') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold>Select achievement to issue:</Text>
        <Select
          options={achievements.map(a => ({
            label: a.achievementType ?? a.name ?? `Achievement #${a.id}`,
            value: String(a.id),
          }))}
          onChange={value => {
            const a = achievements.find(x => x.id === Number(value))!;
            setSelectedAchievement(a);
            setStep(recipient ? 'enter-expiry' : 'enter-recipient');
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
          onSubmit={value => {
            if (!value.includes('@')) return;
            setRecipient(value);
            setStep('enter-expiry');
          }}
        />
      </Box>
    );
  }

  if (step === 'enter-expiry') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold>Expiration date <Text dimColor>(leave blank for none)</Text>:</Text>
        <TextInput
          placeholder="YYYY-MM-DD"
          onSubmit={value => {
            setExpiry(value);
            setStep('confirm');
          }}
        />
      </Box>
    );
  }

  if (step === 'confirm') {
    const achievementName = selectedAchievement?.achievementType ?? selectedAchievement?.name ?? `#${selectedAchievement?.id}`;
    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column" marginBottom={1}>
          <Text bold>Issue credential — confirm:</Text>
          <Text>  Achievement: <Text color="cyan">{achievementName}</Text></Text>
          <Text>  Recipient:   <Text color="cyan">{recipient}</Text></Text>
          {expiry && <Text>  Expires:     <Text color="cyan">{expiry}</Text></Text>}
        </Box>
        <ConfirmInput
          onConfirm={doIssue}
          onCancel={() => {
            process.exitCode = 1;
            exit();
          }}
        />
      </Box>
    );
  }

  if (step === 'issuing') {
    return <Box><Spinner label="Issuing credential…" /></Box>;
  }

  if (step === 'done') {
    return (
      <Box flexDirection="column">
        <Text color="green" bold>✓ Credential issued</Text>
        {issuedId && <Text dimColor>  ID: {issuedId}</Text>}
      </Box>
    );
  }

  // error
  return (
    <Box flexDirection="column">
      <Text color="red">✗ {error}</Text>
    </Box>
  );
}
