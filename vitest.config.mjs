import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.d.ts'],
    },
    exclude: ['**/node_modules/**', '**/dist/**', '**/.{git,cache,output,wrangler}/**'],
  },
});
