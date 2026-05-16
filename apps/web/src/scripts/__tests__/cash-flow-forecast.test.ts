/**
 * Cash Flow Forecasting Calculator Tests
 * Comprehensive test suite for cash flow projections
 */

import { describe, it, expect } from 'vitest';

interface CashFlowInput {
  startingCash: number;
  monthlyRevenue: number;
  revenueGrowthRate: number;
  averageCollectionDays: number;
  monthlyExpenses: number;
  expenseGrowthRate: number;
  averagePaymentDays: number;
}

interface MonthlyProjection {
  month: number;
  monthName: string;
  revenue: number;
  cashCollected: number;
  expenses: number;
  cashPaid: number;
  netCashFlow: number;
  endingCash: number;
  burnRate: number;
  runwayMonths: number;
}

interface CashFlowResult {
  projections: MonthlyProjection[];
  summary: {
    totalRevenue: number;
    totalCashCollected: number;
    totalExpenses: number;
    totalCashPaid: number;
    netCashFlow: number;
    endingCash: number;
    lowestCash: { month: number; amount: number; monthName: string };
    highestCash: { month: number; amount: number; monthName: string };
    averageBurnRate: number;
    cashRunway: number;
    workingCapitalNeeds: number;
  };
  warnings: string[];
  recommendations: string[];
}

function calculateCashFlow(input: CashFlowInput): CashFlowResult {
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const projections: MonthlyProjection[] = [];

  let cashBalance = input.startingCash;
  let accumulatedAR = 0;
  let accumulatedAP = 0;

  const collectionDelay = Math.floor(input.averageCollectionDays / 30);
  const paymentDelay = Math.floor(input.averagePaymentDays / 30);

  const revenueByMonth: number[] = [];
  const expensesByMonth: number[] = [];

  for (let month = 0; month < 12; month++) {
    let monthlyRevenue =
      input.monthlyRevenue * Math.pow(1 + input.revenueGrowthRate / 100 / 12, month);
    revenueByMonth.push(monthlyRevenue);

    let monthlyExpenses =
      input.monthlyExpenses * Math.pow(1 + input.expenseGrowthRate / 100 / 12, month);
    expensesByMonth.push(monthlyExpenses);

    const collectionMonth = month - collectionDelay;
    const cashCollected = collectionMonth >= 0 ? revenueByMonth[collectionMonth] : 0;

    const paymentMonth = month - paymentDelay;
    const cashPaid = paymentMonth >= 0 ? expensesByMonth[paymentMonth] : monthlyExpenses;

    const netCashFlow = cashCollected - cashPaid;
    cashBalance += netCashFlow;

    const burnRate = netCashFlow < 0 ? Math.abs(netCashFlow) : 0;
    const runwayMonths = burnRate > 0 ? cashBalance / burnRate : Infinity;

    projections.push({
      month: month + 1,
      monthName: monthNames[month],
      revenue: monthlyRevenue,
      cashCollected,
      expenses: monthlyExpenses,
      cashPaid,
      netCashFlow,
      endingCash: cashBalance,
      burnRate,
      runwayMonths,
    });

    accumulatedAR += monthlyRevenue - cashCollected;
    accumulatedAP += monthlyExpenses - cashPaid;
  }

  const totalRevenue = revenueByMonth.reduce((sum, r) => sum + r, 0);
  const totalCashCollected = projections.reduce((sum, p) => sum + p.cashCollected, 0);
  const totalExpenses = expensesByMonth.reduce((sum, e) => sum + e, 0);
  const totalCashPaid = projections.reduce((sum, p) => sum + p.cashPaid, 0);
  const netCashFlow = totalCashCollected - totalCashPaid;
  const endingCash = projections[11].endingCash;

  const lowestCashMonth = projections.reduce((min, p) => (p.endingCash < min.endingCash ? p : min));
  const highestCashMonth = projections.reduce((max, p) =>
    p.endingCash > max.endingCash ? p : max
  );

  const lowestCash = {
    month: lowestCashMonth.month,
    amount: lowestCashMonth.endingCash,
    monthName: lowestCashMonth.monthName,
  };

  const highestCash = {
    month: highestCashMonth.month,
    amount: highestCashMonth.endingCash,
    monthName: highestCashMonth.monthName,
  };

  const negativeCashFlowMonths = projections.filter((p) => p.netCashFlow < 0);
  const averageBurnRate =
    negativeCashFlowMonths.length > 0
      ? negativeCashFlowMonths.reduce((sum, p) => sum + Math.abs(p.netCashFlow), 0) /
        negativeCashFlowMonths.length
      : 0;

  const cashRunway = averageBurnRate > 0 ? endingCash / averageBurnRate : Infinity;
  const workingCapitalNeeds = accumulatedAR - accumulatedAP;

  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (lowestCash.amount < 0) {
    warnings.push(`🚨 Cash runs out in ${lowestCash.monthName}!`);
  }

  if (input.averageCollectionDays > 60) {
    warnings.push(`⚠️ ${input.averageCollectionDays} days to collect is slow`);
  }

  if (endingCash > input.startingCash * 1.5) {
    recommendations.push('✓ Cash is accumulating');
  }

  return {
    projections,
    summary: {
      totalRevenue,
      totalCashCollected,
      totalExpenses,
      totalCashPaid,
      netCashFlow,
      endingCash,
      lowestCash,
      highestCash,
      averageBurnRate,
      cashRunway,
      workingCapitalNeeds,
    },
    warnings,
    recommendations,
  };
}

