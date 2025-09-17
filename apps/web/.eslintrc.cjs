/**
 * Local ESLint config for the Astro web app.
 * - Disables type-aware linting for Playwright config and tests to avoid TS project include errors
 * - Ensures .astro files use the Astro parser without type-aware project
 */
// @ts-check

module.exports = {
  overrides: [
    {
      files: ['playwright.config.ts', 'tests/**/*.*'],
      parserOptions: {
        // Avoid "ESLint was configured to run using parserOptions.project but the file is not included"
        project: null,
      },
    },
    {
      files: ['**/*.astro'],
      extends: ['plugin:astro/recommended'],
      parser: 'astro-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
        project: null,
        extraFileExtensions: ['.astro'],
      },
    },
  ],
};
