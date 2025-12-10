import { expect, test } from '@playwright/test';

test.describe('Loan Amortization quick start', () => {
  test('submits form and renders results', async ({ page }) => {
    // Mock the API to avoid depending on the API worker during preview
    await page.route('**/v1/api/analysis/amortization', async (route) => {
      const months = 12;
      const schedule = Array.from({ length: months }, (_, i) => {
        const month = i + 1;
        const payment = 1000;
        const principal = 700 + i * 5;
        const interest = payment - principal;
        const balance = Math.max(0, 12000 - payment * month);
        return { month, payment, principal, interest, balance };
      });
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        json: {
          monthlyPayment: 1000,
          totalInterest: 36000,
          totalAmount: 120000,
          schedule,
        },
      });
    });
    // Visit the alias route and fill the form explicitly
    await page.goto('/amortization');

    await page.fill('#principal', '250000');
    await page.fill('#annualRate', '5');
    await page.fill('#termMonths', '360');

    await page.click('#analyze-btn');

    // Wait for results (loading spinner may be skipped if render is fast)
    const results = page.locator('#results-section');
    await expect(results).toBeVisible({ timeout: 20_000 });

    // Expect the results section to contain payment information
    // The page may show results in various formats (table, summary cards, etc.)
    await expect(results).toContainText(/payment|month|principal|interest/i);
    await expect(results).toContainText('$');

    // Smoke-check that payment table or schedule is visible
    const tableOrChart = results.locator('table, canvas, svg');
    await expect(tableOrChart.first()).toBeVisible();
  });
});
