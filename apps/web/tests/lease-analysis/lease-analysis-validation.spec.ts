import { expect, test, type Page, type Route } from '@playwright/test';

const successResponse = {
  leaseType: 'warehouse-nnn',
  termMonths: 60,
  startDate: '2024-01-01',
  endDate: '2028-12-31',
  metrics: {
    totalCost: 420000,
    averageMonthlyPayment: 7000,
    presentValue: 390000,
    effectiveAnnualRate: 0.065,
  },
  schedule: [],
  renewalOptions: [],
  riskAnalysis: {
    flexibilityScore: 72,
    renewalRisk: 'medium',
    marketComparability: 'high',
  },
  insights: {
    effectiveRent: 7000,
    occupancyCost: 7600,
    totalCommitment: 420000,
    flexibilityRating: 'medium',
    recommendations: ['Review escalation exposure'],
  },
};

async function mockLeaseAnalysis(
  page: Page,
  handler?: (route: Route) => Promise<void>
) {
  await page.route('**/v1/api/analysis/enhanced-lease', async (route) => {
    if (handler) {
      await handler(route);
      return;
    }

    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      json: successResponse,
    });
  });
}

async function openLeaseAnalysis(page: Page) {
  await page.goto('/lease-analysis');
  await expect(page.getByRole('tablist')).toBeVisible();
}

async function switchToEquipmentLease(page: Page) {
  await page.locator('select').first().selectOption('equipment');
  await expect(page.getByLabel('Equipment Cost')).toBeVisible();
}

test.describe('Enhanced Lease Analysis - Form Validation & Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await mockLeaseAnalysis(page);
    await openLeaseAnalysis(page);
  });

  test('default warehouse lease auto-analyzes on load', async ({ page }) => {
    await expect(page.getByText('Financial Summary')).toBeVisible();
    await expect(page.getByLabel('Monthly Base Rent')).toBeVisible();
    await expect(page.getByLabel('Lease Term (Months)')).toHaveValue('60');
  });

  test('equipment numeric inputs enforce current HTML constraints', async ({ page }) => {
    await switchToEquipmentLease(page);

    const equipmentCostInput = page.getByLabel('Equipment Cost');
    const rateInput = page.getByLabel('Annual Interest Rate');
    const termInput = page.getByLabel('Lease Term (Months)');

    await equipmentCostInput.fill('-50000');
    await expect(equipmentCostInput).toHaveJSProperty('validity.valid', false);

    await rateInput.fill('150');
    await expect(rateInput).toHaveJSProperty('validity.valid', false);

    await rateInput.fill('7.5');
    await expect(rateInput).toHaveJSProperty('validity.valid', true);

    await termInput.fill('0');
    await expect(termInput).toHaveJSProperty('validity.valid', false);
  });

  test('escalation fields are configurable on the Terms tab', async ({ page }) => {
    await page.getByRole('button', { name: 'Show Advanced' }).click();
    await page.getByRole('tab', { name: 'Terms' }).click();

    await expect(page.getByText('Rent Escalations')).toBeVisible();

    const escalationField = page
      .locator('div.space-y-1')
      .filter({ has: page.locator('label', { hasText: 'Escalation Type' }) })
      .locator('select');

    await escalationField.selectOption('fixed');

    await expect(page.getByLabel('Annual Escalation Rate')).toBeVisible();
  });

  test('additional monthly costs appear for non-equipment lease types', async ({ page }) => {
    await page.locator('select').first().selectOption('office-nnn');
    await page.getByRole('button', { name: 'Show Advanced' }).click();
    await page.getByRole('tab', { name: 'Terms' }).click();

    await expect(page.getByText('Additional Monthly Costs')).toBeVisible();
    await expect(page.getByLabel('CAM Charges')).toBeVisible();
    await expect(page.getByLabel('Property Taxes')).toBeVisible();
    await expect(page.getByLabel('Insurance')).toBeVisible();
  });

  test('server errors surface in the UI', async ({ page }) => {
    await page.unroute('**/v1/api/analysis/enhanced-lease');
    await mockLeaseAnalysis(page, async (route) => {
      await route.fulfill({
        status: 500,
        headers: { 'content-type': 'application/json' },
        json: {
          error: {
            message: 'Internal server error during analysis',
          },
        },
      });
    });

    await page.reload();
    await expect(page.getByText('Internal server error during analysis').first()).toBeVisible();
    await expect(page.getByText('Financial Summary')).not.toBeVisible();
  });

  test('loading state is visible while analysis is pending', async ({ page }) => {
    let releaseResponse!: () => void;
    const responseReleased = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });

    await page.unroute('**/v1/api/analysis/enhanced-lease');
    await mockLeaseAnalysis(page, async (route) => {
      await responseReleased;
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        json: successResponse,
      });
    });

    await page.reload();
    await expect(page.getByRole('button', { name: 'Analyzing...' })).toBeVisible();

    releaseResponse();

    await expect(page.getByText('Financial Summary')).toBeVisible();
  });

  test('equipment inputs can be reset after entry', async ({ page }) => {
    await switchToEquipmentLease(page);

    const equipmentCostInput = page.getByLabel('Equipment Cost');
    const rateInput = page.getByLabel('Annual Interest Rate');
    const residualInput = page.getByLabel('Residual Value');

    await equipmentCostInput.fill('100000');
    await rateInput.fill('6.5');
    await residualInput.fill('10000');

    await equipmentCostInput.clear();
    await expect(equipmentCostInput).toHaveValue(/^(|0)$/);
  });

  test('keyboard navigation follows the equipment form order', async ({ page }) => {
    await switchToEquipmentLease(page);

    const equipmentCostInput = page.getByLabel('Equipment Cost');
    const rateInput = page.getByLabel('Annual Interest Rate');
    const residualInput = page.getByLabel('Residual Value');

    await equipmentCostInput.click();
    await expect(equipmentCostInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(rateInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(residualInput).toBeFocused();
  });

  test('equipment inputs remain label-addressable for accessibility', async ({ page }) => {
    await switchToEquipmentLease(page);

    await expect(page.getByLabel('Equipment Cost')).toBeVisible();
    await expect(page.getByLabel('Annual Interest Rate')).toBeVisible();
    await expect(page.getByLabel('Residual Value')).toBeVisible();
  });
});
