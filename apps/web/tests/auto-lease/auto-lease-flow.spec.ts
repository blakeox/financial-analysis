/**
 * Auto Lease Decision Journey - Integration and Flow Tests
 * Tests complete journey navigation and edge cases
 */

import { expect, test } from '@playwright/test';

const STORAGE_KEY = 'fanalyx-journey-state-auto-lease-decision';
const JOURNEY_URL = '/journey/auto-lease-decision';

test.describe('Auto Lease Journey - Overview', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  });

  test('loads overview page with all steps', async ({ page }) => {
    await page.goto(JOURNEY_URL);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toContainText('Auto Lease Decision');

    const stepLinks = page.locator('[href*="/journey/auto-lease-decision/step/"]');
    await expect(stepLinks).toHaveCount(4);
  });
});

test.describe('Auto Lease Journey - Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  });

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
      [STORAGE_KEY, testData] as [string, typeof testData]
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

test.describe('Auto Lease Journey - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  });

  test('handles missing optional fields gracefully', async ({ page }) => {
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
      [STORAGE_KEY, minimalData] as [string, typeof minimalData]
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
      [STORAGE_KEY, zeroData] as [string, typeof zeroData]
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

  test('handles partial data in localStorage', async ({ page }) => {
    const partialData = {
      currentStepOrder: 2,
      collectedData: {
        'lease-profile': {
          monthlyPayment: '399',
          // residualValue intentionally missing
        },
      },
    };

    await page.goto('/');
    await page.evaluate(
      ([key, data]) => localStorage.setItem(key, JSON.stringify(data)),
      [STORAGE_KEY, partialData] as [string, typeof partialData]
    );

    await page.goto(`${JOURNEY_URL}/step/lease-profile`);
    await page.waitForLoadState('networkidle');

    // Should restore the data that exists
    await expect(page.locator('input[name="monthlyPayment"]')).toHaveValue('399');
    // Missing field should be empty
    await expect(page.locator('input[name="residualValue"]')).toHaveValue('');
  });

  test('handles corrupted localStorage gracefully', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(
      (key) => localStorage.setItem(key, 'not-valid-json'),
      STORAGE_KEY
    );

    await page.goto(`${JOURNEY_URL}/step/lease-profile`);
    await page.waitForLoadState('networkidle');

    // Page should load without crashing
    await expect(page.locator('h1')).toContainText('Lease Profile');
  });
});

test.describe('Auto Lease Journey - Data Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  });

  test('preserves data types as strings', async ({ page }) => {
    await page.goto(`${JOURNEY_URL}/step/lease-profile`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="monthlyPayment"]', '450.99');
    await page.fill('input[name="monthsRemaining"]', '12');
    await page.click('body');
    await page.waitForTimeout(500);

    const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    const data = JSON.parse(stored!);

    // Values should be stored as strings
    expect(typeof data.collectedData?.['lease-profile']?.monthlyPayment).toBe('string');
    expect(typeof data.collectedData?.['lease-profile']?.monthsRemaining).toBe('string');
    expect(data.collectedData?.['lease-profile']?.monthlyPayment).toBe('450.99');
  });
});
