import { beforeEach, describe, expect, it } from 'vitest';
import { BudgetEngine } from '@financial-analysis/analysis';
import {
  collectExpenses,
  collectIncome,
  displayResults,
  parseNumber,
} from '../budget.client';

describe('budget.client', () => {
  const buildFormData = () => {
    const formData = new FormData();
    formData.set('income-name-0', 'Salary');
    formData.set('income-amount-0', '5500');
    formData.set('income-type-0', 'salary');
    formData.set('income-name-1', 'Freelance');
    formData.set('income-amount-1', '800');
    formData.set('income-type-1', 'business');
    formData.set('income-name-2', '');
    formData.set('income-amount-2', 'foo');

    formData.set('expense-name-0', 'Rent');
    formData.set('expense-amount-0', '2100');
    formData.set('expense-type-0', 'housing');
    formData.set('expense-essential-0', 'on');
    formData.set('expense-name-1', 'Streaming');
    formData.set('expense-amount-1', '35');
    formData.set('expense-type-1', 'entertainment');
    formData.set('expense-essential-1', '');

    return formData;
  };

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('collectIncome filters invalid rows and normalizes types', () => {
    const formData = buildFormData();
    const income = collectIncome(formData, 3);

    expect(income).toHaveLength(2);
    expect(income[0]).toMatchObject({ name: 'Salary', monthlyAmount: 5500, type: 'salary' });
    expect(income[1]).toMatchObject({ name: 'Freelance', type: 'business', recurring: true });
  });

  it('collectExpenses captures required flags and ignores blanks', () => {
    const formData = buildFormData();
    const expenses = collectExpenses(formData, 3);

    expect(expenses).toHaveLength(2);
    expect(expenses[0]).toMatchObject({ name: 'Rent', monthlyAmount: 2100, isEssential: true });
    expect(expenses[1]).toMatchObject({ name: 'Streaming', isEssential: false });
  });

  it('parseNumber returns NaN for invalid inputs', () => {
    expect(Number.isNaN(parseNumber(null))).toBe(true);
    expect(Number.isNaN(parseNumber('abc'))).toBe(true);
  });

  it('displayResults populates summary, rule insights, and recommendations', () => {
    const result = BudgetEngine.analyze({
      income: [
        { name: 'Salary', monthlyAmount: 5500, type: 'salary', recurring: true },
        { name: 'Freelance', monthlyAmount: 800, type: 'business', recurring: true },
      ],
      expenses: [
        { name: 'Rent', monthlyAmount: 2100, type: 'housing', isFixed: true, isEssential: true },
        { name: 'Food', monthlyAmount: 650, type: 'food', isFixed: false, isEssential: true },
        { name: 'Gym', monthlyAmount: 45, type: 'other', isFixed: false, isEssential: false },
      ],
      debts: [],
      savingsGoalMonthly: 400,
      optimizationGoal: 'balance',
    });

    document.body.innerHTML = `
      <div id="results" class="hidden"></div>
      <div id="total-income"></div>
      <div id="total-expenses"></div>
      <div id="net-income"></div>
      <div id="savings-rate"></div>
      <div id="rule-analysis"></div>
      <ul id="recommendations"></ul>
    `;

    displayResults(result);

    const currencyFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });

    const formatCurrency = (value: string) =>
      currencyFormatter.format(Number.parseFloat(value));

    expect(document.getElementById('results')?.classList.contains('hidden')).toBe(false);
    expect(document.getElementById('total-income')?.textContent).toBe(
      formatCurrency(result.incomeSummary.totalMonthlyIncome),
    );
    expect(document.getElementById('total-expenses')?.textContent).toBe(
      formatCurrency(result.expenseSummary.totalMonthlyExpenses),
    );
    expect(document.getElementById('net-income')?.textContent).toBe(
      formatCurrency(result.metrics.monthlyNetIncome),
    );
    expect(document.getElementById('savings-rate')?.textContent).toBe(
      `${Number.parseFloat(result.metrics.savingsRate).toFixed(1)}%`,
    );
    expect(document.getElementById('rule-analysis')?.innerHTML).toContain(
      formatCurrency(result.budgetRuleAnalysis.needs.current),
    );
    expect(document.querySelectorAll('#recommendations li').length).toBeGreaterThan(0);
  });
});
