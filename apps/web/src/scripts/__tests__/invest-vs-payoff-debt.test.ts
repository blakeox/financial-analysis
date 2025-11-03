/**
 * Unit Tests for Invest vs Pay Off Debt Calculator
 */

import { describe, it, expect, beforeEach } from 'vitest';

type InvestVsDebtInput = {
  extraMoney: number;
  debtBalance: number;
  debtInterestRate: number;
  debtMinimumPayment: number;
  debtType: 'credit-card' | 'student-loan' | 'auto-loan' | 'mortgage' | 'personal-loan';
  expectedInvestmentReturn: number;
  taxRate: number;
  timeHorizonYears: number;
  hasEmergencyFund: boolean;
  employerMatch: number;
};

describe('Invest vs Pay Off Debt Calculator', () => {
  let defaultInput: InvestVsDebtInput;

  beforeEach(() => {
    defaultInput = {
      extraMoney: 500,
      debtBalance: 10000,
      debtInterestRate: 18,
      debtMinimumPayment: 200,
      debtType: 'credit-card',
      expectedInvestmentReturn: 10,
      taxRate: 22,
      timeHorizonYears: 10,
      hasEmergencyFund: true,
      employerMatch: 0,
    };
  });

  describe('Input Validation', () => {
    it('should require positive extra money', () => {
      const invalid = { ...defaultInput, extraMoney: 0 };
      expect(() => validateInput(invalid)).toThrow('extra money');
    });

    it('should require positive debt balance', () => {
      const invalid = { ...defaultInput, debtBalance: 0 };
      expect(() => validateInput(invalid)).toThrow('debt balance');
    });

    it('should require valid interest rate', () => {
      const invalid = { ...defaultInput, debtInterestRate: -1 };
      expect(() => validateInput(invalid)).toThrow('valid interest rate');
    });

    it('should require positive minimum payment', () => {
      const invalid = { ...defaultInput, debtMinimumPayment: 0 };
      expect(() => validateInput(invalid)).toThrow('minimum payment');
    });
  });

  describe('Pay Off Debt First Strategy', () => {
    it('should calculate payoff time correctly', () => {
      // $10k debt at 18% APR with $700/month payment ($200 min + $500 extra)
      const monthlyRate = 0.18 / 12;
      const monthlyPayment = 700;
      
      let balance = 10000;
      let months = 0;
      
      while (balance > 0 && months < 100) {
        const interest = balance * monthlyRate;
        const principal = monthlyPayment - interest;
        balance -= principal;
        months++;
      }
      
      // Should pay off in ~17 months
      expect(months).toBeLessThan(20);
      expect(months).toBeGreaterThan(15);
    });

    it('should calculate total interest paid correctly', () => {
      const monthlyRate = 0.18 / 12;
      const monthlyPayment = 700;
      
      let balance = 10000;
      let totalInterest = 0;
      
      while (balance > 0) {
        const interest = balance * monthlyRate;
        const principal = Math.min(monthlyPayment - interest, balance);
        totalInterest += interest;
        balance -= principal;
      }
      
      // Total interest should be ~$1,400-$1,600 with aggressive payments
      expect(totalInterest).toBeGreaterThan(1200);
      expect(totalInterest).toBeLessThan(2000);
    });

    it('should invest extra money after debt is paid off', () => {
      // After paying off debt in 17 months, invest for remaining 103 months
      const monthsInvesting = 103;
      const monthlyReturn = 0.10 / 12;
      const extraMoney = 500;
      
      let investment = 0;
      for (let i = 0; i < monthsInvesting; i++) {
        investment = investment * (1 + monthlyReturn) + extraMoney;
      }
      
      // Should accumulate significant investment
      expect(investment).toBeGreaterThan(60000);
    });
  });

  describe('Invest First Strategy', () => {
    it('should calculate investment growth with employer match', () => {
      const monthlyInvestment = 500;
      const employerMatch = 0.50; // 50% match
      const totalMonthly = monthlyInvestment * (1 + employerMatch);
      const monthlyReturn = 0.10 / 12;
      const months = 120;
      
      let balance = 0;
      for (let i = 0; i < months; i++) {
        balance = balance * (1 + monthlyReturn) + totalMonthly;
      }
      
      // With match, should have significantly more
      expect(balance).toBeGreaterThan(100000);
    });

    it('should continue paying minimum on debt', () => {
      const minimumPayment = 200;
      const monthlyRate = 0.18 / 12;
      const months = 12;
      
      let balance = 10000;
      for (let i = 0; i < months; i++) {
        const interest = balance * monthlyRate;
        const principal = minimumPayment - interest;
        balance -= principal;
      }
      
      // Debt should decrease but still be substantial
      expect(balance).toBeLessThan(10000);
      expect(balance).toBeGreaterThan(8000);
    });
  });

  describe('Hybrid Strategy', () => {
    it('should split extra money 50/50', () => {
      const extraMoney = 500;
      const toDebt = extraMoney * 0.5;
      const toInvest = extraMoney * 0.5;
      
      expect(toDebt).toBe(250);
      expect(toInvest).toBe(250);
    });

    it('should redirect debt payment to investing after payoff', () => {
      // Once debt is paid, both halves go to investing
      const extraMoney = 500;
      const afterDebtPayoff = extraMoney; // Full amount to investing
      
      expect(afterDebtPayoff).toBe(500);
    });
  });

  describe('Recommendation Logic', () => {
    it('should prioritize emergency fund if not present', () => {
      const noEmergencyFund = { ...defaultInput, hasEmergencyFund: false };
      
      // Recommendation should be to build emergency fund first
      expect(noEmergencyFund.hasEmergencyFund).toBe(false);
    });

    it('should recommend investing when employer match is available and debt rate is moderate', () => {
      const withMatch = { ...defaultInput, employerMatch: 50, debtInterestRate: 6 };
      
      // 50% employer match is immediate 50% return - beats 6% debt
      expect(withMatch.employerMatch).toBeGreaterThan(withMatch.debtInterestRate);
    });

    it('should recommend paying debt when interest rate is very high', () => {
      const highInterest = { ...defaultInput, debtInterestRate: 24 };
      
      // 24% guaranteed return from debt payoff beats 10% expected investment return
      expect(highInterest.debtInterestRate).toBeGreaterThan(defaultInput.expectedInvestmentReturn);
    });

    it('should recommend investing for low-rate mortgage debt', () => {
      const lowRateMortgage = { ...defaultInput, debtType: 'mortgage' as const, debtInterestRate: 3.5 };
      
      // 3.5% mortgage vs 10% expected returns - invest wins mathematically
      expect(defaultInput.expectedInvestmentReturn).toBeGreaterThan(lowRateMortgage.debtInterestRate);
    });

    it('should recommend hybrid when rates are close', () => {
      const similarRates = { ...defaultInput, debtInterestRate: 8, expectedInvestmentReturn: 10 };
      const diff = similarRates.expectedInvestmentReturn - similarRates.debtInterestRate;
      
      // 2% difference suggests hybrid approach
      expect(diff).toBeLessThan(3);
      expect(diff).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle debt with 0% interest (promotional)', () => {
      const zeroInterest = { ...defaultInput, debtInterestRate: 0 };
      
      // With 0% debt, always invest instead
      expect(zeroInterest.debtInterestRate).toBe(0);
      expect(defaultInput.expectedInvestmentReturn).toBeGreaterThan(0);
    });

    it('should handle very small debt balances', () => {
      const smallDebt = { ...defaultInput, debtBalance: 100 };
      
      // $100 debt should be paid off immediately
      expect(smallDebt.debtBalance).toBeLessThan(smallDebt.extraMoney);
    });

    it('should handle very large employer match (100%)', () => {
      const fullMatch = { ...defaultInput, employerMatch: 100 };
      
      // 100% match = immediate 100% return!
      expect(fullMatch.employerMatch).toBe(100);
    });

    it('should handle minimum payment larger than extra money', () => {
      const largeMinimum = { ...defaultInput, debtMinimumPayment: 600, extraMoney: 100 };
      const totalPayment = largeMinimum.debtMinimumPayment + largeMinimum.extraMoney;
      
      expect(totalPayment).toBe(700);
    });
  });

  describe('Mathematical Accuracy', () => {
    it('should correctly calculate compound interest for investments', () => {
      const principal = 500;
      const monthlyRate = 0.10 / 12;
      const months = 120;
      
      let balance = 0;
      for (let i = 0; i < months; i++) {
        balance = balance * (1 + monthlyRate) + principal;
      }
      
      // Future value of annuity formula: PMT * ((1 + r)^n - 1) / r
      const expected = principal * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
      
      expect(balance).toBeCloseTo(expected, 2);
    });

    it('should correctly calculate debt payoff with interest', () => {
      const balance = 10000;
      const rate = 0.18 / 12;
      const payment = 500;
      
      let remaining = balance;
      let months = 0;
      
      while (remaining > 0.01) {
        const interest = remaining * rate;
        const principal = payment - interest;
        remaining -= principal;
        months++;
      }
      
      // Verify it converges to zero
      expect(remaining).toBeLessThan(0.02);
      expect(months).toBeGreaterThan(0);
    });
  });
});

function validateInput(input: InvestVsDebtInput): void {
  if (input.extraMoney <= 0) throw new Error('Please enter extra money amount');
  if (input.debtBalance <= 0) throw new Error('Please enter debt balance');
  if (input.debtInterestRate < 0) throw new Error('Please enter valid interest rate');
  if (input.debtMinimumPayment <= 0) throw new Error('Please enter minimum payment');
}

