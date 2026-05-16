import { describe, it, expect } from 'vitest';
import { EbitdaForecaster } from '../ebitda-forecasting';
import type {
  ScenarioInput,
  MonthlyFinancials,
  Employee,
  EbitdaForecastResult,
} from '../ebitda-forecasting';

describe('EbitdaForecaster', () => {
  const baseFinancials: MonthlyFinancials = {
    month: 12,
    year: 2023,
    revenue: 100000,
    costOfGoodsSold: 30000,
    operatingExpenses: 40000,
    depreciation: 2000,
    amortization: 1000,
    interestExpense: 500,
    taxes: 5000,
  };

  const baseEmployee: Employee = {
    id: 'emp1',
    name: 'John Doe',
    role: 'Developer',
    department: 'Engineering',
    billableHoursPerMonth: 160,
    hourlyRate: 150,
    salary: 120000,
    benefits: 2000,
    startDate: '2023-01-01T00:00:00.000Z',
    isActive: true,
  };

  const basicInput: ScenarioInput = {
    name: 'Base Scenario',
    description: 'Test scenario',
    forecastPeriodMonths: 12,
    currentMonthlyFinancials: [baseFinancials],
    currentEmployees: [baseEmployee],
    newEmployees: [],
    revenueGrowthRate: 0.02, // 2% monthly
    billableHoursGrowthRate: 0,
    additionalExpenses: [],
    operatingExpenseGrowthRate: 0.01, // 1% monthly
    inflationRate: 0.03, // 3% annual
  };

  describe('basic forecasting', () => {
    it('generates forecast for specified period', () => {
      const result = EbitdaForecaster.forecast(basicInput);

      expect(result.forecast).toHaveLength(12);
    });

    it('each month has all required fields', () => {
      const result = EbitdaForecaster.forecast(basicInput);

      const firstMonth = result.forecast[0]!;
      expect(firstMonth).toHaveProperty('month');
      expect(firstMonth).toHaveProperty('year');
      expect(firstMonth).toHaveProperty('revenue');
      expect(firstMonth).toHaveProperty('ebitda');
      expect(firstMonth).toHaveProperty('netIncome');
    });

    it('returns scenario metadata', () => {
      const result = EbitdaForecaster.forecast(basicInput);

      expect(result.scenario.name).toBe('Base Scenario');
      expect(result.scenario.forecastPeriodMonths).toBe(12);
    });
  });

  describe('revenue projections', () => {
    it('applies revenue growth rate', () => {
      const result = EbitdaForecaster.forecast(basicInput);

      const firstMonth = result.forecast[0]!;
      const lastMonth = result.forecast[11]!;

      // Revenue should grow over time
      expect(lastMonth.revenue).toBeGreaterThan(firstMonth.revenue);
    });

    it('zero growth keeps revenue stable', () => {
      const noGrowthInput: ScenarioInput = {
        ...basicInput,
        revenueGrowthRate: 0,
      };

      const result = EbitdaForecaster.forecast(noGrowthInput);

      // First and last months should be very similar
      const firstRevenue = result.forecast[0]!.revenue;
      const lastRevenue = result.forecast[11]!.revenue;

      // Allow for seasonality and other factors
      expect(Math.abs(lastRevenue - firstRevenue) / firstRevenue).toBeLessThan(0.15);
    });

    it('handles seasonality factors', () => {
      const seasonalInput: ScenarioInput = {
        ...basicInput,
        economicFactors: {
          marketGrowth: 0,
          competitionFactor: 1,
          seasonalityFactors: [0.8, 0.9, 1.0, 1.0, 1.1, 1.2, 1.2, 1.1, 1.0, 1.0, 1.1, 1.5],
        },
      };

      const result = EbitdaForecaster.forecast(seasonalInput);

      // Revenue should vary by month
      const revenues = result.forecast.map((f) => f.revenue);
      const minRevenue = Math.min(...revenues);
      const maxRevenue = Math.max(...revenues);

      expect(maxRevenue).toBeGreaterThan(minRevenue);
    });

    it('applies market growth and competition factors', () => {
      const competitiveInput: ScenarioInput = {
        ...basicInput,
        economicFactors: {
          marketGrowth: 0.12,
          competitionFactor: 0.8,
        },
      };

      const baseline = EbitdaForecaster.forecast({
        ...basicInput,
        economicFactors: {
          marketGrowth: 0.12,
          competitionFactor: 1,
        },
      });
      const competitive = EbitdaForecaster.forecast(competitiveInput);

      expect(competitive.forecast[0]!.revenue).toBeLessThan(baseline.forecast[0]!.revenue);
    });
  });

  describe('expense projections', () => {
    it('applies operating expense growth rate', () => {
      const result = EbitdaForecaster.forecast(basicInput);

      const firstMonth = result.forecast[0]!;
      const lastMonth = result.forecast[11]!;

      // Expenses should grow over time
      expect(lastMonth.operatingExpenses).toBeGreaterThan(firstMonth.operatingExpenses);
    });

    it('includes employee costs in operating expenses', () => {
      const result = EbitdaForecaster.forecast(basicInput);

      const firstMonth = result.forecast[0]!;
      expect(firstMonth.employeeCosts).toBeGreaterThan(0);
    });

    it('applies inflation to costs', () => {
      const highInflationInput: ScenarioInput = {
        ...basicInput,
        inflationRate: 0.1, // 10%
      };

      const result = EbitdaForecaster.forecast(highInflationInput);

      const firstCosts = result.forecast[0]!.operatingExpenses;
      const lastCosts = result.forecast[11]!.operatingExpenses;

      // Higher inflation should increase costs more
      const growthRate = (lastCosts - firstCosts) / firstCosts;
      expect(growthRate).toBeGreaterThan(0.05);
    });
  });

  describe('employee tracking', () => {
    it('tracks current employee count', () => {
      const result = EbitdaForecaster.forecast(basicInput);

      expect(result.forecast[0]!.employeeCount).toBe(1);
    });

    it('adds new employees at specified months', () => {
      const inputWithNewHire: ScenarioInput = {
        ...basicInput,
        newEmployees: [
          {
            ...baseEmployee,
            id: 'emp2',
            name: 'Jane Doe',
            startMonth: 6,
          },
        ],
      };

      const result = EbitdaForecaster.forecast(inputWithNewHire);

      expect(result.forecast[5]!.employeeCount).toBe(2); // Month 6 (0-indexed = 5)
      expect(result.forecast[4]!.employeeCount).toBe(1); // Month 5 still has 1
    });

    it('tracks billable hours', () => {
      const result = EbitdaForecaster.forecast(basicInput);

      expect(result.forecast[0]!.billableHours).toBeGreaterThan(0);
    });

    it('applies billable hours growth rate', () => {
      const hoursGrowthInput: ScenarioInput = {
        ...basicInput,
        billableHoursGrowthRate: 0.05, // 5% monthly growth
      };

      const result = EbitdaForecaster.forecast(hoursGrowthInput);

      expect(result.forecast[11]!.billableHours).toBeGreaterThan(result.forecast[0]!.billableHours);
    });
  });

  describe('EBITDA calculations', () => {
    it('calculates EBITDA correctly', () => {
      const result = EbitdaForecaster.forecast(basicInput);

      const month = result.forecast[0]!;
      // EBITDA = Gross Profit - Operating Expenses
      expect(month.ebitda).toBe(month.grossProfit - month.operatingExpenses);
    });

    it('calculates EBIT from EBITDA', () => {
      const result = EbitdaForecaster.forecast(basicInput);

      const month = result.forecast[0]!;
      // EBIT = EBITDA - Depreciation - Amortization
      expect(month.ebit).toBeCloseTo(month.ebitda - month.depreciation - month.amortization, 2);
    });

    it('calculates net income', () => {
      const result = EbitdaForecaster.forecast(basicInput);

      const month = result.forecast[0]!;
      // Net Income = EBT - Taxes
      expect(month.netIncome).toBe(month.ebt - month.taxes);
    });

    it('calculates EBITDA margin', () => {
      const result = EbitdaForecaster.forecast(basicInput);

      const month = result.forecast[0]!;
      expect(month.ebitdaMargin).toBeCloseTo((month.ebitda / month.revenue) * 100, 2);
    });
  });

  describe('summary metrics', () => {
    it('calculates total revenue', () => {
      const result = EbitdaForecaster.forecast(basicInput);

      const expectedTotal = result.forecast.reduce((sum, f) => sum + f.revenue, 0);
      expect(result.summary.totalRevenue).toBeCloseTo(expectedTotal, 0);
    });

    it('calculates total EBITDA', () => {
      const result = EbitdaForecaster.forecast(basicInput);

      const expectedTotal = result.forecast.reduce((sum, f) => sum + f.ebitda, 0);
      expect(result.summary.totalEbitda).toBeCloseTo(expectedTotal, 0);
    });

    it('calculates average EBITDA margin', () => {
      const result = EbitdaForecaster.forecast(basicInput);

      expect(result.summary.averageEbitdaMargin).toBeGreaterThan(0);
    });

    it('reports final employee count', () => {
      const result = EbitdaForecaster.forecast(basicInput);

      expect(result.summary.finalEmployeeCount).toBe(1);
    });

    it('calculates revenue growth', () => {
      const result = EbitdaForecaster.forecast(basicInput);

      expect(result.summary.revenueGrowth).toBeGreaterThan(0);
    });

    it('handles zero baseline revenue', () => {
      const zeroBaseline: ScenarioInput = {
        ...basicInput,
        currentMonthlyFinancials: [
          {
            ...baseFinancials,
            revenue: 0,
            costOfGoodsSold: 0,
            operatingExpenses: 0,
          },
        ],
        currentEmployees: [],
        revenueGrowthRate: 0,
      };

      const result = EbitdaForecaster.forecast(zeroBaseline);
      expect(result.summary.revenueGrowth).toBe(0);
      expect(result.summary.ebitdaGrowth).toBe(0);
      expect(result.keyMetrics.revenuePerBillableHour).toBe(0);
    });
  });

  describe('key metrics', () => {
    it('calculates revenue per employee', () => {
      const result = EbitdaForecaster.forecast(basicInput);

      expect(result.keyMetrics.revenuePerEmployee).toBeGreaterThan(0);
    });

    it('calculates EBITDA per employee', () => {
      const result = EbitdaForecaster.forecast(basicInput);

      expect(result.keyMetrics.ebitdaPerEmployee).toBeDefined();
    });

    it('calculates average billable hours', () => {
      const result = EbitdaForecaster.forecast(basicInput);

      expect(result.keyMetrics.averageBillableHours).toBeGreaterThan(0);
    });

    it('calculates revenue per billable hour', () => {
      const result = EbitdaForecaster.forecast(basicInput);

      expect(result.keyMetrics.revenuePerBillableHour).toBeGreaterThan(0);
    });
  });

  describe('additional expenses', () => {
    it('includes additional expenses', () => {
      const inputWithExpenses: ScenarioInput = {
        ...basicInput,
        additionalExpenses: [
          {
            id: 'exp1',
            name: 'Software License',
            category: 'fixed',
            amount: 5000,
            frequency: 'monthly',
            isRecurring: true,
            startMonth: 1,
          },
        ],
      };

      const result = EbitdaForecaster.forecast(inputWithExpenses);

      // Operating expenses should be higher
      expect(result.summary.totalOperatingExpenses).toBeGreaterThan(
        EbitdaForecaster.forecast(basicInput).summary.totalOperatingExpenses
      );
    });

    it('handles quarterly expenses', () => {
      const inputWithQuarterly: ScenarioInput = {
        ...basicInput,
        additionalExpenses: [
          {
            id: 'exp1',
            name: 'Quarterly Payment',
            category: 'fixed',
            amount: 10000,
            frequency: 'quarterly',
            isRecurring: true,
            startMonth: 1,
          },
        ],
      };

      const result = EbitdaForecaster.forecast(inputWithQuarterly);

      // Should show expense in quarters
      expect(result.forecast).toHaveLength(12);
    });

    it('applies annual expenses in month 12', () => {
      const inputWithAnnual: ScenarioInput = {
        ...basicInput,
        currentMonthlyFinancials: [
          {
            ...baseFinancials,
            operatingExpenses: 0,
          },
        ],
        currentEmployees: [],
        operatingExpenseGrowthRate: 0,
        inflationRate: 0,
        additionalExpenses: [
          {
            id: 'expA',
            name: 'Annual Fee',
            category: 'fixed',
            amount: 12000,
            frequency: 'annually',
            isRecurring: true,
            startMonth: 1,
          },
        ],
      };

      const result = EbitdaForecaster.forecast(inputWithAnnual);
      expect(result.forecast[10]!.operatingExpenses).toBe(0);
      expect(result.forecast[11]!.operatingExpenses).toBeGreaterThan(0);
    });
  });

  describe('scenario comparison', () => {
    it('compares multiple scenarios', () => {
      const scenario1 = EbitdaForecaster.forecast(basicInput);
      const scenario2 = EbitdaForecaster.forecast({
        ...basicInput,
        name: 'Aggressive Growth',
        revenueGrowthRate: 0.05,
      });

      const comparison = EbitdaForecaster.compareScenarios([scenario1, scenario2]);

      expect(comparison.comparison).toHaveLength(2);
      expect(comparison.bestScenario).toBeDefined();
    });

    it('ranks scenarios by EBITDA', () => {
      const lowGrowth = EbitdaForecaster.forecast({
        ...basicInput,
        name: 'Low Growth',
        revenueGrowthRate: 0.01,
      });
      const highGrowth = EbitdaForecaster.forecast({
        ...basicInput,
        name: 'High Growth',
        revenueGrowthRate: 0.05,
      });

      const comparison = EbitdaForecaster.compareScenarios([lowGrowth, highGrowth]);

      // High growth should rank first
      expect(comparison.comparison[0]!.scenarioName).toBe('High Growth');
    });

    it('generates comparison insights', () => {
      const scenario1 = EbitdaForecaster.forecast(basicInput);
      const scenario2 = EbitdaForecaster.forecast({
        ...basicInput,
        name: 'Alternative',
        revenueGrowthRate: 0.03,
      });

      const comparison = EbitdaForecaster.compareScenarios([scenario1, scenario2]);

      expect(comparison.insights).toBeDefined();
      expect(Array.isArray(comparison.insights)).toBe(true);
    });

    it('highlights margin and efficiency differences', () => {
      const scenario1 = EbitdaForecaster.forecast({
        ...basicInput,
        name: 'High EBITDA',
        currentEmployees: [
          baseEmployee,
          { ...baseEmployee, id: 'emp2', name: 'Jane Doe' },
          { ...baseEmployee, id: 'emp3', name: 'Sam Doe' },
        ],
        revenueGrowthRate: 0.06,
        operatingExpenseGrowthRate: 0.03,
      });
      const scenario2 = EbitdaForecaster.forecast({
        ...basicInput,
        name: 'High Margin',
        currentEmployees: [baseEmployee],
        revenueGrowthRate: 0.005,
        operatingExpenseGrowthRate: -0.02,
      });

      const comparison = EbitdaForecaster.compareScenarios([scenario1, scenario2]);
      expect(comparison.insights.length).toBeGreaterThan(0);
    });

    it('adds highest margin insight when not best by EBITDA', () => {
      const scenarioA = {
        scenario: { name: 'Scenario A', forecastPeriodMonths: 12 },
        forecast: [],
        summary: {
          totalRevenue: 100000,
          totalEbitda: 60000,
          averageEbitdaMargin: 10,
          totalEmployeeCosts: 0,
          totalOperatingExpenses: 0,
          finalEmployeeCount: 3,
          revenueGrowth: 0,
          ebitdaGrowth: 0,
        },
        keyMetrics: {
          revenuePerEmployee: 0,
          ebitdaPerEmployee: 0,
          averageBillableHours: 0,
          revenuePerBillableHour: 0,
        },
      } as EbitdaForecastResult;

      const scenarioB = {
        scenario: { name: 'Scenario B', forecastPeriodMonths: 12 },
        forecast: [],
        summary: {
          totalRevenue: 80000,
          totalEbitda: 40000,
          averageEbitdaMargin: 50,
          totalEmployeeCosts: 0,
          totalOperatingExpenses: 0,
          finalEmployeeCount: 2,
          revenueGrowth: 0,
          ebitdaGrowth: 0,
        },
        keyMetrics: {
          revenuePerEmployee: 0,
          ebitdaPerEmployee: 0,
          averageBillableHours: 0,
          revenuePerBillableHour: 0,
        },
      } as EbitdaForecastResult;

      const comparison = EbitdaForecaster.compareScenarios([scenarioA, scenarioB]);
      expect(comparison.insights.some((item) => item.includes('highest EBITDA margin'))).toBe(true);
    });

    it('adds per-employee insight for single scenario', () => {
      const scenario = EbitdaForecaster.forecast({
        ...basicInput,
        name: 'Single Scenario',
      });

      const comparison = EbitdaForecaster.compareScenarios([scenario]);
      expect(comparison.insights.length).toBe(1);
      expect(comparison.insights[0]).toContain('EBITDA per employee');
    });
  });

  describe('edge cases', () => {
    it('throws error with empty financials', () => {
      const emptyInput: ScenarioInput = {
        ...basicInput,
        currentMonthlyFinancials: [],
      };

      expect(() => EbitdaForecaster.forecast(emptyInput)).toThrow();
    });

    it('handles no employees', () => {
      const noEmployeesInput: ScenarioInput = {
        ...basicInput,
        currentEmployees: [],
      };

      const result = EbitdaForecaster.forecast(noEmployeesInput);

      expect(result.forecast[0]!.employeeCount).toBe(0);
    });

    it('handles short forecast period', () => {
      const shortInput: ScenarioInput = {
        ...basicInput,
        forecastPeriodMonths: 3,
      };

      const result = EbitdaForecaster.forecast(shortInput);

      expect(result.forecast).toHaveLength(3);
    });

    it('handles long forecast period', () => {
      const longInput: ScenarioInput = {
        ...basicInput,
        forecastPeriodMonths: 36,
      };

      const result = EbitdaForecaster.forecast(longInput);

      expect(result.forecast).toHaveLength(36);
    });
  });
});
