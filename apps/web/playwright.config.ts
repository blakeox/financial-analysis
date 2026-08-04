/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { defineConfig, devices } from '@playwright/test';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PLAYWRIGHT_MATRIX_PROJECTS,
  PLAYWRIGHT_PROJECT_DEVICE_MAP,
} from './scripts/playwright-projects.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const enableMatrix = process.env.PLAYWRIGHT_MATRIX === '1';
const projectNames = (enableMatrix ? PLAYWRIGHT_MATRIX_PROJECTS : ['chromium']) as Array<
  keyof typeof PLAYWRIGHT_PROJECT_DEVICE_MAP
>;

const projects = projectNames.map((name) => ({
  name,
  use: { ...devices[PLAYWRIGHT_PROJECT_DEVICE_MAP[name]] },
}));

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  // The matrix runs several browser projects concurrently on shared CI
  // runners. Keep local failures immediate, but allow one bounded retry for
  // transient runner contention or cold Astro/Worker startup in CI.
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/playwright/results.xml' }],
    ['blob', { outputDir: 'test-results/playwright/blob' }],
  ],
  use: {
    baseURL: 'http://localhost:8788',
    navigationTimeout: 60_000,
    actionTimeout: 20_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'cd ../.. && pnpm run dev:all',
    cwd: __dirname,
    url: 'http://localhost:8788',
    timeout: 240_000,
    // Reuse existing server if available
    reuseExistingServer: true,
  },
  projects,
});
