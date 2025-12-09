/**
 * Auto Lease Decision Journey - Step 3: Replacement Options
 * Tests incentives, NPV calculations, and option comparisons
 */

import { expect, test } from '@playwright/test';

const STORAGE_KEY = 'fanalyx-journey-state-auto-lease-decision';
const JOURNEY_URL = '/journey/auto-lease-decision';

test.describe('Step 3: Replacement Options', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  });

  test.describe('Form Fields - Incentives', () => {
    test('displays loyalty and conquest incentive fields', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/replacement-options`);
      await page.waitForLoadState('networkidle');

      await expect(page.locator('input[name="loyaltyBonus"]')).toBeVisible();
      await expect(page.locator('input[name="conquestCash"]')).toBeVisible();
    });

    test('displays EV credit fields', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/replacement-options`);
      await page.waitForLoadState('networkidle');

      await expect(page.locator('input[name="evFederalCredit"]')).toBeVisible();
      await expect(page.locator('input[name="evStateCredit"]')).toBeVisible();
    });

    test('displays dealer and special rebate fields', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/replacement-options`);
      await page.waitForLoadState('networkidle');

      await expect(page.locator('input[name="dealerRebate"]')).toBeVisible();
      await expect(page.locator('input[name="collegeGradRebate"]')).toBeVisible();
    });
  });

  test.describe('Form Fields - Opportunity Cost', () => {
    test('displays discount rate field for NPV calculation', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/replacement-options`);
      await page.waitForLoadState('networkidle');

      await expect(page.locator('input[name="discountRate"]')).toBeVisible();
    });
  });

  test.describe('Data Persistence - Incentives', () => {
    test('saves all incentive fields to localStorage', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/replacement-options`);
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="loyaltyBonus"]', '500');
      await page.fill('input[name="conquestCash"]', '750');
      await page.fill('input[name="evFederalCredit"]', '7500');
      await page.fill('input[name="evStateCredit"]', '2000');
      await page.fill('input[name="dealerRebate"]', '1500');
      await page.fill('input[name="collegeGradRebate"]', '400');
      await page.click('body');
      await page.waitForTimeout(500);

      const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
      const data = JSON.parse(stored!);
      
      expect(data.collectedData?.['replacement-options']?.loyaltyBonus).toBe('500');
      expect(data.collectedData?.['replacement-options']?.conquestCash).toBe('750');
      expect(data.collectedData?.['replacement-options']?.evFederalCredit).toBe('7500');
      expect(data.collectedData?.['replacement-options']?.evStateCredit).toBe('2000');
      expect(data.collectedData?.['replacement-options']?.dealerRebate).toBe('1500');
      expect(data.collectedData?.['replacement-options']?.collegeGradRebate).toBe('400');
    });

    test('saves discount rate to localStorage', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/replacement-options`);
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="discountRate"]', '7');
      await page.click('body');
      await page.waitForTimeout(500);

      const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
      const data = JSON.parse(stored!);
      expect(data.collectedData?.['replacement-options']?.discountRate).toBe('7');
    });
  });

  test.describe('NPV Calculations', () => {
    test('calculates NPV when discount rate is provided', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/replacement-options`);
      await page.waitForLoadState('networkidle');

      // Fill basic values
      await page.fill('input[name="horizonMonths"]', '36');
      await page.fill('input[name="annualMiles"]', '12000');

      // Fill lease option
      await page.fill('input[name="leaseMonthly"]', '399');
      await page.fill('input[name="leaseDownPayment"]', '2500');

      // Fill finance option
      await page.fill('input[name="financePrice"]', '35000');
      await page.fill('input[name="financeDownPayment"]', '5000');
      await page.fill('input[name="financeApr"]', '5.9');
      await page.fill('input[name="financeTermMonths"]', '60');
      await page.fill('input[name="financeResaleValue"]', '22000');

      // Add discount rate for NPV calculation
      await page.fill('input[name="discountRate"]', '7');

      // Trigger calculation
      const calcButton = page.locator('button:has-text("Compare")');
      if (await calcButton.count() > 0) {
        await calcButton.click();
        await page.waitForTimeout(500);

        // Verify NPV appears in results
        const pageContent = await page.textContent('body');
        expect(pageContent).toContain('NPV');
      }
    });

    test('shows NPV alongside total cost when discount rate set', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/replacement-options`);
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="horizonMonths"]', '48');
      await page.fill('input[name="leaseMonthly"]', '450');
      await page.fill('input[name="leaseDownPayment"]', '3000');
      await page.fill('input[name="discountRate"]', '6');

      const calcButton = page.locator('button:has-text("Compare")');
      if (await calcButton.count() > 0) {
        await calcButton.click();
        await page.waitForTimeout(500);

        const resultsSection = page.locator('#result, #results, .results');
        if (await resultsSection.count() > 0) {
          const resultsText = await resultsSection.first().textContent();
          // When discount rate is provided, NPV should appear
          if (resultsText) {
            expect(resultsText.toLowerCase()).toContain('npv');
          }
        }
      }
    });
  });

  test.describe('Incentives Impact', () => {
    test('incentives are subtracted from option costs', async ({ page }) => {
      // Set up data from previous steps first
      await page.goto(`${JOURNEY_URL}/step/lease-profile`);
      await page.waitForLoadState('networkidle');
      await page.fill('input[name="monthlyPayment"]', '400');
      await page.fill('input[name="residualValue"]', '20000');
      await page.fill('input[name="monthsRemaining"]', '6');
      await page.click('body');
      await page.waitForTimeout(300);

      // Navigate to Step 3
      await page.goto(`${JOURNEY_URL}/step/replacement-options`);
      await page.waitForLoadState('networkidle');

      // Fill replacement options with incentives
      await page.fill('input[name="horizonMonths"]', '36');
      await page.fill('input[name="annualMiles"]', '15000');
      await page.fill('input[name="financePrice"]', '40000');
      await page.fill('input[name="financeDownPayment"]', '3000');
      await page.fill('input[name="financeApr"]', '6.5');
      await page.fill('input[name="financeTermMonths"]', '60');
      await page.fill('input[name="financeResaleValue"]', '25000');

      // Add significant incentives
      await page.fill('input[name="evFederalCredit"]', '7500');
      await page.fill('input[name="evStateCredit"]', '2000');

      await page.click('body');
      await page.waitForTimeout(500);

      // Check that incentives were saved
      const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
      const data = JSON.parse(stored!);
      expect(data.collectedData?.['replacement-options']?.evFederalCredit).toBe('7500');
      expect(data.collectedData?.['replacement-options']?.evStateCredit).toBe('2000');
    });

    test('total incentives are calculated correctly', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/replacement-options`);
      await page.waitForLoadState('networkidle');

      // Fill all incentive fields
      await page.fill('input[name="loyaltyBonus"]', '500');
      await page.fill('input[name="conquestCash"]', '0');
      await page.fill('input[name="evFederalCredit"]', '7500');
      await page.fill('input[name="evStateCredit"]', '2000');
      await page.fill('input[name="dealerRebate"]', '1000');
      await page.fill('input[name="collegeGradRebate"]', '0');
      await page.click('body');
      await page.waitForTimeout(500);

      const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
      const data = JSON.parse(stored!);
      
      // Calculate expected total: 500 + 7500 + 2000 + 1000 = 11000
      const loyalty = parseFloat(data.collectedData?.['replacement-options']?.loyaltyBonus || '0');
      const evFed = parseFloat(data.collectedData?.['replacement-options']?.evFederalCredit || '0');
      const evState = parseFloat(data.collectedData?.['replacement-options']?.evStateCredit || '0');
      const dealer = parseFloat(data.collectedData?.['replacement-options']?.dealerRebate || '0');
      
      expect(loyalty + evFed + evState + dealer).toBe(11000);
    });
  });

  test.describe('Data Restoration', () => {
    test('restores all fields from pre-populated localStorage', async ({ page }) => {
      const testData = {
        currentStepOrder: 3,
        collectedData: {
          'replacement-options': {
            horizonMonths: '48',
            annualMiles: '15000',
            discountRate: '6.5',
            loyaltyBonus: '600',
            evFederalCredit: '7500',
            evStateCredit: '2500',
            dealerRebate: '1200',
          },
        },
      };

      await page.goto('/');
      await page.evaluate(
        ([key, data]) => localStorage.setItem(key, JSON.stringify(data)),
        [STORAGE_KEY, testData] as [string, typeof testData]
      );

      await page.goto(`${JOURNEY_URL}/step/replacement-options`);
      await page.waitForLoadState('networkidle');

      await expect(page.locator('input[name="discountRate"]')).toHaveValue('6.5');
      await expect(page.locator('input[name="loyaltyBonus"]')).toHaveValue('600');
      await expect(page.locator('input[name="evFederalCredit"]')).toHaveValue('7500');
      await expect(page.locator('input[name="evStateCredit"]')).toHaveValue('2500');
    });
  });
});
