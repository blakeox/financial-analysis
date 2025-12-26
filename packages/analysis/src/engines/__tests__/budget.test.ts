import { describe, it, expect } from 'vitest';
import { analyze } from '../budget';
import type { BudgetInput } from '../../schemas/budget';

describe('Budget Analysis Engine', () => {
  const basicInput: BudgetInput = {
    income: [
      { name: 'Salary', type: 'salary', monthlyAmount: 8000, recurring: true },
    ],
    expenses: [
      { name: 'Rent', type: 'housing', monthlyAmount: 2000, isFixed: true, isEssential: true },
      { name: 'Utilities', type: 'utilities', monthlyAmount: 200, isFixed: true, isEssential: true },
      { name: 'Groceries', type: 'food', monthlyAmount: 600, isFixed: false, isEssential: true },
      { name: 'Transportation', type: 'transportation', monthlyAmount: 400, isFixed: true, isEssential: true },
      { name: 'Entertainment', type: 'entertainment', monthlyAmount: 500, isFixed: false, isEssential: false },
      { name: 'Dining Out', type: 'food', monthlyAmount: 300, isFixed: false, isEssential: false },
    ],
    debts: [
      { name: 'Credit Card', type: 'credit_card', totalBalance: 5000, monthlyPayment: 200, interestRate: 0.18 },
      { name: 'Car Loan', type: 'auto', totalBalance: 15000, monthlyPayment: 400, interestRate: 0.05 },
    ],
    savingsGoalMonthly: 1000,
    optimizationGoal: 'balance',
  };

  describe('basic budget calculations', () => {
    it('calculates income summary correctly', () => {
      const result = analyze(basicInput);

      expect(result.incomeSummary.totalMonthlyIncome).toBe('8000.00');
      expect(result.incomeSummary.totalAnnualIncome).toBe('96000.00');
      expect(result.incomeSummary.sources).toHaveLength(1);
    });

    it('calculates expense summary correctly', () => {
      const result = analyze(basicInput);

      // 2000 + 200 + 600 + 400 + 500 + 300 = 4000
      expect(result.expenseSummary.totalMonthlyExpenses).toBe('4000.00');
      expect(result.expenseSummary.categories).toHaveLength(6);
    });

    it('separates fixed and variable expenses', () => {
      const result = analyze(basicInput);

      // Fixed: Rent (2000) + Utilities (200) + Transportation (400) = 2600
      expect(result.expenseSummary.fixedExpenses).toBe('2600.00');
      // Variable: Groceries (600) + Entertainment (500) + Dining (300) = 1400
      expect(result.expenseSummary.variableExpenses).toBe('1400.00');
    });

    it('separates essential and discretionary expenses', () => {
      const result = analyze(basicInput);

      // Essential: Rent + Utilities + Groceries + Transportation = 3200
      expect(result.expenseSummary.essentialExpenses).toBe('3200.00');
      // Discretionary: Entertainment + Dining = 800
      expect(result.expenseSummary.discretionaryExpenses).toBe('800.00');
    });
  });

  describe('debt analysis', () => {
    it('calculates total debt correctly', () => {
      const result = analyze(basicInput);

      expect(result.debtSummary.totalDebtBalance).toBe('20000.00');
      expect(result.debtSummary.totalMonthlyDebtPayment).toBe('600.00');
    });

    it('calculates debt-to-income ratio', () => {
      const result = analyze(basicInput);

      // 600 / 8000 = 7.5%
      expect(parseFloat(result.debtSummary.debtToIncomeRatio)).toBeCloseTo(7.5, 0);
    });

    it('calculates weighted average interest rate', () => {
      const result = analyze(basicInput);

      // (5000 * 0.18 + 15000 * 0.05) / 20000 = 0.0825 = 8.25%
      expect(parseFloat(result.debtSummary.weightedAverageInterestRate)).toBeCloseTo(8.25, 0);
    });

    it('handles no debts', () => {
      const noDeptInput = {
        ...basicInput,
        debts: [],
      };

      const result = analyze(noDeptInput);

      expect(result.debtSummary.totalDebtBalance).toBe('0.00');
      expect(result.debtSummary.debtToIncomeRatio).toBe('0.0');
    });
  });

  describe('budget metrics', () => {
    it('calculates monthly net income', () => {
      const result = analyze(basicInput);

      // 8000 - 4000 = 4000
      expect(result.metrics.monthlyNetIncome).toBe('4000.00');
    });

    it('calculates savings rate', () => {
      const result = analyze(basicInput);

      // 4000 / 8000 = 50%
      expect(parseFloat(result.metrics.savingsRate)).toBeCloseTo(50, 0);
    });

    it('calculates housing ratio', () => {
      const result = analyze(basicInput);

      // 2000 / 8000 = 25%
      expect(parseFloat(result.metrics.housingRatio)).toBeCloseTo(25, 0);
    });

    it('calculates financial health score', () => {
      const result = analyze(basicInput);

      // Should be a number between 0 and 100
      expect(result.metrics.financialHealthScore).toBeGreaterThanOrEqual(0);
      expect(result.metrics.financialHealthScore).toBeLessThanOrEqual(100);
    });
  });

  describe('50/30/20 rule analysis', () => {
    it('analyzes needs category', () => {
      const result = analyze(basicInput);

      expect(result.budgetRuleAnalysis.needs).toBeDefined();
      expect(parseFloat(result.budgetRuleAnalysis.needs.recommendedPercent)).toBe(50);
    });

    it('analyzes wants category', () => {
      const result = analyze(basicInput);

      expect(result.budgetRuleAnalysis.wants).toBeDefined();
      expect(parseFloat(result.budgetRuleAnalysis.wants.recommendedPercent)).toBe(30);
    });

    it('analyzes savings category', () => {
      const result = analyze(basicInput);

      expect(result.budgetRuleAnalysis.savings).toBeDefined();
      expect(parseFloat(result.budgetRuleAnalysis.savings.recommendedPercent)).toBe(20);
    });

    it('provides analysis recommendations', () => {
      const result = analyze(basicInput);

      expect(result.budgetRuleAnalysis.analysis).toBeDefined();
      expect(Array.isArray(result.budgetRuleAnalysis.analysis)).toBe(true);
    });
  });

  describe('spending analysis', () => {
    it('identifies overspending categories', () => {
      const overSpendInput: BudgetInput = {
        ...basicInput,
        expenses: [
          { name: 'Rent', type: 'housing', monthlyAmount: 4000, isFixed: true, isEssential: true }, // 50% of income - over limit
          { name: 'Entertainment', type: 'entertainment', monthlyAmount: 1500, isFixed: false, isEssential: false }, // 18.75% - over limit
        ],
      };

      const result = analyze(overSpendInput);

      expect(result.spendingAnalysis.overspendingCategories.length).toBeGreaterThan(0);
    });

    it('provides spending recommendations', () => {
      const result = analyze(basicInput);

      expect(result.spendingAnalysis.recommendations).toBeDefined();
      expect(Array.isArray(result.spendingAnalysis.recommendations)).toBe(true);
    });
  });

  describe('optimized budget generation', () => {
    it('generates optimized budget for maximize_savings goal', () => {
      const maximizeSavingsInput = {
        ...basicInput,
        optimizationGoal: 'maximize_savings' as const,
      };

      const result = analyze(maximizeSavingsInput);

      expect(result.optimizedBudget.optimizationGoal).toBe('maximize_savings');
    });

    it('generates optimized budget for reduce_debt goal', () => {
      const reduceDebtInput = {
        ...basicInput,
        optimizationGoal: 'reduce_debt' as const,
      };

      const result = analyze(reduceDebtInput);

      expect(result.optimizedBudget.optimizationGoal).toBe('reduce_debt');
    });

    it('generates optimized budget for balance goal', () => {
      const result = analyze(basicInput);

      expect(result.optimizedBudget.optimizationGoal).toBe('balance');
    });

    it('provides implementation steps', () => {
      const result = analyze(basicInput);

      expect(result.optimizedBudget.implementation).toBeDefined();
      expect(Array.isArray(result.optimizedBudget.implementation)).toBe(true);
      expect(result.optimizedBudget.implementation.length).toBeGreaterThan(0);
    });

    it('reduces discretionary categories when wants exceed the 30% target', () => {
      const highWantsInput: BudgetInput = {
        income: [{ name: 'Salary', type: 'salary', monthlyAmount: 4000, recurring: true }],
        expenses: [
          { name: 'Rent', type: 'housing', monthlyAmount: 1000, isFixed: true, isEssential: true },
          { name: 'Utilities', type: 'utilities', monthlyAmount: 200, isFixed: true, isEssential: true },
          { name: 'Entertainment', type: 'entertainment', monthlyAmount: 1000, isFixed: false, isEssential: false },
          { name: 'Dining', type: 'food', monthlyAmount: 1000, isFixed: false, isEssential: false },
        ],
        debts: [],
        savingsGoalMonthly: 200,
        optimizationGoal: 'balance',
      };

      const result = analyze(highWantsInput);

      expect(result.optimizedBudget.optimizationGoal).toBe('balance');
      expect(result.optimizedBudget.adjustedCategories).toHaveLength(2);

      const entertainment = result.optimizedBudget.adjustedCategories.find(
        (category) => category.category === 'Entertainment'
      );
      const dining = result.optimizedBudget.adjustedCategories.find(
        (category) => category.category === 'Dining'
      );

      expect(entertainment).toBeDefined();
      expect(dining).toBeDefined();

      expect(entertainment!.change).toBe('-400.00');
      expect(entertainment!.changePercent).toBe('-40.0');
      expect(entertainment!.recommendedAmount).toBe('600.00');

      expect(dining!.change).toBe('-400.00');
      expect(dining!.changePercent).toBe('-40.0');
      expect(dining!.recommendedAmount).toBe('600.00');
    });
  });

  describe('recommendations', () => {
    it('generates recommendations', () => {
      const result = analyze(basicInput);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('shows excellent health message when score >= 80', () => {
      // High income, low expenses, no debt = excellent health
      const excellentInput: BudgetInput = {
        income: [{ name: 'Salary', type: 'salary', monthlyAmount: 10000, recurring: true }],
        expenses: [
          { name: 'Rent', type: 'housing', monthlyAmount: 1500, isFixed: true, isEssential: true },
          { name: 'Groceries', type: 'food', monthlyAmount: 300, isFixed: false, isEssential: true },
        ],
        debts: [],
        savingsGoalMonthly: 2000,
        optimizationGoal: 'balance',
      };

      const result = analyze(excellentInput);

      expect(result.recommendations).toContain('Excellent financial health! Keep up the great work.');
    });

    it('shows good health message when score 60-79', () => {
      // Score calculation: net income (30) + savings 10-20% (10) + housing 30-40% (10) + DTI <=36% (20) = 70
      const goodInput: BudgetInput = {
        income: [{ name: 'Salary', type: 'salary', monthlyAmount: 5000, recurring: true }],
        expenses: [
          { name: 'Rent', type: 'housing', monthlyAmount: 1800, isFixed: true, isEssential: true }, // 36% housing
          { name: 'Groceries', type: 'food', monthlyAmount: 500, isFixed: false, isEssential: true },
          { name: 'Entertainment', type: 'entertainment', monthlyAmount: 300, isFixed: false, isEssential: false },
          { name: 'Other', type: 'other', monthlyAmount: 1600, isFixed: false, isEssential: false },
        ],
        debts: [
          { name: 'Car Loan', type: 'auto', totalBalance: 10000, monthlyPayment: 200, interestRate: 0.05 },
        ],
        savingsGoalMonthly: 500,
        optimizationGoal: 'balance',
      };

      const result = analyze(goodInput);
      // Score should be between 60-79
      expect(result.metrics.financialHealthScore).toBeGreaterThanOrEqual(60);
      expect(result.metrics.financialHealthScore).toBeLessThan(80);
      expect(result.recommendations).toContain('Good financial health with room for improvement.');
    });

    it('shows needs attention message when score < 60', () => {
      // Score: net income (0 - expenses > income) OR negative on several metrics
      // Score: negative net (0) + low savings <10% (0) + high housing >40% (0) + DTI 36-43% (10) = 10
      const poorInput: BudgetInput = {
        income: [{ name: 'Salary', type: 'salary', monthlyAmount: 4000, recurring: true }],
        expenses: [
          { name: 'Rent', type: 'housing', monthlyAmount: 1800, isFixed: true, isEssential: true }, // 45% housing
          { name: 'Groceries', type: 'food', monthlyAmount: 600, isFixed: false, isEssential: true },
          { name: 'Entertainment', type: 'entertainment', monthlyAmount: 500, isFixed: false, isEssential: false },
          { name: 'Other', type: 'other', monthlyAmount: 1500, isFixed: false, isEssential: false },
        ],
        debts: [
          { name: 'Credit Card', type: 'credit_card', totalBalance: 15000, monthlyPayment: 600, interestRate: 0.22 },
          { name: 'Personal Loan', type: 'personal', totalBalance: 10000, monthlyPayment: 400, interestRate: 0.15 },
        ],
        savingsGoalMonthly: 200,
        optimizationGoal: 'balance',
      };

      const result = analyze(poorInput);
      // Score should be below 60
      expect(result.metrics.financialHealthScore).toBeLessThan(60);
      expect(result.recommendations).toContain('Your financial health needs attention. Focus on the recommendations below.');
    });

    it('warns when savings rate is below 10%', () => {
      // Low savings rate scenario
      const lowSavingsInput: BudgetInput = {
        income: [{ name: 'Salary', type: 'salary', monthlyAmount: 5000, recurring: true }],
        expenses: [
          { name: 'Rent', type: 'housing', monthlyAmount: 1500, isFixed: true, isEssential: true },
          { name: 'Groceries', type: 'food', monthlyAmount: 600, isFixed: false, isEssential: true },
          { name: 'Utilities', type: 'utilities', monthlyAmount: 200, isFixed: true, isEssential: true },
          { name: 'Entertainment', type: 'entertainment', monthlyAmount: 800, isFixed: false, isEssential: false },
          { name: 'Dining', type: 'food', monthlyAmount: 700, isFixed: false, isEssential: false },
          { name: 'Shopping', type: 'other', monthlyAmount: 800, isFixed: false, isEssential: false },
        ],
        debts: [],
        savingsGoalMonthly: 100,
        optimizationGoal: 'balance',
      };

      const result = analyze(lowSavingsInput);

      expect(result.recommendations.some(r => 
        r.includes('savings rate is below 10%')
      )).toBe(true);
    });

    it('warns when housing ratio exceeds 30%', () => {
      // High housing ratio
      const highHousingInput: BudgetInput = {
        income: [{ name: 'Salary', type: 'salary', monthlyAmount: 5000, recurring: true }],
        expenses: [
          { name: 'Rent', type: 'housing', monthlyAmount: 2000, isFixed: true, isEssential: true }, // 40%
          { name: 'Groceries', type: 'food', monthlyAmount: 400, isFixed: false, isEssential: true },
        ],
        debts: [],
        savingsGoalMonthly: 500,
        optimizationGoal: 'balance',
      };

      const result = analyze(highHousingInput);

      expect(result.recommendations.some(r => 
        r.includes('Housing costs are') && r.includes('ideal: 25-30%')
      )).toBe(true);
    });

    it('warns when debt-to-income ratio exceeds 43%', () => {
      // Very high DTI
      const highDtiInput: BudgetInput = {
        income: [{ name: 'Salary', type: 'salary', monthlyAmount: 4000, recurring: true }],
        expenses: [
          { name: 'Rent', type: 'housing', monthlyAmount: 800, isFixed: true, isEssential: true },
          { name: 'Groceries', type: 'food', monthlyAmount: 300, isFixed: false, isEssential: true },
        ],
        debts: [
          { name: 'Credit Card', type: 'credit_card', totalBalance: 20000, monthlyPayment: 800, interestRate: 0.22 },
          { name: 'Car Loan', type: 'auto', totalBalance: 25000, monthlyPayment: 600, interestRate: 0.06 },
          { name: 'Personal', type: 'personal', totalBalance: 15000, monthlyPayment: 500, interestRate: 0.12 },
        ],
        savingsGoalMonthly: 200,
        optimizationGoal: 'balance',
      };

      const result = analyze(highDtiInput);

      expect(result.recommendations.some(r => 
        r.includes('Debt-to-income ratio is high (>43%)')
      )).toBe(true);
    });

    it('warns when debt-to-income ratio is between 36% and 43%', () => {
      // Moderate DTI (36-43%)
      const moderateDtiInput: BudgetInput = {
        income: [{ name: 'Salary', type: 'salary', monthlyAmount: 5000, recurring: true }],
        expenses: [
          { name: 'Rent', type: 'housing', monthlyAmount: 1200, isFixed: true, isEssential: true },
          { name: 'Groceries', type: 'food', monthlyAmount: 400, isFixed: false, isEssential: true },
        ],
        debts: [
          { name: 'Credit Card', type: 'credit_card', totalBalance: 10000, monthlyPayment: 400, interestRate: 0.20 },
          { name: 'Car Loan', type: 'auto', totalBalance: 20000, monthlyPayment: 500, interestRate: 0.05 },
          { name: 'Student Loan', type: 'student', totalBalance: 30000, monthlyPayment: 1100, interestRate: 0.06 },
        ],
        savingsGoalMonthly: 300,
        optimizationGoal: 'balance',
      };

      const result = analyze(moderateDtiInput);

      expect(result.recommendations.some(r => 
        r.includes('manageable but could be improved')
      )).toBe(true);
    });

    it('suggests optimization savings when projected savings are positive', () => {
      // To trigger projectedMonthlySavings > 0:
      // - maximize_savings goal
      // - Current savings rate < 20% (so additionalNeeded > 0)
      // - Has discretionary (non-essential) expenses to reduce
      const optimizableInput: BudgetInput = {
        income: [{ name: 'Salary', type: 'salary', monthlyAmount: 5000, recurring: true }],
        expenses: [
          { name: 'Rent', type: 'housing', monthlyAmount: 1500, isFixed: true, isEssential: true },
          { name: 'Groceries', type: 'food', monthlyAmount: 500, isFixed: false, isEssential: true },
          { name: 'Entertainment', type: 'entertainment', monthlyAmount: 800, isFixed: false, isEssential: false }, // discretionary
          { name: 'Dining', type: 'food', monthlyAmount: 600, isFixed: false, isEssential: false }, // discretionary
          { name: 'Shopping', type: 'other', monthlyAmount: 700, isFixed: false, isEssential: false }, // discretionary
        ],
        debts: [],
        savingsGoalMonthly: 500,
        optimizationGoal: 'maximize_savings', // triggers the optimization path
      };

      const result = analyze(optimizableInput);

      // Current: 5000 - (1500+500+800+600+700) = 5000 - 4100 = 900 (18% savings)
      // Target: 5000 * 0.2 = 1000 savings
      // Additional needed: 1000 - 900 = 100
      // Should suggest reducing discretionary expenses
      expect(parseFloat(result.optimizedBudget.projectedMonthlySavings)).toBeGreaterThan(0);
      expect(result.recommendations.some(r => 
        r.includes('Implementing the optimized budget could save you')
      )).toBe(true);
    });
  });

  describe('multiple income sources', () => {
    it('handles multiple income sources', () => {
      const multiIncomeInput: BudgetInput = {
        ...basicInput,
        income: [
          { name: 'Salary', type: 'salary', monthlyAmount: 6000, recurring: true },
          { name: 'Side Business', type: 'business', monthlyAmount: 1500, recurring: true },
          { name: 'Rental Income', type: 'investment', monthlyAmount: 500, recurring: true },
        ],
      };

      const result = analyze(multiIncomeInput);

      expect(result.incomeSummary.totalMonthlyIncome).toBe('8000.00');
      expect(result.incomeSummary.sources).toHaveLength(3);
    });

    it('calculates percent of total for each income source', () => {
      const multiIncomeInput: BudgetInput = {
        ...basicInput,
        income: [
          { name: 'Salary', type: 'salary', monthlyAmount: 8000, recurring: true },
          { name: 'Side Business', type: 'business', monthlyAmount: 2000, recurring: true },
        ],
      };

      const result = analyze(multiIncomeInput);

      const salarySource = result.incomeSummary.sources.find(s => s.name === 'Salary');
      expect(parseFloat(salarySource!.percentOfTotal)).toBeCloseTo(80, 0);
    });
  });

  describe('metadata', () => {
    it('includes calculation metadata', () => {
      const result = analyze(basicInput);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.calculatedAt).toBeDefined();
      expect(result.metadata.version).toBe('1.0.0');
    });
  });
});
