// Provide package-specific TS parser settings, then reuse root config
const tsParser = require('@typescript-eslint/parser');

module.exports = [
	// Load root config first
	...require('../../eslint.config.cjs'),
	// Then override parser options for this package (non-test files only)
	{
		files: ['**/*.ts', '**/*.tsx'],
		ignores: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
				project: [__dirname + '/tsconfig.json'],
				tsconfigRootDir: __dirname,
			},
		},
	},
];
