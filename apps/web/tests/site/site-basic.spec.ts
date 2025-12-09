import { test, expect } from '@playwright/test';

// Basic smoke tests for key routes and content

test.describe('Site basic routes', () => {
  test('home page loads with title and header', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Financial Analysis/i);
    await expect(page.locator('#site-nav')).toContainText(/Fanalyx/i);
    await expect(page.locator('main')).toBeVisible();
  });

  test('models page lists models and CTAs', async ({ page }) => {
    await page.goto('/models');
    await expect(page).toHaveTitle(/Financial Models/i);
    await expect(page.locator('h1')).toContainText(/Financial Models/i);
    // Check for at least two model cards
    const cards = page.locator('main .grid > *');
    await expect(await cards.count()).toBeGreaterThan(1);

    // CTAs exist (choose a single element to satisfy strict mode)
    await expect(page.locator('a[href^="/analysis"]').first()).toBeVisible();
    await expect(page.locator('a[href^="/amortization"]').first()).toBeVisible();

    // Verify EBITDA Forecasting model card is present and accessible
    await expect(page.locator('a[href="/ebitda-forecasting"]')).toBeVisible();
    await expect(page.locator('div[data-model="EBITDA Forecasting"]')).toContainText(
      /EBITDA Forecasting/i
    );
  });

  test('analysis page form present', async ({ page }) => {
    await page.goto('/analysis');
    await expect(page.locator('#analysis-form')).toBeVisible();
    await expect(page.locator('#analyze-btn')).toBeVisible();
  });

  test('ebitda-forecasting page loads with dashboard', async ({ page }) => {
    await page.goto('/ebitda-forecasting');
    await expect(page).toHaveTitle(/EBITDA Forecasting/i);
    await expect(page.locator('h1')).toContainText(/EBITDA Forecasting/i);
    await expect(page.locator('main')).toBeVisible();
  });

  test('status page returns content', async ({ page }) => {
    await page.goto('/status');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('body')).toContainText(/Status|OK|Healthy/i);
  });
});
