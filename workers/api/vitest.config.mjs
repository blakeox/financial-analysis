import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/__tests__/test-setup.ts'],
    // Only run our source tests, never anything in node_modules
    include: ['src/**/*.{test,spec}.{ts,tsx,js,jsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{git,cache,output,wrangler}/**',
      '**/*.d.ts',
    ],
    // Reduce parallel execution to avoid KV database locking
    pool: 'forks',
    maxWorkers: 4,
    // Retry flaky tests once before failing
    retry: 1,
    slowTestThreshold: 2000,
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.d.ts'],
      thresholds: {
        branches: 60,
        statements: 70,
        functions: 60,
        lines: 70,
      },
    },
  },
});
