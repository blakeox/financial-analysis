import { expect, test } from '@playwright/test';

/**
 * Ensures error states render when API rejects or returns invalid data.
 */
test.describe('Amortization API error handling', () => {
  test('shows error message on 400/validation error', async ({ page }) => {
    await page.route('**/v1/api/analysis/amortization', async (route) => {
      await route.fulfill({
        status: 400,
        headers: { 'content-type': 'application/json' },
        json: { message: 'Validation failed: principal must be > 0' },
      });
    });

    await page.goto('/analysis');
    await page.fill('#principal', '0');
    await page.fill('#annualRate', '5');
    await page.fill('#termMonths', '360');
    await page.click('#analyze-btn');
  // Ensure client handlers attached and error state can be toggled
  await page.waitForSelector('#analysis-form[data-js-ready="true"]');

    const error = page.locator('#error-state');
    await expect(error).toBeVisible();
    await expect(page.locator('#error-message')).toContainText(/validation/i);

    // Results should remain hidden
    await expect(page.locator('#results-section')).toBeHidden();
  });

  test('shows error message on 500/server error', async ({ page }) => {
    await page.route('**/v1/api/analysis/amortization', async (route) => {
      await route.fulfill({
        status: 500,
        headers: { 'content-type': 'application/json' },
        json: { message: 'Internal Server Error' },
      });
    });

    await page.goto('/analysis');
    await page.fill('#principal', '200000');
    await page.fill('#annualRate', '5');
    await page.fill('#termMonths', '360');
    await page.click('#analyze-btn');

    const error = page.locator('#error-state');
    await expect(error).toBeVisible();
    // Generic message is acceptable
    await expect(page.locator('#error-message')).toBeVisible();

    // Results should remain hidden
    await expect(page.locator('#results-section')).toBeHidden();
  });
});
