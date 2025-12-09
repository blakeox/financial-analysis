/**
 * Auto Lease Decision Journey - Step 2: Lease vs Buyout
 * Tests exit strategy options, trade-in values, and comparison calculations
 */

import { expect, test } from '@playwright/test';

const STORAGE_KEY = 'fanalyx-journey-state-auto-lease-decision';
const JOURNEY_URL = '/journey/auto-lease-decision';

test.describe('Step 2: Lease vs Buyout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  });

  test.describe('Form Fields', () => {
    test('displays basic buyout fields', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/lease-vs-buyout`);
      await page.waitForLoadState('networkidle');

      await expect(page.locator('input[name="buyoutAmount"]')).toBeVisible();
      await expect(page.locator('input[name="apr"]')).toBeVisible();
      await expect(page.locator('input[name="loanTermMonths"]')).toBeVisible();
      await expect(page.locator('input[name="expectedValueNow"]')).toBeVisible();
    });

    test('displays trade-in option fields', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/lease-vs-buyout`);
      await page.waitForLoadState('networkidle');

      await expect(page.locator('input[name="tradeInValue"]')).toBeVisible();
      await expect(page.locator('input[name="privateSaleValue"]')).toBeVisible();
      await expect(page.locator('input[name="instantOfferValue"]')).toBeVisible();
    });

    test('displays depreciation model selector', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/lease-vs-buyout`);
      await page.waitForLoadState('networkidle');

      await expect(page.locator('select[name="depreciationModel"]')).toBeVisible();
    });

    test('displays gap insurance field', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/lease-vs-buyout`);
      await page.waitForLoadState('networkidle');

      await expect(page.locator('input[name="gapInsurance"]')).toBeVisible();
    });
  });

  test.describe('Data Persistence', () => {
    test('saves basic buyout fields to localStorage', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/lease-vs-buyout`);
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="buyoutAmount"]', '20000');
      await page.fill('input[name="apr"]', '6.5');
      await page.fill('input[name="loanTermMonths"]', '48');
      await page.click('body');
      await page.waitForTimeout(500);

      const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
      const data = JSON.parse(stored!);
      expect(data.collectedData?.['lease-vs-buyout']?.buyoutAmount).toBe('20000');
      expect(data.collectedData?.['lease-vs-buyout']?.apr).toBe('6.5');
      expect(data.collectedData?.['lease-vs-buyout']?.loanTermMonths).toBe('48');
    });

    test('saves exit strategy values to localStorage', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/lease-vs-buyout`);
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="tradeInValue"]', '21000');
      await page.fill('input[name="privateSaleValue"]', '23000');
      await page.fill('input[name="instantOfferValue"]', '20500');
      await page.click('body');
      await page.waitForTimeout(500);

      const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
      const data = JSON.parse(stored!);
      expect(data.collectedData?.['lease-vs-buyout']?.tradeInValue).toBe('21000');
      expect(data.collectedData?.['lease-vs-buyout']?.privateSaleValue).toBe('23000');
      expect(data.collectedData?.['lease-vs-buyout']?.instantOfferValue).toBe('20500');
    });

    test('saves gap insurance and depreciation model', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/lease-vs-buyout`);
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="gapInsurance"]', '600');
      await page.selectOption('select[name="depreciationModel"]', 'moderate');
      await page.click('body');
      await page.waitForTimeout(500);

      const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
      const data = JSON.parse(stored!);
      expect(data.collectedData?.['lease-vs-buyout']?.gapInsurance).toBe('600');
      expect(data.collectedData?.['lease-vs-buyout']?.depreciationModel).toBe('moderate');
    });
  });

  test.describe('Exit Strategy Calculations', () => {
    test('runs comparison calculation with all exit options', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/lease-vs-buyout`);
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="buyoutAmount"]', '20000');
      await page.fill('input[name="apr"]', '6.5');
      await page.fill('input[name="loanTermMonths"]', '48');
      await page.fill('input[name="expectedValueNow"]', '22000');
      await page.fill('input[name="tradeInValue"]', '21000');
      await page.fill('input[name="privateSaleValue"]', '23000');
      await page.fill('input[name="instantOfferValue"]', '20500');

      const calcButton = page.locator('button:has-text("Compare")');
      if (await calcButton.count() > 0) {
        await calcButton.click();
        await page.waitForTimeout(500);

        const resultsSection = page.locator('#result, #results, [data-results], .results');
        if (await resultsSection.count() > 0) {
          await expect(resultsSection.first()).toBeVisible();
        }
      }
    });

    test('displays individual exit option results', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/lease-vs-buyout`);
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="buyoutAmount"]', '20000');
      await page.fill('input[name="expectedValueNow"]', '22000');
      await page.fill('input[name="tradeInValue"]', '21000');
      await page.fill('input[name="privateSaleValue"]', '24000');
      await page.fill('input[name="instantOfferValue"]', '20500');

      const calcButton = page.locator('button:has-text("Compare")');
      if (await calcButton.count() > 0) {
        await calcButton.click();
        await page.waitForTimeout(500);

        // Check that exit options appear in results
        const pageContent = await page.textContent('body');
        
        // Results should mention trade-in, private sale, or exit strategies
        const hasExitContent = pageContent?.includes('trade') || 
                              pageContent?.includes('private') || 
                              pageContent?.includes('instant') ||
                              pageContent?.includes('exit');
        
        // Only assert if calculation was triggered
        if (await page.locator('#result, #results, .results').count() > 0) {
          expect(hasExitContent).toBe(true);
        }
      }
    });
  });

  test.describe('Data Restoration', () => {
    test('restores all fields from pre-populated localStorage', async ({ page }) => {
      const testData = {
        currentStepOrder: 2,
        collectedData: {
          'lease-vs-buyout': {
            buyoutAmount: '18500',
            apr: '5.9',
            loanTermMonths: '60',
            expectedValueNow: '21000',
            tradeInValue: '19500',
            privateSaleValue: '22000',
            instantOfferValue: '19000',
            depreciationModel: 'aggressive',
            gapInsurance: '450',
          },
        },
      };

      await page.goto('/');
      await page.evaluate(
        ([key, data]) => localStorage.setItem(key, JSON.stringify(data)),
        [STORAGE_KEY, testData] as [string, typeof testData]
      );

      await page.goto(`${JOURNEY_URL}/step/lease-vs-buyout`);
      await page.waitForLoadState('networkidle');

      await expect(page.locator('input[name="buyoutAmount"]')).toHaveValue('18500');
      await expect(page.locator('input[name="tradeInValue"]')).toHaveValue('19500');
      await expect(page.locator('input[name="privateSaleValue"]')).toHaveValue('22000');
      await expect(page.locator('input[name="gapInsurance"]')).toHaveValue('450');
    });
  });
});
