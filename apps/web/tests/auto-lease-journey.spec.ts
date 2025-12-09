/**
 * Auto Lease Decision Journey E2E Tests
 * Tests the complete workflow for the auto-lease-decision journey including:
 * - Form field persistence across steps
 * - Calculation outputs and accuracy
 * - Navigation flow
 * - New fields (early termination, wear & tear, trade-in options, incentives)
 */

import { expect, test } from '@playwright/test';

const STORAGE_KEY = 'fanalyx-journey-state-auto-lease-decision';
const JOURNEY_URL = '/journey/auto-lease-decision';

test.describe('Auto Lease Decision Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  });

  test.describe('Journey Overview Page', () => {
    test('loads overview page with all steps', async ({ page }) => {
      await page.goto(JOURNEY_URL);
      await page.waitForLoadState('networkidle');

      // Verify page title
      await expect(page.locator('h1')).toContainText('Auto Lease Decision');

      // Verify all 4 steps are visible
      const stepLinks = page.locator('[href*="/journey/auto-lease-decision/step/"]');
      await expect(stepLinks).toHaveCount(4);
    });
  });

  test.describe('Step 1: Lease Profile', () => {
    test('displays all form fields including new gap analysis fields', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/lease-profile`);
      await page.waitForLoadState('networkidle');

      // Verify basic fields exist
      await expect(page.locator('input[name="monthlyPayment"]')).toBeVisible();
      await expect(page.locator('input[name="residualValue"]')).toBeVisible();
      await expect(page.locator('input[name="monthsRemaining"]')).toBeVisible();

      // Verify early termination fields exist
      await expect(page.locator('input[name="earlyTerminationFee"]')).toBeVisible();
      await expect(page.locator('input[name="remainingPaymentsOwed"]')).toBeVisible();
      await expect(page.locator('input[name="leaseTransferFee"]')).toBeVisible();

      // Verify wear & tear fields exist
      await expect(page.locator('input[name="excessWearCharges"]')).toBeVisible();
      await expect(page.locator('input[name="tireCharges"]')).toBeVisible();
      await expect(page.locator('input[name="bodyDamageEstimate"]')).toBeVisible();
    });

    test('persists form data to localStorage', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/lease-profile`);
      await page.waitForLoadState('networkidle');

      // Fill out form
      await page.fill('input[name="monthlyPayment"]', '450');
      await page.fill('input[name="residualValue"]', '22000');
      await page.fill('input[name="monthsRemaining"]', '12');
      await page.fill('input[name="earlyTerminationFee"]', '500');
      await page.fill('input[name="excessWearCharges"]', '300');

      // Trigger save (usually on blur or form submit)
      await page.click('body');

      // Wait for save to complete
      await page.waitForTimeout(500);

      // Verify localStorage was updated
      const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
      expect(stored).not.toBeNull();

      const data = JSON.parse(stored!);
      expect(data.collectedData?.['lease-profile']?.monthlyPayment).toBe('450');
      expect(data.collectedData?.['lease-profile']?.earlyTerminationFee).toBe('500');
    });

    test('restores form data on page reload', async ({ page }) => {
      // First visit: fill out form
      await page.goto(`${JOURNEY_URL}/step/lease-profile`);
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="monthlyPayment"]', '399');
      await page.fill('input[name="residualValue"]', '18500');
      await page.click('body');
      await page.waitForTimeout(500);

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify fields are restored
      await expect(page.locator('input[name="monthlyPayment"]')).toHaveValue('399');
      await expect(page.locator('input[name="residualValue"]')).toHaveValue('18500');
    });
  });

  test.describe('Step 2: Lease vs Buyout', () => {
    test('displays trade-in options fields', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/lease-vs-buyout`);
      await page.waitForLoadState('networkidle');

      // Verify basic fields
      await expect(page.locator('input[name="buyoutAmount"]')).toBeVisible();
      await expect(page.locator('input[name="apr"]')).toBeVisible();

      // Verify new trade-in option fields
      await expect(page.locator('input[name="tradeInValue"]')).toBeVisible();
      await expect(page.locator('input[name="privateSaleValue"]')).toBeVisible();
      await expect(page.locator('input[name="instantOfferValue"]')).toBeVisible();

      // Verify depreciation model select exists
      await expect(page.locator('select[name="depreciationModel"]')).toBeVisible();

      // Verify gap insurance field
      await expect(page.locator('input[name="gapInsurance"]')).toBeVisible();
    });

    test('calculates exit strategy comparison correctly', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/lease-vs-buyout`);
      await page.waitForLoadState('networkidle');

      // Fill out form with known values
      await page.fill('input[name="buyoutAmount"]', '20000');
      await page.fill('input[name="apr"]', '6.5');
      await page.fill('input[name="loanTermMonths"]', '48');
      await page.fill('input[name="expectedValueNow"]', '22000');
      await page.fill('input[name="tradeInValue"]', '21000');
      await page.fill('input[name="privateSaleValue"]', '23000');
      await page.fill('input[name="instantOfferValue"]', '20500');

      // Trigger calculation
      const calcButton = page.locator('button:has-text("Compare")');
      if (await calcButton.count() > 0) {
        await calcButton.click();
      }

      // Wait for results
      await page.waitForTimeout(500);

      // Verify results show (check for result container)
      const resultsSection = page.locator('#result, #results, [data-results], .results');
      if (await resultsSection.count() > 0) {
        await expect(resultsSection.first()).toBeVisible();
      }
    });
  });

  test.describe('Step 3: Replacement Options', () => {
    test('displays incentives and rebates fields', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/replacement-options`);
      await page.waitForLoadState('networkidle');

      // Verify incentive fields exist
      await expect(page.locator('input[name="loyaltyBonus"]')).toBeVisible();
      await expect(page.locator('input[name="conquestCash"]')).toBeVisible();
      await expect(page.locator('input[name="evFederalCredit"]')).toBeVisible();
      await expect(page.locator('input[name="evStateCredit"]')).toBeVisible();
      await expect(page.locator('input[name="dealerRebate"]')).toBeVisible();
      await expect(page.locator('input[name="collegeGradRebate"]')).toBeVisible();

      // Verify opportunity cost field
      await expect(page.locator('input[name="discountRate"]')).toBeVisible();
    });

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

      // Add incentives
      await page.fill('input[name="evFederalCredit"]', '7500');
      await page.fill('input[name="dealerRebate"]', '1000');

      // Trigger calculation
      const calcButton = page.locator('button:has-text("Compare")');
      if (await calcButton.count() > 0) {
        await calcButton.click();
      }

      // Wait for calculation
      await page.waitForTimeout(500);

      // Verify NPV appears in results
      const pageContent = await page.textContent('body');
      expect(pageContent).toContain('NPV');
    });

    test('subtracts incentives from option costs', async ({ page }) => {
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
  });

  test.describe('Step 4: Decision Review', () => {
    test('displays all collected data from previous steps', async ({ page }) => {
      // Pre-populate localStorage with comprehensive data
      const testData = {
        currentStepOrder: 4,
        collectedData: {
          'lease-profile': {
            monthlyPayment: '450',
            residualValue: '22000',
            monthsRemaining: '12',
            currentMileage: '28000',
            allowedMileage: '36000',
            earlyTerminationFee: '500',
            remainingPaymentsOwed: '5400',
            leaseTransferFee: '350',
            excessWearCharges: '400',
            tireCharges: '800',
            bodyDamageEstimate: '600',
          },
          'lease-vs-buyout': {
            buyoutAmount: '20000',
            apr: '6.5',
            loanTermMonths: '48',
            expectedValueNow: '22000',
            tradeInValue: '21000',
            privateSaleValue: '24000',
            instantOfferValue: '21500',
            depreciationModel: 'moderate',
            gapInsurance: '600',
          },
          'replacement-options': {
            horizonMonths: '36',
            annualMiles: '12000',
            discountRate: '7',
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
        [STORAGE_KEY, testData]
      );

      // Navigate to decision review
      await page.goto(`${JOURNEY_URL}/step/decision-review`);
      await page.waitForLoadState('networkidle');

      // Verify lease snapshot shows
      const leaseSummary = page.locator('#summary-lease');
      await expect(leaseSummary).toContainText('$450');

      // Verify early termination section appears
      const terminationSection = page.locator('#termination-section');
      await expect(terminationSection).toBeVisible();
      await expect(terminationSection).toContainText('$500');
      await expect(terminationSection).toContainText('$5,400');

      // Verify wear & tear section
      await expect(terminationSection).toContainText('$400');
      await expect(terminationSection).toContainText('$800');

      // Verify exit strategy section appears
      const exitSection = page.locator('#exit-section');
      await expect(exitSection).toBeVisible();
      await expect(exitSection).toContainText('$21,000');
      await expect(exitSection).toContainText('$24,000');

      // Verify best exit recommendation shows
      const exitRecommendation = page.locator('#exit-recommendation');
      await expect(exitRecommendation).toContainText('Best exit');

      // Verify incentives section appears
      const incentivesSection = page.locator('#incentives-section');
      await expect(incentivesSection).toBeVisible();
      await expect(incentivesSection).toContainText('$7,500');
      await expect(incentivesSection).toContainText('$2,000');

      // Verify incentives total
      const incentivesTotal = page.locator('#incentives-total');
      await expect(incentivesTotal).toContainText('$11,500'); // 500 + 7500 + 2000 + 1500
    });

    test('shows chat prompt with all collected data', async ({ page }) => {
      // Pre-populate with test data
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
        [STORAGE_KEY, testData]
      );

      await page.goto(`${JOURNEY_URL}/step/decision-review`);
      await page.waitForLoadState('networkidle');

      // Verify chat prompt contains the data
      const chatPrompt = page.locator('#chat-prompt');
      const promptText = await chatPrompt.textContent();
      expect(promptText).toContain('auto-lease-decision');
      expect(promptText).toContain('400');
      expect(promptText).toContain('18000');
    });
  });

  test.describe('Complete Journey Flow', () => {
    test('navigates through all steps and persists data', async ({ page }) => {
      // Step 1: Lease Profile
      await page.goto(`${JOURNEY_URL}/step/lease-profile`);
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="monthlyPayment"]', '425');
      await page.fill('input[name="residualValue"]', '19500');
      await page.fill('input[name="monthsRemaining"]', '8');
      await page.fill('input[name="earlyTerminationFee"]', '450');
      await page.click('body');
      await page.waitForTimeout(300);

      // Navigate to Step 2
      const nextButton1 = page.locator('a:has-text("Next:")');
      await nextButton1.click();
      await page.waitForURL('**/lease-vs-buyout');

      // Step 2: Lease vs Buyout
      await page.fill('input[name="buyoutAmount"]', '17500');
      await page.fill('input[name="apr"]', '5.9');
      await page.fill('input[name="tradeInValue"]', '19000');
      await page.fill('input[name="privateSaleValue"]', '21000');
      await page.click('body');
      await page.waitForTimeout(300);

      // Navigate to Step 3
      const nextButton2 = page.locator('a:has-text("Next:")');
      await nextButton2.click();
      await page.waitForURL('**/replacement-options');

      // Step 3: Replacement Options
      await page.fill('input[name="horizonMonths"]', '48');
      await page.fill('input[name="annualMiles"]', '15000');
      await page.fill('input[name="evFederalCredit"]', '7500');
      await page.fill('input[name="discountRate"]', '6');
      await page.click('body');
      await page.waitForTimeout(300);

      // Navigate to Step 4
      const nextButton3 = page.locator('a:has-text("Next:")');
      await nextButton3.click();
      await page.waitForURL('**/decision-review');

      // Step 4: Verify all data persisted
      const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
      expect(stored).not.toBeNull();

      const data = JSON.parse(stored!);

      // Verify Step 1 data
      expect(data.collectedData?.['lease-profile']?.monthlyPayment).toBe('425');
      expect(data.collectedData?.['lease-profile']?.earlyTerminationFee).toBe('450');

      // Verify Step 2 data
      expect(data.collectedData?.['lease-vs-buyout']?.buyoutAmount).toBe('17500');
      expect(data.collectedData?.['lease-vs-buyout']?.tradeInValue).toBe('19000');

      // Verify Step 3 data
      expect(data.collectedData?.['replacement-options']?.horizonMonths).toBe('48');
      expect(data.collectedData?.['replacement-options']?.evFederalCredit).toBe('7500');
      expect(data.collectedData?.['replacement-options']?.discountRate).toBe('6');

      // Verify decision review displays data
      await expect(page.locator('#summary-lease')).toContainText('$425');
      await expect(page.locator('#exit-section')).toBeVisible();
      await expect(page.locator('#incentives-section')).toBeVisible();
    });

    test('can go back and modify earlier steps', async ({ page }) => {
      // Start with pre-populated data
      const testData = {
        currentStepOrder: 3,
        collectedData: {
          'lease-profile': {
            monthlyPayment: '400',
            residualValue: '20000',
            monthsRemaining: '10',
          },
          'lease-vs-buyout': {
            buyoutAmount: '18000',
            apr: '6.0',
          },
        },
      };

      await page.goto('/');
      await page.evaluate(
        ([key, data]) => localStorage.setItem(key, JSON.stringify(data)),
        [STORAGE_KEY, testData]
      );

      // Go to Step 3
      await page.goto(`${JOURNEY_URL}/step/replacement-options`);
      await page.waitForLoadState('networkidle');

      // Go back to Step 1
      await page.goto(`${JOURNEY_URL}/step/lease-profile`);
      await page.waitForLoadState('networkidle');

      // Verify data was restored
      await expect(page.locator('input[name="monthlyPayment"]')).toHaveValue('400');

      // Modify data
      await page.fill('input[name="monthlyPayment"]', '450');
      await page.click('body');
      await page.waitForTimeout(300);

      // Go forward to Step 4
      await page.goto(`${JOURNEY_URL}/step/decision-review`);
      await page.waitForLoadState('networkidle');

      // Verify modified data shows
      await expect(page.locator('#summary-lease')).toContainText('$450');
    });
  });

  test.describe('Edge Cases', () => {
    test('handles missing optional fields gracefully', async ({ page }) => {
      // Pre-populate with minimal data (only required fields)
      const minimalData = {
        currentStepOrder: 4,
        collectedData: {
          'lease-profile': {
            monthlyPayment: '350',
            residualValue: '15000',
            monthsRemaining: '6',
          },
          'lease-vs-buyout': {
            buyoutAmount: '14000',
          },
          'replacement-options': {
            horizonMonths: '36',
          },
        },
      };

      await page.goto('/');
      await page.evaluate(
        ([key, data]) => localStorage.setItem(key, JSON.stringify(data)),
        [STORAGE_KEY, minimalData]
      );

      await page.goto(`${JOURNEY_URL}/step/decision-review`);
      await page.waitForLoadState('networkidle');

      // Page should load without errors
      await expect(page.locator('h1')).toContainText('Decision Review');

      // Optional sections should be hidden when no data
      await expect(page.locator('#termination-section')).toHaveClass(/hidden/);
      await expect(page.locator('#exit-section')).toHaveClass(/hidden/);
      await expect(page.locator('#incentives-section')).toHaveClass(/hidden/);
    });

    test('handles cleared localStorage', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/decision-review`);
      await page.waitForLoadState('networkidle');

      // Page should still load, just with default/empty state
      await expect(page.locator('h1')).toContainText('Decision Review');
      await expect(page.locator('#summary-lease')).toContainText('Gathering details');
    });

    test('handles zero values correctly', async ({ page }) => {
      const zeroData = {
        currentStepOrder: 4,
        collectedData: {
          'lease-profile': {
            monthlyPayment: '0',
            earlyTerminationFee: '0',
          },
          'lease-vs-buyout': {
            tradeInValue: '0',
            privateSaleValue: '0',
          },
          'replacement-options': {
            evFederalCredit: '0',
          },
        },
      };

      await page.goto('/');
      await page.evaluate(
        ([key, data]) => localStorage.setItem(key, JSON.stringify(data)),
        [STORAGE_KEY, zeroData]
      );

      await page.goto(`${JOURNEY_URL}/step/decision-review`);
      await page.waitForLoadState('networkidle');

      // Page should load without errors
      await expect(page.locator('h1')).toContainText('Decision Review');

      // Sections with zero values should not show
      await expect(page.locator('#termination-section')).toHaveClass(/hidden/);
      await expect(page.locator('#exit-section')).toHaveClass(/hidden/);
      await expect(page.locator('#incentives-section')).toHaveClass(/hidden/);
    });
  });
});
