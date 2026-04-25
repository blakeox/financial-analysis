import { test, expect } from '@playwright/test';

test.describe('Navbar hydration sanity', () => {
  test('handlers attach: search overlay and mobile toggle', async ({ page }) => {
    await page.goto('/');

    // Search overlay opens and focuses input
    await page.getByTestId('nav-search-toggle').click();
    const overlay = page.getByTestId('nav-search-overlay');
    await expect(overlay).toBeVisible();
    await expect(page.locator('#search-input')).toBeFocused();

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(overlay).toBeHidden();

    // Mobile toggle only under small viewport
    await page.setViewportSize({ width: 390, height: 844 });
    const toggle = page.getByTestId('nav-mobile-toggle');
    const panel = page.getByTestId('nav-mobile-panel');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toHaveClass(/opacity-100/);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).not.toHaveClass(/opacity-100/);
  });
});
