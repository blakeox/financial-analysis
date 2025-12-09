/**
 * Auto Lease Decision Journey - Step 4: Decision Review
 * Tests data display, section visibility, and chat integration
 */

import { expect, test } from '@playwright/test';

const STORAGE_KEY = 'fanalyx-journey-state-auto-lease-decision';
const JOURNEY_URL = '/journey/auto-lease-decision';

test.describe('Step 4: Decision Review', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  });

  test.describe('Lease Summary Display', () => {
    test('displays lease profile summary', async ({ page }) => {
      const testData = {
        currentStepOrder: 4,
        collectedData: {
          'lease-profile': {
            monthlyPayment: '450',
            residualValue: '22000',
            monthsRemaining: '12',
          },
        },
      };

      await page.goto('/');
      await page.evaluate(
        ([key, data]) => localStorage.setItem(key, JSON.stringify(data)),
        [STORAGE_KEY, testData] as [string, typeof testData]
      );

      await page.goto(`${JOURNEY_URL}/step/decision-review`);
      await page.waitForLoadState('networkidle');

      const leaseSummary = page.locator('#summary-lease');
      await expect(leaseSummary).toContainText('$450');
    });

    test('shows placeholder when no data exists', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/decision-review`);
      await page.waitForLoadState('networkidle');

      await expect(page.locator('#summary-lease')).toContainText('Gathering details');
    });
  });

  test.describe('Early Termination Section', () => {
    test('displays termination costs when data exists', async ({ page }) => {
      const testData = {
        currentStepOrder: 4,
        collectedData: {
          'lease-profile': {
            earlyTerminationFee: '500',
            remainingPaymentsOwed: '5400',
            leaseTransferFee: '350',
          },
        },
      };

      await page.goto('/');
      await page.evaluate(
        ([key, data]) => localStorage.setItem(key, JSON.stringify(data)),
        [STORAGE_KEY, testData] as [string, typeof testData]
      );

      await page.goto(`${JOURNEY_URL}/step/decision-review`);
      await page.waitForLoadState('networkidle');

      const terminationSection = page.locator('#termination-section');
      await expect(terminationSection).toBeVisible();
      await expect(terminationSection).toContainText('$500');
      await expect(terminationSection).toContainText('$5,400');
      await expect(terminationSection).toContainText('$350');
    });

    test('hides termination section when no data', async ({ page }) => {
      const testData = {
        currentStepOrder: 4,
        collectedData: {
          'lease-profile': {
            monthlyPayment: '400',
          },
        },
      };

      await page.goto('/');
      await page.evaluate(
        ([key, data]) => localStorage.setItem(key, JSON.stringify(data)),
        [STORAGE_KEY, testData] as [string, typeof testData]
      );

      await page.goto(`${JOURNEY_URL}/step/decision-review`);
      await page.waitForLoadState('networkidle');

      await expect(page.locator('#termination-section')).toHaveClass(/hidden/);
    });
  });

  test.describe('Wear and Tear Section', () => {
    test('displays wear and tear charges', async ({ page }) => {
      const testData = {
        currentStepOrder: 4,
        collectedData: {
          'lease-profile': {
            excessWearCharges: '400',
            tireCharges: '800',
            bodyDamageEstimate: '600',
          },
        },
      };

      await page.goto('/');
      await page.evaluate(
        ([key, data]) => localStorage.setItem(key, JSON.stringify(data)),
        [STORAGE_KEY, testData] as [string, typeof testData]
      );

      await page.goto(`${JOURNEY_URL}/step/decision-review`);
      await page.waitForLoadState('networkidle');

      const terminationSection = page.locator('#termination-section');
      await expect(terminationSection).toBeVisible();
      await expect(terminationSection).toContainText('$400');
      await expect(terminationSection).toContainText('$800');
      await expect(terminationSection).toContainText('$600');
    });
  });

  test.describe('Exit Strategy Section', () => {
    test('displays all exit option values', async ({ page }) => {
      const testData = {
        currentStepOrder: 4,
        collectedData: {
          'lease-vs-buyout': {
            buyoutAmount: '20000',
            tradeInValue: '21000',
            privateSaleValue: '24000',
            instantOfferValue: '21500',
          },
        },
      };

      await page.goto('/');
      await page.evaluate(
        ([key, data]) => localStorage.setItem(key, JSON.stringify(data)),
        [STORAGE_KEY, testData] as [string, typeof testData]
      );

      await page.goto(`${JOURNEY_URL}/step/decision-review`);
      await page.waitForLoadState('networkidle');

      const exitSection = page.locator('#exit-section');
      await expect(exitSection).toBeVisible();
      await expect(exitSection).toContainText('$21,000');
      await expect(exitSection).toContainText('$24,000');
      await expect(exitSection).toContainText('$21,500');
    });

    test('shows best exit recommendation', async ({ page }) => {
      const testData = {
        currentStepOrder: 4,
        collectedData: {
          'lease-vs-buyout': {
            buyoutAmount: '20000',
            tradeInValue: '21000',
            privateSaleValue: '24000',
            instantOfferValue: '21500',
          },
        },
      };

      await page.goto('/');
      await page.evaluate(
        ([key, data]) => localStorage.setItem(key, JSON.stringify(data)),
        [STORAGE_KEY, testData] as [string, typeof testData]
      );

      await page.goto(`${JOURNEY_URL}/step/decision-review`);
      await page.waitForLoadState('networkidle');

      const exitRecommendation = page.locator('#exit-recommendation');
      await expect(exitRecommendation).toContainText('Best exit');
      // Private sale at $24,000 should be the best option
      await expect(exitRecommendation).toContainText('private');
    });

    test('hides exit section when no data', async ({ page }) => {
      const testData = {
        currentStepOrder: 4,
        collectedData: {
          'lease-vs-buyout': {
            buyoutAmount: '18000',
          },
        },
      };

      await page.goto('/');
      await page.evaluate(
        ([key, data]) => localStorage.setItem(key, JSON.stringify(data)),
        [STORAGE_KEY, testData] as [string, typeof testData]
      );

      await page.goto(`${JOURNEY_URL}/step/decision-review`);
      await page.waitForLoadState('networkidle');

      await expect(page.locator('#exit-section')).toHaveClass(/hidden/);
    });
  });

  test.describe('Incentives Section', () => {
    test('displays all incentive values', async ({ page }) => {
      const testData = {
        currentStepOrder: 4,
        collectedData: {
          'replacement-options': {
            loyaltyBonus: '500',
            evFederalCredit: '7500',
            evStateCredit: '2000',
            dealerRebate: '1500',
          },
        },
      };

      await page.goto('/');
      await page.evaluate(
        ([key, data]) => localStorage.setItem(key, JSON.stringify(data)),
        [STORAGE_KEY, testData] as [string, typeof testData]
      );

      await page.goto(`${JOURNEY_URL}/step/decision-review`);
      await page.waitForLoadState('networkidle');

      const incentivesSection = page.locator('#incentives-section');
      await expect(incentivesSection).toBeVisible();
      await expect(incentivesSection).toContainText('$500');
      await expect(incentivesSection).toContainText('$7,500');
      await expect(incentivesSection).toContainText('$2,000');
      await expect(incentivesSection).toContainText('$1,500');
    });

    test('calculates and displays total incentives', async ({ page }) => {
      const testData = {
        currentStepOrder: 4,
        collectedData: {
          'replacement-options': {
            loyaltyBonus: '500',
            evFederalCredit: '7500',
            evStateCredit: '2000',
            dealerRebate: '1500',
          },
        },
      };

      await page.goto('/');
      await page.evaluate(
        ([key, data]) => localStorage.setItem(key, JSON.stringify(data)),
        [STORAGE_KEY, testData] as [string, typeof testData]
      );

      await page.goto(`${JOURNEY_URL}/step/decision-review`);
      await page.waitForLoadState('networkidle');

      // Total should be 500 + 7500 + 2000 + 1500 = $11,500
      const incentivesTotal = page.locator('#incentives-total');
      await expect(incentivesTotal).toContainText('$11,500');
    });

    test('hides incentives section when no incentives', async ({ page }) => {
      const testData = {
        currentStepOrder: 4,
        collectedData: {
          'replacement-options': {
            horizonMonths: '36',
          },
        },
      };

      await page.goto('/');
      await page.evaluate(
        ([key, data]) => localStorage.setItem(key, JSON.stringify(data)),
        [STORAGE_KEY, testData] as [string, typeof testData]
      );

      await page.goto(`${JOURNEY_URL}/step/decision-review`);
      await page.waitForLoadState('networkidle');

      await expect(page.locator('#incentives-section')).toHaveClass(/hidden/);
    });
  });

  test.describe('Chat Integration', () => {
    test('shows chat prompt with collected data', async ({ page }) => {
      const testData = {
        currentStepOrder: 4,
        collectedData: {
          'lease-profile': { monthlyPayment: '400' },
          'lease-vs-buyout': { buyoutAmount: '18000' },
          'replacement-options': { horizonMonths: '36' },
        },
      };

      await page.goto('/');
      await page.evaluate(
        ([key, data]) => localStorage.setItem(key, JSON.stringify(data)),
        [STORAGE_KEY, testData] as [string, typeof testData]
      );

      await page.goto(`${JOURNEY_URL}/step/decision-review`);
      await page.waitForLoadState('networkidle');

      const chatPrompt = page.locator('#chat-prompt');
      const promptText = await chatPrompt.textContent();
      expect(promptText).toContain('auto-lease-decision');
      expect(promptText).toContain('400');
      expect(promptText).toContain('18000');
    });

    test('includes NPV note when discount rate was used', async ({ page }) => {
      const testData = {
        currentStepOrder: 4,
        collectedData: {
          'replacement-options': {
            discountRate: '7',
            horizonMonths: '36',
          },
        },
      };

      await page.goto('/');
      await page.evaluate(
        ([key, data]) => localStorage.setItem(key, JSON.stringify(data)),
        [STORAGE_KEY, testData] as [string, typeof testData]
      );

      await page.goto(`${JOURNEY_URL}/step/decision-review`);
      await page.waitForLoadState('networkidle');

      // Should show NPV-related note or display
      const pageContent = await page.textContent('body');
      expect(pageContent?.toLowerCase()).toContain('npv');
    });
  });
});
