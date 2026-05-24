import { test } from '@playwright/test';
import { buildA11yAllCalculatorPaths } from './smoke-routes';
import { expectNoA11yViolations } from './a11y-helpers';

/**
 * Full calculator catalog contrast + a11y sweep.
 * Run via: cd apps/web && pnpm test:e2e:a11y
 */
const calculatorPaths = buildA11yAllCalculatorPaths();

test.describe('Accessibility — all calculators', () => {
  for (const path of calculatorPaths) {
    test(`no a11y violations on ${path}`, async ({ page }) => {
      await expectNoA11yViolations(page, path);
    });
  }
});
