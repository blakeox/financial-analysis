import { expect, test } from '@playwright/test';

test.describe('Site route contract', () => {
  test('home page renders the current hero and primary CTA', async ({ page }) => {
    const response = await page.goto('/');

    expect(response?.ok()).toBeTruthy();
    await expect(page).toHaveURL('/');
    await expect(page).toHaveTitle(/Fanalyx|Financial Analysis/i);
    await expect(page.locator('#site-nav')).toContainText(/Fanalyx/i);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: /Ask anything\.\s*Get clear financial answers\./i,
      })
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Try Fanalyx Free' }).first()).toHaveAttribute(
      'href',
      '/agent'
    );
  });

  test('models page exposes current category and featured model entry points', async ({ page }) => {
    const response = await page.goto('/models');

    expect(response?.ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/models\/?$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Financial Models' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Explore Personal Tools/i })).toHaveAttribute(
      'href',
      '/models/personal'
    );
    await expect(page.getByRole('link', { name: /Explore Business Tools/i })).toHaveAttribute(
      'href',
      '/models/business'
    );

    const leaseAnalysisCard = page.locator('[data-model="Enhanced Lease Analysis"]');
    await expect(leaseAnalysisCard).toContainText(/Enhanced Lease Analysis/i);
    await expect(leaseAnalysisCard.locator('a[href="/lease-analysis"]')).toBeVisible();
  });

  test('analysis route keeps the lease analysis alias contract', async ({ page }) => {
    const response = await page.goto('/analysis');

    expect(response?.ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/analysis\/?$/);
    await expect(
      page.getByRole('heading', { level: 1, name: /Enhanced Lease Analysis/i })
    ).toBeVisible();
    await expect(page.getByText(/Analyze lease vs buy scenarios/i)).toBeVisible();
  });

  test('status page renders current system status content', async ({ page }) => {
    const response = await page.goto('/status');

    expect(response?.ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/status\/?$/);
    await expect(page.getByRole('heading', { level: 1, name: /System Status/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Notes' })).toBeVisible();
    await expect(page.getByText(/Usage refreshes automatically every 30 seconds\./i)).toBeVisible();
  });
});
