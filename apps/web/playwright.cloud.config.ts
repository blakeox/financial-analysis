// Cloudflare Browser Rendering integration for Playwright tests
// Uses the new GA features with tripled limits for paid plans (30 concurrent browsers vs 10)

import { defineConfig, devices } from '@playwright/test';
import { createRequire } from 'node:module';
import { ensureBrowserRenderingEndpoint } from './tests/global-setup';

const require = createRequire(import.meta.url);
const globalSetup = require.resolve('./tests/global-setup');

const wsEndpoint = await ensureBrowserRenderingEndpoint();
const cloudConnection = wsEndpoint
  ? {
      connectOptions: {
        wsEndpoint,
      },
    }
  : {};

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 2, // More retries since we're using cloud browsers
  workers: 10, // Can now use more parallel workers with increased limits
  timeout: 60_000, // Increased timeout for cloud execution
  globalSetup,
  
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results.xml' }]
  ],
  
  use: {
    // Use Cloudflare Browser Rendering endpoint
    // This connects to Cloudflare's headless browser infrastructure
    ...cloudConnection,

    baseURL: process.env.BASE_URL || 'https://financial-analysis-web.blakeoxford.workers.dev',
    
    // Enhanced settings for cloud browsers
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Longer timeouts for cloud execution
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
  },

  // Test environments with Browser Rendering
  projects: [
    // Desktop browsers on Cloudflare infrastructure
    {
      name: 'chromium-cloud',
      use: { 
        ...devices['Desktop Chrome'],
        // Use Cloudflare Browser Rendering for this project
        ...cloudConnection,
      },
    },
    {
      name: 'firefox-cloud', 
      use: { 
        ...devices['Desktop Firefox'],
        ...cloudConnection,
      },
    },
    // Mobile testing on cloud browsers
    {
      name: 'mobile-chrome-cloud',
      use: { 
        ...devices['Pixel 5'],
        ...cloudConnection,
      },
    },
    
    // Keep local fallback for development
    {
      name: 'chromium-local',
      use: { ...devices['Desktop Chrome'] },
      // Only run locally if no cloud endpoint configured
      testIgnore: wsEndpoint ? '**/*' : undefined,
    },
  ],
});
