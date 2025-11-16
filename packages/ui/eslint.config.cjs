module.exports = [
  ...require('@financial-analysis/config/eslint.config.cjs'),
  {
    files: ['src/components/LeaseAnalysisDashboard.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-constant-binary-expression': 'off',
    },
  },
];
