const tsParser = require('@typescript-eslint/parser');
const baseConfig = require('../../eslint.config.cjs');

module.exports = [
  ...baseConfig,
  // Use the Playwright tsconfig for tests and Playwright config file
  {
    files: ['playwright.config.ts', 'tests/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.playwright.json'],
        projectService: false,
      },
    },
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.json'],
        projectService: false,
      },
    },
  },
];
