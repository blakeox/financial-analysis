const tsParser = require('@typescript-eslint/parser');

module.exports = [
	{
		files: ['**/*.ts', '**/*.tsx'],
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
	...require('../../eslint.config.cjs'),
];
