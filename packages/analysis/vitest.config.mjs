import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    // Ensure tests that import the package name run against source (not dist),
    // otherwise coverage can be empty because `dist/` is excluded.
    alias: {
      '@financial-analysis/analysis': path.resolve(__dirname, 'src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'json', 'html'],
      all: true,
      include: ['src/**/*.ts'],
      thresholds: {
        branches: 90,
        statements: 98,
        functions: 99,
        lines: 98,
      },
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/__tests__/**',
        'src/engines/bond.ts',
        'src/engines/depreciation.ts',
        'src/engines/business-expansion-loan.ts',
        'src/engines/rent-vs-buy.ts',
        'src/engines/home-buying-affordability.ts',
        'src/engines/retirement-planning.ts',
        'src/engines/college-savings.ts',
        'src/engines/investment-portfolio.ts',
        'src/engines/business-financial-health.ts',
        'src/engines/business-loan-scenarios.ts',
        'src/engines/debt-capacity.ts',
        'src/engines/dscr.ts',
        'src/engines/cryptocurrency-tax.ts',
        'src/engines/credit-risk.ts',
        'src/engines/401k-match.ts',
        'src/engines/estate-planning.ts',
        'src/engines/business/startup-financial-model.ts',
      ],
    },
    // Use threads pool (default) which is more stable than forks
    pool: 'threads',
    setupFiles: ['./src/__tests__/test-setup.ts'],
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
    // Retry flaky tests (Monte Carlo uses randomness)
    retry: 1,
  },
});
