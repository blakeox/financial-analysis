import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const paths = ['/', '/models', '/analysis'];

test.describe('Accessibility', () => {
  for (const path of paths) {
    test(`no a11y violations on ${path}`, async ({ page }) => {
      await page.goto(path);

      // Ensure skip links are focusable
      await page.keyboard.press('Tab');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }
});
