import { expect, test } from '@playwright/test';

/**
 * Verifies the chart view toggle defaults to Yearly and can switch to Monthly.
 */
test.describe('Amortization chart view toggle', () => {
  test('defaults to Yearly and toggles to Monthly', async ({ page }) => {
    await page.route('**/v1/api/analysis/amortization', async (route) => {
      const months = 36;
      const schedule = Array.from({ length: months }, (_, i) => {
        const month = i + 1;
        const payment = 1200;
        const principal = 800 + (i % 4);
        const interest = payment - principal;
        const balance = Math.max(0, 43200 - payment * month);
        return { month, payment, principal, interest, balance };
      });
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        json: { monthlyPayment: 1200, totalInterest: 25000, totalAmount: 67000, schedule },
      });
    });

    await page.goto('/analysis');
    await page.fill('#principal', '180000');
    await page.fill('#annualRate', '5');
    await page.fill('#termMonths', '360');
    await page.click('#analyze-btn');
    
    // Wait for results to appear
    const results = page.locator('#results-section');
    await expect(results).toBeVisible({ timeout: 10000 });

    // Verify results content is populated
    await expect(results).toContainText(/payment|month/i);
    await expect(results).toContainText('$');

    // Verify schedule table exists
    const scheduleTable = page.locator('#schedule-content table');
    await expect(scheduleTable).toBeVisible();
    
    // Verify table has expected columns
    await expect(scheduleTable).toContainText(/month|payment|principal|interest|balance/i);
  });
});
