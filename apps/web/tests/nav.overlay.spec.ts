import { test, expect } from '@playwright/test';
import { gotoPath, setViewportDesktop, waitForNavReady } from './utils/nav';

test.describe('Navbar search overlay', () => {
  test('open/close and focus management', async ({ page }) => {
    await setViewportDesktop(page);
    await gotoPath(page, '/');
    await waitForNavReady(page);

    const overlay = page.locator('[data-testid="nav-search-overlay"]');
    // Ensure closed state first
    if (await overlay.isVisible()) {
      // try closing via close button
      const closeBtn = page.locator('[data-testid="nav-search-close"]');
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
      await expect(overlay).toBeHidden();
    }

    await page.click('[data-testid="nav-search-toggle"]');
    await expect(overlay).toBeVisible();
    await expect(page.locator('#search-input')).toBeFocused();

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(overlay).toBeHidden();

    // Open again and close via close button
    await page.click('[data-testid="nav-search-toggle"]');
    await expect(overlay).toBeVisible();
    await page.click('[data-testid="nav-search-close"]');
    await expect(overlay).toBeHidden();
  });
});
