import { expect, test } from '@playwright/test';
import {
  buildAnalysisResult,
  fillEquipmentLeaseForm,
  mockLeaseAnalysis,
  openLeaseAnalysis,
  switchToEquipmentLease,
} from './helpers';

test.describe('Lease analysis basic browser contracts', () => {
  test('renders the current shell and auto-runs the default warehouse request', async ({ page }) => {
    const requests = await mockLeaseAnalysis(page);

    await openLeaseAnalysis(page);

    await expect(page).toHaveTitle(/Lease Analysis/);
    await expect(page.getByText('🤖 AI-Powered Document Analysis')).toBeVisible();
    await expect(page.getByText('Quick Start Templates')).toBeVisible();
    await expect(page.getByText('Analysis History')).toBeVisible();
    await expect(page.getByText('Financial Summary')).toBeVisible();

    await expect.poll(() => requests.length).toBeGreaterThan(0);

    expect(requests[0]).toMatchObject({
      leaseType: 'warehouse-nnn',
      baseRent: 45000,
      termMonths: 60,
    });

    await expect(page.getByText('$7,000').first()).toBeVisible();
    await expect(page.getByText('$420,000').first()).toBeVisible();
  });

  test('posts the current equipment payload and renders explicit result sections', async ({ page }) => {
    const requests = await mockLeaseAnalysis(page, async (route, payload) => {
      const isEquipment = payload.leaseType === 'equipment';

      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        json: buildAnalysisResult({
          leaseType: isEquipment ? 'equipment' : 'warehouse-nnn',
          termMonths: isEquipment ? 48 : 60,
          metrics: {
            totalCost: isEquipment ? 120000 : 420000,
            presentValue: isEquipment ? 110000 : 390000,
            averageMonthlyPayment: isEquipment ? 2500 : 7000,
            costPerMonth: isEquipment ? 2500 : 7000,
            costPerYear: isEquipment ? 30000 : 84000,
          },
          insights: {
            effectiveRent: isEquipment ? 2500 : 7000,
            occupancyCost: isEquipment ? 2500 : 7600,
            totalCommitment: isEquipment ? 120000 : 420000,
          },
          riskAnalysis: {
            earlyTerminationCost: isEquipment ? 12000 : 15000,
          },
          leaseVsBuy: isEquipment
            ? {
                leaseOption: {
                  totalCost: 120000,
                  presentValue: 110000,
                  monthlyPayment: 2500,
                  totalInterest: 20000,
                },
                buyOption: {
                  purchasePrice: 130000,
                  loanPayment: 2875,
                  totalLoanCost: 138000,
                  presentValue: 125000,
                  taxBenefits: 7000,
                  netCost: 131000,
                },
                recommendation: 'lease',
                savingsAmount: 18000,
                breakEvenPoint: 36,
              }
            : undefined,
        }),
      });
    });

    await openLeaseAnalysis(page);
    await switchToEquipmentLease(page);
    await fillEquipmentLeaseForm(page);

    const requestCountBeforeClick = requests.length;
    await page.getByRole('button', { name: 'Analyze Lease' }).click();

    await expect.poll(() => requests.length).toBeGreaterThan(requestCountBeforeClick);

    const lastRequest = requests.at(-1);
    expect(lastRequest).toMatchObject({
      leaseType: 'equipment',
      principal: 100000,
      termMonths: 48,
      residualValue: 10000,
    });
    expect(lastRequest?.annualRate).toBeCloseTo(0.065, 6);

    await expect(page.getByRole('heading', { name: 'Lease vs Buy Comparison' })).toBeVisible();
    await expect(page.getByText('Recommendation: LEASE')).toBeVisible();
    await expect(page.getByText('Review renewal terms before signing')).toBeVisible();
    await expect(page.getByText('$2,500').first()).toBeVisible();
    await expect(page.getByText('$120,000').first()).toBeVisible();
  });
});
