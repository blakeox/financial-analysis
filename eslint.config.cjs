// ESLint v9 flat config
const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const astroParser = require('astro-eslint-parser');
const astroPlugin = require('eslint-plugin-astro');

module.exports = [
  // Base JS recommendations
  js.configs.recommended,

  // TypeScript (type-checked) rules
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        // Let typescript-eslint discover nearest tsconfig automatically
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...(tsPlugin.configs.recommendedTypeChecked?.rules || {}),

      // Local customizations
      // Rely on TypeScript for undefined vars; core rule is not TS-aware
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  },

  // Astro files (non type-aware)
  {
    files: ['**/*.astro'],
    languageOptions: {
      parser: astroParser,
      parserOptions: {
        parser: tsParser,
        projectService: false,
        extraFileExtensions: ['.astro'],
      },
    },
    plugins: {
      astro: astroPlugin,
    },
    rules: {
      ...(astroPlugin.configs.recommended?.rules || {}),
    },
  },

  // Config and test files: turn off type-aware parsing to avoid project errors
  {
    files: [
      '**/*.config.js',
      '**/*.config.cjs',
      '**/*.config.mjs',
      '**/*.config.ts',
      '**/*.test.ts',
      '**/*.test.tsx',
      'apps/web/playwright.config.ts',
      'apps/web/tests/**/*.*',
    ],
    languageOptions: {
      parserOptions: {
        projectService: false,
      },
    },
    rules: {
      // Disable type-aware rules that require parserServices in these files
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/require-await': 'off',
      // Tests often rely on expression-only assertions (e.g., getByText throws)
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
];
