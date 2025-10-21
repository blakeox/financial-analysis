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
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.d.ts'],
    },
  },
});
