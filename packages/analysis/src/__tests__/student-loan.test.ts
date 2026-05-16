import { describe, it, expect } from 'vitest';
import * as StudentLoanEngine from '../engines/student-loan.js';
import type { StudentLoanInput } from '../schemas/student-loan.js';

describe('StudentLoanEngine', () => {
  it('should calculate avalanche strategy for student loans', () => {
    const input: StudentLoanInput = {
      loans: [
        {
          name: 'Federal Subsidized',
          balance: 15000,
          interestRate: 0.045,
          minimumPayment: 200,
          loanType: 'federal_subsidized',
        },
        {
          name: 'Federal Unsubsidized',
          balance: 20000,
          interestRate: 0.065,
          minimumPayment: 250,
          loanType: 'federal_unsubsidized',
        },
        {
          name: 'Private Loan',
          balance: 10000,
          interestRate: 0.085,
          minimumPayment: 150,
          loanType: 'private',
        },
      ],
      extraMonthlyPayment: 300,
      paymentStrategy: 'avalanche',
    };

    const result = StudentLoanEngine.analyze(input);

    expect(result.summary.strategy).toBe('avalanche');
    expect(result.summary.totalMonthsToPayoff).toBeGreaterThan(0);
    expect(result.summary.totalMonthsToPayoff).toBeLessThan(120);
    expect(result.summary.loanSummaries.length).toBe(3);

    const privateHighest = result.summary.loanSummaries.find((s) => s.name === 'Private Loan');
    expect(privateHighest).toBeDefined();
  });

  it('should calculate snowball strategy', () => {
    const input: StudentLoanInput = {
      loans: [
        {
          name: 'Loan A - Small',
          balance: 3000,
          interestRate: 0.04,
          minimumPayment: 100,
          loanType: 'federal_unsubsidized',
        },
        {
          name: 'Loan B - Large',
          balance: 15000,
          interestRate: 0.08,
          minimumPayment: 250,
          loanType: 'private',
        },
      ],
      extraMonthlyPayment: 200,
      paymentStrategy: 'snowball',
    };

    const result = StudentLoanEngine.analyze(input);

    expect(result.summary.strategy).toBe('snowball');
    expect(result.payoffSchedule.length).toBeGreaterThan(0);
  });

  it('should analyze income-driven repayment plan', () => {
    const input: StudentLoanInput = {
      loans: [
        {
          name: 'Federal Loan 1',
          balance: 50000,
          interestRate: 0.055,
          minimumPayment: 500,
          loanType: 'federal_unsubsidized',
        },
      ],
      extraMonthlyPayment: 0,
      paymentStrategy: 'standard',
      incomeDrivenPlan: {
        planType: 'PAYE',
        annualIncome: 45000,
        familySize: 1,
        expectedAnnualIncreaseRate: 0.03,
      },
    };

    const result = StudentLoanEngine.analyze(input);

    expect(result.incomeDrivenAnalysis).toBeDefined();
    if (result.incomeDrivenAnalysis) {
      expect(result.incomeDrivenAnalysis.planType).toBe('PAYE');
      expect(parseFloat(result.incomeDrivenAnalysis.monthlyPaymentYear1)).toBeGreaterThan(0);
      expect(result.incomeDrivenAnalysis.comparisonToStandard).toBeDefined();
    }
  });

  it('should analyze refinancing options', () => {
    const input: StudentLoanInput = {
      loans: [
        {
          name: 'High Rate Loan',
          balance: 30000,
          interestRate: 0.08,
          minimumPayment: 400,
          loanType: 'private',
        },
      ],
      extraMonthlyPayment: 0,
      paymentStrategy: 'standard',
      refinancingOption: {
        newInterestRate: 0.05,
        newTermMonths: 120,
        closingCosts: 500,
      },
    };

    const result = StudentLoanEngine.analyze(input);

    expect(result.refinancingAnalysis).toBeDefined();
    if (result.refinancingAnalysis) {
      expect(result.refinancingAnalysis.newInterestRate).toBe('5.00');
      expect(result.refinancingAnalysis.newTermMonths).toBe(120);
      expect(parseFloat(result.refinancingAnalysis.totalSavings)).toBeDefined();
    }
  });

  it('should generate month-by-month schedule', () => {
    const input: StudentLoanInput = {
      loans: [
        {
          name: 'Test Loan',
          balance: 10000,
          interestRate: 0.06,
          minimumPayment: 200,
          loanType: 'federal_subsidized',
        },
      ],
      extraMonthlyPayment: 100,
      paymentStrategy: 'standard',
    };

    const result = StudentLoanEngine.analyze(input);

    expect(result.payoffSchedule.length).toBeGreaterThan(0);

    const firstMonth = result.payoffSchedule[0];
    expect(firstMonth).toBeDefined();
    if (firstMonth) {
      expect(firstMonth.month).toBe(1);
      expect(firstMonth.payments.length).toBe(1);
      expect(parseFloat(firstMonth.totalPayment)).toBeGreaterThan(200);
    }
  });

  it('should handle multiple federal loans', () => {
    const input: StudentLoanInput = {
      loans: [
        {
          name: 'Federal Sub 1',
          balance: 5500,
          interestRate: 0.045,
          minimumPayment: 100,
          loanType: 'federal_subsidized',
        },
        {
          name: 'Federal Unsub 1',
          balance: 7500,
          interestRate: 0.055,
          minimumPayment: 120,
          loanType: 'federal_unsubsidized',
        },
        {
          name: 'Federal Unsub 2',
          balance: 10000,
          interestRate: 0.065,
          minimumPayment: 150,
          loanType: 'federal_unsubsidized',
        },
      ],
      extraMonthlyPayment: 150,
      paymentStrategy: 'avalanche',
      forgivenessEligible: false,
    };

    const result = StudentLoanEngine.analyze(input);

    expect(result.input.totalLoans).toBe(3);
    expect(parseFloat(result.input.totalBalance)).toBe(23000);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('should provide recommendations', () => {
    const input: StudentLoanInput = {
      loans: [
        {
          name: 'Mixed Loans',
          balance: 25000,
          interestRate: 0.07,
          minimumPayment: 300,
          loanType: 'federal_unsubsidized',
        },
      ],
      extraMonthlyPayment: 0,
      paymentStrategy: 'standard',
    };

    const result = StudentLoanEngine.analyze(input);

    expect(result.recommendations).toBeDefined();
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});
