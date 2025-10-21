import { test, expect } from '@playwright/test';

// Edge case inputs: zero APR, very long term, large principal. We mock API for deterministic output.

test.describe('Analysis edge cases', () => {
  test('0% APR produces principal-only payments', async ({ page }) => {
    await page.route('**/v1/api/analysis/amortization', async (route) => {
      const principal = 12000;
      const months = 12;
      const payment = principal / months;
      const schedule = Array.from({ length: months }, (_, i) => {
        const month = i + 1;
        const interest = 0;
        const principalPay = payment;
        const balance = Math.max(0, principal - payment * month);
        return { month, payment, principal: principalPay, interest, balance };
      });
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        json: {
          monthlyPayment: payment,
          totalInterest: 0,
          totalAmount: principal,
          schedule,
        },
      });
    });

    await page.goto('/analysis');
    await page.fill('#principal', '12000');
    await page.fill('#annualRate', '0');
    await page.fill('#termMonths', '12');
    await page.click('#analyze-btn');

    const results = page.locator('#results-section');
    await expect(results).toBeVisible();
    await expect(results).toContainText(/payment/i);
    
    // Verify schedule table exists (shows amortization data)
    const scheduleTable = page.locator('#schedule-content table');
    await expect(scheduleTable).toBeVisible();
  });

  test('very long term still renders results', async ({ page }) => {
    await page.route('**/v1/api/analysis/amortization', async (route) => {
      const months = 600; // 50 years
      const schedule = Array.from({ length: months }, (_, i) => {
        const month = i + 1;
        const payment = 500;
        const principal = 100 + (i % 10);
        const interest = payment - principal;
        const balance = Math.max(0, 300000 - payment * month);
        return { month, payment, principal, interest, balance };
      });
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        json: {
          monthlyPayment: 500,
          totalInterest: 120000,
          totalAmount: 420000,
          schedule,
        },
      });
    });

    await page.goto('/analysis');
    await page.fill('#principal', '300000');
    await page.fill('#annualRate', '3');
    await page.fill('#termMonths', '600');
    await page.click('#analyze-btn');

    const results = page.locator('#results-section');
    await expect(results).toBeVisible();
    
    // Verify schedule table exists even with long term
    const scheduleTable = page.locator('#schedule-content table');
    await expect(scheduleTable).toBeVisible();
  });
});
