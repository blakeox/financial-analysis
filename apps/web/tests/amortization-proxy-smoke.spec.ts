import { test, expect } from '@playwright/test';

test.describe('Amortization (dev proxy smoke)', () => {
  test('submits and renders results via /v1 proxy', async ({ page }) => {
    // Go to analysis page
    await page.goto('/analysis');

    // Wait for JS handlers attached
    await page.waitForSelector('#analysis-form[data-js-ready="true"]');

    // Fill form
    await page.fill('#principal', '100000');
    await page.fill('#annualRate', '5'); // percent
    await page.fill('#termMonths', '360');

    // Intercept the API call to verify it's hitting the expected path and returns 200
    const [response] = await Promise.all([
      page.waitForResponse((res) =>
        res.url().includes('/v1/api/analysis/amortization') && res.status() === 200
      ),
      page.click('#analyze-btn'),
    ]);

    expect(response.ok()).toBeTruthy();
    // Prove it was served via the dev proxy in the web worker
    expect(await response.headerValue('X-Dev-Proxy')).toBe('web->api');

    // Results should become visible
    await expect(page.locator('#results-section')).toBeVisible();
    await expect(page.locator('#results-section')).toContainText(/Monthly payment/i);
  });
});
