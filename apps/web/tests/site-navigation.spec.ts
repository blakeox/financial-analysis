import { test, expect } from '@playwright/test';

// High-level navigation flows using visible CTAs (not nav appearance/behavior)

test.describe('Site navigation flow', () => {
  test('Home → Models → Analysis → Status via CTAs', async ({ page }) => {
    // Home
    await page.goto('/');
    await expect(page).toHaveTitle(/Financial Analysis/i);

  // Click Explore Models CTA (unique hero button by accessible name)
  const exploreModels = page.getByRole('link', { name: /Explore Models/i });
  await expect(exploreModels).toBeVisible();
  await exploreModels.click();

    // Models
    await expect(page).toHaveURL(/\/models$/);
    await expect(page.locator('h1')).toContainText(/Financial Models/i);

    // Click Analyze Loan (amortization) CTA
    const analyzeLoan = page.locator('a[href^="/amortization"], a[href^="/analysis"]').first();
    await expect(analyzeLoan).toBeVisible();
    await analyzeLoan.click();

    // Analysis
    await expect(page).toHaveURL(/\/(analysis|amortization)/);
    await expect(page.locator('#analysis-form')).toBeVisible();

    // Navigate to Status via location bar or a direct link if present
    await page.goto('/status');
    await expect(page).toHaveURL(/\/status$/);
    await expect(page.locator('h1')).toContainText(/Status|System Status/i);
  });
});
