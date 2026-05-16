import { expect, test } from '@playwright/test';

test.describe('Status page with mocked storage states', () => {
  test.fixme('shows OK then switches to Locked when test events fire', async ({ page }) => {
    await page.goto('/status');
    await page.waitForLoadState('load');

    await expect(page.getByRole('heading', { name: /System Status/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /R2 Storage/i })).toBeVisible();

    await page.waitForFunction(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return Boolean((window as any).__FA_STORAGE_TEST_READY__);
    }, { timeout: 10000 });

    const sendMockUpdate = async (payload: Record<string, unknown>, delay = 0) => {
      await page.evaluate(
        ({ data, delayMs }) => {
          const dispatch = () => {
            window.dispatchEvent(new CustomEvent('__FA_STORAGE_TEST_UPDATE__', { detail: data }));
          };
          if (delayMs > 0) {
            setTimeout(dispatch, delayMs);
          } else {
            dispatch();
          }
        },
        { data: payload, delayMs: delay }
      );
    };

    const okPayload = {
      usedBytes: 10 * 1024 * 1024,
      softLimit: 100 * 1024 * 1024,
      hardLimit: 200 * 1024 * 1024,
      maxObjectSize: 50 * 1024 * 1024,
      locked: false,
      timestamp: new Date().toISOString(),
    };

    const lockedPayload = {
      usedBytes: 210 * 1024 * 1024,
      softLimit: 100 * 1024 * 1024,
      hardLimit: 200 * 1024 * 1024,
      maxObjectSize: 50 * 1024 * 1024,
      locked: true,
      timestamp: new Date().toISOString(),
    };

    await sendMockUpdate(okPayload);
    await expect(page.getByTestId('storage-status-value')).toHaveText('OK', { timeout: 5000 });
    await expect(page.getByTestId('storage-locked-badge')).toBeHidden({ timeout: 5000 });

    await sendMockUpdate(lockedPayload, 150);
    await expect(page.getByTestId('storage-status-value')).toHaveText('Locked', { timeout: 5000 });
    await expect(page.getByTestId('storage-locked-badge')).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText(/Uploads are temporarily disabled due to storage limits/i)
    ).toBeVisible();
  });
});
