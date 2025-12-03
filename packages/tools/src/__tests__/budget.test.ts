import { describe, expect, it } from 'vitest';
import { BudgetTool } from '../tools/budget';

describe('BudgetTool', () => {
  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(BudgetTool.toolName).toBe('optimize_budget');
    });

    it('has a description', () => {
      expect(BudgetTool.description).toBeTruthy();
      expect(BudgetTool.description.length).toBeGreaterThan(100);
    });

    it('has required input schema fields', () => {
      const schema = BudgetTool.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toContain('income');
      expect(schema.required).toContain('expenses');
    });

    it('supports multiple optimization goals', () => {
      const goals = BudgetTool.inputSchema.properties.optimizationGoal.enum;
      expect(goals).toContain('maximize_savings');
      expect(goals).toContain('reduce_debt');
      expect(goals).toContain('balance');
      expect(goals).toContain('reduce_discretionary');
    });
  });

  describe('execute', () => {
    it('analyzes basic budget', async () => {
      const result = await BudgetTool.execute({
        income: [
          { name: 'Salary', monthlyAmount: 5000, type: 'salary' },
        ],
        expenses: [
          { name: 'Rent', monthlyAmount: 1500, type: 'housing', isFixed: true, isEssential: true },
          { name: 'Groceries', monthlyAmount: 400, type: 'food', isEssential: true },
          { name: 'Entertainment', monthlyAmount: 200, type: 'entertainment', isEssential: false },
        ],
      });

      expect(result).toBeDefined();
      expect(result.incomeSummary).toBeDefined();
      expect(result.expenseSummary).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('includes debt analysis', async () => {
      const result = await BudgetTool.execute({
        income: [
          { name: 'Salary', monthlyAmount: 6000, type: 'salary' },
        ],
        expenses: [
          { name: 'Rent', monthlyAmount: 1800, type: 'housing', isFixed: true },
          { name: 'Utilities', monthlyAmount: 150, type: 'utilities', isFixed: true },
        ],
        debts: [
          { name: 'Credit Card', totalBalance: 5000, monthlyPayment: 200, interestRate: 0.18, type: 'credit_card' },
          { name: 'Car Loan', totalBalance: 15000, monthlyPayment: 350, interestRate: 0.05, type: 'auto' },
        ],
      });

      expect(result.debtSummary).toBeDefined();
    });

    it('calculates budget metrics', async () => {
      const result = await BudgetTool.execute({
        income: [
          { name: 'Salary', monthlyAmount: 5000, type: 'salary' },
        ],
        expenses: [
          { name: 'Rent', monthlyAmount: 1500, type: 'housing' },
          { name: 'Food', monthlyAmount: 500, type: 'food' },
        ],
      });

      expect(result.metrics).toBeDefined();
    });

    it('provides optimized budget', async () => {
      const result = await BudgetTool.execute({
        income: [
          { name: 'Salary', monthlyAmount: 7000, type: 'salary' },
        ],
        expenses: [
          { name: 'Housing', monthlyAmount: 2000, type: 'housing', isFixed: true, isEssential: true },
          { name: 'Food', monthlyAmount: 600, type: 'food', isEssential: true },
          { name: 'Entertainment', monthlyAmount: 500, type: 'entertainment', isEssential: false },
          { name: 'Shopping', monthlyAmount: 400, type: 'personal', isEssential: false },
        ],
        optimizationGoal: 'maximize_savings',
      });

      expect(result.optimizedBudget).toBeDefined();
    });

    it('includes 50/30/20 budget rule analysis', async () => {
      const result = await BudgetTool.execute({
        income: [
          { name: 'Salary', monthlyAmount: 5000, type: 'salary' },
        ],
        expenses: [
          { name: 'Rent', monthlyAmount: 1400, type: 'housing', isEssential: true },
          { name: 'Food', monthlyAmount: 400, type: 'food', isEssential: true },
          { name: 'Entertainment', monthlyAmount: 300, type: 'entertainment', isEssential: false },
        ],
        optimizationGoal: 'balance',
      });

      expect(result.budgetRuleAnalysis).toBeDefined();
    });

    it('handles multiple income sources', async () => {
      const result = await BudgetTool.execute({
        income: [
          { name: 'Salary', monthlyAmount: 4000, type: 'salary' },
          { name: 'Side Business', monthlyAmount: 1000, type: 'business' },
          { name: 'Investments', monthlyAmount: 500, type: 'investment' },
        ],
        expenses: [
          { name: 'Rent', monthlyAmount: 1500, type: 'housing' },
        ],
      });

      expect(result).toBeDefined();
      expect(result.incomeSummary).toBeDefined();
    });

    it('handles reduce_debt optimization goal', async () => {
      const result = await BudgetTool.execute({
        income: [
          { name: 'Salary', monthlyAmount: 5000, type: 'salary' },
        ],
        expenses: [
          { name: 'Rent', monthlyAmount: 1200, type: 'housing' },
          { name: 'Food', monthlyAmount: 400, type: 'food' },
        ],
        debts: [
          { name: 'Credit Card', totalBalance: 10000, monthlyPayment: 300, interestRate: 0.22, type: 'credit_card' },
        ],
        optimizationGoal: 'reduce_debt',
      });

      expect(result).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('rejects empty income array', async () => {
      await expect(
        BudgetTool.execute({
          income: [],
          expenses: [
            { name: 'Rent', monthlyAmount: 1500, type: 'housing' },
          ],
        })
      ).rejects.toThrow();
    });

    it('rejects empty expenses array', async () => {
      await expect(
        BudgetTool.execute({
          income: [
            { name: 'Salary', monthlyAmount: 5000, type: 'salary' },
          ],
          expenses: [],
        })
      ).rejects.toThrow();
    });
  });
});
