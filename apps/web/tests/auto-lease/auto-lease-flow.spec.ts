import { expect, test } from '@playwright/test';

import {
  JOURNEY_URL,
  STEP_PATHS,
  clearAutoLeaseState,
  expectStoredStepFields,
  goToNextStep,
  gotoAutoLeasePage,
} from './helpers';

test.describe('Auto lease journey flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearAutoLeaseState(page);
  });

  test('moves through each step via route changes and renders the persisted review state', async ({
    page,
  }) => {
    await gotoAutoLeasePage(page, JOURNEY_URL, 'Auto Lease Decision');
    await expect(page.locator('[href*="/journey/auto-lease-decision/step/"]')).toHaveCount(4);

    await gotoAutoLeasePage(page, STEP_PATHS.leaseProfile, 'Lease Profile');
    await page.locator('[name="monthlyPayment"]').fill('425');
    await page.locator('[name="monthsRemaining"]').fill('8');
    await page.locator('[name="residualValue"]').fill('19500');
    await page.locator('[name="earlyTerminationFee"]').fill('450');
    await page.locator('[name="excessWearCharges"]').fill('400');
    await page.getByRole('button', { name: 'Save Lease Profile' }).click();

    await expect(page.locator('#lease-profile-status')).toHaveText('Saved ✓');
    await expectStoredStepFields(page, 'lease-profile', {
      monthlyPayment: '425',
      monthsRemaining: '8',
      residualValue: '19500',
      earlyTerminationFee: '450',
      excessWearCharges: '400',
    });

    await goToNextStep(page, STEP_PATHS.leaseVsBuyout);
    await expect(page.locator('#lease-buyout-status')).toHaveText('Pre-filled from lease profile');
    await expect(page.locator('[name="buyoutAmount"]')).toHaveValue('19500');
    await expect(page.locator('[name="remainingPayments"]')).toHaveValue('3400');

    await page.locator('[name="salesTaxRate"]').fill('8');
    await page.locator('[name="fees"]').fill('300');
    await page.locator('[name="apr"]').fill('5.9');
    await page.locator('[name="loanTermMonths"]').fill('48');
    await page.locator('[name="expectedValueNow"]').fill('22000');
    await page.locator('[name="expectedValueFuture"]').fill('20000');
    await page.locator('[name="tradeInValue"]').fill('20500');
    await page.locator('[name="privateSaleValue"]').fill('22000');
    await page.locator('[name="instantOfferValue"]').fill('20000');
    await page.getByRole('button', { name: 'Save Numbers' }).click();

    await expect(page.locator('#lease-buyout-results')).toBeVisible();
    await expect(page.locator('#equitySummary')).toContainText('Best: private sale');
    await expectStoredStepFields(page, 'lease-vs-buyout', {
      buyoutAmount: '19500',
      salesTaxRate: '8',
      fees: '300',
      apr: '5.9',
      loanTermMonths: '48',
      expectedValueNow: '22000',
      expectedValueFuture: '20000',
      privateSaleValue: '22000',
    });

    await goToNextStep(page, STEP_PATHS.replacementOptions);
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
    await page.getByRole('button', { name: 'Save Scenario Inputs' }).click();

    await expect(page.locator('#replacement-results')).toBeVisible();
    await expect(page.locator('#leaseResult')).toContainText('NPV:');
    await expectStoredStepFields(page, 'replacement-options', {
      horizonMonths: '36',
      annualMiles: '15000',
      financePrice: '38000',
      financeDownPayment: '4000',
      financeApr: '5.4',
      financeTermMonths: '60',
      financeResaleValue: '24000',
      loyaltyBonus: '500',
      evFederalCredit: '7500',
      dealerRebate: '1000',
      discountRate: '6',
    });

    await goToNextStep(page, STEP_PATHS.review);
    await expect(page.locator('#summary-lease')).toContainText('$425');
    await expect(page.locator('#summary-buyout')).toContainText('$19,500');
    await expect(page.locator('#summary-options')).toContainText('NPV at 6% discount');
    await expect(page.locator('#termination-section')).toBeVisible();
    await expect(page.locator('#termination-section')).toContainText('$450');
    await expect(page.locator('#termination-section')).toContainText('$400');
    await expect(page.locator('#exit-section')).toBeVisible();
    await expect(page.locator('#exit-section')).toContainText('$22,000');
    await expect(page.locator('#exit-recommendation')).toContainText('Best exit: private sale');
    await expect(page.locator('#incentives-section')).toBeVisible();
    await expect(page.locator('#incentives-total')).toContainText('$9,000');
    await expect(page.locator('#chat-prompt')).toContainText('"scenario": "auto-lease-decision"');
  });
});
