// Shared ESLint flat config
const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const astroParser = require('astro-eslint-parser');
const astroPlugin = require('eslint-plugin-astro');

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
    },
  },
  {
    files: ['**/*.astro'],
    languageOptions: {
      parser: astroParser,
      parserOptions: { parser: tsParser, projectService: false, extraFileExtensions: ['.astro'] },
    },
    plugins: { astro: astroPlugin },
    rules: { ...(astroPlugin.configs.recommended?.rules || {}) },
  },
  {
    files: [
      '**/*.config.*',
      '**/*.test.*',
      'apps/web/playwright.config.ts',
      'apps/web/tests/**/*.*',
    ],
    languageOptions: { parserOptions: { projectService: false } },
    rules: {
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
];
