const tsParser = require('@typescript-eslint/parser');

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
    },
  },
];
