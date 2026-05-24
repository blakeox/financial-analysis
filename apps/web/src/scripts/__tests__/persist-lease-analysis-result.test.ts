import { describe, expect, it } from 'vitest';
import { toLeaseAnalysisStorePayload } from '../lease/persist-lease-analysis-result';
import type { EnhancedLeaseAnalysisResult } from '@financial-analysis/analysis';

function minimalLeaseResult(
  overrides: Partial<EnhancedLeaseAnalysisResult> = {}
): EnhancedLeaseAnalysisResult {
  return {
    leaseType: 'commercial-nnn',
    termMonths: 60,
    startDate: '2026-01-01',
    endDate: '2030-12-31',
    schedule: [],
    metrics: {
      totalCost: 600_000,
      presentValue: 520_000,
      futureValue: 600_000,
      effectiveAnnualRate: 0.06,
      internalRateOfReturn: 0.05,
      paybackPeriod: 48,
      totalInterestPaid: 80_000,
      averageMonthlyPayment: 10_000,
      costPerMonth: 10_000,
      costPerYear: 120_000,
    },
    renewalOptions: [],
    riskAnalysis: {
      earlyTerminationCost: 0,
      totalCommitment: 600_000,
      flexibilityScore: 50,
      renewalRisk: 'medium',
      rateEscalationRisk: 'medium',
    },
    insights: {
      effectiveRent: 10_000,
      occupancyCost: 600_000,
      totalCommitment: 500_000,
      flexibilityRating: 'medium',
      recommendations: [],
    },
    ...overrides,
  };
}

describe('toLeaseAnalysisStorePayload', () => {
  it('maps enhanced lease metrics for the lease impact engine', () => {
    const payload = toLeaseAnalysisStorePayload(
      minimalLeaseResult({
        purchaseOption: { available: true, residualValue: 50_000 },
        leaseVsBuy: {
          leaseOption: {
            totalCost: 600_000,
            presentValue: 520_000,
            monthlyPayment: 10_000,
            totalInterest: 80_000,
          },
          buyOption: {
            purchasePrice: 750_000,
            loanPayment: 0,
            totalLoanCost: 0,
            presentValue: 0,
            taxBenefits: 0,
            netCost: 0,
          },
          recommendation: 'lease',
          savingsAmount: 0,
          breakEvenPoint: 0,
        },
      })
    );

    expect(payload.principal).toBe(750_000);
    expect(payload.annualRate).toBe(0.06);
    expect(payload.termMonths).toBe(60);
    expect(payload.residualValue).toBe(50_000);
    expect(payload.monthlyPayment).toBe(10_000);
    expect(payload.totalCost).toBe(600_000);
  });
});
