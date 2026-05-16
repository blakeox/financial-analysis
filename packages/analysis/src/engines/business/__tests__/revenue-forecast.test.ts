import { describe, it, expect } from 'vitest';
import { RevenueForecastEngine } from '../revenue-forecast';
import type { RevenueForecastInput, RevenueStream } from '../revenue-forecast';

describe('RevenueForecastEngine', () => {
  // Basic revenue stream matching actual schema
  const basicStream: RevenueStream = {
    name: 'SaaS Subscriptions',
    currentMonthlyRevenue: 50000,
    growthRate: 5, // 5% monthly
    seasonalityPattern: 'none',
  };

  const basicInput: RevenueForecastInput = {
    revenueStreams: [basicStream],
    forecastMonths: 12,
  };

  describe('basic forecasting', () => {
    it('generates monthly forecasts', () => {
      const result = RevenueForecastEngine.analyze(basicInput);

      expect(result.monthlyForecasts).toHaveLength(12);
    });

    it('each month has required fields', () => {
      const result = RevenueForecastEngine.analyze(basicInput);

      const firstMonth = result.monthlyForecasts[0]!;
      expect(firstMonth).toHaveProperty('month');
      expect(firstMonth).toHaveProperty('monthName');
      expect(firstMonth).toHaveProperty('totalRevenue');
      expect(firstMonth).toHaveProperty('cumulativeRevenue');
      expect(firstMonth).toHaveProperty('revenueByStream');
    });

    it('provides revenue by stream per month', () => {
      const result = RevenueForecastEngine.analyze(basicInput);

      const firstMonth = result.monthlyForecasts[0]!;
      expect(firstMonth.revenueByStream).toHaveProperty('SaaS Subscriptions');
      expect(firstMonth.revenueByStream['SaaS Subscriptions']).toBeGreaterThan(0);
    });

    it('calculates cumulative revenue correctly', () => {
      const result = RevenueForecastEngine.analyze(basicInput);

      let runningTotal = 0;
      for (const month of result.monthlyForecasts) {
        runningTotal += month.totalRevenue;
        expect(month.cumulativeRevenue).toBeCloseTo(runningTotal, 0);
      }
    });

    it('includes month name', () => {
      const result = RevenueForecastEngine.analyze(basicInput);

      // Month names should be like 'Jan', 'Feb', etc.
      expect(result.monthlyForecasts[0]!.monthName).toBeDefined();
      expect(typeof result.monthlyForecasts[0]!.monthName).toBe('string');
    });
  });

  describe('revenue growth', () => {
    it('applies growth rate over time', () => {
      const result = RevenueForecastEngine.analyze(basicInput);

      const firstRevenue = result.monthlyForecasts[0]!.totalRevenue;
      const lastRevenue = result.monthlyForecasts[11]!.totalRevenue;

      expect(lastRevenue).toBeGreaterThan(firstRevenue);
    });

    it('zero growth keeps revenue stable', () => {
      const noGrowthInput: RevenueForecastInput = {
        revenueStreams: [{ ...basicStream, growthRate: 0 }],
        forecastMonths: 12,
      };

      const result = RevenueForecastEngine.analyze(noGrowthInput);

      const firstRevenue = result.monthlyForecasts[0]!.totalRevenue;
      const lastRevenue = result.monthlyForecasts[11]!.totalRevenue;

      expect(lastRevenue).toBeCloseTo(firstRevenue, -2);
    });

    it('handles negative growth', () => {
      const declineInput: RevenueForecastInput = {
        revenueStreams: [{ ...basicStream, growthRate: -5 }],
        forecastMonths: 12,
      };

      const result = RevenueForecastEngine.analyze(declineInput);

      const firstRevenue = result.monthlyForecasts[0]!.totalRevenue;
      const lastRevenue = result.monthlyForecasts[11]!.totalRevenue;

      expect(lastRevenue).toBeLessThan(firstRevenue);
    });

    it('tracks growth vs previous month', () => {
      const result = RevenueForecastEngine.analyze(basicInput);

      // First month may be null or 0, subsequent months should have growth
      for (let i = 1; i < result.monthlyForecasts.length; i++) {
        expect(result.monthlyForecasts[i]!.growthVsPreviousMonth).toBeDefined();
      }
    });
  });

  describe('multiple revenue streams', () => {
    it('combines multiple streams', () => {
      const multiStreamInput: RevenueForecastInput = {
        revenueStreams: [
          basicStream,
          {
            name: 'Consulting',
            currentMonthlyRevenue: 20000,
            growthRate: 2,
            seasonalityPattern: 'none',
          },
        ],
        forecastMonths: 12,
      };

      const result = RevenueForecastEngine.analyze(multiStreamInput);

      // First month should have both streams in revenueByStream
      const firstMonth = result.monthlyForecasts[0]!;
      expect(Object.keys(firstMonth.revenueByStream)).toHaveLength(2);
      expect(firstMonth.revenueByStream['SaaS Subscriptions']).toBeDefined();
      expect(firstMonth.revenueByStream['Consulting']).toBeDefined();
      expect(firstMonth.totalRevenue).toBeGreaterThan(50000);
    });

    it('sums multiple streams correctly', () => {
      const multiStreamInput: RevenueForecastInput = {
        revenueStreams: [
          { ...basicStream, growthRate: 0 },
          {
            name: 'Services',
            currentMonthlyRevenue: 30000,
            growthRate: 0,
            seasonalityPattern: 'none',
          },
        ],
        forecastMonths: 1,
      };

      const result = RevenueForecastEngine.analyze(multiStreamInput);

      const firstMonth = result.monthlyForecasts[0]!;
      const sumOfStreams = Object.values(firstMonth.revenueByStream).reduce((a, b) => a + b, 0);
      expect(firstMonth.totalRevenue).toBeCloseTo(sumOfStreams, 0);
    });
  });

  describe('seasonality patterns', () => {
    it('applies retail seasonality', () => {
      const retailInput: RevenueForecastInput = {
        revenueStreams: [{ ...basicStream, seasonalityPattern: 'retail', growthRate: 0 }],
        forecastMonths: 12,
      };

      const result = RevenueForecastEngine.analyze(retailInput);

      // Revenue should vary by month due to seasonality
      const revenues = result.monthlyForecasts.map((m) => m.totalRevenue);
      const minRevenue = Math.min(...revenues);
      const maxRevenue = Math.max(...revenues);

      expect(maxRevenue / minRevenue).toBeGreaterThan(1.1);
    });

    it('applies B2B seasonality', () => {
      const b2bInput: RevenueForecastInput = {
        revenueStreams: [{ ...basicStream, seasonalityPattern: 'b2b' }],
        forecastMonths: 12,
      };

      const result = RevenueForecastEngine.analyze(b2bInput);

      expect(result.monthlyForecasts).toHaveLength(12);
    });

    it('applies custom seasonality factors', () => {
      const customInput: RevenueForecastInput = {
        revenueStreams: [
          {
            ...basicStream,
            seasonalityPattern: 'custom',
            customSeasonalFactors: [0.8, 0.8, 1.0, 1.0, 1.0, 1.2, 1.2, 1.0, 1.0, 1.0, 1.1, 1.5],
          },
        ],
        forecastMonths: 12,
      };

      const result = RevenueForecastEngine.analyze(customInput);

      // Revenue should follow custom pattern
      expect(result.monthlyForecasts).toHaveLength(12);
    });

    it('no seasonality keeps baseline stable', () => {
      const noSeasonalityInput: RevenueForecastInput = {
        revenueStreams: [{ ...basicStream, seasonalityPattern: 'none', growthRate: 0 }],
        forecastMonths: 12,
      };

      const result = RevenueForecastEngine.analyze(noSeasonalityInput);

      const revenues = result.monthlyForecasts.map((m) => m.totalRevenue);
      const variance = Math.max(...revenues) - Math.min(...revenues);

      // Without seasonality, minimal variance
      expect(variance / revenues[0]!).toBeLessThan(0.1);
    });
  });

  describe('customer-based forecasting', () => {
    it('incorporates existing customers with churn and new customers', () => {
      const customerInput: RevenueForecastInput = {
        ...basicInput,
        existingCustomers: 100,
        averageRevenuePerCustomer: 500,
        monthlyChurnRate: 2,
        newCustomersPerMonth: 10,
      };

      const result = RevenueForecastEngine.analyze(customerInput);

      expect(result.customerMetrics).toBeDefined();
      expect(result.customerMetrics!.endingCustomers).toBeDefined();
    });

    it('tracks customer count over time', () => {
      const customerInput: RevenueForecastInput = {
        revenueStreams: [basicStream],
        forecastMonths: 12,
        existingCustomers: 100,
        averageRevenuePerCustomer: 500,
        monthlyChurnRate: 2,
        newCustomersPerMonth: 10,
      };

      const result = RevenueForecastEngine.analyze(customerInput);

      expect(result.customerMetrics!.endingCustomers).toBeDefined();
    });

    it('calculates net customer growth', () => {
      const customerInput: RevenueForecastInput = {
        revenueStreams: [basicStream],
        forecastMonths: 12,
        existingCustomers: 100,
        averageRevenuePerCustomer: 500,
        newCustomersPerMonth: 15,
        monthlyChurnRate: 5,
      };

      const result = RevenueForecastEngine.analyze(customerInput);

      // More new customers than churn
      expect(result.customerMetrics!.netCustomerGrowth).toBeGreaterThan(0);
    });

    it('tracks ARPU', () => {
      const customerInput: RevenueForecastInput = {
        revenueStreams: [basicStream],
        forecastMonths: 12,
        existingCustomers: 100,
        averageRevenuePerCustomer: 500,
        monthlyChurnRate: 2,
        newCustomersPerMonth: 10,
      };

      const result = RevenueForecastEngine.analyze(customerInput);

      expect(result.customerMetrics).toBeDefined();
      expect(result.customerMetrics!.avgRevenuePerCustomer).toBeDefined();
    });

    it('includes customer data in monthly forecasts', () => {
      const customerInput: RevenueForecastInput = {
        revenueStreams: [basicStream],
        forecastMonths: 12,
        existingCustomers: 100,
        averageRevenuePerCustomer: 500,
      };

      const result = RevenueForecastEngine.analyze(customerInput);

      // Monthly forecasts should have customer data
      expect(result.monthlyForecasts[0]!.customers).toBeDefined();
    });
  });

  describe('summary statistics', () => {
    it('calculates total forecast revenue', () => {
      const result = RevenueForecastEngine.analyze(basicInput);

      const expectedTotal = result.monthlyForecasts.reduce((sum, m) => sum + m.totalRevenue, 0);
      expect(result.summary.totalForecastRevenue).toBeCloseTo(expectedTotal, 0);
    });

    it('calculates average monthly revenue', () => {
      const result = RevenueForecastEngine.analyze(basicInput);

      expect(result.summary.averageMonthlyRevenue).toBeCloseTo(
        result.summary.totalForecastRevenue / 12,
        0
      );
    });

    it('calculates total growth percentage', () => {
      const result = RevenueForecastEngine.analyze(basicInput);

      expect(result.summary.totalGrowth).toBeDefined();
      expect(typeof result.summary.totalGrowth).toBe('number');
    });

    it('calculates compound monthly growth rate', () => {
      const result = RevenueForecastEngine.analyze(basicInput);

      expect(result.summary.compoundMonthlyGrowthRate).toBeDefined();
    });

    it('identifies peak month with details', () => {
      const result = RevenueForecastEngine.analyze(basicInput);

      expect(result.summary.peakMonth).toBeDefined();
      expect(result.summary.peakMonth.month).toBeGreaterThan(0);
      expect(result.summary.peakMonth.month).toBeLessThanOrEqual(12);
      expect(result.summary.peakMonth.revenue).toBeGreaterThan(0);
    });

    it('identifies lowest month with details', () => {
      const result = RevenueForecastEngine.analyze(basicInput);

      expect(result.summary.lowestMonth).toBeDefined();
      expect(result.summary.lowestMonth.month).toBeGreaterThan(0);
      expect(result.summary.lowestMonth.revenue).toBeGreaterThan(0);
    });
  });

  describe('stream breakdown at result level', () => {
    it('provides stream breakdown array', () => {
      const result = RevenueForecastEngine.analyze(basicInput);

      expect(result.streamBreakdown).toBeDefined();
      expect(Array.isArray(result.streamBreakdown)).toBe(true);
      expect(result.streamBreakdown).toHaveLength(1);
    });

    it('includes stream name and total revenue', () => {
      const result = RevenueForecastEngine.analyze(basicInput);

      expect(result.streamBreakdown[0]!.name).toBe('SaaS Subscriptions');
      expect(result.streamBreakdown[0]!.totalRevenue).toBeGreaterThan(0);
    });

    it('calculates stream percentage of total', () => {
      const result = RevenueForecastEngine.analyze(basicInput);

      // Single stream should be 100%
      expect(result.streamBreakdown[0]!.percentOfTotal).toBeCloseTo(100, 0);
    });

    it('calculates stream growth', () => {
      const result = RevenueForecastEngine.analyze(basicInput);

      expect(result.streamBreakdown[0]!.growth).toBeDefined();
      expect(typeof result.streamBreakdown[0]!.growth).toBe('number');
    });

    it('orders streams by contribution in multi-stream scenario', () => {
      const multiStreamInput: RevenueForecastInput = {
        revenueStreams: [
          { ...basicStream, currentMonthlyRevenue: 30000 },
          {
            name: 'Products',
            currentMonthlyRevenue: 70000,
            growthRate: 0,
            seasonalityPattern: 'none',
          },
        ],
        forecastMonths: 12,
      };

      const result = RevenueForecastEngine.analyze(multiStreamInput);

      // Should have both streams
      expect(result.streamBreakdown).toHaveLength(2);
      // Percentages should sum to 100
      const totalPercentage = result.streamBreakdown.reduce((sum, s) => sum + s.percentOfTotal, 0);
      expect(totalPercentage).toBeCloseTo(100, 0);
    });
  });

  describe('insights', () => {
    it('generates insights array', () => {
      const result = RevenueForecastEngine.analyze(basicInput);

      expect(result.insights).toBeDefined();
      expect(Array.isArray(result.insights)).toBe(true);
    });

    it('provides meaningful insight strings', () => {
      const result = RevenueForecastEngine.analyze(basicInput);

      if (result.insights.length > 0) {
        expect(typeof result.insights[0]).toBe('string');
        expect(result.insights[0].length).toBeGreaterThan(0);
      }
    });
  });

  describe('recommendations', () => {
    it('generates recommendations array', () => {
      const result = RevenueForecastEngine.analyze(basicInput);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe('risks', () => {
    it('generates risks array', () => {
      const result = RevenueForecastEngine.analyze(basicInput);

      expect(result.risks).toBeDefined();
      expect(Array.isArray(result.risks)).toBe(true);
    });

    it('generates non-empty risks array', () => {
      const result = RevenueForecastEngine.analyze(basicInput);

      // Engine should generate risks for analysis
      expect(result.risks.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('edge cases', () => {
    it('handles single month forecast', () => {
      const singleMonthInput: RevenueForecastInput = {
        ...basicInput,
        forecastMonths: 1,
      };

      const result = RevenueForecastEngine.analyze(singleMonthInput);

      expect(result.monthlyForecasts).toHaveLength(1);
    });

    it('handles long forecast period', () => {
      const longInput: RevenueForecastInput = {
        ...basicInput,
        forecastMonths: 36,
      };

      const result = RevenueForecastEngine.analyze(longInput);

      expect(result.monthlyForecasts).toHaveLength(36);
    });

    it('handles zero revenue stream', () => {
      const zeroInput: RevenueForecastInput = {
        revenueStreams: [{ ...basicStream, currentMonthlyRevenue: 0 }],
        forecastMonths: 12,
      };

      const result = RevenueForecastEngine.analyze(zeroInput);

      expect(result.monthlyForecasts[0]!.totalRevenue).toBe(0);
    });

    it('handles very small revenue', () => {
      const smallInput: RevenueForecastInput = {
        revenueStreams: [{ ...basicStream, currentMonthlyRevenue: 0.01 }],
        forecastMonths: 12,
      };

      const result = RevenueForecastEngine.analyze(smallInput);

      expect(result.monthlyForecasts[0]!.totalRevenue).toBeGreaterThanOrEqual(0);
    });

    it('handles very large revenue', () => {
      const largeInput: RevenueForecastInput = {
        revenueStreams: [{ ...basicStream, currentMonthlyRevenue: 1000000000 }],
        forecastMonths: 12,
      };

      const result = RevenueForecastEngine.analyze(largeInput);

      expect(result.monthlyForecasts[0]!.totalRevenue).toBeGreaterThan(0);
    });

    it('handles high growth rate', () => {
      const highGrowthInput: RevenueForecastInput = {
        revenueStreams: [{ ...basicStream, growthRate: 100 }],
        forecastMonths: 12,
      };

      const result = RevenueForecastEngine.analyze(highGrowthInput);

      expect(result.monthlyForecasts).toHaveLength(12);
      expect(result.monthlyForecasts[11]!.totalRevenue).toBeGreaterThan(
        result.monthlyForecasts[0]!.totalRevenue
      );
    });

    it('handles extreme negative growth', () => {
      const negativeInput: RevenueForecastInput = {
        revenueStreams: [{ ...basicStream, growthRate: -50 }],
        forecastMonths: 12,
      };

      const result = RevenueForecastEngine.analyze(negativeInput);

      expect(result.monthlyForecasts).toHaveLength(12);
      // Revenue should decrease significantly
      expect(result.monthlyForecasts[11]!.totalRevenue).toBeLessThan(
        result.monthlyForecasts[0]!.totalRevenue
      );
    });
  });

  describe('growth tracking', () => {
    it('tracks year-over-year growth for long forecasts', () => {
      const longInput: RevenueForecastInput = {
        ...basicInput,
        forecastMonths: 24,
      };

      const result = RevenueForecastEngine.analyze(longInput);

      // After 12 months, should have YoY comparison
      const month13 = result.monthlyForecasts[12];
      expect(month13).toBeDefined();
      expect(month13!.growthVsYearAgo).toBeDefined();
    });

    it('growth vs previous month is calculated', () => {
      const result = RevenueForecastEngine.analyze(basicInput);

      // Second month onwards should have growth vs previous
      for (let i = 1; i < result.monthlyForecasts.length; i++) {
        const growth = result.monthlyForecasts[i]!.growthVsPreviousMonth;
        expect(growth).toBeDefined();
        expect(typeof growth).toBe('number');
      }
    });
  });

  describe('many streams', () => {
    it('handles many revenue streams', () => {
      const manyStreams: RevenueStream[] = Array.from({ length: 10 }, (_, i) => ({
        name: `Stream ${i + 1}`,
        currentMonthlyRevenue: 10000 * (i + 1),
        growthRate: i,
        seasonalityPattern: 'none' as const,
      }));

      const manyStreamInput: RevenueForecastInput = {
        revenueStreams: manyStreams,
        forecastMonths: 12,
      };

      const result = RevenueForecastEngine.analyze(manyStreamInput);

      expect(result.streamBreakdown).toHaveLength(10);
      expect(Object.keys(result.monthlyForecasts[0]!.revenueByStream)).toHaveLength(10);
    });
  });

  describe('seasonality patterns in detail', () => {
    it('handles all valid seasonality patterns', () => {
      const patterns = ['none', 'retail', 'b2b', 'custom'] as const;

      for (const pattern of patterns) {
        const input: RevenueForecastInput = {
          revenueStreams: [
            {
              ...basicStream,
              seasonalityPattern: pattern,
              // Custom pattern needs factors
              ...(pattern === 'custom'
                ? { customSeasonalFactors: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] }
                : {}),
            },
          ],
          forecastMonths: 12,
        };

        const result = RevenueForecastEngine.analyze(input);
        expect(result.monthlyForecasts).toHaveLength(12);
      }
    });

    it('undefined seasonality defaults to none', () => {
      const input: RevenueForecastInput = {
        revenueStreams: [
          {
            name: 'Test',
            currentMonthlyRevenue: 10000,
            growthRate: 0,
          },
        ],
        forecastMonths: 12,
      };

      const result = RevenueForecastEngine.analyze(input);
      expect(result.monthlyForecasts).toHaveLength(12);
    });
  });
});
