import { test, expect } from '@playwright/test';

test.describe('Amortization (dev proxy smoke)', () => {
  test('submits and renders results via /v1 proxy', async ({ page }) => {
    // Go to analysis page
    await page.goto('/analysis');
    
    // Wait for page to load
    await expect(page.locator('#analysis-form')).toBeVisible();

    // Fill form
    await page.fill('#principal', '100000');
    await page.fill('#annualRate', '5'); // percent
    await page.fill('#termMonths', '360');

    // Click analyze and wait for results (placeholder implementation)
    await page.click('#analyze-btn');

    // Results should become visible (currently shows placeholder after 2s)
    const results = page.locator('#results-section');
    await expect(results).toBeVisible({ timeout: 10000 });
    await expect(results).toContainText(/payment|month/i);
  });
});
