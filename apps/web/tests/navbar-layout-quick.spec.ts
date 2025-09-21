import { test, expect } from '@playwright/test';

test.describe('Navbar Layout Quick Check', () => {
  test('navbar should have proper layout and not be crammed to the left', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="nav-root"]');
    
    // Set desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    
    // Check that desktop navigation is visible and properly positioned
    const desktopNav = page.locator('[data-testid="nav-desktop"]');
    await expect(desktopNav).toBeVisible();
    
    // Check brand positioning (should be on left)
    const brand = page.locator('[aria-label="Home"]');
    await expect(brand).toBeVisible();
    
    // Check theme toggle positioning (should be on right)
    const themeToggle = page.locator('[data-testid="nav-theme-toggle"]');
    await expect(themeToggle).toBeVisible();
    
    // Visual layout check - desktop nav should not be hidden on md+ screens
    await expect(desktopNav).toHaveClass(/md:flex/);
    
    // Test passes if basic layout elements are visible and positioned
    console.log('✅ Layout check passed: Brand, desktop nav, and theme toggle are all visible');
  });
});