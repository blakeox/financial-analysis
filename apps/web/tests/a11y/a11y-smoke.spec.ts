import { expect, test } from '@playwright/test';
import { buildA11ySmokePaths } from './smoke-routes';
import { expectNoA11yViolations, expectNoColorContrastViolations } from './a11y-helpers';

const smokePaths = buildA11ySmokePaths();

test.describe('Accessibility smoke', () => {
  for (const path of smokePaths) {
    test(`no a11y violations on ${path}`, async ({ page }) => {
      await expectNoA11yViolations(page, path);
    });
  }

  test('legacy amortization route redirects to the canonical calculator', async ({ page }) => {
    await page.goto('/amortization');
    await expect(page).toHaveURL(/\/calculator\/amortization\/?$/);
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('color contrast rule is enabled on home', async ({ page }) => {
    await expectNoColorContrastViolations(page, '/');
  });

  test('color contrast on representative calculator', async ({ page }) => {
    await expectNoColorContrastViolations(page, '/calculator/amortization');
  });
});
