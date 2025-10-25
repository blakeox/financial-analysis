import { registerChatButton } from './chat-actions';
import { storeAnalysisResult } from './analysis-results';
import { BudgetEngine } from '@financial-analysis/analysis';
import type { BudgetResult } from '@financial-analysis/analysis';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const formatCurrency = (value: string | undefined): string => {
  if (!value) return 'N/A';
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) return value;
  return currencyFormatter.format(numeric);
};

const formatPercent = (value: string | undefined): string => {
  if (!value) return 'N/A';
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) return value;
  return `${numeric.toFixed(1)}%`;
};

type OptimizationGoal =
  | 'maximize_savings'
  | 'reduce_debt'
  | 'balance'
  | 'reduce_discretionary';

type IncomeType = 'salary' | 'business' | 'investment' | 'rental' | 'other';

type ExpenseType =
  | 'housing'
  | 'food'
  | 'transportation'
  | 'utilities'
  | 'insurance'
  | 'entertainment'
  | 'other';

export const parseNumber = (value: FormDataEntryValue | null): number => {
  if (value === null) return Number.NaN;
  const numericValue = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isFinite(numericValue) ? numericValue : Number.NaN;
};

export const displayResults = (result: BudgetResult): void => {
  const totals = {
    income: document.getElementById('total-income'),
    expenses: document.getElementById('total-expenses'),
    net: document.getElementById('net-income'),
    savingsRate: document.getElementById('savings-rate'),
  } as const;

  if (totals.income)
    totals.income.textContent = formatCurrency(result.incomeSummary.totalMonthlyIncome);
  if (totals.expenses)
    totals.expenses.textContent = formatCurrency(result.expenseSummary.totalMonthlyExpenses);
  if (totals.net) totals.net.textContent = formatCurrency(result.metrics.monthlyNetIncome);
  if (totals.savingsRate) totals.savingsRate.textContent = formatPercent(result.metrics.savingsRate);

  const ruleEl = document.getElementById('rule-analysis');
  if (ruleEl) {
    const { needs, wants, savings } = result.budgetRuleAnalysis;
    ruleEl.innerHTML = `
      <p><strong>Needs (50%):</strong> ${formatCurrency(needs.current)} (${formatPercent(needs.currentPercent)} vs target ${formatPercent(needs.recommendedPercent)})</p>
      <p><strong>Wants (30%):</strong> ${formatCurrency(wants.current)} (${formatPercent(wants.currentPercent)} vs target ${formatPercent(wants.recommendedPercent)})</p>
      <p><strong>Savings (20%):</strong> ${formatCurrency(savings.current)} (${formatPercent(savings.currentPercent)} vs target ${formatPercent(savings.recommendedPercent)})</p>
    `;
  }

  const recEl = document.getElementById('recommendations');
  if (recEl) {
    recEl.innerHTML = result.recommendations
      .map((rec) => `<li class="text-gray-700 dark:text-gray-300">${rec}</li>`)
      .join('');
  }

  document.getElementById('results')?.classList.remove('hidden');
};

export const collectIncome = (formData: FormData, incomeCount: number) => {
  const income: Array<{
    name: string;
    monthlyAmount: number;
    type: IncomeType;
    recurring: boolean;
  }> = [];

  for (let i = 0; i < incomeCount; i += 1) {
    const name = formData.get(`income-name-${i}`);
    const amount = parseNumber(formData.get(`income-amount-${i}`));
    const type = formData.get(`income-type-${i}`);

    if (typeof name === 'string' && name.trim() && !Number.isNaN(amount)) {
      income.push({
        name: name.trim(),
        monthlyAmount: amount,
        type: (typeof type === 'string' && type ? type : 'salary') as IncomeType,
        recurring: true,
      });
    }
  }

  return income;
};

export const collectExpenses = (formData: FormData, expenseCount: number) => {
  const expenses: Array<{
    name: string;
    monthlyAmount: number;
    type: ExpenseType;
    isFixed: boolean;
    isEssential: boolean;
  }> = [];

  for (let i = 0; i < expenseCount; i += 1) {
    const name = formData.get(`expense-name-${i}`);
    const amount = parseNumber(formData.get(`expense-amount-${i}`));
    const type = formData.get(`expense-type-${i}`);
    const isEssential = formData.get(`expense-essential-${i}`) === 'on';

    if (typeof name === 'string' && name.trim() && !Number.isNaN(amount)) {
      expenses.push({
        name: name.trim(),
        monthlyAmount: amount,
        type: (typeof type === 'string' && type ? type : 'other') as ExpenseType,
        isFixed: false,
        isEssential,
      });
    }
  }

  return expenses;
};

