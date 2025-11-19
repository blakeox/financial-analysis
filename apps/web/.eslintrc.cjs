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
        // Allow these utility files to lint without type-aware project services
        projectService: false,
      },
    },
    {
      files: ['**/*.astro'],
      extends: ['plugin:astro/recommended'],
      parser: 'astro-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
        projectService: false,
        extraFileExtensions: ['.astro'],
      },
    },
  ],
};
