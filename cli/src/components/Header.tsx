import React from 'react';
import { Box, Text } from 'ink';

const LABELS: Record<string, string> = {
  menu: 'Main Menu',
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
  const label = LABELS[screen] ?? screen;
  return (
    <Box
      borderStyle="round"
      borderColor="blue"
      paddingX={2}
      marginBottom={1}
      flexDirection="row"
      gap={1}
    >
      <Text bold color="blue">Certo</Text>
      {screen !== 'menu' && (
        <>
          <Text dimColor>›</Text>
          <Text bold>{label}</Text>
        </>
      )}
      <Box flexGrow={1} />
      {screen !== 'menu' && (
        <Text dimColor>Esc to go back</Text>
      )}
    </Box>
  );
}
