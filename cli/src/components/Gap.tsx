/**
 * Gap — a non-collapsing vertical spacer.
 * Empty <Box> elements can be crushed by Yoga's flexShrink=1 default
 * when content overflows. A Gap with real text characters never collapses.
 */
import React from 'react';
import { Box, Text } from 'ink';

export function Gap({ lines = 1 }: { lines?: number }) {
  return (
    <Box flexDirection="column" flexShrink={0}>
      {Array.from({ length: lines }, (_, i) => (
        <Text key={i}> </Text>
      ))}
    </Box>
  );
}
