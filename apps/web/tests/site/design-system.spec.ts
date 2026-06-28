import { expect, test } from '@playwright/test';

test.describe('Design system page', () => {
  test('renders both tiers and core primitives', async ({ page }) => {
    await page.goto('/developers/design-system');

    await expect(page.getByRole('heading', { name: 'Fanalyx visual language' })).toBeVisible();
    await expect(page.locator('.fa-button-primary').first()).toBeVisible();
    await expect(page.locator('.fa-callout-info').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Primary' }).first()).toBeVisible();
    await expect(page.getByText('Deterministic engines with audited formulas.')).toBeVisible();
  });
});
