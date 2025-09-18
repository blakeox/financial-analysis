import { expect, test } from '@playwright/test';

// Basic homepage test
test('homepage loads and displays site title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Financial Analysis/i);
  await expect(page.locator('#site-nav')).toContainText(/Financial Analysis/i);
});

// Navigation test
test('navigation links work', async ({ page }) => {
  await page.goto('/');
  const header = page.locator('#site-nav');
  await expect(header).toBeVisible();
  await header.locator('.desktop-nav a', { hasText: 'Models' }).first().click();
  await expect(page).toHaveURL(/\/models/);
  await expect(page.locator('main')).toContainText(/Models/i);

  await header.locator('.desktop-nav a', { hasText: 'Analysis' }).first().click();
  await expect(page).toHaveURL(/\/analysis/);
  await expect(page.locator('main')).toContainText(/Analysis/i);
});

// Analysis flow test (basic presence)
test('analysis page loads and form is present', async ({ page }) => {
  await page.goto('/analysis');
  await expect(page.locator('form')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeVisible();
});
