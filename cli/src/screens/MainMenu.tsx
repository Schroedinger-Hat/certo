import React from 'react';
import { Box, Text } from 'ink';
import { Select } from '@inkjs/ui';

export type MenuCommand = 'verify' | 'issue' | 'list' | 'revoke' | 'renew' | 'backup' | 'restore' | 'exit';

interface Props {
  onSelect: (cmd: MenuCommand) => void;
}

const OPTIONS = [
  { label: '🔍  Verify a credential',      value: 'verify' },
  { label: '✨  Issue a credential',        value: 'issue' },
  { label: '📋  List credentials',          value: 'list' },
  { label: '🚫  Revoke a credential',       value: 'revoke' },
  { label: '♻️   Renew a credential',       value: 'renew' },
  { label: '💾  Backup',                    value: 'backup' },
  { label: '📦  Restore from backup',       value: 'restore' },
  { label: '🚪  Exit',                      value: 'exit' },
];

export function MainMenu({ onSelect }: Props) {
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>What would you like to do?</Text>
      <Select
        options={OPTIONS}
        onChange={value => onSelect(value as MenuCommand)}
      />
    </Box>
  );
}
