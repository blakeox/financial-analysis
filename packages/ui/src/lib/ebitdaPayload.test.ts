import { describe, it, expect } from 'vitest';
import { buildScenarioPayload } from './ebitdaPayload';
import type { MonthlyFinancialsData, FixedAssetData, LeaseData } from '../index';
import type { DashboardScenarioConfig } from './ebitdaPayload';

const baseFinancials: MonthlyFinancialsData = {
  january: 10000,
  february: 12000,
  march: 0,
  april: 0,
  may: 0,
  june: 0,
  july: 0,
  august: 0,
  september: 0,
  october: 0,
  november: 0,
  december: 0,
} as const;

describe('buildScenarioPayload', () => {
  it('applies fixed asset depreciation across months with revenue', () => {
    const payload = buildScenarioPayload({
      financials: baseFinancials,
      employees: [],
      expenseTypes: [],
      fixedAssets: [
        { id: 'a1', name: 'Laptop', monthlyDepreciation: 100, isActive: true },
        { id: 'a2', name: 'Server', monthlyDepreciation: 300, isActive: true },
        { id: 'a3', name: 'Old asset', monthlyDepreciation: 50, isActive: false },
      ] as FixedAssetData[],
      leases: [],
      scenarioConfig: {
        scenarioName: 'Test',
        projectionMonths: 12,
        revenueGrowthRate: 0.02,
        operatingExpenseGrowthRate: 0.01,
        billableHoursGrowthRate: 0,
        inflationRate: 0,
        marketGrowthFactor: 1,
        competitionFactor: 1,
      } as DashboardScenarioConfig,
      clock: new Date('2025-01-15T00:00:00Z'),
    });

    // Only Jan/Feb included, both should carry depreciation of 400 (100+300)
    expect(payload.currentMonthlyFinancials.map((m) => [m.month, m.depreciation])).toEqual([
      [1, 400],
      [2, 400],
    ]);
  });

  it('maps active leases as fixed monthly additional expenses', () => {
    const payload = buildScenarioPayload({
      financials: baseFinancials,
      employees: [],
      expenseTypes: [],
      fixedAssets: [],
      leases: [
        { id: 'l1', name: 'Office', monthlyPayment: 2500, isActive: true },
        { id: 'l2', name: 'Truck', monthlyPayment: 600, isActive: false },
      ] as LeaseData[],
      scenarioConfig: {
        scenarioName: 'Leases',
        projectionMonths: 6,
        revenueGrowthRate: 0,
        operatingExpenseGrowthRate: 0,
        billableHoursGrowthRate: 0,
        inflationRate: 0,
        marketGrowthFactor: 1,
        competitionFactor: 1,
      } as DashboardScenarioConfig,
      clock: new Date('2025-01-15T00:00:00Z'),
    });

    expect(payload.additionalExpenses).toEqual([
      {
        id: 'lease-l1',
        name: 'Office Lease',
        category: 'fixed',
        amount: 2500,
        frequency: 'monthly',
        isRecurring: true,
        description: 'Lease payment for Office',
        startMonth: 1,
        growthRate: 0,
      },
    ]);
  });

  it('throws when no months have revenue', () => {
    expect(() =>
      buildScenarioPayload({
        financials: {
          january: 0,
          february: 0,
          march: 0,
          april: 0,
          may: 0,
          june: 0,
          july: 0,
          august: 0,
          september: 0,
          october: 0,
          november: 0,
          december: 0,
        } as MonthlyFinancialsData,
        employees: [],
        expenseTypes: [],
        fixedAssets: [],
        leases: [],
        scenarioConfig: {
          scenarioName: 'None',
          projectionMonths: 12,
          revenueGrowthRate: 0,
          operatingExpenseGrowthRate: 0,
          billableHoursGrowthRate: 0,
          inflationRate: 0,
          marketGrowthFactor: 1,
          competitionFactor: 1,
        } as DashboardScenarioConfig,
      })
    ).toThrowError(/at least one month/);
  });
});
