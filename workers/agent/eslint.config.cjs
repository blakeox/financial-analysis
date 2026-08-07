const tsParser = require('@typescript-eslint/parser');
const globalsLib = require('globals');

module.exports = [
  ...require('../../eslint.config.cjs'),
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globalsLib.browser,
        ...globalsLib.worker,
        ExecutionContext: 'readonly',
        Fetcher: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off',
    },
  },
];
