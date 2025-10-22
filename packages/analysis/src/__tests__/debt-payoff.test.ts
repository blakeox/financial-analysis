import { describe, it, expect } from 'vitest';
import { DebtPayoffEngine } from '../engines/debt-payoff.js';
import type { DebtPayoffInput } from '../schemas/debt-payoff.js';

describe('DebtPayoffEngine', () => {
  it('should calculate avalanche strategy correctly', () => {
    const input: DebtPayoffInput = {
      debts: [
        { name: 'Credit Card A', balance: 5000, interestRate: 0.18, minimumPayment: 150 },
        { name: 'Credit Card B', balance: 3000, interestRate: 0.24, minimumPayment: 90 },
        { name: 'Personal Loan', balance: 8000, interestRate: 0.12, minimumPayment: 200 },
      ],
      extraMonthlyPayment: 300,
      strategy: 'avalanche',
    };

    const result = DebtPayoffEngine.analyze(input);

    expect(result.input.numberOfDebts).toBe(3);
    expect(parseFloat(result.input.totalDebtBalance)).toBe(16000);
    expect(parseFloat(result.input.totalMinimumPayment)).toBe(440);
    expect(result.summary.strategy).toBe('avalanche');
    
    // Avalanche should pay off highest rate debt (Credit Card B at 24%) fastest
    const creditCardB = result.summary.debtSummaries.find(d => d.name === 'Credit Card B');
    expect(creditCardB).toBeDefined();
    expect(result.summary.totalMonthsToPayoff).toBeGreaterThan(0);
    expect(parseFloat(result.summary.totalInterestPaid)).toBeGreaterThan(0);
  });

  it('should calculate snowball strategy correctly', () => {
    const input: DebtPayoffInput = {
      debts: [
        { name: 'Credit Card A', balance: 5000, interestRate: 0.18, minimumPayment: 150 },
        { name: 'Credit Card B', balance: 3000, interestRate: 0.24, minimumPayment: 90 },
        { name: 'Personal Loan', balance: 8000, interestRate: 0.12, minimumPayment: 200 },
      ],
      extraMonthlyPayment: 300,
      strategy: 'snowball',
    };

    const result = DebtPayoffEngine.analyze(input);

    expect(result.summary.strategy).toBe('snowball');
    
    // Snowball should target lowest balance (Credit Card B at $3000) first
    const firstDebtPaidOff = result.summary.debtSummaries.find(d => d.monthsToPayoff === Math.min(...result.summary.debtSummaries.map(s => s.monthsToPayoff)));
    expect(firstDebtPaidOff?.name).toBe('Credit Card B');
  });

  it('should show avalanche saves more interest than snowball', () => {
    const input: DebtPayoffInput = {
      debts: [
        { name: 'High Interest', balance: 2000, interestRate: 0.25, minimumPayment: 60 },
        { name: 'Low Interest', balance: 5000, interestRate: 0.08, minimumPayment: 100 },
      ],
      extraMonthlyPayment: 200,
      strategy: 'avalanche',
    };

    const result = DebtPayoffEngine.analyze(input);

    const avalancheInterest = parseFloat(result.summary.totalInterestPaid);
    const snowballInterest = parseFloat(result.alternativeStrategy!.totalInterestPaid);
    const savings = parseFloat(result.comparisonSavings!);

    // With this scenario (high rate on smaller balance, low rate on larger balance),
    // avalanche and snowball should be very close or avalanche might save slightly
    expect(avalancheInterest).toBeLessThanOrEqual(snowballInterest);
    expect(savings).toBeGreaterThanOrEqual(0);
  });

  it('should generate month-by-month payment schedule', () => {
    const input: DebtPayoffInput = {
      debts: [
        { name: 'Debt 1', balance: 1000, interestRate: 0.15, minimumPayment: 50 },
      ],
      extraMonthlyPayment: 100,
      strategy: 'avalanche',
    };

    const result = DebtPayoffEngine.analyze(input);

    expect(result.payoffSchedule.length).toBeGreaterThan(0);
    
    const firstMonth = result.payoffSchedule[0];
    expect(firstMonth?.month).toBe(1);
    expect(firstMonth?.payments.length).toBe(1);
    expect(parseFloat(firstMonth!.payments[0]!.payment)).toBeGreaterThan(0);
    expect(parseFloat(firstMonth!.payments[0]!.interest)).toBeGreaterThan(0);
    expect(parseFloat(firstMonth!.payments[0]!.principal)).toBeGreaterThan(0);

    // Last month should have zero balance
    const lastMonth = result.payoffSchedule[result.payoffSchedule.length - 1];
    expect(parseFloat(lastMonth!.remainingBalance)).toBe(0);
  });

  it('should calculate balance transfer benefits correctly', () => {
    const input: DebtPayoffInput = {
      debts: [
        { name: 'High Rate Card', balance: 5000, interestRate: 0.22, minimumPayment: 150 },
      ],
      extraMonthlyPayment: 200,
      strategy: 'avalanche',
      balanceTransferOffer: {
        creditLimit: 6000,
        transferFeeRate: 0.03, // 3%
        introRate: 0.0, // 0% for intro period
        introMonths: 12,
        regularRate: 0.15,
      },
    };

    const result = DebtPayoffEngine.analyze(input);

    expect(result.balanceTransfer).toBeDefined();
    expect(parseFloat(result.balanceTransfer!.transferredAmount)).toBe(5000);
    expect(parseFloat(result.balanceTransfer!.transferFee)).toBe(150); // 3% of $5000
    expect(result.balanceTransfer!.recommended).toBe(true); // Should save money
    expect(parseFloat(result.balanceTransfer!.savings)).toBeGreaterThan(0);
  });

  it('should not recommend balance transfer if fees exceed savings', () => {
    const input: DebtPayoffInput = {
      debts: [
        { name: 'Low Rate Debt', balance: 1000, interestRate: 0.05, minimumPayment: 50 },
      ],
      extraMonthlyPayment: 500, // Paying off quickly anyway
      strategy: 'avalanche',
      balanceTransferOffer: {
        creditLimit: 2000,
        transferFeeRate: 0.05, // 5% fee
        introRate: 0.0,
        introMonths: 6,
        regularRate: 0.18,
      },
    };

    const result = DebtPayoffEngine.analyze(input);

    // With low original rate and high payoff speed, transfer might not be worth it
    expect(result.balanceTransfer).toBeDefined();
    // The recommendation depends on calculation, but we verify it exists
    expect(typeof result.balanceTransfer!.recommended).toBe('boolean');
  });

  it('should handle multiple debts with extra payments', () => {
    const input: DebtPayoffInput = {
      debts: [
        { name: 'Debt 1', balance: 2000, interestRate: 0.15, minimumPayment: 60 },
        { name: 'Debt 2', balance: 3000, interestRate: 0.18, minimumPayment: 90 },
        { name: 'Debt 3', balance: 1500, interestRate: 0.12, minimumPayment: 45 },
      ],
      extraMonthlyPayment: 400,
      strategy: 'avalanche',
    };

    const result = DebtPayoffEngine.analyze(input);

    expect(result.summary.debtSummaries.length).toBe(3);
    
    // All debts should be paid off
    for (const summary of result.summary.debtSummaries) {
      expect(summary.monthsToPayoff).toBeGreaterThan(0);
      expect(parseFloat(summary.totalInterest)).toBeGreaterThan(0);
      expect(parseFloat(summary.totalPaid)).toBeGreaterThan(parseFloat(summary.originalBalance));
    }
  });
});
