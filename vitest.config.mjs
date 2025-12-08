import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    environmentMatchGlobs: [
      ['packages/ui/**', 'happy-dom'],
      ['packages/**', 'node'],
      ['workers/**', 'node'],
      ['tests/**', 'node'],
    ],
    // Use UI package setup for React component tests (extends jest-dom matchers)
    setupFiles: ['./packages/ui/vitest.setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.d.ts'],
    },
    exclude: ['**/node_modules/**', '**/dist/**', '**/.{git,cache,output,wrangler}/**'],
  },
});
