import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Only run our source tests, never anything in node_modules
    include: ['src/**/*.{test,spec}.{ts,tsx,js,jsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{git,cache,output,wrangler}/**',
      '**/*.d.ts',
      'src/__tests__/miniflare-test.test.ts',
    ],
    // Reduce parallel execution to avoid KV database locking
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        maxForks: 4, // Limit concurrency to reduce SQLITE_BUSY errors
      },
    },
    // Retry flaky tests once before failing
    retry: 1,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.d.ts'],
    },
  },
});
