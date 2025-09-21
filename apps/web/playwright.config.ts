/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { defineConfig, devices } from '@playwright/test';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4321',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'node ./scripts/ensure-port-free.mjs && pnpm build && astro preview --port 4321 --host 127.0.0.1 --strictPort',
    cwd: __dirname,
    url: 'http://127.0.0.1:4321',
    timeout: 240_000,
    // Always start a fresh server to avoid connecting to an unrelated server on the same port
    reuseExistingServer: false,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
