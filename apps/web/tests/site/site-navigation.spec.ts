import { test, expect } from '@playwright/test';

test.describe('Site navigation contract', () => {
  test('desktop nav exposes the current public site routes', async ({ page }) => {
    await page.goto('/');

    const desktopNav = page.locator('[data-testid="nav-desktop"]');
    await expect(desktopNav).toBeVisible();
    await expect(desktopNav.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    await expect(desktopNav.getByRole('link', { name: 'Models' })).toHaveAttribute(
      'href',
      '/models'
    );
    await expect(desktopNav.getByRole('link', { name: 'Journey' })).toHaveAttribute(
      'href',
      '/journey'
    );
    await expect(desktopNav.getByRole('link', { name: 'Agent' })).toHaveAttribute('href', '/agent');
    await expect(desktopNav.getByRole('link', { name: 'Developers' })).toHaveAttribute(
      'href',
      '/developers'
    );
    await expect(desktopNav.getByRole('link', { name: 'Status' })).toHaveAttribute(
      'href',
      '/status'
    );
  });

  test('homepage CTA leads to the Fanalyx agent and pricing stays reachable', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'Try Fanalyx Free' }).first().click();
    await expect(page).toHaveURL(/\/agent\/?$/);
    await page.goBack();
    await page.getByRole('link', { name: 'Get Started Free' }).first().click();
    await expect(page).toHaveURL(/\/agent\/?$/);
    await page.goBack();
    await page.locator('[data-testid="nav-desktop"]').getByRole('link', { name: 'Agent' }).click();
    await expect(page).toHaveURL(/\/agent\/?$/);
    await page.goBack();
    await page
      .locator('[data-testid="nav-desktop"]')
      .getByRole('link', { name: 'Developers' })
      .click();
    await expect(page).toHaveURL(/\/developers\/?$/);
  });

  test('pricing stays reachable from the homepage footer', async ({ page }) => {
    await page.goto('/');

    await page.locator('footer').getByRole('link', { name: 'Pricing' }).click();
    await expect(page).toHaveURL(/\/pricing\/?$/);
    await expect(
      page.getByRole('heading', { level: 1, name: /Simple, Transparent Pricing/i })
    ).toBeVisible();
  });

  test('status link navigates directly to the current status page', async ({ page }) => {
    await page.goto('/models');

    await page.locator('[data-testid="nav-desktop"]').getByRole('link', { name: 'Status' }).click();
    await expect(page).toHaveURL(/\/status\/?$/);
    await expect(page.getByRole('heading', { level: 1, name: /System Status/i })).toBeVisible();
  });
});
