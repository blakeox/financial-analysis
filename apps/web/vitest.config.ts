import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['src/scripts/__tests__/test-setup.ts'],
    include: ['src/**/*.test.ts'],
    exclude: ['tests/**/*', 'playwright-report/**/*'],
    slowTestThreshold: 2000,
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage/vitest',
      include: [
        'scripts/**/*.mjs',
        'src/scripts/calculators/amortization.client.ts',
        'src/scripts/calculators/savings-goal.client.ts',
        'src/scripts/calculators/student-loans.client.ts',
        'src/scripts/calculators/retirement.client.ts',
        'src/scripts/chat/**/*.{ts,tsx}',
        'src/scripts/models/**/*.{ts,tsx}',
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/scripts/chat/accessibility.ts',
        'src/scripts/chat/chat-memory.ts',
        'src/scripts/chat/chat-panel.ts',
        'src/scripts/chat/field-update-manager.ts',
        'src/scripts/chat/state-store.ts',
        'src/scripts/chat/tool-catalog.ts',
        'src/scripts/chat/transport.ts',
        'src/scripts/chat/types.ts',
        'src/scripts/models/types.ts',
      ],
      thresholds: {
        branches: 50,
        statements: 60,
        functions: 50,
        lines: 60,
      },
    },
  },
});
