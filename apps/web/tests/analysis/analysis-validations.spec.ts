import { test, expect } from '@playwright/test';

// Client-side validation and guardrails for the analysis form

test.describe('Analysis input validations', () => {
  test('rejects invalid numbers and enforces min/max', async ({ page }) => {
    await page.goto('/analysis');

    // Empty submit triggers native required
    await page.click('#analyze-btn');
    // Some browsers delay validation bubble; just ensure form still visible
    await expect(page.locator('#analysis-form')).toBeVisible();

    // Invalid principal (negative)
    await page.fill('#principal', '-1');
    await page.fill('#annualRate', '5');
    await page.fill('#termMonths', '360');
    await page.click('#analyze-btn');

    // Expect no results (client will block or server will reject)
    await expect(page.locator('#results-section')).toBeHidden();

    // Fix principal, but invalid rate (> 100)
    await page.fill('#principal', '100000');
    await page.fill('#annualRate', '150');
    await page.click('#analyze-btn');
    await expect(page.locator('#results-section')).toBeHidden();

    // Fix rate, but invalid term (0)
    await page.fill('#annualRate', '5');
    await page.fill('#termMonths', '0');
    await page.click('#analyze-btn');
    await expect(page.locator('#results-section')).toBeHidden();
  });
});
