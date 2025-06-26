// @ts-ignore: Could not find module '@playwright/test' types in dev environment
import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import type { ConfigOptions } from '@nuxt/test-utils/playwright'

export default defineConfig<ConfigOptions>({
  testDir: './e2e',
  use: {
    nuxt: {
      rootDir: fileURLToPath(new URL('.', import.meta.url))
    },
    baseURL: 'http://localhost:3000'
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
  ]
}) 