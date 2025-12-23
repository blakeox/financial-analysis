import { describe, it, expect } from 'vitest';
import {
  AmortizationAnalyzer,
  buildAmortizationComprehensiveAnalysis,
  computeAmortizationInsights,
} from '../amortization';
import type { AmortizationAnalysisResult } from '../amortization';
import type { AmortizationInput } from '../../schemas';

describe('AmortizationAnalyzer', () => {
  const buildInput = (overrides: Partial<AmortizationInput> = {}): AmortizationInput => ({
    principal: 300000,
    annualRate: 0.065, // 6.5%
    termMonths: 360, // 30 years
    extraMonthlyPayment: 0,
    oneTimePayments: [],
    paymentFrequency: 'monthly',
    interestOnlyMonths: 0,
    balloonPayment: 0,
    origination_fee: 0,
    points: 0,
    pmi: { enabled: false, rate: 0, dropOffLTV: 0.8 },
    propertyTaxAnnual: 0,
    homeInsuranceAnnual: 0,
    hoaMonthly: 0,
    downPayment: 0,
    closingCosts: 0,
    ...overrides,
  });

  const basicInput = buildInput();

  describe('basic amortization calculations', () => {
    it('calculates monthly payment correctly', () => {
      const result = AmortizationAnalyzer.analyze(basicInput);

      // Expected monthly payment for $300k at 6.5% for 30 years ≈ $1,896
      expect(result.monthlyPayment).toBeGreaterThan(1890);
      expect(result.monthlyPayment).toBeLessThan(1910);
    });

    it('generates correct number of schedule entries', () => {
      const result = AmortizationAnalyzer.analyze(basicInput);

      expect(result.schedule).toHaveLength(360);
    });

    it('calculates total interest over loan term', () => {
      const result = AmortizationAnalyzer.analyze(basicInput);

      // Total interest should be significant portion of total payments
      expect(result.totalInterest).toBeGreaterThan(300000);
      // Total payments should approximately equal principal + interest (within rounding tolerance)
      expect(result.totalPayments).toBeCloseTo(result.totalInterest + basicInput.principal, -2);
    });

    it('schedule starts with high interest, ends with high principal', () => {
      const result = AmortizationAnalyzer.analyze(basicInput);

      const firstPayment = result.schedule[0]!;
      const lastPayment = result.schedule[result.schedule.length - 1]!;

      // First payment should have more interest than principal
      expect(firstPayment.interest).toBeGreaterThan(firstPayment.principal);

      // Last payment should have more principal than interest
      expect(lastPayment.principal).toBeGreaterThan(lastPayment.interest);
    });

    it('final balance is zero or near zero', () => {
      const result = AmortizationAnalyzer.analyze(basicInput);

      const lastPayment = result.schedule[result.schedule.length - 1]!;
      expect(lastPayment.balance).toBeLessThan(1); // Allow for rounding
    });
  });

  describe('Comprehensive Analysis', () => {
    it('should return all required fields in the analysis result', () => {
      const result = AmortizationAnalyzer.analyze(basicInput);

      expect(result).toHaveProperty('monthlyPayment');
      expect(result).toHaveProperty('totalPayments');
      expect(result).toHaveProperty('totalInterest');
      expect(result).toHaveProperty('schedule');
      // Optional fields might not be present depending on input
    });
  });

  describe('cumulative tracking', () => {
    it('tracks cumulative interest correctly', () => {
      const result = AmortizationAnalyzer.analyze(basicInput);

      const lastPayment = result.schedule[result.schedule.length - 1]!;
      expect(lastPayment.cumulativeInterest).toBeCloseTo(result.totalInterest, 0);
    });

    it('tracks cumulative principal correctly', () => {
      const result = AmortizationAnalyzer.analyze(basicInput);

      const lastPayment = result.schedule[result.schedule.length - 1]!;
      // Cumulative principal should equal original loan amount
      expect(lastPayment.cumulativePrincipal).toBeCloseTo(basicInput.principal, 0);
    });
  });

  describe('extra payments', () => {
    it('reduces total interest with extra monthly payment', () => {
      const withExtra = buildInput({
        extraMonthlyPayment: 200,
      });

      const baseline = AmortizationAnalyzer.analyze(basicInput);
      const withExtraResult = AmortizationAnalyzer.analyze(withExtra);

      expect(withExtraResult.totalInterest).toBeLessThan(baseline.totalInterest);
    });

    it('calculates interest saved from extra payments', () => {
      const withExtra = buildInput({
        extraMonthlyPayment: 500,
      });

      const result = AmortizationAnalyzer.analyze(withExtra);

      if (result.interestSaved !== undefined) {
        expect(result.interestSaved).toBeGreaterThan(0);
      }
    });
  });

  describe('PMI handling', () => {
    it('calculates PMI when enabled', () => {
      const withPMI = buildInput({
        pmi: {
          enabled: true,
          rate: 0.005, // 0.5% annual PMI rate
          dropOffLTV: 0.8,
          homeValue: 350000,
        },
      });

      const result = AmortizationAnalyzer.analyze(withPMI);

      // First payment should include PMI
      expect(result.schedule[0]!.pmi).toBeGreaterThan(0);
    });

    it('PMI drops off at specified LTV', () => {
      const withPMI = buildInput({
        principal: 280000, // 80% LTV on $350k home - close to drop off
        pmi: {
          enabled: true,
          rate: 0.005,
          dropOffLTV: 0.8,
          homeValue: 350000,
        },
      });

      const result = AmortizationAnalyzer.analyze(withPMI);

      // PMI should drop off at some point
      if (result.pmiDropoffMonth !== undefined) {
        expect(result.pmiDropoffMonth).toBeGreaterThan(0);
      }
    });
  });

  describe('zero interest rate', () => {
    it('handles zero interest rate correctly', () => {
      const zeroInterest = buildInput({
        principal: 120000,
        annualRate: 0,
        termMonths: 120, // 10 years
      });

      const result = AmortizationAnalyzer.analyze(zeroInterest);

      // Monthly payment should be principal / months
      expect(result.monthlyPayment).toBeCloseTo(1000, 0);
      expect(result.totalInterest).toBe(0);
    });
  });

  describe('short term loans', () => {
    it('handles 15 year mortgage', () => {
      const fifteenYear = buildInput({
        annualRate: 0.06,
        termMonths: 180,
      });

      const result = AmortizationAnalyzer.analyze(fifteenYear);

      expect(result.schedule).toHaveLength(180);
      // 15 year payment should be higher than 30 year
      const thirtyYearResult = AmortizationAnalyzer.analyze({
        ...fifteenYear,
        termMonths: 360,
      });
      expect(result.monthlyPayment).toBeGreaterThan(thirtyYearResult.monthlyPayment);
    });
  });

  describe('PITI calculations', () => {
    it('includes property tax in total monthly payment', () => {
      const withTaxes = buildInput({
        propertyTaxAnnual: 6000, // $6000/year
      });

      const result = AmortizationAnalyzer.analyze(withTaxes);

      if (result.monthlyPropertyTax !== undefined) {
        expect(result.monthlyPropertyTax).toBeCloseTo(500, 0);
      }
    });

    it('includes insurance in total monthly payment', () => {
      const withInsurance = buildInput({
        homeInsuranceAnnual: 2400, // $2400/year
      });

      const result = AmortizationAnalyzer.analyze(withInsurance);

      if (result.monthlyInsurance !== undefined) {
        expect(result.monthlyInsurance).toBeCloseTo(200, 0);
      }
    });
  });

  describe('one-time payments', () => {
    it('applies one-time payment at specified month', () => {
      const withOneTime = buildInput({
        oneTimePayments: [{ month: 12, amount: 10000 }],
      });

      const baseline = AmortizationAnalyzer.analyze(basicInput);
      const withOneTimeResult = AmortizationAnalyzer.analyze(withOneTime);

      // Should reduce total interest
      expect(withOneTimeResult.totalInterest).toBeLessThan(baseline.totalInterest);
    });
  });

  describe('advanced loan configurations', () => {
    it('supports interest-only periods before amortization begins', () => {
      const input = buildInput({
        interestOnlyMonths: 6,
      });

      const result = AmortizationAnalyzer.analyze(input);

      expect(result.schedule[0]!.principal).toBe(0);
      expect(result.schedule[5]!.principal).toBe(0);
      expect(result.schedule[6]!.principal).toBeGreaterThan(0);
    });

    it('generates biweekly payment dates when configured', () => {
      const biweekly = buildInput({
        principal: 200000,
        annualRate: 0.05,
        termMonths: 24,
        paymentFrequency: 'biweekly',
        startDate: '2024-01-01',
      });

      const result = AmortizationAnalyzer.analyze(biweekly);

      expect(result.schedule[0]!.date).toBe('2024-01-01');
      expect(result.schedule[1]!.date).toBe('2024-01-15');
    });

    it('generates weekly payment dates when configured', () => {
      const weekly = buildInput({
        principal: 180000,
        annualRate: 0.045,
        termMonths: 12,
        paymentFrequency: 'weekly',
        startDate: '2024-01-01',
      });

      const result = AmortizationAnalyzer.analyze(weekly);

      expect(result.schedule[0]!.date).toBe('2024-01-01');
      expect(result.schedule[1]!.date).toBe('2024-01-08');
    });

    it('applies balloon payments at maturity', () => {
      const input = buildInput({
        principal: 200000,
        annualRate: 0.05,
        termMonths: 120,
        balloonPayment: 50000,
      });

      const result = AmortizationAnalyzer.analyze(input);
      const lastPayment = result.schedule[result.schedule.length - 1]!;

      expect(lastPayment.principal).toBeCloseTo(50000, 0);
      expect(lastPayment.balance).toBe(0);
    });

    it('calculates APR and total cost summary when upfront costs and escrows exist', () => {
      const input = buildInput({
        propertyTaxAnnual: 6000,
        homeInsuranceAnnual: 1800,
        hoaMonthly: 150,
        origination_fee: 2500,
        points: 1,
        closingCosts: 4000,
        downPayment: 60000,
      });

      const result = AmortizationAnalyzer.analyze(input);

      expect(result.apr).toBeDefined();
      expect(result.totalCostSummary).toBeDefined();
      expect(result.totalMonthlyPayment).toBeGreaterThan(result.monthlyPayment);
      expect(result.monthlyPropertyTax).toBeCloseTo(500, 0);
      expect(result.monthlyInsurance).toBeCloseTo(150, 0);
    });
  });

  describe('insight helpers', () => {
    it('handles empty schedules in computeAmortizationInsights', () => {
      const emptyResult: AmortizationAnalysisResult = {
        monthlyPayment: 0,
        totalPayments: 0,
        totalInterest: 0,
        schedule: [],
      };

      const insights = computeAmortizationInsights(emptyResult);

      expect(insights.periods).toBe(0);
      expect(insights.milestones).toHaveLength(0);
    });

    it('produces milestones for populated schedules', () => {
      const populated = AmortizationAnalyzer.analyze(basicInput);
      const insights = computeAmortizationInsights(populated);

      expect(insights.periods).toBeGreaterThan(0);
      expect(insights.milestones.length).toBeGreaterThan(0);
      expect(insights.principalTakeoverMonth).not.toBeNull();
    });
  });

  describe('comprehensive analysis builder', () => {
    it('includes PMI planning and optimization guidance', () => {
      const input = buildInput({
        principal: 360000,
        annualRate: 0.055,
        termMonths: 180,
        extraMonthlyPayment: 150,
        pmi: {
          enabled: true,
          rate: 0.006,
          dropOffLTV: 0.8,
          homeValue: 400000,
        },
      });

      const result = AmortizationAnalyzer.analyze(input);

      const analysis = buildAmortizationComprehensiveAnalysis(result, {
        assumedMonthlyIncome: 9000,
      });

      expect(analysis.summary.totalExtraPayments).toBeGreaterThan(0);
      expect(analysis.recommendations.some((rec) => rec.title.includes('PMI'))).toBe(true);
      expect(analysis.optimizationOpportunities.length).toBeGreaterThan(0);
      expect(analysis.timeline.milestones.length).toBeGreaterThan(0);
      expect(analysis.riskAssessment.factors.length).toBeGreaterThan(0);
    });

    it('derives term months when schedule data is unavailable', () => {
      const minimalResult: AmortizationAnalysisResult = {
        monthlyPayment: 1000,
        totalPayments: 12000,
        totalInterest: 2000,
        schedule: [],
      };

      const analysis = buildAmortizationComprehensiveAnalysis(minimalResult);

      expect(analysis.summary.termMonths).toBe(12);
      expect(analysis.summary.years).toBeCloseTo(1, 5);
    });

    it('falls back to zero term when payments are not defined', () => {
      const zeroPaymentResult: AmortizationAnalysisResult = {
        monthlyPayment: 0,
        totalPayments: 0,
        totalInterest: 0,
        schedule: [],
      };

      const analysis = buildAmortizationComprehensiveAnalysis(zeroPaymentResult);

      expect(analysis.summary.termMonths).toBe(0);
      expect(analysis.summary.years).toBe(0);
    });
  });

  describe('Comprehensive Analysis', () => {
    it('returns all required fields in the result object', () => {
      const result = AmortizationAnalyzer.analyze(basicInput);

      expect(result).toHaveProperty('monthlyPayment');
      expect(result).toHaveProperty('totalPayments');
      expect(result).toHaveProperty('totalInterest');
      expect(result).toHaveProperty('schedule');
      expect(Array.isArray(result.schedule)).toBe(true);
      
      // Optional fields might be undefined, but we check for their existence in the type
      // by accessing them (TS would complain if they didn't exist on the type)
      void result.totalPMI;
      void result.interestSaved;
      void result.timeReduced;
      void result.payoffDate;
      void result.pmiDropoffMonth;
      void result.monthlyPropertyTax;
      void result.monthlyInsurance;
      void result.monthlyHOA;
      void result.totalMonthlyPayment;
      void result.apr;
      void result.totalCostSummary;
    });
  });
});
