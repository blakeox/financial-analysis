import { expect, test } from '@playwright/test';

const pagesWithoutSiteGuide = ['/', '/models', '/journey', '/agent'] as const;
const pagesWithSiteGuide = ['/status', '/developers', '/pricing'] as const;

test.describe('Site guide chat surface contracts', () => {
  for (const path of pagesWithoutSiteGuide) {
    test(`does not mount the site guide on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('#chat-toggle')).toHaveCount(0);
      await expect(page.locator('#chat-panel')).toHaveCount(0);
    });
  }

  for (const path of pagesWithSiteGuide) {
    test(`mounts and toggles the site guide on ${path}`, async ({ page }) => {
      await page.goto(path);

      const toggle = page.locator('#chat-toggle');
      const panel = page.locator('#chat-panel');

      await expect(toggle).toBeVisible();
      await expect(panel).toHaveAttribute('aria-hidden', 'true');

      await toggle.click();
      await expect(panel).toHaveClass(/visible/);
      await expect(panel).toHaveAttribute('aria-hidden', 'false');

      await toggle.click();
      await expect(panel).not.toHaveClass(/visible/);
      await expect(panel).toHaveAttribute('aria-hidden', 'true');
    });
  }
});
