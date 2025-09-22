import { expect, test } from '@playwright/test';
import { gotoPath } from './utils/nav';

test.describe('Navbar mobile menu stability', () => {
  test('open/close does not flash wrong state', async ({ page }) => {
    // Emulate mobile viewport to force mobile behavior
    await page.setViewportSize({ width: 390, height: 844 });

    await gotoPath(page, '/');

    const toggle = page.locator('[data-nav-toggle]');
    const panel = page.locator('[data-mobile-panel]');

    await expect(toggle).toBeVisible();
    await expect(panel).toBeVisible();

    // Initial state: hidden
    await expect(panel).toHaveClass(/pointer-events-none/);
    await expect(panel).toHaveClass(/opacity-0/);
    // Ensure it starts offset above
    await expect(panel).toHaveClass(/-translate-y-2/);

    // Open
    await toggle.click();
    // Panel should become interactive and visible
    await expect(panel).not.toHaveClass(/pointer-events-none/);
    await expect(panel).toHaveClass(/opacity-100/);
    await expect(panel).not.toHaveClass(/-translate-y-2/);

    // Close
    await toggle.click();
    await expect(panel).toHaveClass(/pointer-events-none/);
    await expect(panel).toHaveClass(/opacity-0/);
    await expect(panel).toHaveClass(/-translate-y-2/);

    // Rapid toggle to simulate fast user clicks (stress for flash/revert)
    for (let i = 0; i < 3; i++) {
      await toggle.click();
      await page.waitForTimeout(50);
      await toggle.click();
      await page.waitForTimeout(50);
    }

    // Final state should be hidden and offset
    await expect(panel).toHaveClass(/pointer-events-none/);
    await expect(panel).toHaveClass(/opacity-0/);
    await expect(panel).toHaveClass(/-translate-y-2/);
  });
});