describe('Cash Flow Forecasting Calculator', () => {
  describe('Basic Cash Flow Calculations', () => {
    it('should project cash balance over 12 months', () => {
      const input: CashFlowInput = {
        startingCash: 100000,
        monthlyRevenue: 50000,
        revenueGrowthRate: 0,
        averageCollectionDays: 0, // Immediate collection
        monthlyExpenses: 40000,
        expenseGrowthRate: 0,
        averagePaymentDays: 0, // Immediate payment
      };

      const result = calculateCashFlow(input);

      expect(result.projections).toHaveLength(12);
      expect(result.summary.endingCash).toBe(220000); // 100k + (50k - 40k) * 12
    });

    it('should calculate net cash flow correctly', () => {
      const input: CashFlowInput = {
        startingCash: 100000,
        monthlyRevenue: 50000,
        revenueGrowthRate: 0,
        averageCollectionDays: 0,
        monthlyExpenses: 40000,
        expenseGrowthRate: 0,
        averagePaymentDays: 0,
      };

      const result = calculateCashFlow(input);

      expect(result.summary.netCashFlow).toBeCloseTo(120000, 0); // (50k - 40k) * 12
    });

    it('should track total revenue vs total expenses', () => {
      const input: CashFlowInput = {
        startingCash: 100000,
        monthlyRevenue: 60000,
        revenueGrowthRate: 0,
        averageCollectionDays: 0,
        monthlyExpenses: 45000,
        expenseGrowthRate: 0,
        averagePaymentDays: 0,
      };

      const result = calculateCashFlow(input);

      expect(result.summary.totalRevenue).toBe(720000); // 60k * 12
      expect(result.summary.totalExpenses).toBe(540000); // 45k * 12
    });
  });

  describe('AR/AP Timing (Collection & Payment Delays)', () => {
    it('should handle 30-day collection delay', () => {
      const input: CashFlowInput = {
        startingCash: 100000,
        monthlyRevenue: 50000,
        revenueGrowthRate: 0,
        averageCollectionDays: 30,
        monthlyExpenses: 40000,
        expenseGrowthRate: 0,
        averagePaymentDays: 0,
      };

      const result = calculateCashFlow(input);

      // First month: collect $0 (1-month delay), pay $40k
      expect(result.projections[0].cashCollected).toBe(0);
      expect(result.projections[0].netCashFlow).toBe(-40000);

      // Second month: collect first month's revenue
      expect(result.projections[1].cashCollected).toBe(50000);
    });

    it('should handle 30-day payment delay', () => {
      const input: CashFlowInput = {
        startingCash: 100000,
        monthlyRevenue: 50000,
        revenueGrowthRate: 0,
        averageCollectionDays: 0,
        monthlyExpenses: 40000,
        expenseGrowthRate: 0,
        averagePaymentDays: 30,
      };

      const result = calculateCashFlow(input);

      // First month: collect immediately, but payment delayed shows as current month's expense
      expect(result.projections[0].cashCollected).toBe(50000);
    });

    it('should calculate working capital needs with AR/AP gap', () => {
      const input: CashFlowInput = {
        startingCash: 100000,
        monthlyRevenue: 50000,
        revenueGrowthRate: 0,
        averageCollectionDays: 60, // Customers pay in 60 days
        monthlyExpenses: 40000,
        expenseGrowthRate: 0,
        averagePaymentDays: 30, // We pay in 30 days
      };

      const result = calculateCashFlow(input);

      // Should show significant working capital needs
      expect(result.summary.workingCapitalNeeds).toBeGreaterThan(0);
    });
  });

  describe('Growth Rate Modeling', () => {
    it('should apply revenue growth rate', () => {
      const input: CashFlowInput = {
        startingCash: 100000,
        monthlyRevenue: 50000,
        revenueGrowthRate: 12, // 12% annual = ~1% monthly
        averageCollectionDays: 0,
        monthlyExpenses: 40000,
        expenseGrowthRate: 0,
        averagePaymentDays: 0,
      };

      const result = calculateCashFlow(input);

      // Month 12 should have higher revenue than month 1
      expect(result.projections[11].revenue).toBeGreaterThan(result.projections[0].revenue);
    });

    it('should apply expense growth rate', () => {
      const input: CashFlowInput = {
        startingCash: 100000,
        monthlyRevenue: 50000,
        revenueGrowthRate: 0,
        averageCollectionDays: 0,
        monthlyExpenses: 40000,
        expenseGrowthRate: 6, // 6% annual
        averagePaymentDays: 0,
      };

      const result = calculateCashFlow(input);

      // Month 12 should have higher expenses than month 1
      expect(result.projections[11].expenses).toBeGreaterThan(result.projections[0].expenses);
    });

    it('should handle different revenue and expense growth rates', () => {
      const input: CashFlowInput = {
        startingCash: 100000,
        monthlyRevenue: 50000,
        revenueGrowthRate: 20, // Growing revenue
        averageCollectionDays: 0,
        monthlyExpenses: 40000,
        expenseGrowthRate: 5, // Slower expense growth
        averagePaymentDays: 0,
      };

      const result = calculateCashFlow(input);

      // Cash should accumulate due to revenue growing faster
      expect(result.summary.endingCash).toBeGreaterThan(input.startingCash);
    });
  });

  describe('Burn Rate & Cash Runway', () => {
    it('should calculate burn rate for unprofitable business', () => {
      const input: CashFlowInput = {
        startingCash: 100000,
        monthlyRevenue: 30000,
        revenueGrowthRate: 0,
        averageCollectionDays: 0,
        monthlyExpenses: 50000, // Burning $20k/month
        expenseGrowthRate: 0,
        averagePaymentDays: 0,
      };

      const result = calculateCashFlow(input);

      expect(result.summary.averageBurnRate).toBeCloseTo(20000, -1);
    });

    it('should calculate cash runway correctly', () => {
      const input: CashFlowInput = {
        startingCash: 100000,
        monthlyRevenue: 30000,
        revenueGrowthRate: 0,
        averageCollectionDays: 0,
        monthlyExpenses: 50000,
        expenseGrowthRate: 0,
        averagePaymentDays: 0,
      };

      const result = calculateCashFlow(input);

      // With $20k monthly burn, 12-month ending cash determines runway
      expect(result.summary.cashRunway).toBeLessThan(6); // Running out soon
    });

    it('should show infinite runway for profitable business', () => {
      const input: CashFlowInput = {
        startingCash: 100000,
        monthlyRevenue: 60000,
        revenueGrowthRate: 0,
        averageCollectionDays: 0,
        monthlyExpenses: 40000,
        expenseGrowthRate: 0,
        averagePaymentDays: 0,
      };

      const result = calculateCashFlow(input);

      expect(result.summary.averageBurnRate).toBe(0);
      expect(result.summary.cashRunway).toBe(Infinity);
    });
  });

  describe('Warnings & Recommendations', () => {
    it('should warn when cash runs out', () => {
      const input: CashFlowInput = {
        startingCash: 50000,
        monthlyRevenue: 20000,
        revenueGrowthRate: 0,
        averageCollectionDays: 0,
        monthlyExpenses: 30000,
        expenseGrowthRate: 0,
        averagePaymentDays: 0,
      };

      const result = calculateCashFlow(input);

      expect(result.summary.lowestCash.amount).toBeLessThan(0);
      expect(result.warnings.some((w) => w.includes('runs out'))).toBe(true);
    });

    it('should warn about slow collection', () => {
      const input: CashFlowInput = {
        startingCash: 100000,
        monthlyRevenue: 50000,
        revenueGrowthRate: 0,
        averageCollectionDays: 90, // Very slow
        monthlyExpenses: 40000,
        expenseGrowthRate: 0,
        averagePaymentDays: 30,
      };

      const result = calculateCashFlow(input);

      expect(result.warnings.some((w) => w.includes('slow'))).toBe(true);
    });

    it('should recommend accumulating cash', () => {
      const input: CashFlowInput = {
        startingCash: 100000,
        monthlyRevenue: 70000,
        revenueGrowthRate: 0,
        averageCollectionDays: 0,
        monthlyExpenses: 40000,
        expenseGrowthRate: 0,
        averagePaymentDays: 0,
      };

      const result = calculateCashFlow(input);

      expect(result.recommendations.some((r) => r.includes('accumulating'))).toBe(true);
    });
  });

  describe('Lowest & Highest Cash Identification', () => {
    it('should identify lowest cash month', () => {
      const input: CashFlowInput = {
        startingCash: 100000,
        monthlyRevenue: 40000,
        revenueGrowthRate: 0,
        averageCollectionDays: 0,
        monthlyExpenses: 45000, // Burning cash
        expenseGrowthRate: 0,
        averagePaymentDays: 0,
      };

      const result = calculateCashFlow(input);

      // Cash decreases each month, so Dec should be lowest
      expect(result.summary.lowestCash.monthName).toBe('Dec');
      expect(result.summary.lowestCash.amount).toBeLessThan(input.startingCash);
    });

    it('should identify highest cash month', () => {
      const input: CashFlowInput = {
        startingCash: 100000,
        monthlyRevenue: 60000,
        revenueGrowthRate: 0,
        averageCollectionDays: 0,
        monthlyExpenses: 40000,
        expenseGrowthRate: 0,
        averagePaymentDays: 0,
      };

      const result = calculateCashFlow(input);

      // Cash increases each month, so Dec should be highest
      expect(result.summary.highestCash.monthName).toBe('Dec');
      expect(result.summary.highestCash.amount).toBeGreaterThan(input.startingCash);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle startup burning cash', () => {
      const input: CashFlowInput = {
        startingCash: 500000, // Seed funding
        monthlyRevenue: 20000, // Early traction
        revenueGrowthRate: 50, // Rapid growth
        averageCollectionDays: 30,
        monthlyExpenses: 80000, // Building product
        expenseGrowthRate: 10,
        averagePaymentDays: 45,
      };

      const result = calculateCashFlow(input);

      expect(result.summary.averageBurnRate).toBeGreaterThan(0);
      expect(result.summary.cashRunway).toBeLessThan(12);
      expect(result.projections[0].endingCash).toBeLessThan(input.startingCash);
    });

    it('should handle established business with seasonal cycles', () => {
      const input: CashFlowInput = {
        startingCash: 200000,
        monthlyRevenue: 100000,
        revenueGrowthRate: 5,
        averageCollectionDays: 45, // B2B collections
        monthlyExpenses: 70000,
        expenseGrowthRate: 3,
        averagePaymentDays: 60, // Negotiate good terms
      };

      const result = calculateCashFlow(input);

      expect(result.summary.endingCash).toBeGreaterThan(input.startingCash);
      expect(result.summary.netCashFlow).toBeGreaterThan(0);
    });

    it('should handle service business with immediate collection', () => {
      const input: CashFlowInput = {
        startingCash: 50000,
        monthlyRevenue: 40000,
        revenueGrowthRate: 15,
        averageCollectionDays: 0, // Paid upfront
        monthlyExpenses: 30000,
        expenseGrowthRate: 8,
        averagePaymentDays: 30,
      };

      const result = calculateCashFlow(input);

      expect(result.summary.endingCash).toBeGreaterThan(input.startingCash);
      expect(result.summary.cashRunway).toBe(Infinity);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero revenue (pre-revenue startup)', () => {
      const input: CashFlowInput = {
        startingCash: 1000000,
        monthlyRevenue: 0,
        revenueGrowthRate: 0,
        averageCollectionDays: 0,
        monthlyExpenses: 50000,
        expenseGrowthRate: 0,
        averagePaymentDays: 0,
      };

      const result = calculateCashFlow(input);

      expect(result.summary.totalRevenue).toBe(0);
      expect(result.summary.averageBurnRate).toBe(50000);
      expect(result.summary.endingCash).toBe(400000); // 1M - (50k * 12)
    });

    it('should handle negative growth (declining business)', () => {
      const input: CashFlowInput = {
        startingCash: 200000,
        monthlyRevenue: 100000,
        revenueGrowthRate: -10, // Declining
        averageCollectionDays: 0,
        monthlyExpenses: 60000,
        expenseGrowthRate: 0,
        averagePaymentDays: 0,
      };

      const result = calculateCashFlow(input);

      expect(result.projections[11].revenue).toBeLessThan(result.projections[0].revenue);
    });

    it('should handle very long collection periods', () => {
      const input: CashFlowInput = {
        startingCash: 200000,
        monthlyRevenue: 50000,
        revenueGrowthRate: 0,
        averageCollectionDays: 120, // 4 months!
        monthlyExpenses: 40000,
        expenseGrowthRate: 0,
        averagePaymentDays: 30,
      };

      const result = calculateCashFlow(input);

      expect(result.warnings.some((w) => w.includes('slow'))).toBe(true);
      expect(result.summary.workingCapitalNeeds).toBeGreaterThan(100000);
    });
  });
});
