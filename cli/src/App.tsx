import React, { useCallback, useState } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import { Header } from './components/Header.js';
import { Logo } from './components/Logo.js';
import { FullScreen } from './components/FullScreen.js';
import { Shortcuts } from './components/Shortcuts.js';
import { Gap } from './components/Gap.js';
import { ThemeProvider, nextThemeMode, useTheme, type ThemeMode } from './theme.js';
import { MainMenu, type MenuCommand } from './screens/MainMenu.js';
import { VerifyScreen } from './screens/VerifyScreen.js';
import { IssueScreen } from './screens/IssueScreen.js';
import { ListScreen } from './screens/ListScreen.js';
import { RevokeScreen } from './screens/RevokeScreen.js';
import { RenewScreen } from './screens/RenewScreen.js';
import { BackupScreen, RestoreScreen } from './screens/BackupRestoreScreens.js';
import { getConfig, type Config } from './utils/config.js';

export type Screen = 'menu' | MenuCommand;

// Context-aware keyboard hints shown in the footer per screen
const HINTS: Record<Screen, Array<[string, string]>> = {
  menu:    [['↑↓', 'choose'], ['↵', 'select'], ['^C', 'quit']],
  verify:  [['esc', 'back'], ['^C', 'quit']],
  issue:   [['esc', 'back'], ['^C', 'quit']],
  list:    [['esc', 'back'], ['^C', 'quit']],
  revoke:  [['esc', 'back'], ['^C', 'quit']],
  renew:   [['esc', 'back'], ['^C', 'quit']],
  backup:  [['esc', 'back'], ['^C', 'quit']],
  restore: [['esc', 'back'], ['^C', 'quit']],
  exit:    [],
};

interface AppProps {
  initialScreen?: Screen;
  initialParams?: Record<string, string>;
  flags?: Record<string, string | boolean>;
}

export function App({ initialScreen, initialParams = {}, flags = {} }: AppProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');
  const cycleTheme = useCallback(() => setThemeMode(nextThemeMode), []);

  return (
    <ThemeProvider mode={themeMode}>
      <AppContent
        initialScreen={initialScreen}
        initialParams={initialParams}
        flags={flags}
        themeMode={themeMode}
        cycleTheme={cycleTheme}
      />
    </ThemeProvider>
  );
}

function AppContent({
  initialScreen,
  initialParams = {},
  flags = {},
  themeMode,
  cycleTheme,
}: AppProps & { themeMode: ThemeMode; cycleTheme: () => void }) {
  const { exit } = useApp();
  const theme = useTheme();
  const { stdout } = useStdout();
  const columns = stdout?.columns && stdout.columns > 0 ? stdout.columns : 80;
  const isNarrow = columns < 60;

  const [screen, setScreen] = useState<Screen>(initialScreen ?? 'menu');
  const cfg: Config = getConfig(flags);

  useInput((input, key) => {
    // ^T cycles theme
    if (key.ctrl && input === 't') { cycleTheme(); return; }
    // Esc goes back to menu from any sub-screen
    if (key.escape && screen !== 'menu') setScreen('menu');
  });

  function navigate(cmd: MenuCommand) {
    if (cmd === 'exit') { exit(); return; }
    setScreen(cmd);
  }

  function goBack() { setScreen('menu'); }

  const hints: Array<[string, string]> = [
    ...(HINTS[screen] ?? []),
    ['^T', `theme:${themeMode}`],
  ];

  return (
    <FullScreen>
      <Box flexDirection="column" paddingX={isNarrow ? 0 : 2} minHeight={20}>

        {/* Logo (main menu) or breadcrumb header (sub-screens) */}
        {screen === 'menu' ? (
          <>
            <Gap />
            <Logo compact={isNarrow} />
            <Gap />
            <Box justifyContent="center">
              <Text color={theme.muted} dimColor={theme.dimMuted}>
                Open Badges 3.0 · Verifiable Credentials
              </Text>
            </Box>
            <Gap />
          </>
        ) : (
          <Header screen={screen} />
        )}

        {/* Active screen */}
        {screen === 'menu' && <MainMenu onSelect={navigate} />}
        {screen === 'verify' && <VerifyScreen cfg={cfg} initialId={initialParams['id']} onBack={goBack} />}
        {screen === 'issue' && <IssueScreen cfg={cfg} onBack={goBack} />}
        {screen === 'list' && <ListScreen cfg={cfg} columns={columns} onBack={goBack} />}
        {screen === 'revoke' && <RevokeScreen cfg={cfg} initialId={initialParams['id']} onBack={goBack} />}
        {screen === 'renew' && <RenewScreen cfg={cfg} initialId={initialParams['id']} initialExpiry={initialParams['expiration']} onBack={goBack} />}
        {screen === 'backup' && <BackupScreen onBack={goBack} />}
        {screen === 'restore' && <RestoreScreen onBack={goBack} />}

        {/* Footer shortcuts */}
        <Gap lines={2} />
        <Shortcuts hints={hints} />
      </Box>
    </FullScreen>
  );
}

