import { test, expect } from '@playwright/test';

// Basic stability test for the modern navbar staying visible after initial paint.
// This guards against regression where nav children disappear post-hydration.

test.describe('Navbar visibility', () => {
  test('navbar persists after delay', async ({ page }) => {
    await page.goto('/');

    // Wait for initial network idle / layout settle
    await page.waitForTimeout(300);

    const nav = page.locator('#site-nav');
    await expect(nav).toBeVisible();

    // Capture initial link text content
    const initialLinks = await nav.locator('a').allTextContents();
    expect(initialLinks.length).toBeGreaterThan(0);

    // Wait a bit longer to detect disappearance (existing bug scenario)
    await page.waitForTimeout(1800);

    await expect(nav).toBeVisible();
    const laterLinks = await nav.locator('a').allTextContents();
    expect(laterLinks.length).toBeGreaterThan(0);

    // Ensure at least one overlapping link label remained (not fully replaced with empty)
    const overlap = initialLinks.filter(l => laterLinks.includes(l));
    expect(overlap.length).toBeGreaterThan(0);

    // Height should remain non-trivial
    const height = await nav.evaluate(el => (el as HTMLElement).offsetHeight);
    expect(height).toBeGreaterThan(30);
  });
});
