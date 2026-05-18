import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** Routes gated in PR smoke — keep this list green in CI. */
const smokePaths = [
  '/',
  '/models',
  '/ebitda-forecasting',
  '/journey',
  '/agent',
  '/analysis',
  '/calculator/amortization',
  '/lease-analysis',
];

test.describe('Accessibility smoke', () => {
  for (const path of smokePaths) {
    test(`no a11y violations on ${path}`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.ok(), `expected ${path} to return 2xx`).toBeTruthy();
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }
});
