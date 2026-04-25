import { expect, test } from '@playwright/test';

const analysisResponse = {
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

test.describe('Analysis route contracts', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/v1/api/analysis/enhanced-lease', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        json: analysisResponse,
      });
    });
  });

  test('renders the current lease-analysis experience on /analysis', async ({ page }) => {
    await page.goto('/analysis');

    await expect(page).toHaveURL(/\/analysis\/?$/);
    await expect(page).toHaveTitle(/Lease Analysis Calculator/i);
    await expect(
      page.getByRole('heading', { name: 'Enhanced Lease Analysis', exact: true })
    ).toBeVisible();
    await expect(
      page.getByText(
        'Analyze lease vs buy scenarios with AI extraction, templates, and advanced financial modeling'
      )
    ).toBeVisible();

    await expect(page.getByText('🤖 AI-Powered Document Analysis')).toBeVisible();
    await expect(page.getByText('Quick Start Templates')).toBeVisible();
    await expect(page.getByText('Analysis History')).toBeVisible();
    await expect(page.getByText('Financial Summary')).toBeVisible();
    await expect(page.locator('[data-scenario]')).toHaveCount(0);
  });

  test('keeps the enhanced lease form reachable from the analysis alias route', async ({ page }) => {
    await page.goto('/analysis');

    await page.locator('select').first().selectOption('equipment');

    await expect(page.getByLabel('Equipment Cost')).toBeVisible();
    await expect(page.getByLabel('Annual Interest Rate')).toBeVisible();
    await expect(page.getByLabel('Lease Term (Months)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Analyze Lease' })).toBeVisible();
  });
});
