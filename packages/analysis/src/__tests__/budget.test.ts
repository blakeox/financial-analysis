import { describe, it, expect } from 'vitest';
import * as BudgetEngine from '../engines/budget.js';
import type { BudgetInput } from '../schemas/budget.js';

describe('BudgetEngine', () => {
  it('should analyze basic budget', () => {
    const input: BudgetInput = {
      income: [{ name: 'Salary', monthlyAmount: 5000, type: 'salary', recurring: true }],
      expenses: [
        { name: 'Rent', monthlyAmount: 1500, type: 'housing', isFixed: true, isEssential: true },
        { name: 'Groceries', monthlyAmount: 400, type: 'food', isFixed: false, isEssential: true },
        {
          name: 'Entertainment',
          monthlyAmount: 300,
          type: 'entertainment',
          isFixed: false,
          isEssential: false,
        },
      ],
      debts: [],
      savingsGoalMonthly: 500,
      optimizationGoal: 'balance',
    };

    const result = BudgetEngine.analyze(input);

    expect(parseFloat(result.incomeSummary.totalMonthlyIncome)).toBe(5000);
    expect(parseFloat(result.expenseSummary.totalMonthlyExpenses)).toBe(2200);
    expect(result.metrics).toBeDefined();
    expect(parseFloat(result.metrics.savingsRate)).toBeGreaterThan(0);
  });

  it('should calculate 50/30/20 budget rule', () => {
    const input: BudgetInput = {
      income: [{ name: 'Salary', monthlyAmount: 6000, type: 'salary', recurring: true }],
      expenses: [
        { name: 'Housing', monthlyAmount: 1800, type: 'housing', isFixed: true, isEssential: true },
        {
          name: 'Utilities',
          monthlyAmount: 200,
          type: 'utilities',
          isFixed: false,
          isEssential: true,
        },
        { name: 'Food', monthlyAmount: 600, type: 'food', isFixed: false, isEssential: true },
        {
          name: 'Entertainment',
          monthlyAmount: 500,
          type: 'entertainment',
          isFixed: false,
          isEssential: false,
        },
        {
          name: 'Shopping',
          monthlyAmount: 400,
          type: 'personal',
          isFixed: false,
          isEssential: false,
        },
      ],
      debts: [],
      savingsGoalMonthly: 1000,
      optimizationGoal: 'balance',
    };

    const result = BudgetEngine.analyze(input);

    expect(result.budgetRuleAnalysis).toBeDefined();
    expect(result.budgetRuleAnalysis.needs).toBeDefined();
    expect(result.budgetRuleAnalysis.wants).toBeDefined();
    expect(result.budgetRuleAnalysis.savings).toBeDefined();
    expect(result.budgetRuleAnalysis.analysis.length).toBeGreaterThan(0);
  });

  it('should analyze debt-to-income ratio', () => {
    const input: BudgetInput = {
      income: [{ name: 'Salary', monthlyAmount: 8000, type: 'salary', recurring: true }],
      expenses: [
        { name: 'Housing', monthlyAmount: 2000, type: 'housing', isFixed: true, isEssential: true },
        { name: 'Food', monthlyAmount: 600, type: 'food', isFixed: false, isEssential: true },
      ],
      debts: [
        {
          name: 'Mortgage',
          totalBalance: 300000,
          monthlyPayment: 1800,
          interestRate: 0.04,
          type: 'mortgage',
        },
        {
          name: 'Auto Loan',
          totalBalance: 20000,
          monthlyPayment: 400,
          interestRate: 0.06,
          type: 'auto',
        },
        {
          name: 'Credit Card',
          totalBalance: 5000,
          monthlyPayment: 150,
          interestRate: 0.18,
          type: 'credit_card',
        },
      ],
      savingsGoalMonthly: 800,
      optimizationGoal: 'reduce_debt',
    };

    const result = BudgetEngine.analyze(input);

    expect(result.debtSummary.debts.length).toBe(3);
    expect(parseFloat(result.debtSummary.totalMonthlyDebtPayment)).toBe(2350);
    expect(parseFloat(result.debtSummary.debtToIncomeRatio)).toBeGreaterThan(0);
  });

  it('should identify overspending categories', () => {
    const input: BudgetInput = {
      income: [{ name: 'Salary', monthlyAmount: 4000, type: 'salary', recurring: true }],
      expenses: [
        { name: 'Rent', monthlyAmount: 1800, type: 'housing', isFixed: true, isEssential: true }, // 45% - too high
        { name: 'Food', monthlyAmount: 800, type: 'food', isFixed: false, isEssential: true }, // 20% - too high
        {
          name: 'Entertainment',
          monthlyAmount: 600,
          type: 'entertainment',
          isFixed: false,
          isEssential: false,
        },
      ],
      debts: [],
      savingsGoalMonthly: 200,
      optimizationGoal: 'maximize_savings',
    };

    const result = BudgetEngine.analyze(input);

    expect(result.spendingAnalysis.overspendingCategories.length).toBeGreaterThan(0);

    const housingOverspend = result.spendingAnalysis.overspendingCategories.find(
      (c) => c.category === 'Housing'
    );
    expect(housingOverspend).toBeDefined();
  });

  it('should generate optimized budget', () => {
    const input: BudgetInput = {
      income: [{ name: 'Salary', monthlyAmount: 7000, type: 'salary', recurring: true }],
      expenses: [
        { name: 'Housing', monthlyAmount: 2000, type: 'housing', isFixed: true, isEssential: true },
        { name: 'Food', monthlyAmount: 700, type: 'food', isFixed: false, isEssential: true },
        {
          name: 'Entertainment',
          monthlyAmount: 800,
          type: 'entertainment',
          isFixed: false,
          isEssential: false,
        },
        {
          name: 'Shopping',
          monthlyAmount: 600,
          type: 'personal',
          isFixed: false,
          isEssential: false,
        },
        {
          name: 'Dining Out',
          monthlyAmount: 500,
          type: 'food',
          isFixed: false,
          isEssential: false,
        },
      ],
      debts: [],
      savingsGoalMonthly: 1000,
      optimizationGoal: 'maximize_savings',
    };

    const result = BudgetEngine.analyze(input);

    expect(result.optimizedBudget).toBeDefined();
    expect(result.optimizedBudget.optimizationGoal).toBe('maximize_savings');
    // Adjusted categories may be empty if already at good savings rate
    expect(result.optimizedBudget.adjustedCategories).toBeDefined();
  });

  it('should calculate financial health score', () => {
    const input: BudgetInput = {
      income: [
        { name: 'Salary', monthlyAmount: 6000, type: 'salary', recurring: true },
        { name: 'Side Business', monthlyAmount: 1000, type: 'business', recurring: true },
      ],
      expenses: [
        { name: 'Housing', monthlyAmount: 1600, type: 'housing', isFixed: true, isEssential: true },
        {
          name: 'Transportation',
          monthlyAmount: 400,
          type: 'transportation',
          isFixed: false,
          isEssential: true,
        },
        { name: 'Food', monthlyAmount: 600, type: 'food', isFixed: false, isEssential: true },
        {
          name: 'Utilities',
          monthlyAmount: 200,
          type: 'utilities',
          isFixed: false,
          isEssential: true,
        },
        {
          name: 'Entertainment',
          monthlyAmount: 300,
          type: 'entertainment',
          isFixed: false,
          isEssential: false,
        },
      ],
      debts: [
        {
          name: 'Student Loan',
          totalBalance: 30000,
          monthlyPayment: 350,
          interestRate: 0.05,
          type: 'student',
        },
      ],
      savingsGoalMonthly: 1500,
      optimizationGoal: 'balance',
    };

    const result = BudgetEngine.analyze(input);

    expect(result.metrics.financialHealthScore).toBeGreaterThan(0);
    expect(result.metrics.financialHealthScore).toBeLessThanOrEqual(100);
  });

  it('should handle multiple income sources', () => {
    const input: BudgetInput = {
      income: [
        { name: 'Primary Job', monthlyAmount: 5000, type: 'salary', recurring: true },
        { name: 'Freelance', monthlyAmount: 1500, type: 'business', recurring: false },
        { name: 'Rental Income', monthlyAmount: 800, type: 'rental', recurring: true },
      ],
      expenses: [
        { name: 'Rent', monthlyAmount: 1800, type: 'housing', isFixed: true, isEssential: true },
        { name: 'Food', monthlyAmount: 600, type: 'food', isFixed: false, isEssential: true },
      ],
      debts: [],
      savingsGoalMonthly: 2000,
      optimizationGoal: 'maximize_savings',
    };

    const result = BudgetEngine.analyze(input);

    expect(result.incomeSummary.sources.length).toBe(3);
    expect(parseFloat(result.incomeSummary.totalMonthlyIncome)).toBe(7300);
  });

  it('should provide comprehensive recommendations', () => {
    const input: BudgetInput = {
      income: [{ name: 'Salary', monthlyAmount: 5500, type: 'salary', recurring: true }],
      expenses: [
        { name: 'Housing', monthlyAmount: 2000, type: 'housing', isFixed: true, isEssential: true },
        { name: 'Food', monthlyAmount: 500, type: 'food', isFixed: false, isEssential: true },
        {
          name: 'Transportation',
          monthlyAmount: 400,
          type: 'transportation',
          isFixed: false,
          isEssential: true,
        },
        {
          name: 'Entertainment',
          monthlyAmount: 600,
          type: 'entertainment',
          isFixed: false,
          isEssential: false,
        },
      ],
      debts: [
        {
          name: 'Credit Card',
          totalBalance: 8000,
          monthlyPayment: 250,
          interestRate: 0.19,
          type: 'credit_card',
        },
      ],
      savingsGoalMonthly: 500,
      optimizationGoal: 'balance',
    };

    const result = BudgetEngine.analyze(input);

    expect(result.recommendations).toBeDefined();
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});
