import { expect, test } from '@playwright/test';

/**
 * Verifies that the analysis page reads query params and optional auto-run.
 */
test.describe('Analysis deep-linking', () => {
  test('prefills from URL and auto-runs when auto=1', async ({ page }) => {
    // Mock amortization API
    await page.route('**/v1/api/analysis/amortization', async (route) => {
      const months = 12;
      const schedule = Array.from({ length: months }, (_, i) => {
        const month = i + 1;
        const payment = 1500;
        const principal = 900 + i * 3;
        const interest = payment - principal;
        const balance = Math.max(0, 18000 - payment * month);
        return { month, payment, principal, interest, balance };
      });
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        json: {
          monthlyPayment: 1500,
          totalInterest: 18000,
          totalAmount: 198000,
          schedule,
        },
      });
    });

    // Prefill & auto-run
    await page.goto('/analysis?principal=350000&annualRate=6.25&termMonths=360&auto=1');

    // Verify inputs are prefilled
    await expect(page.locator('#principal')).toHaveValue('350000');
    await expect(page.locator('#annualRate')).toHaveValue('6.25');
    await expect(page.locator('#termMonths')).toHaveValue('360');

    // Verify results become visible without clicking the analyze button
    const results = page.locator('#results-section');
    await expect(results).toBeVisible();

    // Basic content checks
    await expect(results).toContainText('Monthly payment');
    await expect(results).toContainText('$');
  });
});
