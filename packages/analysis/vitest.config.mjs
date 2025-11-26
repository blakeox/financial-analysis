import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.d.ts'],
    },
    // Use threads pool (default) which is more stable than forks
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
        isolate: false,
      },
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 5000,
    // Exclude dist tests to avoid double-running
    exclude: ['**/dist/**', '**/node_modules/**'],
    // Disable file parallelism to reduce memory pressure
    fileParallelism: false,
  },
});
