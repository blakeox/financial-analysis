import { test, expect } from '@playwright/test';

test.describe('Status page', () => {
  test('renders status content and usage card shell', async ({ page }) => {
    await page.goto('/status');
    await expect(page.locator('h1')).toContainText(/System Status/i);
    await expect(page.locator('main')).toBeVisible();
    // The StorageUsageCard is a client island; assert its container area exists by headings
    await expect(page.getByRole('heading', { level: 2, name: /R2 Storage/i })).toBeVisible();
  });
});
