import { expect, test } from '@playwright/test';

test.describe('Navbar core contracts', () => {
  test('desktop nav exposes the primary routes and updates the active link on navigation', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');

    const nav = page.locator('#site-nav');
    await expect(nav).toBeVisible();
    await expect(page.getByRole('link', { name: 'Home' }).first()).toBeVisible();

    const modelsLink = nav.locator('.desktop-nav a[href="/models"]');
    await expect(modelsLink).toBeVisible();
    await expect(modelsLink).not.toHaveAttribute('aria-current', 'page');

    await modelsLink.click();
    await expect(page).toHaveURL(/\/models\/?$/);

    const activeModelsLink = page.locator('#site-nav .desktop-nav a[href="/models"]');
    await expect(activeModelsLink).toHaveAttribute('aria-current', 'page');
    await expect(activeModelsLink).toBeVisible();
  });

  test('mobile menu reveals route links and closes after choosing one', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const toggle = page.getByTestId('nav-mobile-toggle');
    const panel = page.getByTestId('nav-mobile-panel');

    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toHaveClass(/opacity-0/);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toHaveClass(/opacity-100/);

    const modelsLink = panel.locator('a[data-mobile-link][href="/models"]');
    await expect(modelsLink).toBeVisible();
    await modelsLink.click();

    await expect(page).toHaveURL(/\/models\/?$/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toHaveClass(/opacity-0/);
  });
});
