const { RuleTester } = require('eslint');
const plugin = require('./index.cjs');

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run('prefer-accessible-muted-text', plugin.rules['prefer-accessible-muted-text'], {
  valid: [
    { code: `<p className="text-slate-600 dark:text-slate-400">ok</p>` },
    { code: `<p className={textColors.muted}>ok</p>` },
    { code: `<p className="dark:text-slate-400">ok</p>` },
  ],
  invalid: [
    {
      code: `<p className="text-slate-400">bad</p>`,
      errors: [{ messageId: 'lightSlate400' }],
    },
    {
      code: `<span className="text-xs text-slate-500">bad</span>`,
      errors: [{ messageId: 'lightSlate500' }],
    },
  ],
});

console.log('fa-a11y ESLint rule tests passed');
