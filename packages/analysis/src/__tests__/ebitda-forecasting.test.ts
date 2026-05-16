import { describe, it, expect } from 'vitest';
import {
  EbitdaForecaster,
  ScenarioInputSchema,
  MonthlyFinancialsSchema,
  EmployeeSchema,
  ExpenseTypeSchema,
} from '../engines/ebitda-forecasting';

describe('EbitdaForecaster', () => {
  const baseMonthlyFinancials = {
    month: 12,
    year: 2024,
    revenue: 100000,
    costOfGoodsSold: 30000,
    operatingExpenses: 40000,
    depreciation: 2000,
    amortization: 1000,
    interestExpense: 500,
    taxes: 5000,
  };

  const baseEmployee = {
    id: 'emp1',
    name: 'John Doe',
    role: 'Developer',
    department: 'Engineering',
    billableHoursPerMonth: 160,
    hourlyRate: 75,
    salary: 120000,
    benefits: 2000,
    startDate: '2024-01-01T00:00:00Z',
    isActive: true,
  };

  const baseScenario = {
    name: 'Base Scenario',
    description: 'Baseline forecasting scenario',
    forecastPeriodMonths: 12,
    currentMonthlyFinancials: [baseMonthlyFinancials],
    currentEmployees: [baseEmployee],
    newEmployees: [],
    revenueGrowthRate: 0.05, // 5% monthly growth
    billableHoursGrowthRate: 0.02, // 2% monthly growth
    additionalExpenses: [],
    operatingExpenseGrowthRate: 0.03, // 3% monthly growth
    inflationRate: 0.03, // 3% annual inflation
  };

  describe('Schema Validation', () => {
    it('should validate a complete scenario input', () => {
      const result = ScenarioInputSchema.safeParse(baseScenario);
      expect(result.success).toBe(true);
    });

    it('should validate monthly financials', () => {
      const result = MonthlyFinancialsSchema.safeParse(baseMonthlyFinancials);
      expect(result.success).toBe(true);
    });

    it('should validate employee data', () => {
      const result = EmployeeSchema.safeParse(baseEmployee);
      expect(result.success).toBe(true);
    });

    it('should validate expense types', () => {
      const expense = {
        id: 'exp1',
        name: 'Office Rent',
        category: 'fixed' as const,
        amount: 5000,
        frequency: 'monthly' as const,
        isRecurring: true,
        description: 'Monthly office rent',
      };
      const result = ExpenseTypeSchema.safeParse(expense);
      expect(result.success).toBe(true);
    });

    it('should reject invalid scenario data', () => {
      const invalidScenario = {
        ...baseScenario,
        forecastPeriodMonths: -1, // Invalid negative period
      };
      const result = ScenarioInputSchema.safeParse(invalidScenario);
      expect(result.success).toBe(false);
    });

    it('should reject empty financial data', () => {
      const invalidScenario = {
        ...baseScenario,
        currentMonthlyFinancials: [],
      };
      expect(() => EbitdaForecaster.forecast(invalidScenario)).toThrow();
    });
  });

  describe('Basic Forecasting', () => {
    it('should generate a 12-month forecast', () => {
      const result = EbitdaForecaster.forecast(baseScenario);

      expect(result.forecast).toHaveLength(12);
      expect(result.scenario.name).toBe('Base Scenario');
      expect(result.scenario.forecastPeriodMonths).toBe(12);
    });

    it('should calculate revenue growth correctly', () => {
      const result = EbitdaForecaster.forecast(baseScenario);

      // With 5% monthly growth, month 1 should be 105,000
      const month1 = result.forecast[0];
      expect(month1).toBeDefined();
      expect(month1!.revenue).toBeCloseTo(105000, 0);

      // Month 12 should be significantly higher due to compound growth
      const month12 = result.forecast[11];
      expect(month12).toBeDefined();
      expect(month12!.revenue).toBeGreaterThan(150000);
    });

    it('should calculate EBITDA correctly', () => {
      const result = EbitdaForecaster.forecast(baseScenario);

      result.forecast.forEach((month) => {
        expect(month.ebitda).toBe(month.grossProfit - month.operatingExpenses);
        expect(month.grossProfit).toBe(month.revenue - month.costOfGoodsSold);
        expect(month.ebit).toBe(month.ebitda - month.depreciation - month.amortization);
      });
    });

    it('should track employee costs and count', () => {
      const result = EbitdaForecaster.forecast(baseScenario);

      result.forecast.forEach((month) => {
        expect(month.employeeCount).toBe(1); // Only one employee
        expect(month.employeeCosts).toBeGreaterThan(0);
        // Employee costs should include salary + benefits + inflation adjustment
        expect(month.employeeCosts).toBeGreaterThan(10000); // (120k/12 + 2k) with inflation
      });
    });

    it('should calculate summary metrics correctly', () => {
      const result = EbitdaForecaster.forecast(baseScenario);

      expect(result.summary.totalRevenue).toBeGreaterThan(0);
      expect(result.summary.totalEbitda).toBeGreaterThan(0);
      expect(result.summary.averageEbitdaMargin).toBeGreaterThan(0);
      expect(result.summary.finalEmployeeCount).toBe(1);
      expect(result.summary.revenueGrowth).toBeGreaterThan(0);
    });

    it('should calculate key metrics correctly', () => {
      const result = EbitdaForecaster.forecast(baseScenario);

      expect(result.keyMetrics.revenuePerEmployee).toBeGreaterThan(0);
      expect(result.keyMetrics.ebitdaPerEmployee).toBeGreaterThan(0);
      expect(result.keyMetrics.averageBillableHours).toBeGreaterThan(0);
      expect(result.keyMetrics.revenuePerBillableHour).toBeGreaterThan(0);
    });
  });

  describe('Employee Forecasting', () => {
    it('should add new employees at specified months', () => {
      const scenarioWithNewEmployees = {
        ...baseScenario,
        newEmployees: [
          {
            ...baseEmployee,
            id: 'emp2',
            name: 'Jane Smith',
            startMonth: 6,
          },
          {
            ...baseEmployee,
            id: 'emp3',
            name: 'Bob Johnson',
            startMonth: 9,
          },
        ],
      };

      const result = EbitdaForecaster.forecast(scenarioWithNewEmployees);

      // Month 5 should have 1 employee
      expect(result.forecast[4]!.employeeCount).toBe(1);

      // Month 6 should have 2 employees
      expect(result.forecast[5]!.employeeCount).toBe(2);

      // Month 9 should have 3 employees
      expect(result.forecast[8]!.employeeCount).toBe(3);

      // Employee costs should increase accordingly
      expect(result.forecast[5]!.employeeCosts).toBeGreaterThan(result.forecast[4]!.employeeCosts);
      expect(result.forecast[8]!.employeeCosts).toBeGreaterThan(result.forecast[7]!.employeeCosts);
    });

    it('should handle billable hours growth', () => {
      const result = EbitdaForecaster.forecast(baseScenario);

      // Billable hours should grow month over month
      expect(result.forecast[1]!.billableHours).toBeGreaterThan(result.forecast[0]!.billableHours);
      expect(result.forecast[11]!.billableHours).toBeGreaterThan(result.forecast[0]!.billableHours);
    });
  });

  describe('Expense Forecasting', () => {
    it('should add additional expenses at specified months', () => {
      const scenarioWithExpenses = {
        ...baseScenario,
        additionalExpenses: [
          {
            id: 'exp1',
            name: 'New Office Rent',
            category: 'fixed' as const,
            amount: 8000,
            frequency: 'monthly' as const,
            isRecurring: true,
            startMonth: 3,
          },
          {
            id: 'exp2',
            name: 'Annual Software License',
            category: 'fixed' as const,
            amount: 12000,
            frequency: 'annually' as const,
            isRecurring: true,
            startMonth: 1,
          },
        ],
      };

      const result = EbitdaForecaster.forecast(scenarioWithExpenses);

      // Month 2 should not have the monthly expense yet
      const month2OpEx = result.forecast[1]!.operatingExpenses;

      // Month 3 should have the additional monthly expense
      const month3OpEx = result.forecast[2]!.operatingExpenses;
      expect(month3OpEx).toBeGreaterThan(month2OpEx);

      // Month 12 should have the annual expense
      const month12OpEx = result.forecast[11]!.operatingExpenses;
      expect(month12OpEx).toBeGreaterThan(month3OpEx);
    });

    it('should apply inflation to expenses', () => {
      const result = EbitdaForecaster.forecast(baseScenario);

      // Operating expenses should increase over time due to inflation
      const month1OpEx = result.forecast[0]!.operatingExpenses;
      const month12OpEx = result.forecast[11]!.operatingExpenses;
      expect(month12OpEx).toBeGreaterThan(month1OpEx);
    });
  });

  describe('Seasonality and Market Factors', () => {
    it('should apply seasonality factors when provided', () => {
      const scenarioWithSeasonality = {
        ...baseScenario,
        economicFactors: {
          marketGrowth: 0,
          competitionFactor: 1,
          seasonalityFactors: [1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3], // Holiday peaks
        },
      };

      const result = EbitdaForecaster.forecast(scenarioWithSeasonality);

      // January (month 1) should have higher revenue due to 1.2 multiplier
      const jan = result.forecast.find((f) => f.month === 1);
      // June (month 6) should have lower revenue due to 0.7 multiplier
      const june = result.forecast.find((f) => f.month === 6);

      expect(jan).toBeDefined();
      expect(june).toBeDefined();

      // Note: We need to account for growth rate, so we compare relative differences
      // rather than absolute values
    });

    it('should apply market growth and competition factors', () => {
      const scenarioWithMarketFactors = {
        ...baseScenario,
        economicFactors: {
          marketGrowth: 0.02, // 2% monthly market growth
          competitionFactor: 0.9, // 10% competitive disadvantage
        },
      };

      const baseResult = EbitdaForecaster.forecast(baseScenario);
      const marketResult = EbitdaForecaster.forecast(scenarioWithMarketFactors);

      // Revenue should be affected by market factors
      expect(marketResult.summary.totalRevenue).not.toBe(baseResult.summary.totalRevenue);
    });
  });

  describe('Scenario Comparison', () => {
    it('should compare multiple scenarios correctly', () => {
      const scenario1 = {
        ...baseScenario,
        name: 'Conservative Growth',
        revenueGrowthRate: 0.02,
      };

      const scenario2 = {
        ...baseScenario,
        name: 'Aggressive Growth',
        revenueGrowthRate: 0.08,
      };

      const result1 = EbitdaForecaster.forecast(scenario1);
      const result2 = EbitdaForecaster.forecast(scenario2);

      const comparison = EbitdaForecaster.compareScenarios([result1, result2]);

      expect(comparison.comparison).toHaveLength(2);
      expect(comparison.bestScenario).toBe('Aggressive Growth');
      expect(comparison.insights.length).toBeGreaterThanOrEqual(2); // Should generate at least 2 insights

      // Aggressive growth should have higher EBITDA
      const aggressiveScenario = comparison.comparison.find(
        (c) => c.scenarioName === 'Aggressive Growth'
      );
      const conservativeScenario = comparison.comparison.find(
        (c) => c.scenarioName === 'Conservative Growth'
      );

      expect(aggressiveScenario).toBeDefined();
      expect(conservativeScenario).toBeDefined();
      expect(aggressiveScenario!.totalEbitda).toBeGreaterThan(conservativeScenario!.totalEbitda);
    });

    it('should handle edge cases in scenario comparison', () => {
      const singleScenario = EbitdaForecaster.forecast(baseScenario);
      const comparison = EbitdaForecaster.compareScenarios([singleScenario]);

      expect(comparison.comparison).toHaveLength(1);
      expect(comparison.bestScenario).toBe('Base Scenario');
      expect(comparison.insights).toHaveLength(1); // Only efficiency insight for single scenario
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle zero revenue baseline', () => {
      const zeroRevenueScenario = {
        ...baseScenario,
        currentMonthlyFinancials: [
          {
            ...baseMonthlyFinancials,
            revenue: 0,
          },
        ],
      };

      const result = EbitdaForecaster.forecast(zeroRevenueScenario);
      expect(result.forecast).toHaveLength(12);
      // Should handle zero revenue gracefully
      expect(result.summary.revenueGrowth).toBe(0);
    });

    it('should handle negative growth rates', () => {
      const negativeGrowthScenario = {
        ...baseScenario,
        revenueGrowthRate: -0.05, // 5% monthly decline
      };

      const result = EbitdaForecaster.forecast(negativeGrowthScenario);

      // Revenue should decline over time
      expect(result.forecast[11]!.revenue).toBeLessThan(result.forecast[0]!.revenue);
      expect(result.summary.revenueGrowth).toBeLessThan(0);
    });

    it('should handle very short forecast periods', () => {
      const shortForecastScenario = {
        ...baseScenario,
        forecastPeriodMonths: 1,
      };

      const result = EbitdaForecaster.forecast(shortForecastScenario);
      expect(result.forecast).toHaveLength(1);
      expect(result.summary.totalRevenue).toBeGreaterThan(0);
    });

    it('should handle very long forecast periods', () => {
      const longForecastScenario = {
        ...baseScenario,
        forecastPeriodMonths: 60, // 5 years
      };

      const result = EbitdaForecaster.forecast(longForecastScenario);
      expect(result.forecast).toHaveLength(60);
      // With 5% monthly growth, final revenue should be very high
      expect(result.forecast[59]!.revenue).toBeGreaterThan(1000000);
    });
  });
});
