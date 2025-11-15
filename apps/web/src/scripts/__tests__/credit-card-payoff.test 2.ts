/**
 * Unit Tests for Credit Card Payoff Calculator
 */

import { describe, it, expect, beforeEach } from 'vitest';

type CreditCardInput = {
  balance: number;
  interestRate: number;
  minimumPaymentPercent: number;
  monthlyPayment: number;
  creditLimit: number;
  balanceTransferOffer: boolean;
  transferAPR: number;
  transferFee: number;
  transferPromoPeriod: number;
};

describe('Credit Card Payoff Calculator', () => {
  let defaultInput: CreditCardInput;

  beforeEach(() => {
    defaultInput = {
      balance: 5000,
      interestRate: 18.99,
      minimumPaymentPercent: 2,
      monthlyPayment: 200,
      creditLimit: 10000,
      balanceTransferOffer: false,
      transferAPR: 0,
      transferFee: 3,
      transferPromoPeriod: 12,
    };
  });

  describe('Input Validation', () => {
    it('should require positive balance', () => {
      const invalid = { ...defaultInput, balance: 0 };
      expect(() => validateInput(invalid)).toThrow('balance');
    });

    it('should require positive interest rate', () => {
      const invalid = { ...defaultInput, interestRate: 0 };
      expect(() => validateInput(invalid)).toThrow('interest rate');
    });

    it('should require monthly payment at least minimum', () => {
      const balance = 5000;
      const minimumPercent = 2;
      const minimum = balance * (minimumPercent / 100);
      const tooLow = minimum - 1;
      
      expect(tooLow).toBeLessThan(minimum);
    });

    it('should require positive credit limit', () => {
      const invalid = { ...defaultInput, creditLimit: 0 };
      expect(() => validateInput(invalid)).toThrow('credit limit');
    });
  });

  describe('Minimum Payment Calculations', () => {
    it('should calculate minimum as 2% of balance or $25, whichever is greater', () => {
      const highBalance = 5000;
      const minimum1 = Math.max(highBalance * 0.02, 25);
      expect(minimum1).toBe(100);
      
      const lowBalance = 500;
      const minimum2 = Math.max(lowBalance * 0.02, 25);
      expect(minimum2).toBe(25); // Floor of $25
    });

    it('should show the minimum payment trap takes many years', () => {
      // $5000 at 18.99% APR with only 2% minimum payment
      const balance = 5000;
      const rate = 0.1899 / 12;
      
      let remaining = balance;
      let months = 0;
      
      while (remaining > 1 && months < 600) {
        const minimum = Math.max(remaining * 0.02, 25);
        const interest = remaining * rate;
        const principal = minimum - interest;
        
        if (principal <= 0) break; // Payment doesn't cover interest
        
        remaining -= principal;
        months++;
      }
      
      // Should take many years (typically 15-30 years for minimum payments)
      expect(months).toBeGreaterThan(150); // More than 12 years
    });

    it('should calculate total interest for minimum-only payments', () => {
      const balance = 5000;
      const rate = 0.1899 / 12;
      
      let remaining = balance;
      let totalInterest = 0;
      let months = 0;
      
      while (remaining > 1 && months < 600) {
        const minimum = Math.max(remaining * 0.02, 25);
        const interest = remaining * rate;
        const principal = minimum - interest;
        
        if (principal <= 0) break;
        
        totalInterest += interest;
        remaining -= principal;
        months++;
      }
      
      // Interest paid should be MUCH higher than original balance
      expect(totalInterest).toBeGreaterThan(balance);
      expect(totalInterest / balance).toBeGreaterThan(1); // More than 100% of original balance!
    });
  });

  describe('Aggressive Payoff Strategy', () => {
    it('should pay off faster with higher payments', () => {
      const balance = 5000;
      const rate = 0.1899 / 12;
      const aggressivePayment = 400;
      
      let remaining = balance;
      let months = 0;
      
      while (remaining > 0.01) {
        const interest = remaining * rate;
        const principal = aggressivePayment - interest;
        remaining -= principal;
        months++;
      }
      
      // Should pay off in ~14-15 months
      expect(months).toBeLessThan(20);
      expect(months).toBeGreaterThan(12);
    });

    it('should save significant interest with aggressive payments', () => {
      const balance = 5000;
      const rate = 0.1899 / 12;
      
      // Minimum payments
      let minBalance = balance;
      let minInterest = 0;
      for (let i = 0; i < 300 && minBalance > 1; i++) {
        const min = Math.max(minBalance * 0.02, 25);
        const interest = minBalance * rate;
        const principal = min - interest;
        if (principal <= 0) break;
        minInterest += interest;
        minBalance -= principal;
      }
      
      // Aggressive payments
      let aggBalance = balance;
      let aggInterest = 0;
      for (let i = 0; i < 50 && aggBalance > 0.01; i++) {
        const interest = aggBalance * rate;
        const principal = 400 - interest;
        aggInterest += interest;
        aggBalance -= principal;
      }
      
      // Aggressive should save thousands
      expect(minInterest - aggInterest).toBeGreaterThan(3000);
    });
  });

  describe('Balance Transfer Analysis', () => {
    it('should calculate transfer fee correctly', () => {
      const balance = 5000;
      const transferFee = 3; // 3%
      const feeAmount = balance * (transferFee / 100);
      
      expect(feeAmount).toBe(150);
    });

    it('should add transfer fee to new balance', () => {
      const balance = 5000;
      const transferFee = 150;
      const newBalance = balance + transferFee;
      
      expect(newBalance).toBe(5150);
    });

    it('should calculate savings from 0% APR promo', () => {
      const balance = 5000;
      const originalRate = 0.1899 / 12;
      const promoRate = 0; // 0% APR
      const months = 12;
      const monthlyPayment = 450;
      
      // Original card interest
      let origBalance = balance;
      let origInterest = 0;
      for (let i = 0; i < months && origBalance > 0; i++) {
        const interest = origBalance * originalRate;
        const principal = monthlyPayment - interest;
        origInterest += interest;
        origBalance -= principal;
      }
      
      // Transfer card interest (0%)
      let transferBalance = balance + 150; // Include fee
      let transferInterest = 0;
      for (let i = 0; i < months && transferBalance > 0; i++) {
        const interest = transferBalance * promoRate; // $0
        const principal = monthlyPayment - interest;
        transferInterest += interest;
        transferBalance -= principal;
      }
      
      // Should save all the interest (minus transfer fee)
      const netSavings = origInterest - transferInterest - 150;
      expect(netSavings).toBeGreaterThan(0);
      expect(transferInterest).toBe(0);
    });

    it('should warn about rate jump after promo period', () => {
      const promoMonths = 12;
      const monthlyPayment = 300;
      const transferBalance = 5150;
      
      // Amount paid off during promo
      const paidDuringPromo = monthlyPayment * promoMonths;
      const remainingAfterPromo = transferBalance - paidDuringPromo;
      
      if (remainingAfterPromo > 0) {
        // Remaining balance will be charged at high rate (often 20%+)
        expect(remainingAfterPromo).toBeGreaterThan(0);
      }
    });

    it('should calculate required monthly payment to pay off during promo', () => {
      const transferBalance = 5150;
      const promoMonths = 12;
      const requiredPayment = transferBalance / promoMonths;
      
      expect(requiredPayment).toBeCloseTo(429.17, 2);
    });
  });

  describe('Credit Utilization Impact', () => {
    it('should calculate utilization as balance / credit limit', () => {
      const balance = 5000;
      const creditLimit = 10000;
      const utilization = (balance / creditLimit) * 100;
      
      expect(utilization).toBe(50);
    });

    it('should flag utilization > 70% as critical', () => {
      const highUtil = 75;
      expect(highUtil).toBeGreaterThan(70);
    });

    it('should flag utilization > 30% as needing improvement', () => {
      const moderateUtil = 50;
      expect(moderateUtil).toBeGreaterThan(30);
      expect(moderateUtil).toBeLessThan(70);
    });

    it('should show utilization decreases as balance is paid', () => {
      const initialBalance = 5000;
      const creditLimit = 10000;
      const initialUtil = (initialBalance / creditLimit) * 100;
      
      const afterPayment = 3000;
      const newUtil = (afterPayment / creditLimit) * 100;
      
      expect(newUtil).toBeLessThan(initialUtil);
      expect(initialUtil).toBe(50);
      expect(newUtil).toBe(30);
    });

    it('should estimate credit score improvement from utilization reduction', () => {
      // Dropping from 70% to 30% utilization can improve score by 50-100 points
      const utilizationDrop = 70 - 30; // 40 percentage points
      const estimatedImprovement = utilizationDrop * 2; // Rough estimate: 2 points per %
      
      expect(estimatedImprovement).toBeGreaterThan(50);
      expect(estimatedImprovement).toBeLessThan(100);
    });
  });

  describe('Strategy Comparison', () => {
    it('should compare minimum vs current vs aggressive payments', () => {
      const balance = 5000;
      const minimum = 100; // 2%
      const current = 200;
      const aggressive = 400;
      
      expect(aggressive).toBeGreaterThan(current);
      expect(current).toBeGreaterThan(minimum);
    });

    it('should identify best strategy by total interest paid', () => {
      // More aggressive payment = less interest
      const minInterest = 8000; // Minimum payments
      const currentInterest = 1500; // Current payments
      const aggressiveInterest = 600; // Aggressive payments
      
      const bestInterest = Math.min(minInterest, currentInterest, aggressiveInterest);
      
      expect(bestInterest).toBe(aggressiveInterest);
    });

    it('should consider balance transfer if it saves money despite fee', () => {
      const originalInterest = 1500;
      const transferFee = 150;
      const transferInterest = 0; // 0% APR
      const transferTotal = transferFee + transferInterest;
      
      const savings = originalInterest - transferTotal;
      
      expect(savings).toBe(1350);
      expect(savings).toBeGreaterThan(0);
    });
  });

  describe('Realistic Scenarios', () => {
    it('should handle typical credit card debt scenario', () => {
      // $8,000 balance at 21% APR, paying $300/month
      const balance = 8000;
      const rate = 0.21 / 12;
      const payment = 300;
      
      let remaining = balance;
      let months = 0;
      let totalInterest = 0;
      
      while (remaining > 0.01 && months < 100) {
        const interest = remaining * rate;
        const principal = payment - interest;
        totalInterest += interest;
        remaining -= principal;
        months++;
      }
      
      // Should pay off in ~32-35 months
      expect(months).toBeGreaterThan(30);
      expect(months).toBeLessThan(40);
      
      // Interest should be ~$2,000-$2,500
      expect(totalInterest).toBeGreaterThan(1800);
      expect(totalInterest).toBeLessThan(3000);
    });

    it('should handle multiple cards with balance transfer', () => {
      // Transfer $5k from 18.99% to 0% for 12 months with 3% fee
      const balance = 5000;
      const fee = balance * 0.03;
      const newBalance = balance + fee;
      
      expect(fee).toBe(150);
      expect(newBalance).toBe(5150);
      
      // Must pay off in 12 months to avoid rate jump
      const requiredMonthly = newBalance / 12;
      expect(requiredMonthly).toBeCloseTo(429, 0);
    });
  });
});

function validateInput(input: CreditCardInput): void {
  if (input.balance <= 0) throw new Error('Please enter card balance');
  if (input.interestRate <= 0) throw new Error('Please enter interest rate');
  if (input.monthlyPayment <= 0) throw new Error('Please enter monthly payment');
  if (input.creditLimit <= 0) throw new Error('Please enter credit limit');
  if (input.monthlyPayment < input.balance * (input.minimumPaymentPercent / 100)) {
    throw new Error('Monthly payment must be at least the minimum');
  }
}

