import { test, expect } from '@playwright/test';

// Basic smoke tests for ChatPanel overlay behavior and layering vs navbar
test.describe('ChatPanel overlay and interactions', () => {
  test('opens, closes with click and Escape, and does not block nav when closed', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/');

    // Optionally ensure page loaded by checking title text
    await expect(page).toHaveTitle(/Financial Analysis/i);

    // Open chat via launcher button
    const launcher = page.getByRole('button', { name: /chat/i });
    await expect(launcher).toBeVisible();
    await expect(launcher).toHaveAttribute('data-hydrated', 'true');
    await launcher.click();

    // Scrim should be visible (opacity-100) and panel translated in
    const scrim = page.getByTestId('chat-scrim');
    const panel = page.getByRole('dialog', { name: /chat assistant/i });
    // Panel should appear once hydrated launcher opens it
    await expect(panel).toBeVisible();

    // Close by clicking scrim (preferred). If not found, use the Close button.
    const scrimCount = await scrim.count();
    if (scrimCount > 0) {
      await scrim.click({ position: { x: 10, y: 10 } });
    } else {
      await page.getByRole('button', { name: /close/i }).click();
    }
    await expect(panel).toBeHidden();

    // Re-open and close with Escape
    await launcher.click();
    await expect(panel).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();

    // When closed, navbar menu button should be clickable (mobile) or links (desktop)
    if (isMobile) {
      const menuButton = page.getByRole('button', { name: /open mobile menu/i });
      await expect(menuButton).toBeVisible();
      await menuButton.click();
      const mobilePanel = page.locator('#mobile-nav-panel');
      await expect(mobilePanel).toBeVisible();
    } else {
      const modelsLink = page.getByRole('link', { name: /models/i }).first();
      await expect(modelsLink).toBeVisible();
      await modelsLink.click();
      await expect(page).toHaveURL(/\/models$/);
    }
  });
});
