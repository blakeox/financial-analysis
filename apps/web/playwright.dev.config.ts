import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4323',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev -- --port 4323 --host 127.0.0.1',
    cwd: __dirname,
    url: 'http://127.0.0.1:4323',
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium-dev',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
