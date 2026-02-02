import { describe, expect, it } from 'vitest';
import { EbitdaForecaster } from '../engines/ebitda-forecasting';

describe('EBITDA Forecasting End-to-End Workflow', () => {
  it('should handle a complete service industry forecasting scenario', () => {
    // Sample data for a consulting firm
    const scenarioInput = {
      name: 'Consulting Firm Growth Plan',
      description: ' 12-month forecast with planned hiring and expansion',
      forecastPeriodMonths: 12,

      // Base this on current financials (using Q4 2024 as baseline)
      currentMonthlyFinancials: [
        {
          month: 12,
          year: 2024,
          revenue: 300000, // $300K monthly revenue (increased for better margins)
          costOfGoodsSold: 30000, // 10% of revenue for COGS
          operatingExpenses: 80000, // $80k operating expenses (increased but proportional)
          depreciation: 3000, // $3k depreciation
          amortization: 1000, // $1k amortization
          interestExpense: 1500, // $1.5k interest
          taxes: 25000, // $25k taxes (proportional to higher revenue)
        },
      ],

      // Current team (adjusted for higher revenue base)
      currentEmployees: [
        {
          id: 'emp-1',
          name: 'Senior Consultant',
          role: 'Senior Consultant',
          department: 'Consulting',
          billableHoursPerMonth: 160, // Increased billable hours
          hourlyRate: 250, // Increased rate for higher revenue
          salary: 140000, // Adjusted salary
          benefits: 28000, // 20% of salary
          startDate: '2024-01-01T00:00:00Z',
          isActive: true,
        },
        {
          id: 'emp-2',
          name: 'Junior Consultant',
          role: 'Consultant',
          department: 'Consulting',
          billableHoursPerMonth: 150, // Good utilization
          hourlyRate: 180, // Increased rate
          salary: 95000, // Adjusted salary
          benefits: 19000, // 20% of salary
          startDate: '2024-01-01T00:00:00Z',
          isActive: true,
        },
      ],

      // Planned new hires
      newEmployees: [
        {
          id: 'emp-3',
          name: 'New Senior Consultant',
          role: 'Senior Consultant',
          department: 'Consulting',
          billableHoursPerMonth: 145,
          hourlyRate: 220,
          salary: 125000,
          benefits: 25000,
          startDate: '2025-06-01T00:00:00Z',
          isActive: true,
          startMonth: 6, // Hiring in month 6
        },
        {
          id: 'emp-4',
          name: 'Business Analyst',
          role: 'Analyst',
          department: 'Analytics',
          billableHoursPerMonth: 140,
          hourlyRate: 120,
          salary: 70000,
          benefits: 14000,
          startDate: '2025-09-01T00:00:00Z',
          isActive: true,
          startMonth: 9, // Hiring in month 9
        },
      ],

      // Revenue growth assumptions (more conservative)
      revenueGrowthRate: 0.02, // 2% monthly growth
      billableHoursGrowthRate: 0.01, // 1% growth in billable hours efficiency

      // Additional expenses for growth
      additionalExpenses: [
        {
          id: 'exp-1',
          name: 'Marketing & Sales',
          category: 'variable' as const,
          amount: 5000,
          frequency: 'monthly' as const,
          isRecurring: true,
          description: 'Digital marketing and sales initiatives',
          startMonth: 1,
        },
        {
          id: 'exp-2',
          name: 'Technology Upgrade',
          category: 'fixed' as const,
          amount: 3000,
          frequency: 'monthly' as const,
          isRecurring: true,
          description: 'Software licenses and infrastructure',
          startMonth: 1,
        },
        {
          id: 'exp-3',
          name: 'Office Equipment',
          category: 'fixed' as const,
          amount: 2000,
          frequency: 'monthly' as const,
          isRecurring: false,
          description: 'Equipment for new hires',
          startMonth: 6,
        },
      ],

      operatingExpenseGrowthRate: 0.015, // 1.5% monthly growth in operating expenses (more conservative)
      inflationRate: 0.02, // 2% annual inflation

      // Market conditions
      economicFactors: {
        marketGrowth: 0.05, // 5% market growth
        competitionFactor: 1.1, // Slightly above average competition
        seasonalityFactors: [
          0.9, // Jan - slower
          0.9, // Feb - slower
          1.1, // Mar - busy
          1.1, // Apr - busy
          1.0, // May - normal
          1.0, // Jun - normal
          0.8, // Jul - vacation season
          0.8, // Aug - vacation season
          1.2, // Sep - back to work rush
          1.1, // Oct - busy
          1.0, // Nov - normal
          0.9, // Dec - holidays
        ],
      },
    };

    const forecast = EbitdaForecaster.forecast(scenarioInput);

    // Validate forecast structure
    expect(forecast.scenario).toBeDefined();
    expect(forecast.scenario.name).toBe('Consulting Firm Growth Plan');
    expect(forecast.forecast).toHaveLength(12);
    expect(forecast.summary).toBeDefined();
    expect(forecast.keyMetrics).toBeDefined();

    // Validate growth trajectory
    const finalMonth = forecast.forecast[11];
    const firstMonth = forecast.forecast[0];

    // Revenue should grow over the year
    expect(finalMonth.revenue).toBeGreaterThan(firstMonth.revenue);

    // Should account for new employees in revenue growth
    const midYearRevenue = forecast.forecast[5].revenue;
    const endYearRevenue = finalMonth.revenue;
    expect(endYearRevenue).toBeGreaterThan(midYearRevenue);

    // Validate summary metrics
    expect(forecast.summary.totalRevenue).toBeGreaterThan(0);
    expect(forecast.summary.totalEbitda).toBeGreaterThan(0);
    expect(forecast.summary.averageEbitdaMargin).toBeGreaterThan(0);
    expect(forecast.summary.averageEbitdaMargin).toBeLessThan(100); // Expecting percentage, not ratio
    expect(forecast.summary.finalEmployeeCount).toBe(4); // 2 current + 2 new
    expect(forecast.summary.revenueGrowth).toBeGreaterThan(0);

    // Validate key metrics
    expect(forecast.keyMetrics.revenuePerEmployee).toBeGreaterThan(0);
    expect(forecast.keyMetrics.ebitdaPerEmployee).toBeGreaterThan(0);
    expect(forecast.keyMetrics.averageBillableHours).toBeGreaterThan(0);
    expect(forecast.keyMetrics.revenuePerBillableHour).toBeGreaterThan(0);

    // Employee count should increase mid-year and again in month 9
    const earlyMonth = forecast.forecast[4]; // Month 5
    const midMonth = forecast.forecast[6]; // Month 7 (after June hire)
    const lateMonth = forecast.forecast[10]; // Month 11 (after September hire)

    expect(midMonth.employeeCount).toBeGreaterThan(earlyMonth.employeeCount);
    expect(lateMonth.employeeCount).toBeGreaterThan(midMonth.employeeCount);

    console.log('🎉 End-to-End Test Results:');
    console.log(`📈 Total Revenue: $${forecast.summary.totalRevenue.toLocaleString()}`);
    console.log(`💰 Total EBITDA: $${forecast.summary.totalEbitda.toLocaleString()}`);
    console.log(
      `� Average EBITDA Margin: ${(forecast.summary.averageEbitdaMargin * 100).toFixed(1)}%`
    );
    console.log(`� Final Employee Count: ${forecast.summary.finalEmployeeCount}`);
    console.log(`� Revenue Growth: ${(forecast.summary.revenueGrowth * 100).toFixed(1)}%`);
  });

  it('should handle minimal valid input gracefully', () => {
    const minimalInput = {
      name: 'Minimal Test',
      forecastPeriodMonths: 6,
      currentMonthlyFinancials: [
        {
          month: 12,
          year: 2024,
          revenue: 50000,
          costOfGoodsSold: 10000,
          operatingExpenses: 30000,
          depreciation: 1000,
          amortization: 500,
          interestExpense: 200,
          taxes: 2000,
        },
      ],
      currentEmployees: [],
      newEmployees: [],
      revenueGrowthRate: 0.05,
      billableHoursGrowthRate: 0.0,
      additionalExpenses: [],
      operatingExpenseGrowthRate: 0.0,
      inflationRate: 0.025,
    };

    const forecast = EbitdaForecaster.forecast(minimalInput);

    expect(forecast.forecast).toHaveLength(6);
    expect(forecast.summary.totalRevenue).toBeGreaterThan(0);
    expect(forecast.summary.finalEmployeeCount).toBe(0);

    // Should handle empty employee arrays gracefully
    expect(forecast.keyMetrics.revenuePerEmployee).toBe(0); // No employees
    expect(forecast.keyMetrics.averageBillableHours).toBe(0);
  });

  it('should calculate seasonality impact correctly', () => {
    const input = {
      name: 'Seasonality Test',
      forecastPeriodMonths: 12,
      currentMonthlyFinancials: [
        {
          month: 12,
          year: 2024,
          revenue: 10000, // $10K monthly base
          costOfGoodsSold: 2000,
          operatingExpenses: 6000,
          depreciation: 500,
          amortization: 200,
          interestExpense: 100,
          taxes: 800,
        },
      ],
      currentEmployees: [],
      newEmployees: [],
      revenueGrowthRate: 0.0, // No base growth to isolate seasonality
      billableHoursGrowthRate: 0.0,
      additionalExpenses: [],
      operatingExpenseGrowthRate: 0.0,
      inflationRate: 0.025,
      economicFactors: {
        marketGrowth: 0.0,
        competitionFactor: 1.0,
        seasonalityFactors: [
          2.0, // Jan - double revenue
          0.5, // Feb - half revenue
          1.0, // Mar - normal
          1.0,
          1.0,
          1.0,
          1.0,
          1.0,
          1.0,
          1.0,
          1.0,
          1.0, // Rest normal
        ],
      },
    };

    const forecast = EbitdaForecaster.forecast(input);

    const janRevenue = forecast.forecast[0].revenue;
    const febRevenue = forecast.forecast[1].revenue;
    const marRevenue = forecast.forecast[2].revenue;

    // January should be roughly double March
    expect(janRevenue).toBeCloseTo(marRevenue * 2, -2);

    // February should be roughly half of March
    expect(febRevenue).toBeCloseTo(marRevenue * 0.5, -2);
  });
});
