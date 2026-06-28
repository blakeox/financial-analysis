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

  test('shows typography, chips, forms, and theme toggle', async ({ page }) => {
    await page.goto('/developers/design-system');

    await expect(page.getByRole('heading', { name: 'Typography' })).toBeVisible();
    await expect(page.getByText('Display hero')).toBeVisible();
    await expect(page.locator('.fa-chip-accent').first()).toBeVisible();
    await expect(page.getByLabel('Loan amount')).toBeVisible();
    await expect(page.getByRole('button', { name: /Switch to (light|dark)/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Rail card' })).toBeVisible();
  });
});
