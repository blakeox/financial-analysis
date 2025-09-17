import { defineConfig } from 'vitest/config';

// Minimal Vitest config without ESM-only plugins to avoid esbuild issues when loading TS configs
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
