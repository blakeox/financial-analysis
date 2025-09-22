// Reuse shared flat config and add package-local ignores
const base = require('@financial-analysis/config/eslint.config.cjs');

module.exports = [
	...base,
	{
		ignores: [
			'src/**/*.d.ts',
		],
	},
];
