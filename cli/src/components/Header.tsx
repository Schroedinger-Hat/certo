/**
 * Header — breadcrumb bar shown on sub-screens (not the main menu).
 * Main menu uses the full Logo instead.
 */
import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../theme.js';

const LABELS: Record<string, string> = {
  verify: 'Verify Credential',
  issue: 'Issue Credential',
  list: 'List Credentials',
  revoke: 'Revoke Credential',
  renew: 'Renew Credential',
  backup: 'Backup',
  restore: 'Restore',
};

interface Props {
  screen: string;
}

export function Header({ screen }: Props) {
  const theme = useTheme();
  const label = LABELS[screen] ?? screen;
  return (
    <Box marginBottom={1} gap={1}>
      <Text bold color={theme.primary}>◆ CERTO</Text>
      <Text color={theme.muted} dimColor={theme.dimMuted}>›</Text>
      <Text bold>{label}</Text>
    </Box>
  );
}
