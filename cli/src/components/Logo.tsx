/**
 * Logo — ANSI-shadow ASCII art wordmark for CERTO.
 * Centered in the terminal, themed with the primary brand colour.
 */
import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../theme.js';

const LINES = [
  ' ██████╗███████╗██████╗ ████████╗ ██████╗ ',
  '██╔════╝██╔════╝██╔══██╗╚══██╔══╝██╔═══██╗',
  '██║     █████╗  ██████╔╝   ██║   ██║   ██║',
  '██║     ██╔══╝  ██╔══██╗   ██║   ██║   ██║',
  '╚██████╗███████╗██║  ██║   ██║   ╚██████╔╝',
  ' ╚═════╝╚══════╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ',
];

export function Logo({ compact = false }: { compact?: boolean }) {
  const theme = useTheme();

  if (compact) {
    // Single-line compact version for narrow terminals or sub-screens
    return (
      <Box>
        <Text bold color={theme.primary}>◆ CERTO</Text>
        <Text dimColor> · credential platform</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" alignItems="center">
      {LINES.map((line, i) => (
        <Text key={i} color={theme.primary} bold>
          {line}
        </Text>
      ))}
    </Box>
  );
}
