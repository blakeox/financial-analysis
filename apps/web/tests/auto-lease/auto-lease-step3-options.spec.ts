import { expect, test } from '@playwright/test';

import {
  STEP_PATHS,
  clearAutoLeaseState,
  expectStoredStepFields,
  gotoAutoLeasePage,
} from './helpers';

test.describe('Auto lease replacement-options contract', () => {
  test.beforeEach(async ({ page }) => {
    await clearAutoLeaseState(page);
  });

  test('persists replacement inputs and renders the NPV comparison state', async ({ page }) => {
    await gotoAutoLeasePage(page, STEP_PATHS.replacementOptions, 'New Lease vs Finance vs Cash');

    await page.locator('[name="horizonMonths"]').fill('36');
    await page.locator('[name="annualMiles"]').fill('15000');
    await page.locator('[name="leaseMonthly"]').fill('430');
    await page.locator('[name="leaseDownPayment"]').fill('2000');
    await page.locator('[name="financePrice"]').fill('38000');
    await page.locator('[name="financeDownPayment"]').fill('4000');
    await page.locator('[name="financeApr"]').fill('5.4');
    await page.locator('[name="financeTermMonths"]').fill('60');
    await page.locator('[name="financeResaleValue"]').fill('24000');
    await page.locator('[name="loyaltyBonus"]').fill('500');
    await page.locator('[name="evFederalCredit"]').fill('7500');
    await page.locator('[name="dealerRebate"]').fill('1000');
    await page.locator('[name="discountRate"]').fill('6');
    await page.locator('[name="cashNotOption"]').check();

    await expect(page.locator('[name="cashPrice"]')).toBeDisabled();

    await page.getByRole('button', { name: 'Save Scenario Inputs' }).click();

    await expect(page.locator('#replacement-status')).toHaveText('Saved ✓');
    await expect(page.locator('#replacement-results')).toBeVisible();
    await expect(page.locator('#leaseResult')).toContainText('NPV:');
    await expect(page.locator('#cashResult')).toHaveText('Skipped — marked not an option');
    await expect(page.locator('#optionsRecommendation')).toContainText('lowest NPV cost');

    await expectStoredStepFields(page, 'replacement-options', {
      horizonMonths: '36',
      annualMiles: '15000',
      leaseMonthly: '430',
      leaseDownPayment: '2000',
      financePrice: '38000',
      financeDownPayment: '4000',
      financeApr: '5.4',
      financeTermMonths: '60',
      financeResaleValue: '24000',
      loyaltyBonus: '500',
      evFederalCredit: '7500',
      dealerRebate: '1000',
      discountRate: '6',
      cashNotOption: 'on',
    });
  });
});
