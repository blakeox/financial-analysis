import { describe, it, expect } from 'vitest';
import { analyze, DebtPayoffEngine } from '../debt-payoff';
import type { DebtPayoffInput } from '../../../schemas/debt-payoff';

describe('Debt Payoff Engine', () => {
  const basicInput: DebtPayoffInput = {
    debts: [
      { name: 'Credit Card', balance: 5000, interestRate: 0.18, minimumPayment: 150 },
      { name: 'Car Loan', balance: 15000, interestRate: 0.06, minimumPayment: 350 },
      { name: 'Student Loan', balance: 20000, interestRate: 0.05, minimumPayment: 250 },
    ],
    extraMonthlyPayment: 200,
    strategy: 'avalanche',
  };

  describe('basic payoff calculations', () => {
    it('calculates payoff schedule', () => {
      const result = analyze(basicInput);

      expect(result.payoffSchedule).toBeDefined();
      expect(result.payoffSchedule.length).toBeGreaterThan(0);
    });

    it('generates correct number of debt payments per month', () => {
      const result = analyze(basicInput);

      const firstMonth = result.payoffSchedule[0]!;
      expect(firstMonth.payments).toHaveLength(3);
    });

    it('tracks total monthly payment', () => {
      const result = analyze(basicInput);

      const firstMonth = result.payoffSchedule[0]!;
      // Min payments (150 + 350 + 250 = 750) + extra (200) = 950
      expect(parseFloat(firstMonth.totalPayment)).toBeCloseTo(950, 0);
    });

    it('tracks remaining balance decreasing over time', () => {
      const result = analyze(basicInput);

      const firstMonth = result.payoffSchedule[0]!;
      const lastMonth = result.payoffSchedule[result.payoffSchedule.length - 1]!;

      expect(parseFloat(lastMonth.remainingBalance)).toBeLessThan(parseFloat(firstMonth.remainingBalance));
    });

    it('ends with zero remaining balance', () => {
      const result = analyze(basicInput);

      const lastMonth = result.payoffSchedule[result.payoffSchedule.length - 1]!;
      expect(parseFloat(lastMonth.remainingBalance)).toBeCloseTo(0, 0);
    });
  });

  describe('avalanche strategy', () => {
    it('uses avalanche strategy when specified', () => {
      const result = analyze(basicInput);

      expect(result.summary.strategy).toBe('avalanche');
    });

    it('pays highest interest debt first with extra payment', () => {
      const result = analyze(basicInput);

      // With avalanche, Credit Card (18%) should receive extra payment
      const firstMonth = result.payoffSchedule[0]!;
      const creditCardPayment = firstMonth.payments.find(p => p.debtName === 'Credit Card');
      
      // Should be more than minimum (150) because it gets extra payment
      expect(parseFloat(creditCardPayment!.payment)).toBeGreaterThan(150);
    });
  });

  describe('snowball strategy', () => {
    it('uses snowball strategy when specified', () => {
      const snowballInput: DebtPayoffInput = {
        ...basicInput,
        strategy: 'snowball',
      };

      const result = analyze(snowballInput);

      expect(result.summary.strategy).toBe('snowball');
    });

    it('pays lowest balance debt first with extra payment', () => {
      const snowballInput: DebtPayoffInput = {
        ...basicInput,
        strategy: 'snowball',
      };

      const result = analyze(snowballInput);

      // With snowball, Credit Card ($5000 lowest balance) should receive extra payment
      const firstMonth = result.payoffSchedule[0]!;
      const creditCardPayment = firstMonth.payments.find(p => p.debtName === 'Credit Card');
      
      // Should be more than minimum (150) because it gets extra payment
      expect(parseFloat(creditCardPayment!.payment)).toBeGreaterThan(150);
    });
  });

  describe('strategy comparison', () => {
    it('calculates alternative strategy', () => {
      const result = analyze(basicInput);

      expect(result.alternativeStrategy).toBeDefined();
      expect(result.alternativeStrategy.strategy).toBe('snowball');
    });

    it('calculates comparison savings', () => {
      const result = analyze(basicInput);

      expect(result.comparisonSavings).toBeDefined();
    });

    it('avalanche typically saves more interest than snowball', () => {
      const avalancheResult = analyze(basicInput);
      
      const snowballInput: DebtPayoffInput = {
        ...basicInput,
        strategy: 'snowball',
      };
      const snowballResult = analyze(snowballInput);

      // Avalanche should have less total interest (saves money)
      expect(parseFloat(avalancheResult.summary.totalInterestPaid))
        .toBeLessThanOrEqual(parseFloat(snowballResult.summary.totalInterestPaid));
    });
  });

  describe('summary statistics', () => {
    it('calculates total months to payoff', () => {
      const result = analyze(basicInput);

      expect(result.summary.totalMonthsToPayoff).toBeGreaterThan(0);
      expect(result.summary.totalMonthsToPayoff).toBeLessThan(600);
    });

    it('calculates total interest paid', () => {
      const result = analyze(basicInput);

      expect(parseFloat(result.summary.totalInterestPaid)).toBeGreaterThan(0);
    });

    it('calculates total amount paid', () => {
      const result = analyze(basicInput);

      // Total paid should be principal + interest
      const totalDebt = 5000 + 15000 + 20000;
      expect(parseFloat(result.summary.totalAmountPaid)).toBeGreaterThan(totalDebt);
    });

    it('provides debt summaries for each debt', () => {
      const result = analyze(basicInput);

      expect(result.summary.debtSummaries).toHaveLength(3);
      expect(result.summary.debtSummaries[0]).toHaveProperty('name');
      expect(result.summary.debtSummaries[0]).toHaveProperty('originalBalance');
      expect(result.summary.debtSummaries[0]).toHaveProperty('totalPaid');
      expect(result.summary.debtSummaries[0]).toHaveProperty('monthsToPayoff');
    });
  });

  describe('balance transfer analysis', () => {
    it('calculates balance transfer scenario', () => {
      const withBalanceTransfer: DebtPayoffInput = {
        ...basicInput,
        balanceTransferOffer: {
          creditLimit: 8000,
          introRate: 0,
          regularRate: 0.16,
          introMonths: 18,
          transferFeeRate: 0.03,
        },
      };

      const result = analyze(withBalanceTransfer);

      expect(result.balanceTransfer).toBeDefined();
      expect(result.balanceTransfer!.transferredAmount).toBeDefined();
      expect(result.balanceTransfer!.transferFee).toBeDefined();
    });

    it('calculates transfer fee correctly', () => {
      const withBalanceTransfer: DebtPayoffInput = {
        ...basicInput,
        balanceTransferOffer: {
          creditLimit: 5000,
          introRate: 0,
          regularRate: 0.16,
          introMonths: 12,
          transferFeeRate: 0.03,
        },
      };

      const result = analyze(withBalanceTransfer);

      // 3% of transferred amount
      const transferred = parseFloat(result.balanceTransfer!.transferredAmount);
      const fee = parseFloat(result.balanceTransfer!.transferFee);
      expect(fee).toBeCloseTo(transferred * 0.03, 0);
    });

    it('provides recommendation on balance transfer', () => {
      const withBalanceTransfer: DebtPayoffInput = {
        ...basicInput,
        balanceTransferOffer: {
          creditLimit: 5000,
          introRate: 0,
          regularRate: 0.16,
          introMonths: 12,
          transferFeeRate: 0.03,
        },
      };

      const result = analyze(withBalanceTransfer);

      expect(typeof result.balanceTransfer!.recommended).toBe('boolean');
    });
  });

  describe('single debt', () => {
    it('handles single debt correctly', () => {
      const singleDebtInput: DebtPayoffInput = {
        debts: [
          { name: 'Credit Card', balance: 5000, interestRate: 0.18, minimumPayment: 150 },
        ],
        extraMonthlyPayment: 100,
        strategy: 'avalanche',
      };

      const result = analyze(singleDebtInput);

      expect(result.payoffSchedule.length).toBeGreaterThan(0);
      expect(result.summary.debtSummaries).toHaveLength(1);
    });
  });

  describe('no extra payment', () => {
    it('works with zero extra payment', () => {
      const noExtraInput: DebtPayoffInput = {
        ...basicInput,
        extraMonthlyPayment: 0,
      };

      const result = analyze(noExtraInput);

      expect(result.payoffSchedule.length).toBeGreaterThan(0);
      // Should take longer without extra payments
      const withExtra = analyze(basicInput);
      expect(result.summary.totalMonthsToPayoff).toBeGreaterThanOrEqual(withExtra.summary.totalMonthsToPayoff);
    });
  });

  describe('high extra payment', () => {
    it('handles high extra payment efficiently', () => {
      const highExtraInput: DebtPayoffInput = {
        ...basicInput,
        extraMonthlyPayment: 2000,
      };

      const result = analyze(highExtraInput);

      // Should pay off faster
      const baseline = analyze(basicInput);
      expect(result.summary.totalMonthsToPayoff).toBeLessThan(baseline.summary.totalMonthsToPayoff);
    });
  });

  describe('input reflection', () => {
    it('reflects input parameters correctly', () => {
      const result = analyze(basicInput);

      expect(result.input.totalDebtBalance).toBe('40000.00');
      expect(result.input.numberOfDebts).toBe(3);
      expect(result.input.extraMonthlyPayment).toBe('200.00');
      expect(result.input.strategy).toBe('avalanche');
    });
  });

  describe('DebtPayoffEngine export', () => {
    it('exports analyze function via DebtPayoffEngine', () => {
      const result = DebtPayoffEngine.analyze(basicInput);

      expect(result.summary.strategy).toBe('avalanche');
    });
  });

  describe('metadata', () => {
    it('includes calculation metadata', () => {
      const result = analyze(basicInput);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.timestamp).toBeDefined();
      expect(result.metadata.calculationMethod).toBe('debt-payoff-optimizer-v1');
    });
  });

  describe('Comprehensive Analysis', () => {
    it('should return all required fields in the analysis result', () => {
      const result = analyze(basicInput);

      expect(result).toHaveProperty('input');
      expect(result).toHaveProperty('payoffSchedule');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('alternativeStrategy');
      expect(result).toHaveProperty('comparisonSavings');
      expect(result).toHaveProperty('metadata');
    });
  });
});
