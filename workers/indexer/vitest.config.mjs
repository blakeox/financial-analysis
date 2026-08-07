import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    slowTestThreshold: 2000,
    testTimeout: 30000,
  },
});
