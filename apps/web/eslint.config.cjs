const tsParser = require('@typescript-eslint/parser');

module.exports = [
	// Use the Playwright tsconfig for tests and Playwright config file
	{
		files: ['playwright.config.ts', 'tests/**/*.ts'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
				project: ['./tsconfig.playwright.json'],
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
			},
		},
	},
	...require('../../eslint.config.cjs'),
];
