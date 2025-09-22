import { test, expect } from '@playwright/test';

test.describe('Navbar hydration sanity', () => {
  test('phases present and nav marks ready', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('#site-nav');
    await expect(nav).toBeVisible();

    // dataset phases should appear quickly
    await expect.poll(async () => await page.evaluate(() => {
      const el = document.getElementById('site-nav');
      return !!(el && el.dataset.phaseInitial && el.dataset.phaseRaf);
    })).toBe(true);

    // data-ready="1" should be set shortly after load
    await expect.poll(async () => await page.evaluate(() => {
      return document.getElementById('site-nav')?.getAttribute('data-ready');
    }), { timeout: 2000 }).toBe('1');
  });

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
