import { describe, expect, it } from 'vitest';
import { DebtPayoffTool } from '../tools/debt-payoff';

describe('DebtPayoffTool', () => {
  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(DebtPayoffTool.toolName).toBe('analyze_debt_payoff');
    });

    it('has a description', () => {
      expect(DebtPayoffTool.description).toBeTruthy();
      expect(DebtPayoffTool.description.length).toBeGreaterThan(100);
    });

    it('has required input schema fields', () => {
      const schema = DebtPayoffTool.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toContain('debts');
    });

    it('supports avalanche and snowball strategies', () => {
      const strategies = DebtPayoffTool.inputSchema.properties.strategy.enum;
      expect(strategies).toContain('avalanche');
      expect(strategies).toContain('snowball');
    });
  });

  describe('execute', () => {
    it('calculates basic debt payoff with avalanche strategy', async () => {
      const result = await DebtPayoffTool.execute({
        debts: [
          { name: 'Credit Card 1', balance: 5000, interestRate: 0.22, minimumPayment: 150 },
          { name: 'Credit Card 2', balance: 3000, interestRate: 0.18, minimumPayment: 90 },
        ],
        strategy: 'avalanche',
      });

      expect(result).toBeDefined();
      expect(result.payoffSchedule).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.debtSummaries).toBeDefined();
    });

    it('calculates debt payoff with snowball strategy', async () => {
      const result = await DebtPayoffTool.execute({
        debts: [
          { name: 'Credit Card', balance: 8000, interestRate: 0.2, minimumPayment: 200 },
          { name: 'Personal Loan', balance: 2000, interestRate: 0.12, minimumPayment: 100 },
        ],
        strategy: 'snowball',
      });

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('handles extra monthly payment', async () => {
      const resultWithoutExtra = await DebtPayoffTool.execute({
        debts: [{ name: 'Credit Card', balance: 5000, interestRate: 0.2, minimumPayment: 150 }],
        extraMonthlyPayment: 0,
      });

      const resultWithExtra = await DebtPayoffTool.execute({
        debts: [{ name: 'Credit Card', balance: 5000, interestRate: 0.2, minimumPayment: 150 }],
        extraMonthlyPayment: 200,
      });

      // Extra payment should reduce total months to payoff
      expect(resultWithExtra.summary.totalMonthsToPayoff).toBeLessThan(
        resultWithoutExtra.summary.totalMonthsToPayoff
      );
    });

    it('compares avalanche vs snowball strategies', async () => {
      const result = await DebtPayoffTool.execute({
        debts: [
          { name: 'High Rate Card', balance: 3000, interestRate: 0.25, minimumPayment: 90 },
          { name: 'Low Rate Loan', balance: 10000, interestRate: 0.08, minimumPayment: 200 },
        ],
        strategy: 'avalanche',
      });

      expect(result.alternativeStrategy).toBeDefined();
    });

    it('handles balance transfer offer', async () => {
      const result = await DebtPayoffTool.execute({
        debts: [{ name: 'Credit Card', balance: 8000, interestRate: 0.22, minimumPayment: 240 }],
        balanceTransferOffer: {
          creditLimit: 10000,
          transferFeeRate: 0.03,
          introRate: 0,
          introMonths: 18,
          regularRate: 0.2,
        },
      });

      expect(result).toBeDefined();
    });

    it('handles multiple debts', async () => {
      const result = await DebtPayoffTool.execute({
        debts: [
          { name: 'Credit Card 1', balance: 4000, interestRate: 0.22, minimumPayment: 120 },
          { name: 'Credit Card 2', balance: 6000, interestRate: 0.19, minimumPayment: 150 },
          { name: 'Personal Loan', balance: 8000, interestRate: 0.12, minimumPayment: 200 },
        ],
        extraMonthlyPayment: 300,
        strategy: 'avalanche',
      });

      expect(result).toBeDefined();
      expect(result.summary.debtSummaries.length).toBe(3);
    });

    it('generates month-by-month payment schedule', async () => {
      const result = await DebtPayoffTool.execute({
        debts: [{ name: 'Test Debt', balance: 1000, interestRate: 0.15, minimumPayment: 100 }],
      });

      expect(result.payoffSchedule).toBeDefined();
      expect(result.payoffSchedule.length).toBeGreaterThan(0);
    });

    it('rejects empty debts array', async () => {
      await expect(
        DebtPayoffTool.execute({
          debts: [],
        })
      ).rejects.toThrow();
    });

    it('rejects zero balance debt', async () => {
      await expect(
        DebtPayoffTool.execute({
          debts: [{ name: 'Invalid Debt', balance: 0, interestRate: 0.18, minimumPayment: 50 }],
        })
      ).rejects.toThrow();
    });
  });
});