const addIncomeRow = (incomeCount: number): void => {
  const incomeContainer = document.getElementById('income-container');
  if (!incomeContainer) return;

  const html = `
    <div class="income-item grid grid-cols-3 gap-3">
      <div>
        <label for="income-name-${incomeCount}" class="block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">Income Source</label>
        <input id="income-name-${incomeCount}" type="text" name="income-name-${incomeCount}" placeholder="Source" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm" />
      </div>
      <div>
        <label for="income-amount-${incomeCount}" class="block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">Monthly Amount</label>
        <input id="income-amount-${incomeCount}" type="number" name="income-amount-${incomeCount}" placeholder="Amount" min="0" step="100" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm" />
      </div>
      <div>
        <label for="income-type-${incomeCount}" class="block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">Income Type</label>
        <select id="income-type-${incomeCount}" name="income-type-${incomeCount}" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm"><option value="salary">Salary</option><option value="business">Business</option><option value="investment">Investment</option><option value="rental">Rental</option><option value="other">Other</option></select>
      </div>
    </div>
  `;

  incomeContainer.insertAdjacentHTML('beforeend', html);
};

const addExpenseRow = (expenseCount: number): void => {
  const expensesContainer = document.getElementById('expenses-container');
  if (!expensesContainer) return;

  const html = `
    <div class="expense-item grid grid-cols-4 gap-3">
      <div>
        <label for="expense-name-${expenseCount}" class="block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">Expense Category</label>
        <input id="expense-name-${expenseCount}" type="text" name="expense-name-${expenseCount}" placeholder="Category" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm" />
      </div>
      <div>
        <label for="expense-amount-${expenseCount}" class="block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">Monthly Amount</label>
        <input id="expense-amount-${expenseCount}" type="number" name="expense-amount-${expenseCount}" placeholder="Amount" min="0" step="50" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm" />
      </div>
      <div>
        <label for="expense-type-${expenseCount}" class="block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">Expense Type</label>
        <select id="expense-type-${expenseCount}" name="expense-type-${expenseCount}" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm"><option value="housing">Housing</option><option value="food">Food</option><option value="transportation">Transportation</option><option value="utilities">Utilities</option><option value="insurance">Insurance</option><option value="entertainment">Entertainment</option><option value="other">Other</option></select>
      </div>
      <div class="flex flex-col justify-end">
        <label for="expense-essential-${expenseCount}" class="block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">Essential Expense</label>
        <div class="flex items-center gap-2 text-sm">
          <input id="expense-essential-${expenseCount}" type="checkbox" name="expense-essential-${expenseCount}" checked class="rounded" />
          <span class="text-gray-600 dark:text-gray-400">Yes</span>
        </div>
      </div>
    </div>
  `;

  expensesContainer.insertAdjacentHTML('beforeend', html);
};

const initBudgetPage = () => {
  registerChatButton('#budget-chat-button', 'Budget Optimizer', { tool: 'analyze_budget' });

  const form = document.getElementById('budget-form');
  const addIncomeBtn = document.getElementById('add-income-btn');
  const addExpenseBtn = document.getElementById('add-expense-btn');

  if (!(form instanceof HTMLFormElement)) return;

  let incomeCount = 1;
  let expenseCount = 1;

  addIncomeBtn?.addEventListener('click', () => {
    addIncomeRow(incomeCount);
    incomeCount += 1;
  });

  addExpenseBtn?.addEventListener('click', () => {
    addExpenseRow(expenseCount);
    expenseCount += 1;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    document.getElementById('results')?.classList.add('hidden');
    document.getElementById('error')?.classList.add('hidden');
    document.getElementById('loading')?.classList.remove('hidden');

    try {
      const formData = new FormData(form);
      const savingsGoalMonthly = parseNumber(formData.get('savingsGoalMonthly')) || 0;
      const optimizationGoalValue = formData.get('optimizationGoal');
      const optimizationGoal =
        (typeof optimizationGoalValue === 'string' && optimizationGoalValue
          ? optimizationGoalValue
          : 'balance') as OptimizationGoal;

      const income = collectIncome(formData, incomeCount);
      const expenses = collectExpenses(formData, expenseCount);

      if (income.length === 0) throw new Error('Please add at least one income source');
      if (expenses.length === 0) throw new Error('Please add at least one expense');

      const input = { income, expenses, debts: [], savingsGoalMonthly, optimizationGoal };
      const result = BudgetEngine.analyze(input);

      storeAnalysisResult('analyze_budget', result);
      displayResults(result);
    } catch (error) {
      const errorEl = document.getElementById('error-message');
      if (errorEl) errorEl.textContent = error instanceof Error ? error.message : 'An error occurred';
      document.getElementById('error')?.classList.remove('hidden');
    } finally {
      document.getElementById('loading')?.classList.add('hidden');
    }
  });

  document.getElementById('reset-btn')?.addEventListener('click', () => {
    form.reset();
    document.getElementById('results')?.classList.add('hidden');
    document.getElementById('error')?.classList.add('hidden');
  });
};

  export {};

initBudgetPage();
