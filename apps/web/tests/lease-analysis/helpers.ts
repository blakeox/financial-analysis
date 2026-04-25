import { expect, type Page, type Route } from '@playwright/test';
import type { EnhancedLeaseAnalysisResult } from '@financial-analysis/analysis';

type JsonObject = Record<string, unknown>;

type AnalysisResultOverrides = Omit<
  Partial<EnhancedLeaseAnalysisResult>,
  'metrics' | 'riskAnalysis' | 'insights' | 'leaseVsBuy'
> & {
  metrics?: Partial<EnhancedLeaseAnalysisResult['metrics']>;
  riskAnalysis?: Partial<EnhancedLeaseAnalysisResult['riskAnalysis']>;
  insights?: Partial<EnhancedLeaseAnalysisResult['insights']>;
  leaseVsBuy?: Partial<NonNullable<EnhancedLeaseAnalysisResult['leaseVsBuy']>>;
};

type MockLeaseAnalysisHandler = (
  route: Route,
  payload: JsonObject,
  callIndex: number
) => Promise<void>;

export const enhancedLeaseEndpoint = '**/v1/api/analysis/enhanced-lease';

export function buildAnalysisResult(
  overrides: AnalysisResultOverrides = {}
): EnhancedLeaseAnalysisResult {
  const base: EnhancedLeaseAnalysisResult = {
    leaseType: 'warehouse-nnn',
    termMonths: 60,
    startDate: '2024-01-01',
    endDate: '2028-12-31',
    schedule: Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const basePayment = 7000;
      const additionalCostTotal = 600;
      const totalPayment = basePayment + additionalCostTotal;
      const principalComponent = 6200;
      const interestComponent = 800;

      return {
        month,
        date: `2024-${String(month).padStart(2, '0')}-01`,
        basePayment,
        escalatedPayment: basePayment,
        additionalCosts: {
          camCharges: 250,
          propertyTaxes: 150,
          insurance: 100,
          utilities: 50,
          maintenance: 50,
          managementFee: 0,
          total: additionalCostTotal,
        },
        percentageRent: 0,
        totalPayment,
        cumulativePaid: totalPayment * month,
        effectiveRate: 0.065,
        presentValue: totalPayment * month * 0.94,
        interestComponent,
        principalComponent,
        remainingBalance: Math.max(0, 100000 - principalComponent * month),
      };
    }),
    metrics: {
      totalCost: 420000,
      presentValue: 390000,
      futureValue: 432000,
      effectiveAnnualRate: 0.065,
      internalRateOfReturn: 0.061,
      paybackPeriod: 60,
      totalInterestPaid: 48000,
      averageMonthlyPayment: 7000,
      costPerMonth: 7000,
      costPerYear: 84000,
    },
    renewalOptions: [],
    riskAnalysis: {
      earlyTerminationCost: 15000,
      totalCommitment: 420000,
      flexibilityScore: 72,
      renewalRisk: 'medium',
      rateEscalationRisk: 'medium',
    },
    insights: {
      effectiveRent: 7000,
      occupancyCost: 7600,
      totalCommitment: 420000,
      flexibilityRating: 'medium',
      recommendations: ['Review renewal terms before signing'],
    },
    leaseVsBuy: {
      leaseOption: {
        totalCost: 420000,
        presentValue: 390000,
        monthlyPayment: 7000,
        totalInterest: 48000,
      },
      buyOption: {
        purchasePrice: 450000,
        loanPayment: 7600,
        totalLoanCost: 456000,
        presentValue: 405000,
        taxBenefits: 12000,
        netCost: 444000,
      },
      recommendation: 'lease',
      savingsAmount: 24000,
      breakEvenPoint: 48,
    },
  };

  const baseLeaseVsBuy = base.leaseVsBuy!;
  const nextLeaseVsBuy =
    overrides.leaseVsBuy === undefined
      ? baseLeaseVsBuy
      : {
          ...baseLeaseVsBuy,
          ...overrides.leaseVsBuy,
          leaseOption: {
            ...baseLeaseVsBuy.leaseOption,
            ...(overrides.leaseVsBuy.leaseOption ?? {}),
          },
          buyOption: {
            ...baseLeaseVsBuy.buyOption,
            ...(overrides.leaseVsBuy.buyOption ?? {}),
          },
          recommendation: overrides.leaseVsBuy.recommendation ?? baseLeaseVsBuy.recommendation,
          savingsAmount: overrides.leaseVsBuy.savingsAmount ?? baseLeaseVsBuy.savingsAmount,
          breakEvenPoint: overrides.leaseVsBuy.breakEvenPoint ?? baseLeaseVsBuy.breakEvenPoint,
        };

  return {
    ...base,
    ...overrides,
    schedule: overrides.schedule ?? base.schedule,
    renewalOptions: overrides.renewalOptions ?? base.renewalOptions,
    metrics: {
      ...base.metrics,
      ...(overrides.metrics ?? {}),
    },
    riskAnalysis: {
      ...base.riskAnalysis,
      ...(overrides.riskAnalysis ?? {}),
    },
    insights: {
      ...base.insights,
      ...(overrides.insights ?? {}),
    },
    leaseVsBuy: nextLeaseVsBuy,
  };
}

export async function mockLeaseAnalysis(
  page: Page,
  handler?: MockLeaseAnalysisHandler
): Promise<JsonObject[]> {
  const requests: JsonObject[] = [];

  await page.route(enhancedLeaseEndpoint, async (route) => {
    const payload = (route.request().postDataJSON() as JsonObject | null) ?? {};
    requests.push(payload);

    if (handler) {
      await handler(route, payload, requests.length - 1);
      return;
    }

    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      json: buildAnalysisResult(),
    });
  });

  return requests;
}

export async function openLeaseAnalysis(page: Page) {
  await page.goto('/lease-analysis');
  await expect(page.getByRole('heading', { level: 1, name: 'Enhanced Lease Analysis' })).toBeVisible();
  await expect(page.getByRole('tablist')).toBeVisible();
}

export async function switchToEquipmentLease(page: Page) {
  await page.locator('select').first().selectOption('equipment');
  await expect(page.getByLabel('Equipment Cost')).toBeVisible();
}

export async function fillEquipmentLeaseForm(
  page: Page,
  values: {
    principal?: string;
    annualRate?: string;
    residualValue?: string;
    termMonths?: string;
  } = {}
) {
  await page.getByLabel('Equipment Cost').fill(values.principal ?? '100000');
  await page.getByLabel('Annual Interest Rate').fill(values.annualRate ?? '6.5');
  await page.getByLabel('Residual Value').fill(values.residualValue ?? '10000');
  await page.getByLabel('Lease Term (Months)').fill(values.termMonths ?? '48');
}
