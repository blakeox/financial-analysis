import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/__tests__/test-setup.ts'],
    slowTestThreshold: 2000,
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.d.ts'],
    },
  },
});
