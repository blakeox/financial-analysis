import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:8788',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'node scripts/dev-all.mjs',
    cwd: repoRoot,
    url: 'http://127.0.0.1:8788',
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium-workers-dev',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
