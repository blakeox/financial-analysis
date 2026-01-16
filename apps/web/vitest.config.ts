import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['src/scripts/__tests__/test-setup.ts'],
    include: ['src/scripts/__tests__/**/*.test.ts'],
    exclude: ['tests/**/*', 'playwright-report/**/*'],
    slowTestThreshold: 2000,
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts'],
      thresholds: {
        branches: 50,
        statements: 60,
        functions: 50,
        lines: 60,
      },
    },
  },
});
