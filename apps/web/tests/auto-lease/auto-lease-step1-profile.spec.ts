import { expect, test } from '@playwright/test';

import {
  STEP_PATHS,
  clearAutoLeaseState,
  expectStoredStepFields,
  gotoAutoLeasePage,
} from './helpers';

test.describe('Auto lease lease-profile contract', () => {
  test.beforeEach(async ({ page }) => {
    await clearAutoLeaseState(page);
  });

  test('autosaves lease-profile inputs and restores them after reload', async ({ page }) => {
    await gotoAutoLeasePage(page, STEP_PATHS.leaseProfile, 'Lease Profile');

    await page.locator('[name="monthlyPayment"]').fill('425');
    await page.locator('[name="monthsRemaining"]').fill('8');
    await page.locator('[name="residualValue"]').fill('19500');
    await page.locator('[name="currentMileage"]').fill('28500');
    await page.locator('[name="notes"]').fill('Need AWD before winter');
    await page.getByRole('heading', { level: 1, name: 'Lease Profile' }).click();

    await expectStoredStepFields(page, 'lease-profile', {
      monthlyPayment: '425',
      monthsRemaining: '8',
      residualValue: '19500',
      currentMileage: '28500',
      notes: 'Need AWD before winter',
    });

    await page.reload();
    await expect(page.locator('#lease-profile-status')).toHaveText('Loaded from last session');
    await expect(page.locator('[name="monthlyPayment"]')).toHaveValue('425');
    await expect(page.locator('[name="monthsRemaining"]')).toHaveValue('8');
    await expect(page.locator('[name="residualValue"]')).toHaveValue('19500');
    await expect(page.locator('[name="currentMileage"]')).toHaveValue('28500');
    await expect(page.locator('[name="notes"]')).toHaveValue('Need AWD before winter');
  });
});
