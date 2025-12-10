import { test, expect } from '@playwright/test';
import { gotoPath, setViewportMobile, waitForNavReady } from './utils/nav';

test.describe('Navbar mobile menu', () => {
  test('aria-expanded toggles and panel shows/hides', async ({ page }) => {
    await setViewportMobile(page);
    await gotoPath(page, '/');
    await waitForNavReady(page);

    const toggle = page.locator('[data-testid="nav-mobile-toggle"]');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const panel = page.locator('[data-testid="nav-mobile-panel"]');
    await expect(panel).toHaveClass(/opacity-100/);

    // Clicking a mobile link should close the panel
    const firstMobileLink = panel.locator('[data-mobile-link]').first();
    await firstMobileLink.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toHaveClass(/opacity-0/);
  });
});
