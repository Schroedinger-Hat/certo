/**
 * Theme system for the Certo CLI.
 * Three modes: auto (terminal default), light, dark.
 * Cycle with ^T. Apply via ThemeProvider / read with useTheme.
 */
import React, { createContext, useContext, type ReactNode } from 'react';

export type ThemeMode = 'auto' | 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  /** Brand/primary — links, highlights, selected items */
  primary: string;
  /** Success — valid credentials, completed actions */
  success: string;
  /** Warning — expiring soon, pending confirmations */
  warning: string;
  /** Error — invalid, revoked, failures */
  error: string;
  /** Muted secondary text */
  muted: string;
  /** Whether to dim secondary text (not needed in dark auto terminals) */
  dimMuted: boolean;
}

const THEMES: Record<ThemeMode, Theme> = {
  auto: {
    mode: 'auto',
    primary: 'blue',
    success: 'green',
    warning: 'yellow',
    error: 'red',
    muted: 'gray',
    dimMuted: true,
  },
  dark: {
    mode: 'dark',
    primary: 'cyan',
    success: 'greenBright',
    warning: 'yellowBright',
    error: 'redBright',
    muted: 'gray',
    dimMuted: false,
  },
  light: {
    mode: 'light',
    primary: 'blue',
    success: 'green',
    warning: 'yellow',
    error: 'red',
    muted: 'blackBright',
    dimMuted: false,
  },
};

const ORDER: ThemeMode[] = ['auto', 'dark', 'light'];

export function nextThemeMode(current: ThemeMode): ThemeMode {
  const i = ORDER.indexOf(current);
  return ORDER[(i + 1) % ORDER.length]!;
}

const ThemeContext = createContext<Theme>(THEMES.auto);

export function ThemeProvider({ mode, children }: { mode: ThemeMode; children: ReactNode }) {
  return (
    <ThemeContext.Provider value={THEMES[mode]}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
