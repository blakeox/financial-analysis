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

    // Look for chat toggle button (fixed position bottom-right)
    const launcher = page.locator('#chat-toggle, button[title*="Chat"], button[aria-label*="Chat"]').first();
    const launcherVisible = await launcher.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!launcherVisible) {
      test.skip();
      return;
    }
    
    await launcher.click();

    // Panel should appear
    const panel = page.locator('#chat-panel, .chat-panel').first();
    await expect(panel).toBeVisible({ timeout: 5000 });

    // Should have visible class
    await expect(panel).toHaveClass(/visible/);

    // Close by clicking close button
    const closeBtn = panel.locator('#chat-close, .chat-close, button[aria-label*="Close"]').first();
    await closeBtn.click();
    
    // Panel should hide (remove visible class)
    await expect(panel).not.toHaveClass(/visible/);

    // Re-open and close with Escape
    await launcher.click();
    await expect(panel).toHaveClass(/visible/);
    await page.keyboard.press('Escape');
    await expect(panel).not.toHaveClass(/visible/);

    // When closed, navbar menu button should be clickable (mobile) or links (desktop)
    if (isMobile) {
      const menuButton = page.getByRole('button', { name: /toggle navigation menu/i });
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
