// ESLint v9 flat config
const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const astroParser = require('astro-eslint-parser');
const astroPlugin = require('eslint-plugin-astro');
const jsxA11y = require('eslint-plugin-jsx-a11y');
const faA11y = require('./packages/config/eslint-plugin-fa-a11y/index.cjs');

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
      // ESLint 10: engines often use placeholder init before branch-only reassignment
      'no-useless-assignment': 'off',
      'preserve-caught-error': 'error',
    },
  },

  // JSX/TSX accessibility (React components in web + ui)
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: { 'jsx-a11y': jsxA11y },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      // Crashes under ESLint 10 (minimatch default export); axe covers label association in E2E.
      'jsx-a11y/label-has-associated-control': 'off',
    },
  },

  // Accessible text contrast (secondary/muted copy)
  {
    files: [
      'apps/web/src/**/*.{ts,tsx,astro}',
      'packages/ui/src/**/*.{ts,tsx}',
    ],
    plugins: { 'fa-a11y': faA11y },
    rules: {
      'fa-a11y/prefer-accessible-muted-text': 'error',
    },
  },

  // Design-system metric/insight blocks in client scripts
  {
    files: ['apps/web/src/scripts/**/*.ts'],
    ignores: ['apps/web/src/scripts/**/__tests__/**'],
    plugins: { 'fa-a11y': faA11y },
    rules: {
      'fa-a11y/no-adhoc-violet-metric-blocks': 'error',
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
      'no-useless-assignment': 'off',
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
