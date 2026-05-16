import { expect, test } from '@playwright/test';

import { STEP_PATHS, clearAutoLeaseState, gotoAutoLeasePage, seedAutoLeaseState } from './helpers';

test.describe('Auto lease decision-review contract', () => {
  test.beforeEach(async ({ page }) => {
    await clearAutoLeaseState(page);
  });

  test('shows placeholders and keeps optional review sections hidden without persisted state', async ({
    page,
  }) => {
    await gotoAutoLeasePage(page, STEP_PATHS.review, 'Decision Review');

    await expect(page.locator('#summary-lease')).toContainText('Gathering details');
    await expect(page.locator('#termination-section')).toBeHidden();
    await expect(page.locator('#exit-section')).toBeHidden();
    await expect(page.locator('#incentives-section')).toBeHidden();
  });

  test('keeps optional review sections hidden when saved values are zero or missing', async ({
    page,
  }) => {
    await seedAutoLeaseState(page, {
      currentStepOrder: 4,
      collectedData: {
        'lease-profile': {
          monthlyPayment: '0',
          monthsRemaining: '0',
          residualValue: '0',
          earlyTerminationFee: '0',
          remainingPaymentsOwed: '0',
          leaseTransferFee: '0',
          excessWearCharges: '0',
          tireCharges: '0',
          bodyDamageEstimate: '0',
        },
        'lease-vs-buyout': {
          buyoutAmount: '18000',
          tradeInValue: '0',
          privateSaleValue: '0',
          instantOfferValue: '',
        },
        'replacement-options': {
          horizonMonths: '36',
          loyaltyBonus: '0',
          evFederalCredit: '0',
          dealerRebate: '',
        },
      },
    });

    await gotoAutoLeasePage(page, STEP_PATHS.review, 'Decision Review');

    await expect(page.locator('#summary-lease')).toContainText('$0');
    await expect(page.locator('#termination-section')).toBeHidden();
    await expect(page.locator('#exit-section')).toBeHidden();
    await expect(page.locator('#incentives-section')).toBeHidden();
  });
});
