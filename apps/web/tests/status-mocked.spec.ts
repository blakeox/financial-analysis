import { expect, test } from '@playwright/test';

test.describe('Status page with mocked storage states', () => {
  test('shows OK then switches to Locked on refresh', async ({ page }) => {
    // Intentionally minimal logging; keep test output clean
    // Override setInterval refresh to a shorter interval and requestIdleCallback for Astro client:idle
    await page.addInitScript(() => {
      const origSetInterval = window.setInterval;
      // Speed up any 30000ms intervals by 100x
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__FA_FAST_REFRESH__ = true;
      window.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
        const t = typeof timeout === 'number' && timeout >= 30000 ? 300 : timeout;
        return origSetInterval(handler, t, ...args);
      }) as typeof window.setInterval;

  // Ensure Astro client:idle islands hydrate promptly in tests
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).requestIdleCallback = (cb: (deadline?: unknown) => void) => setTimeout(() => cb(), 0);
    });

    // First response: OK state
    let firstFulfilled = false;
    await page.route('**/v1/storage/usage', async (route) => {
      firstFulfilled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
        },
        body: JSON.stringify({
          usedBytes: 10 * 1024 * 1024,
          softLimit: 100 * 1024 * 1024,
          hardLimit: 200 * 1024 * 1024,
          maxObjectSize: 50 * 1024 * 1024,
          locked: false,
          timestamp: new Date().toISOString(),
        }),
      });
    });

  await page.goto('/status');
  await page.waitForLoadState('domcontentloaded');

    // Headings visible
    await expect(page.getByRole('heading', { name: /System Status/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /R2 Storage/i })).toBeVisible();

    // Card should eventually show OK
    await expect(page.getByText('Storage Usage')).toBeVisible();
    // Ensure the first mocked call was hit
    await expect.poll(async () => firstFulfilled ? 'yes' : 'no', { timeout: 5000 }).toBe('yes');
    await expect.poll(async () => {
      const text = await page.getByTestId('storage-status-value').textContent();
      return text?.trim();
    }, { timeout: 10000 }).toBe('OK');

    // Update route to Locked on next call
    let lockedFulfilled = false;
    await page.unroute('**/v1/storage/usage');
    await page.route('**/v1/storage/usage', async (route) => {
      lockedFulfilled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
        },
        body: JSON.stringify({
          usedBytes: 210 * 1024 * 1024,
          softLimit: 100 * 1024 * 1024,
          hardLimit: 200 * 1024 * 1024,
          maxObjectSize: 50 * 1024 * 1024,
          locked: true,
          timestamp: new Date().toISOString(),
        }),
      });
    });

    // Wait for the fast refresh to occur and assert Locked state appears
    await expect.poll(async () => {
      const text = await page.getByTestId('storage-status-value').textContent();
      return text?.trim();
    }, { timeout: 10000 }).toBe('Locked');
    await expect(page.getByTestId('storage-locked-badge')).toBeVisible();

    // Also the red advisory text should be present
    await expect(
      page.getByText(/Uploads are temporarily disabled due to storage limits/i)
    ).toBeVisible();

    // Ensure the second mocked call was exercised
    expect(lockedFulfilled).toBeTruthy();
  });
});
