import { expect, test } from '@playwright/test';

test.describe('ModernNavBar keyboard shortcuts', () => {
  test('search overlay opens via Cmd/Ctrl+K and closes with Escape', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');

    const overlay = page.locator('#search-overlay');
    await expect(overlay).toBeHidden();

    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+KeyK' : 'Control+KeyK');
    await expect(overlay).toBeVisible();
    await expect(page.locator('#search-input')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(overlay).toBeHidden();
  });
});
