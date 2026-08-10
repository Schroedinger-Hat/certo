/**
 * Shortcuts — a footer bar showing context-aware keyboard hints.
 * Pattern: [key action]  [key action]  ...
 * Inspired by yoinks' Shortcuts component.
 */
import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../theme.js';

type Hint = [key: string, label: string];

interface Props {
  hints: Hint[];
  /** Optional leading element (e.g. a spinner + status text) */
  leading?: React.ReactNode;
}

export function Shortcuts({ hints, leading }: Props) {
  const theme = useTheme();
  return (
    <Box flexDirection="row" gap={2} flexWrap="wrap">
      {leading && <Box marginRight={1}>{leading}</Box>}
      {hints.map(([key, label]) => (
        <Box key={key}>
          <Text bold color={theme.primary}>{key}</Text>
          <Text color={theme.muted} dimColor={theme.dimMuted}> {label}</Text>
        </Box>
      ))}
    </Box>
  );
}
