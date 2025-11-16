// Reuse shared flat config and add package-local ignores
const base = require('@financial-analysis/config/eslint.config.cjs');

module.exports = [
  ...base,
  {
    // Package-local ignores
    ignores: ['src/**/*.d.ts', 'src/**/*.js'],
  },
  {
    // Allow flexible typing in complex analysis engines and tests
    files: ['src/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
