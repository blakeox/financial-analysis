const tsParser = require('@typescript-eslint/parser');

module.exports = [
	...require('../../eslint.config.cjs'),
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
