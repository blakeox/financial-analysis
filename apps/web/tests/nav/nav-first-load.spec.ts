import { test, expect } from '@playwright/test';

// Repro bug: navbar desktop links hidden until hard refresh
// This asserts the desktop nav is visible on first load at >=768px

test.describe('Navbar first-load visibility', () => {
  test('desktop nav visible on initial paint at >=md', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto('/', { waitUntil: 'networkidle' });
    const nav = page.locator('#site-nav .desktop-nav');
    await expect(nav).toBeVisible();
    // Also ensure at least one link is visible
    const firstLink = page.locator('#site-nav .desktop-nav a').first();
    await expect(firstLink).toBeVisible();
  });
});
