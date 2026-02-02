import { describe, it, expect } from 'vitest';
import {
  AmortizationAnalyzer,
  buildAmortizationComprehensiveAnalysis,
  computeAmortizationInsights,
} from '../engines/amortization';

// Helper function to create complete input with defaults
function createAmortizationInput(overrides: Partial<Parameters<typeof AmortizationAnalyzer.analyze>[0]> = {}) {
  return {
    principal: 100000,
    annualRate: 0.06,
    termMonths: 360,
    extraMonthlyPayment: 0,
    oneTimePayments: [],
    paymentFrequency: 'monthly' as const,
    interestOnlyMonths: 0,
    balloonPayment: 0,
    origination_fee: 0,
    points: 0,
    pmi: { enabled: false, rate: 0, dropOffLTV: 0.8 },
    ...overrides
  };
}

describe('AmortizationAnalyzer', () => {
  describe('analyze', () => {
    describe('basic amortization calculations', () => {
      it('should calculate basic monthly payment correctly', () => {
        const result = AmortizationAnalyzer.analyze(createAmortizationInput());

        expect(result.monthlyPayment).toBe(599.55);
        expect(result.totalPayments).toBe(215838.00);
        expect(result.totalInterest).toBe(115838.19);
        expect(result.schedule).toHaveLength(360);
      });

      it('should handle zero interest rate', () => {
        const result = AmortizationAnalyzer.analyze(createAmortizationInput({
          principal: 50000,
          annualRate: 0,
          termMonths: 60
        }));

        expect(result.monthlyPayment).toBe(833.33);
        expect(result.totalPayments).toBe(49999.8);
        expect(result.totalInterest).toBe(0);
        expect(result.schedule).toHaveLength(60);
      });

      it('should calculate final payment correctly', () => {
        const result = AmortizationAnalyzer.analyze(createAmortizationInput({
          annualRate: 0.05
        }));

        const lastPayment = result.schedule[result.schedule.length - 1];
        expect(lastPayment?.balance).toBe(0);
        expect(lastPayment?.principal).toBeCloseTo(534.59, 2);
      });
    });

    describe('extra monthly payments', () => {
      it('should handle extra monthly payments and calculate savings', () => {
        const standardResult = AmortizationAnalyzer.analyze(createAmortizationInput({
          principal: 200000,
          annualRate: 0.045,
          termMonths: 360
        }));

        const extraPaymentResult = AmortizationAnalyzer.analyze(createAmortizationInput({
          principal: 200000,
          annualRate: 0.045,
          termMonths: 360,
          extraMonthlyPayment: 200
        }));

        expect(extraPaymentResult.totalInterest).toBeLessThan(standardResult.totalInterest);
        expect(extraPaymentResult.interestSaved).toBeGreaterThan(0);
        expect(extraPaymentResult.timeReduced).toBeGreaterThan(0);
        expect(extraPaymentResult.schedule.length).toBeLessThan(standardResult.schedule.length);
      });

      it('should handle one-time extra payments', () => {
        const result = AmortizationAnalyzer.analyze(createAmortizationInput({
          oneTimePayments: [
            { month: 12, amount: 5000 },
            { month: 24, amount: 3000 }
          ]
        }));

        const month12 = result.schedule.find(item => item.month === 12);
        const month24 = result.schedule.find(item => item.month === 24);

        expect(month12?.extraPayment).toBe(5000);
        expect(month24?.extraPayment).toBe(3000);
        expect(result.interestSaved).toBeGreaterThan(0);
      });
    });

    describe('payment frequencies', () => {
      it('should handle biweekly payments', () => {
        const monthlyResult = AmortizationAnalyzer.analyze(createAmortizationInput({
          paymentFrequency: 'monthly'
        }));

        const biweeklyResult = AmortizationAnalyzer.analyze(createAmortizationInput({
          paymentFrequency: 'biweekly'
        }));

        // Biweekly should have higher payments but potentially lower total interest
        expect(biweeklyResult.monthlyPayment).toBeGreaterThan(monthlyResult.monthlyPayment);
        expect(biweeklyResult.totalInterest).toBeLessThan(monthlyResult.totalInterest);
      });

      it('should handle weekly payments', () => {
        const result = AmortizationAnalyzer.analyze(createAmortizationInput({
          paymentFrequency: 'weekly'
        }));

        expect(result.monthlyPayment).toBeGreaterThan(0);
        expect(result.schedule).toHaveLength(81);
      });
    });

    describe('interest-only periods', () => {
      it('should handle interest-only periods correctly', () => {
        const result = AmortizationAnalyzer.analyze(createAmortizationInput({
          interestOnlyMonths: 12
        }));

        // First 12 payments should be interest-only
        for (let i = 0; i < 12; i++) {
          const payment = result.schedule[i];
          expect(payment?.principal).toBe(0);
          expect(payment?.interest).toBeCloseTo(500, 0); // 6% annual / 12 = 0.5% monthly
          expect(payment?.payment).toBeCloseTo(500, 0);
        }

        // After interest-only period, principal payments should start
        const afterInterestOnly = result.schedule[12];
        expect(afterInterestOnly?.principal).toBeGreaterThan(0);
      });
    });

    describe('balloon payments', () => {
      it('should handle balloon payments at term end', () => {
        const result = AmortizationAnalyzer.analyze(createAmortizationInput({
          termMonths: 120,
          balloonPayment: 50000
        }));

        const lastPayment = result.schedule[result.schedule.length - 1];
        expect(lastPayment?.principal).toBe(50000); // Balloon payment
        expect(lastPayment?.balance).toBe(0);
      });
    });

    describe('fees and points', () => {
      it('should adjust principal for origination fees', () => {
        const noFeeResult = AmortizationAnalyzer.analyze(createAmortizationInput());

        const feeResult = AmortizationAnalyzer.analyze(createAmortizationInput({
          origination_fee: 2000
        }));

        expect(feeResult.monthlyPayment).toBeGreaterThan(noFeeResult.monthlyPayment);
        expect(feeResult.totalPayments).toBeGreaterThan(noFeeResult.totalPayments);
      });

      it('should adjust principal for discount points', () => {
        const noPointsResult = AmortizationAnalyzer.analyze(createAmortizationInput());

        const pointsResult = AmortizationAnalyzer.analyze(createAmortizationInput({
          points: 2 // 2% of loan amount
        }));

        expect(pointsResult.monthlyPayment).toBeGreaterThan(noPointsResult.monthlyPayment);
        expect(pointsResult.totalPayments).toBeGreaterThan(noPointsResult.totalPayments);
      });
    });

    describe('PMI (Private Mortgage Insurance)', () => {
      it('should calculate PMI payments when LTV is high', () => {
        const result = AmortizationAnalyzer.analyze(createAmortizationInput({
          pmi: {
            enabled: true,
            rate: 0.005, // 0.5% annual PMI
            dropOffLTV: 0.8,
            homeValue: 120000 // 83% LTV initially
          }
        }));

        expect(result.totalPMI).toBeGreaterThan(0);
        expect(result.pmiDropoffMonth).toBeDefined();

        // Check that PMI is included in some payments
        const pmiPayments = result.schedule.filter(item => item.pmi && item.pmi > 0);
        expect(pmiPayments.length).toBeGreaterThan(0);
      });

      it('should drop off PMI when LTV reaches threshold', () => {
        const result = AmortizationAnalyzer.analyze(createAmortizationInput({
          pmi: {
            enabled: true,
            rate: 0.005,
            dropOffLTV: 0.8,
            homeValue: 120000
          }
        }));

        const dropoffMonth = result.pmiDropoffMonth!;
        const beforeDropoff = result.schedule[dropoffMonth - 2];
        const afterDropoff = result.schedule[dropoffMonth];

        expect(beforeDropoff?.pmi).toBeGreaterThan(0);
        expect(afterDropoff?.pmi).toBe(0);
      });
    });

    describe('early payoff scenarios', () => {
      it('should handle early payoff with extra payments', () => {
        const result = AmortizationAnalyzer.analyze(createAmortizationInput({
          extraMonthlyPayment: 1000
        }));

        expect(result.schedule.length).toBeLessThan(360);
        const lastPayment = result.schedule[result.schedule.length - 1];
        expect(lastPayment?.balance).toBe(0);
      });

      it('should calculate payoff date when start date provided', () => {
        const result = AmortizationAnalyzer.analyze(createAmortizationInput({
          startDate: '2024-01-01',
          extraMonthlyPayment: 500
        }));

        expect(result.payoffDate).toBeDefined();
        expect(result.payoffDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    describe('input validation', () => {
      it('should validate positive principal', () => {
        expect(() => {
          AmortizationAnalyzer.analyze(createAmortizationInput({
            principal: -1000
          }));
        }).toThrow();
      });

      it('should validate annual rate between 0 and 1', () => {
        expect(() => {
          AmortizationAnalyzer.analyze(createAmortizationInput({
            annualRate: 1.5
          }));
        }).toThrow();

        expect(() => {
          AmortizationAnalyzer.analyze(createAmortizationInput({
            annualRate: -0.01
          }));
        }).toThrow();
      });

      it('should validate positive term months', () => {
        expect(() => {
          AmortizationAnalyzer.analyze(createAmortizationInput({
            termMonths: 0
          }));
        }).toThrow();
      });
    });

    describe('edge cases', () => {
      it('should handle very short terms', () => {
        const result = AmortizationAnalyzer.analyze(createAmortizationInput({
          principal: 10000,
          termMonths: 1
        }));

        expect(result.schedule).toHaveLength(1);
        expect(result.schedule[0]?.balance).toBe(0);
      });

      it('should handle very large extra payments', () => {
        const result = AmortizationAnalyzer.analyze(createAmortizationInput({
          extraMonthlyPayment: 50000 // Pay off quickly
        }));

        expect(result.schedule.length).toBeLessThan(10);
        expect(result.interestSaved).toBeGreaterThan(0);
      });
    });
  });
});

describe('computeAmortizationInsights', () => {
  it('should compute insights for standard amortization', () => {
    const result = AmortizationAnalyzer.analyze(createAmortizationInput());

    const insights = computeAmortizationInsights(result);

    expect(insights.periods).toBe(360);
    expect(insights.totalInterestShare).toBeGreaterThan(0);
    expect(insights.highestInterestMonth.month).toBeGreaterThan(0);
    expect(insights.principalTakeoverMonth).toBeDefined();
    expect(insights.halfBalanceMonth).toBeDefined();
    expect(insights.milestones).toHaveLength(4); // highest-interest, principal-takeover, halfway, final
  });

  it('should handle empty schedule', () => {
    const emptyResult = {
      schedule: [],
      totalPayments: 0,
      totalInterest: 0,
      monthlyPayment: 0,
    };

    const insights = computeAmortizationInsights(emptyResult);

    expect(insights.periods).toBe(0);
    expect(insights.totalInterestShare).toBe(0);
    expect(insights.milestones).toHaveLength(0);
  });

  it('should identify principal takeover point', () => {
    const result = AmortizationAnalyzer.analyze(createAmortizationInput());

    const insights = computeAmortizationInsights(result);

    const takeoverMonth = insights.principalTakeoverMonth!;
    const takeoverItem = result.schedule[takeoverMonth - 1];

    expect(takeoverItem?.principal).toBeGreaterThanOrEqual(takeoverItem?.interest ?? 0);
  });
});

describe('buildAmortizationComprehensiveAnalysis', () => {
  it('builds narrative summary with schedule-driven metrics', () => {
    const result = AmortizationAnalyzer.analyze(createAmortizationInput());

    const narrative = buildAmortizationComprehensiveAnalysis(result);

    expect(narrative.summary.principal).toBeGreaterThan(0);
    expect(narrative.summary.totalInterest).toBeCloseTo(result.totalInterest, 2);
    expect(narrative.timeline.milestones.length).toBeGreaterThan(0);
    expect(narrative.insights.length).toBeGreaterThan(0);
    expect(narrative.chatSummary).toContain('Total payments');
  });

  it('includes extra payment insights when schedule has contributions', () => {
    const result = AmortizationAnalyzer.analyze(
      createAmortizationInput({ extraMonthlyPayment: 250 })
    );

    const narrative = buildAmortizationComprehensiveAnalysis(result);

    expect(narrative.summary.totalExtraPayments).toBeGreaterThan(0);
    expect(
      narrative.insights.some((item) => item.title.includes('Extra Payment'))
    ).toBe(true);
  });
});
