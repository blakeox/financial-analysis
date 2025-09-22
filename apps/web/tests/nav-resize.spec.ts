import { test, expect } from '@playwright/test';

test.describe('Navbar responsive persistence', () => {
  test('desktop links survive width shrink and restore', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto('/');
    const nav = page.locator('#site-nav');
    await expect(nav).toBeVisible();
    const initialDesktop = await nav.locator('.desktop-nav a').count();
    if(initialDesktop === 0) test.skip();

    // Shrink to mobile
    await page.setViewportSize({ width: 500, height: 900 });
    await page.waitForTimeout(150);
    // Ensure mobile toggle appears
    await expect(page.locator('#nav-toggle')).toBeVisible();

    // Expand again
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.waitForTimeout(200);
    const restored = await nav.locator('.desktop-nav a').count();
    expect(restored).toBe(initialDesktop);
  });
});
