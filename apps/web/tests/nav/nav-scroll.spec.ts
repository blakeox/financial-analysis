import { test, expect } from '@playwright/test';

test.describe('Navbar scroll behavior', () => {
  test('adds is-scrolled and retains desktop links', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('#site-nav');
    await expect(nav).toBeVisible();
    const initialLinks = await nav.locator('.desktop-nav a').count();

    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(100);
    await expect(nav).toHaveClass(/is-scrolled/);

    const afterLinks = await nav.locator('.desktop-nav a').count();
    expect(afterLinks).toBe(initialLinks);
  });
});
