import { test, expect } from '@playwright/test';

test('simple smoke test', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Financial Analysis/);
});