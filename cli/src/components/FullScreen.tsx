/**
 * FullScreen — switches to the terminal's alternate screen buffer on mount
 * and restores the original scrollback on unmount, just like yoinks / vim / less.
 *
 * Only activates in a real TTY — piped output is untouched.
 */
import React, { type ReactNode, useEffect } from 'react';

interface Props {
  children: ReactNode;
}

export function FullScreen({ children }: Props) {
  useEffect(() => {
    if (!process.stdout.isTTY) return;
    // Enter alternate screen buffer + clear it
    process.stdout.write('\x1b[?1049h\x1b[2J\x1b[H');
    return () => {
      // Restore normal screen buffer (scrollback reappears)
      process.stdout.write('\x1b[?1049l');
    };
  }, []);

  return <>{children}</>;
}
