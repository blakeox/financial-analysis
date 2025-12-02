import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    environmentMatchGlobs: [
      ['packages/**', 'node'],
      ['workers/**', 'node'],
      ['tests/**', 'node'],
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.d.ts'],
    },
    exclude: ['**/node_modules/**', '**/dist/**', '**/.{git,cache,output,wrangler}/**'],
  },
});
