import React, { useState } from 'react';
import { Box, useApp, useInput } from 'ink';
import { Header } from './components/Header.js';
import { MainMenu, type MenuCommand } from './screens/MainMenu.js';
import { VerifyScreen } from './screens/VerifyScreen.js';
import { IssueScreen } from './screens/IssueScreen.js';
import { ListScreen } from './screens/ListScreen.js';
import { RevokeScreen } from './screens/RevokeScreen.js';
import { RenewScreen } from './screens/RenewScreen.js';
import { BackupScreen, RestoreScreen } from './screens/BackupRestoreScreens.js';
import { getConfig, type Config } from './utils/config.js';

export type Screen = 'menu' | MenuCommand;

interface AppProps {
  /** If set, skip the menu and go directly to this screen (one-shot mode) */
  initialScreen?: Screen;
  /** Pre-filled params for the initial screen */
  initialParams?: Record<string, string>;
  /** Custom flags (from CLI args) */
  flags?: Record<string, string | boolean>;
}

export function App({ initialScreen, initialParams = {}, flags = {} }: AppProps) {
  const { exit } = useApp();
  const [screen, setScreen] = useState<Screen>(initialScreen ?? 'menu');
  const cfg: Config = getConfig(flags);

  // Esc goes back to the main menu from any sub-screen
  useInput((_input, key) => {
    if (key.escape && screen !== 'menu') {
      setScreen('menu');
    }
  });

  function navigate(cmd: MenuCommand) {
    if (cmd === 'exit') {
      exit();
      return;
    }
    setScreen(cmd);
  }

  function goBack() {
    setScreen('menu');
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Header screen={screen} />

      {screen === 'menu' && (
        <MainMenu onSelect={navigate} />
      )}

      {screen === 'verify' && (
        <VerifyScreen
          cfg={cfg}
          initialId={initialParams['id']}
          onBack={goBack}
        />
      )}

      {screen === 'issue' && (
        <IssueScreen
          cfg={cfg}
          onBack={goBack}
        />
      )}

      {screen === 'list' && (
        <ListScreen
          cfg={cfg}
          onBack={goBack}
        />
      )}

      {screen === 'revoke' && (
        <RevokeScreen
          cfg={cfg}
          initialId={initialParams['id']}
          onBack={goBack}
        />
      )}

      {screen === 'renew' && (
        <RenewScreen
          cfg={cfg}
          initialId={initialParams['id']}
          initialExpiry={initialParams['expiration']}
          onBack={goBack}
        />
      )}

      {screen === 'backup' && (
        <BackupScreen onBack={goBack} />
      )}

      {screen === 'restore' && (
        <RestoreScreen onBack={goBack} />
      )}
    </Box>
  );
}
