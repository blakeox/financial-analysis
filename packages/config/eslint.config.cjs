// Shared ESLint flat config
const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const astroParser = require('astro-eslint-parser');
const astroPlugin = require('eslint-plugin-astro');
const jsxA11y = require('eslint-plugin-jsx-a11y');
const faA11y = require('./eslint-plugin-fa-a11y/index.cjs');

module.exports = [
  js.configs.recommended,
  {
    ignores: ['**/*.d.ts'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        projectService: true,
        // Allow files to be linted even if the TS Project Service doesn't find them
        allowDefaultProject: true,
        // Let TS ESLint fall back to default project when file isn't part of a configured project
      },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...(tsPlugin.configs.recommendedTypeChecked?.rules || {}),
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-useless-assignment': 'off',
    },
  },
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: { 'jsx-a11y': jsxA11y },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      // Crashes under ESLint 10 (minimatch default export); axe covers label association in E2E.
      'jsx-a11y/label-has-associated-control': 'off',
    },
  },
  {
    files: [
      'apps/web/src/**/*.{ts,tsx,astro}',
      'packages/ui/src/**/*.{ts,tsx}',
    ],
    plugins: { 'fa-a11y': faA11y },
    rules: {
      'fa-a11y/prefer-accessible-muted-text': 'error',
      'fa-a11y/no-adhoc-violet-metric-blocks': 'error',
      'fa-a11y/no-violet-in-ui-primitives': 'error',
    },
  },
  {
    files: ['**/*.astro'],
    languageOptions: {
      parser: astroParser,
      parserOptions: { parser: tsParser, projectService: false, extraFileExtensions: ['.astro'] },
    },
    plugins: { astro: astroPlugin },
    rules: {
      ...(astroPlugin.configs.recommended?.rules || {}),
      'no-useless-assignment': 'off',
    },
  },
  {
    files: [
      '**/*.config.*',
      '**/*.test.*',
      'apps/web/playwright.config.ts',
      'apps/web/tests/**/*.*',
    ],
    languageOptions: {
      parserOptions: {
        projectService: false,
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
];
