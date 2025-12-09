/**
 * Auto Lease Decision Journey - Step 1: Lease Profile
 * Tests form fields, data persistence, and field restoration
 */

import { expect, test } from '@playwright/test';

const STORAGE_KEY = 'fanalyx-journey-state-auto-lease-decision';
const JOURNEY_URL = '/journey/auto-lease-decision';

test.describe('Step 1: Lease Profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  });

  test.describe('Form Fields', () => {
    test('displays all basic lease fields', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/lease-profile`);
      await page.waitForLoadState('networkidle');

      await expect(page.locator('input[name="monthlyPayment"]')).toBeVisible();
      await expect(page.locator('input[name="residualValue"]')).toBeVisible();
      await expect(page.locator('input[name="monthsRemaining"]')).toBeVisible();
    });

    test('displays early termination fields', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/lease-profile`);
      await page.waitForLoadState('networkidle');

      await expect(page.locator('input[name="earlyTerminationFee"]')).toBeVisible();
      await expect(page.locator('input[name="remainingPaymentsOwed"]')).toBeVisible();
      await expect(page.locator('input[name="leaseTransferFee"]')).toBeVisible();
    });

    test('displays wear and tear fields', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/lease-profile`);
      await page.waitForLoadState('networkidle');

      await expect(page.locator('input[name="excessWearCharges"]')).toBeVisible();
      await expect(page.locator('input[name="tireCharges"]')).toBeVisible();
      await expect(page.locator('input[name="bodyDamageEstimate"]')).toBeVisible();
    });
  });

  test.describe('Data Persistence', () => {
    test('saves basic fields to localStorage', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/lease-profile`);
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="monthlyPayment"]', '450');
      await page.fill('input[name="residualValue"]', '22000');
      await page.fill('input[name="monthsRemaining"]', '12');
      await page.click('body');
      await page.waitForTimeout(500);

      const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
      expect(stored).not.toBeNull();

      const data = JSON.parse(stored!);
      expect(data.collectedData?.['lease-profile']?.monthlyPayment).toBe('450');
      expect(data.collectedData?.['lease-profile']?.residualValue).toBe('22000');
      expect(data.collectedData?.['lease-profile']?.monthsRemaining).toBe('12');
    });

    test('saves early termination fields to localStorage', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/lease-profile`);
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="earlyTerminationFee"]', '500');
      await page.fill('input[name="remainingPaymentsOwed"]', '5400');
      await page.fill('input[name="leaseTransferFee"]', '350');
      await page.click('body');
      await page.waitForTimeout(500);

      const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
      const data = JSON.parse(stored!);
      expect(data.collectedData?.['lease-profile']?.earlyTerminationFee).toBe('500');
      expect(data.collectedData?.['lease-profile']?.remainingPaymentsOwed).toBe('5400');
      expect(data.collectedData?.['lease-profile']?.leaseTransferFee).toBe('350');
    });

    test('saves wear and tear fields to localStorage', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/lease-profile`);
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="excessWearCharges"]', '400');
      await page.fill('input[name="tireCharges"]', '800');
      await page.fill('input[name="bodyDamageEstimate"]', '600');
      await page.click('body');
      await page.waitForTimeout(500);

      const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
      const data = JSON.parse(stored!);
      expect(data.collectedData?.['lease-profile']?.excessWearCharges).toBe('400');
      expect(data.collectedData?.['lease-profile']?.tireCharges).toBe('800');
      expect(data.collectedData?.['lease-profile']?.bodyDamageEstimate).toBe('600');
    });
  });

  test.describe('Data Restoration', () => {
    test('restores basic fields on page reload', async ({ page }) => {
      await page.goto(`${JOURNEY_URL}/step/lease-profile`);
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="monthlyPayment"]', '399');
      await page.fill('input[name="residualValue"]', '18500');
      await page.click('body');
      await page.waitForTimeout(500);

      await page.reload();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('input[name="monthlyPayment"]')).toHaveValue('399');
      await expect(page.locator('input[name="residualValue"]')).toHaveValue('18500');
    });

    test('restores all fields from pre-populated localStorage', async ({ page }) => {
      const testData = {
        currentStepOrder: 1,
        collectedData: {
          'lease-profile': {
            monthlyPayment: '425',
            residualValue: '20000',
            monthsRemaining: '10',
            earlyTerminationFee: '600',
            remainingPaymentsOwed: '4250',
            leaseTransferFee: '300',
            excessWearCharges: '350',
            tireCharges: '700',
            bodyDamageEstimate: '450',
          },
        },
      };

      await page.goto('/');
      await page.evaluate(
        ([key, data]) => localStorage.setItem(key, JSON.stringify(data)),
        [STORAGE_KEY, testData]
      );

      await page.goto(`${JOURNEY_URL}/step/lease-profile`);
      await page.waitForLoadState('networkidle');

      await expect(page.locator('input[name="monthlyPayment"]')).toHaveValue('425');
      await expect(page.locator('input[name="residualValue"]')).toHaveValue('20000');
      await expect(page.locator('input[name="earlyTerminationFee"]')).toHaveValue('600');
      await expect(page.locator('input[name="excessWearCharges"]')).toHaveValue('350');
    });
  });
});
