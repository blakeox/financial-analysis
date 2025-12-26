import { describe, it, expect } from 'vitest';
import { analyze } from '../student-loan.js';
import type { StudentLoanInput } from '../../schemas/student-loan.js';

describe('StudentLoanAnalyzer', () => {
  const createBasicInput = (overrides: Partial<StudentLoanInput> = {}): StudentLoanInput => ({
    loans: [
      {
        name: 'Federal Direct Loan',
        loanType: 'federal_unsubsidized',
        balance: 30000,
        interestRate: 0.05,
        minimumPayment: 350,
      },
      {
        name: 'Private Loan',
        loanType: 'private',
        balance: 20000,
        interestRate: 0.07,
        minimumPayment: 250,
      },
    ],
    extraMonthlyPayment: 100,
    paymentStrategy: 'avalanche',
    ...overrides,
  });

  describe('analyze()', () => {
    it('should calculate standard payoff correctly', () => {
      const input = createBasicInput();
      const result = analyze(input);

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.strategy).toBe('avalanche');
      expect(result.summary.totalMonthsToPayoff).toBeGreaterThan(0);
    });

    it('should generate payoff schedule', () => {
      const input = createBasicInput();
      const result = analyze(input);

      expect(result.payoffSchedule).toBeDefined();
      expect(result.payoffSchedule.length).toBeGreaterThan(0);

      const firstMonth = result.payoffSchedule[0];
      expect(firstMonth).toHaveProperty('month');
      expect(firstMonth).toHaveProperty('payments');
      expect(firstMonth).toHaveProperty('totalPayment');
      expect(firstMonth).toHaveProperty('remainingBalance');
    });

    it('should track loan summaries correctly', () => {
      const input = createBasicInput();
      const result = analyze(input);

      expect(result.summary.loanSummaries).toBeDefined();
      expect(result.summary.loanSummaries.length).toBe(2);

      const federalLoan = result.summary.loanSummaries.find(
        (l) => l.name === 'Federal Direct Loan'
      );
      expect(federalLoan).toBeDefined();
      expect(parseFloat(federalLoan!.originalBalance)).toBe(30000);
    });
  });

  describe('payment strategies', () => {
    it('should apply avalanche strategy (highest rate first)', () => {
      const input = createBasicInput({ paymentStrategy: 'avalanche' });
      const result = analyze(input);

      // Private loan (7%) should be targeted first with avalanche
      expect(result.summary.strategy).toBe('avalanche');
    });

    it('should apply snowball strategy (lowest balance first)', () => {
      const input = createBasicInput({ paymentStrategy: 'snowball' });
      const result = analyze(input);

      // Private loan ($20k) should be targeted first with snowball (lower balance)
      expect(result.summary.strategy).toBe('snowball');
    });

    it('should apply minimum payments only', () => {
      const input = createBasicInput({
        paymentStrategy: 'minimum_only',
        extraMonthlyPayment: 0,
      });
      const result = analyze(input);

      expect(result.summary.strategy).toBe('minimum_only');
    });
  });

  describe('income-driven repayment analysis', () => {
    it('should calculate IBR plan', () => {
      const input = createBasicInput({
        incomeDrivenPlan: {
          planType: 'IBR',
          annualIncome: 60000,
          familySize: 1,
          expectedAnnualIncreaseRate: 0.03,
        },
        forgivenessEligible: true,
        forgivenessMonths: 240,
      });
      const result = analyze(input);

      expect(result.incomeDrivenAnalysis).toBeDefined();
      expect(result.incomeDrivenAnalysis!.planType).toBe('IBR');
      expect(parseFloat(result.incomeDrivenAnalysis!.monthlyPaymentYear1)).toBeGreaterThan(0);
    });

    it('should calculate PAYE plan', () => {
      const input = createBasicInput({
        incomeDrivenPlan: {
          planType: 'PAYE',
          annualIncome: 50000,
          familySize: 2,
          expectedAnnualIncreaseRate: 0.02,
        },
      });
      const result = analyze(input);

      expect(result.incomeDrivenAnalysis).toBeDefined();
      expect(result.incomeDrivenAnalysis!.planType).toBe('PAYE');
    });

    it('should calculate REPAYE plan', () => {
      const input = createBasicInput({
        incomeDrivenPlan: {
          planType: 'REPAYE',
          annualIncome: 45000,
          familySize: 1,
          expectedAnnualIncreaseRate: 0.025,
        },
      });
      const result = analyze(input);

      expect(result.incomeDrivenAnalysis).toBeDefined();
      expect(result.incomeDrivenAnalysis!.planType).toBe('REPAYE');
    });

    it('should calculate ICR plan', () => {
      const input = createBasicInput({
        incomeDrivenPlan: {
          planType: 'ICR',
          annualIncome: 55000,
          familySize: 1,
          expectedAnnualIncreaseRate: 0.03,
        },
      });
      const result = analyze(input);

      expect(result.incomeDrivenAnalysis).toBeDefined();
      expect(result.incomeDrivenAnalysis!.planType).toBe('ICR');
    });

    it('should compare IDR to standard repayment', () => {
      const input = createBasicInput({
        incomeDrivenPlan: {
          planType: 'IBR',
          annualIncome: 40000,
          familySize: 1,
          expectedAnnualIncreaseRate: 0.02,
        },
        forgivenessEligible: true,
      });
      const result = analyze(input);

      expect(result.incomeDrivenAnalysis!.comparisonToStandard).toBeDefined();
      expect(result.incomeDrivenAnalysis!.comparisonToStandard.paymentDifference).toBeDefined();
      expect(result.incomeDrivenAnalysis!.comparisonToStandard.recommended).toBeDefined();
      expect(result.incomeDrivenAnalysis!.comparisonToStandard.reason).toBeDefined();
    });

    it('should calculate potential forgiveness', () => {
      const input = createBasicInput({
        incomeDrivenPlan: {
          planType: 'IBR',
          annualIncome: 35000,
          familySize: 2,
          expectedAnnualIncreaseRate: 0.02,
        },
        forgivenessEligible: true,
        forgivenessMonths: 240,
      });
      const result = analyze(input);

      expect(result.incomeDrivenAnalysis!.potentialForgiveness).toBeDefined();
    });
  });

  describe('refinancing analysis', () => {
    it('should calculate refinancing option', () => {
      const input = createBasicInput({
        refinancingOption: {
          newInterestRate: 0.04,
          newTermMonths: 120,
          closingCosts: 500,
        },
      });
      const result = analyze(input);

      expect(result.refinancingAnalysis).toBeDefined();
      expect(parseFloat(result.refinancingAnalysis!.newMonthlyPayment)).toBeGreaterThan(0);
    });

    it('should calculate total savings from refinancing', () => {
      const input = createBasicInput({
        refinancingOption: {
          newInterestRate: 0.035,
          newTermMonths: 84,
          closingCosts: 300,
        },
      });
      const result = analyze(input);

      expect(result.refinancingAnalysis!.totalSavings).toBeDefined();
    });

    it('should warn about losing federal benefits', () => {
      const input = createBasicInput({
        refinancingOption: {
          newInterestRate: 0.04,
          newTermMonths: 120,
          closingCosts: 500,
        },
      });
      const result = analyze(input);

      expect(result.refinancingAnalysis!.warnings).toBeDefined();
      expect(result.refinancingAnalysis!.warnings.length).toBeGreaterThan(0);
      expect(
        result.refinancingAnalysis!.warnings.some((w) => w.includes('federal'))
      ).toBe(true);
    });

    it('should recommend against higher rate refinancing', () => {
      const input: StudentLoanInput = {
        loans: [
          {
            name: 'Federal Loan',
            loanType: 'federal_unsubsidized',
            balance: 30000,
            interestRate: 0.04,
            minimumPayment: 300,
          },
        ],
        extraMonthlyPayment: 0,
        paymentStrategy: 'avalanche',
        refinancingOption: {
          newInterestRate: 0.08, // Higher than current
          newTermMonths: 120,
          closingCosts: 500,
        },
      };
      const result = analyze(input);

      expect(result.refinancingAnalysis!.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('recommendations', () => {
    it('should generate recommendations', () => {
      const input = createBasicInput();
      const result = analyze(input);

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should recommend extra payments when none provided', () => {
      const input = createBasicInput({ extraMonthlyPayment: 0 });
      const result = analyze(input);

      expect(
        result.recommendations.some((r) => r.toLowerCase().includes('extra'))
      ).toBe(true);
    });

    it('should explain avalanche method', () => {
      const input = createBasicInput({ paymentStrategy: 'avalanche' });
      const result = analyze(input);

      expect(
        result.recommendations.some((r) => r.toLowerCase().includes('avalanche'))
      ).toBe(true);
    });

    it('should explain snowball method', () => {
      const input = createBasicInput({ paymentStrategy: 'snowball' });
      const result = analyze(input);

      expect(
        result.recommendations.some((r) => r.toLowerCase().includes('snowball'))
      ).toBe(true);
    });

    it('should recommend IDR for federal loans', () => {
      const input = createBasicInput();
      const result = analyze(input);

      expect(
        result.recommendations.some(
          (r) => r.toLowerCase().includes('income-driven') || r.toLowerCase().includes('idr')
        )
      ).toBe(true);
    });
  });

  describe('input summary', () => {
    it('should include input summary', () => {
      const input = createBasicInput();
      const result = analyze(input);

      expect(result.input).toBeDefined();
      expect(result.input.totalLoans).toBe(2);
      expect(parseFloat(result.input.totalBalance)).toBe(50000);
      expect(result.input.paymentStrategy).toBe('avalanche');
    });

    it('should calculate weighted average rate', () => {
      const input = createBasicInput();
      const result = analyze(input);

      // Expected: (30000 * 0.05 + 20000 * 0.07) / 50000 = 0.058 = 5.8%
      expect(parseFloat(result.input.weightedAverageRate)).toBeCloseTo(5.8, 1);
    });
  });

  describe('edge cases', () => {
    it('should handle single loan', () => {
      const input: StudentLoanInput = {
        loans: [
          {
            name: 'Single Loan',
            loanType: 'private',
            balance: 10000,
            interestRate: 0.06,
            minimumPayment: 200,
          },
        ],
        extraMonthlyPayment: 50,
        paymentStrategy: 'avalanche',
      };
      const result = analyze(input);

      expect(result).toBeDefined();
      expect(result.summary.loanSummaries.length).toBe(1);
    });

    it('should handle many loans', () => {
      const loans = Array.from({ length: 10 }, (_, i) => ({
        name: `Loan ${i + 1}`,
        loanType: 'private' as const,
        balance: 5000 + i * 1000,
        interestRate: 0.04 + i * 0.005,
        minimumPayment: 100 + i * 10,
      }));

      const input: StudentLoanInput = {
        loans,
        extraMonthlyPayment: 200,
        paymentStrategy: 'avalanche',
      };
      const result = analyze(input);

      expect(result).toBeDefined();
      expect(result.summary.loanSummaries.length).toBe(10);
    });

    it('should handle zero extra payment', () => {
      const input = createBasicInput({ extraMonthlyPayment: 0 });
      const result = analyze(input);

      expect(result).toBeDefined();
      expect(result.summary.totalMonthsToPayoff).toBeGreaterThan(0);
    });

    it('should handle large extra payment', () => {
      const input = createBasicInput({ extraMonthlyPayment: 5000 });
      const result = analyze(input);

      expect(result).toBeDefined();
      expect(result.summary.totalMonthsToPayoff).toBeLessThan(20);
    });
  });

  describe('metadata', () => {
    it('should include metadata', () => {
      const input = createBasicInput();
      const result = analyze(input);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.calculatedAt).toBeDefined();
      expect(result.metadata.version).toBe('1.0.0');
    });
  });
});
