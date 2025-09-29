import { test, expect } from '@playwright/test';

// Runs against the workers-dev stack (web worker 8788 with dev proxy -> API 8787)
// Validates error handling on invalid input. The UI performs client-side validation; if submission
// occurs, the API should reject with 400 and the UI should show an error state.

test.describe('Amortization (dev proxy error)', () => {
  test('invalid input shows error without successful results', async ({ page }) => {
    await page.goto('/analysis');
    await page.waitForSelector('#analysis-form[data-js-ready="true"]');

    // Enter invalid values (negative principal) that should be rejected
    await page.fill('#principal', '-100');
    await page.fill('#annualRate', '5');
    await page.fill('#termMonths', '360');

    // Try submit and capture any API request; it may not be sent if client blocks.
    // Use a short timeout so we don't hang the test if no request is issued.
    const waitForPost = page
      .waitForResponse((res) => res.url().includes('/v1/api/analysis/amortization'), {
        timeout: 1500,
      })
      .catch(() => null);

    await page.click('#analyze-btn');
    const maybeResponse = await waitForPost;

    // If a response exists, it should be an error (>=400) and carry the dev-proxy header
    if (maybeResponse) {
      expect(maybeResponse.status()).toBeGreaterThanOrEqual(400);
      const hdr = await maybeResponse.headerValue('X-Dev-Proxy');
      expect(hdr === null || hdr === 'web->api').toBeTruthy();
    }

    // Error state should be visible; results hidden
    await expect(page.locator('#error-state')).toBeVisible();
    await expect(page.locator('#results-section')).toBeHidden();
  });
});
