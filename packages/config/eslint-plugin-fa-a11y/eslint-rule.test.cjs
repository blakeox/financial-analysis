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

ruleTester.run('no-adhoc-violet-metric-blocks', plugin.rules['no-adhoc-violet-metric-blocks'], {
  valid: [
    {
      code: `const html = renderMetricCards([{ title: 'A', value: '1', tone: 'violet' }]);`,
      filename: '/repo/apps/web/src/scripts/calculators/example.client.ts',
    },
    {
      code: `const cls = 'bg-violet-500 rounded-full';`,
      filename: '/repo/apps/web/src/scripts/calculators/example.client.ts',
    },
  ],
  invalid: [
    {
      code: `const html = \`<div class="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4"></div>\`;`,
      filename: '/repo/apps/web/src/scripts/calculators/example.client.ts',
      errors: [{ messageId: 'adhocVioletMetric' }],
    },
  ],
});

console.log('fa-a11y no-adhoc-violet-metric-blocks tests passed');

ruleTester.run('no-violet-in-ui-primitives', plugin.rules['no-violet-in-ui-primitives'], {
  valid: [
    {
      code: `export const buttonVariants = { primary: 'fa-button-primary' };`,
      filename: '/repo/packages/ui/src/lib/classNames.ts',
    },
    {
      code: `const cls = 'bg-violet-50';`,
      filename: '/repo/packages/ui/src/components/LeaseAnalysisDashboard.tsx',
    },
  ],
  invalid: [
    {
      code: `export const bad = 'bg-violet-500 text-white';`,
      filename: '/repo/packages/ui/src/lib/classNames.ts',
      errors: [{ messageId: 'violetFreelance' }],
    },
    {
      code: `const x = 'hover:bg-violet-700';`,
      filename: '/repo/packages/ui/src/components/Button.tsx',
      errors: [{ messageId: 'violetFreelance' }],
    },
  ],
});

console.log('fa-a11y no-violet-in-ui-primitives tests passed');
