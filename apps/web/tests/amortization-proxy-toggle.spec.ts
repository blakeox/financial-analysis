import { test, expect } from '@playwright/test';

// Runs against the workers-dev stack (web worker 8788 with dev proxy -> API 8787)
// Validates the Monthly/Yearly toggle after a successful proxied submit.

test.describe('Amortization (dev proxy toggle)', () => {
  test('Monthly/Yearly toggle updates chart view', async ({ page }) => {
    await page.goto('/analysis');
    await page.waitForSelector('#analysis-form[data-js-ready="true"]');

    await page.fill('#principal', '250000');
    await page.fill('#annualRate', '6.5');
    await page.fill('#termMonths', '360');

    const [response] = await Promise.all([
      page.waitForResponse((res) =>
        res.url().includes('/v1/api/analysis/amortization') && res.status() === 200
      ),
      page.click('#analyze-btn'),
    ]);

    expect(response.ok()).toBeTruthy();
    expect(await response.headerValue('X-Dev-Proxy')).toBe('web->api');

    // Results visible
    await expect(page.locator('#results-section')).toBeVisible();

    // Chart exists with expected aria-label
    const chart = page.locator('svg[aria-label*="Amortization schedule chart"]');
    await expect(chart).toBeVisible();

    // Toggle to Yearly
    await page.getByRole('button', { name: 'Yearly' }).click();

    // Heuristic: in yearly mode, there should be far fewer bars.
    // We can count rects for principal bars as a proxy.
    const rectsYearly = await chart.locator('rect').count();

    // Toggle back to Monthly
    await page.getByRole('button', { name: 'Monthly' }).click();
    const rectsMonthly = await chart.locator('rect').count();

    expect(rectsMonthly).toBeGreaterThan(rectsYearly);
  });
});
