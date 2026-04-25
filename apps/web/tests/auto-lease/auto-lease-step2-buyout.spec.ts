import { expect, test } from '@playwright/test';

import {
  STEP_PATHS,
  clearAutoLeaseState,
  expectStoredStepFields,
  gotoAutoLeasePage,
  seedAutoLeaseState,
} from './helpers';

test.describe('Auto lease lease-vs-buyout contract', () => {
  test.beforeEach(async ({ page }) => {
    await clearAutoLeaseState(page);
  });

  test('pre-fills from the lease profile and renders comparison results without sleeps', async ({
    page,
  }) => {
    await seedAutoLeaseState(page, {
      currentStepOrder: 1,
      collectedData: {
        'lease-profile': {
          monthlyPayment: '425',
          monthsRemaining: '8',
          residualValue: '19500',
          dispositionFee: '395',
        },
      },
    });

    await gotoAutoLeasePage(page, STEP_PATHS.leaseVsBuyout, 'Buyout Math & Equity Check');
    await expect(page.locator('#lease-buyout-status')).toHaveText('Pre-filled from lease profile');
    await expect(page.locator('[name="remainingPayments"]')).toHaveValue('3400');
    await expect(page.locator('[name="buyoutAmount"]')).toHaveValue('19500');

    await page.locator('[name="salesTaxRate"]').fill('8');
    await page.locator('[name="fees"]').fill('300');
    await page.locator('[name="apr"]').fill('5.9');
    await page.locator('[name="loanTermMonths"]').fill('48');
    await page.locator('[name="expectedValueNow"]').fill('22000');
    await page.locator('[name="expectedValueFuture"]').fill('20000');
    await page.locator('[name="tradeInValue"]').fill('20500');
    await page.locator('[name="privateSaleValue"]').fill('22000');
    await page.locator('[name="instantOfferValue"]').fill('19800');
    await page.getByRole('button', { name: 'Save Numbers' }).click();

    await expect(page.locator('#lease-buyout-status')).toHaveText('Saved ✓');
    await expect(page.locator('#lease-buyout-results')).toBeVisible();
    await expect(page.locator('#buyoutSummary')).toContainText('/mo');
    await expect(page.locator('#leaseCostSummary')).toContainText('$3,795');
    await expect(page.locator('#equitySummary')).toContainText('Best: private sale');

    await expectStoredStepFields(page, 'lease-vs-buyout', {
      buyoutAmount: '19500',
      salesTaxRate: '8',
      fees: '300',
      apr: '5.9',
      loanTermMonths: '48',
      expectedValueNow: '22000',
      expectedValueFuture: '20000',
      tradeInValue: '20500',
      privateSaleValue: '22000',
      instantOfferValue: '19800',
    });
  });
});
