import type { BudgetResult } from '@financial-analysis/analysis';
import { BudgetEngine } from '@financial-analysis/analysis';
import { storeAnalysisResult } from './analysis-results';
import { registerChatButton } from './chat-actions';

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

type OptimizationGoal = 'maximize_savings' | 'reduce_debt' | 'balance' | 'reduce_discretionary';

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
  // Use the generic results structure from IndividualCalculatorPage.astro
  const resultsContainer = document.getElementById('results-container');
  const summaryCards = document.getElementById('summary-cards');

  if (!resultsContainer || !summaryCards) {
    console.error('Required DOM elements not found for budget results');
    return;
  }

  // Render summary cards
  summaryCards.innerHTML = `
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-blue-900 dark:text-blue-100">Monthly Income</h5>
      <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${formatCurrency(result.incomeSummary.totalMonthlyIncome)}</p>
    </div>
    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-green-900 dark:text-green-100">Monthly Expenses</h5>
      <p class="text-2xl font-bold text-green-600 dark:text-green-400">${formatCurrency(result.expenseSummary.totalMonthlyExpenses)}</p>
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-purple-900 dark:text-purple-100">Net Income</h5>
      <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">${formatCurrency(result.metrics.monthlyNetIncome)}</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-orange-900 dark:text-orange-100">Savings Rate</h5>
      <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">${formatPercent(result.metrics.savingsRate)}</p>
    </div>
  `;

  // Render detailed breakdown
  const { needs, wants, savings } = result.budgetRuleAnalysis;

  resultsContainer.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">50/30/20 Budget Analysis</h3>
      
      <div class="space-y-4">
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Needs (50%)</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Housing, utilities, food, transportation</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-gray-900 dark:text-white">${formatCurrency(needs.current)}</span>
            <p class="text-sm ${needs.currentPercent > needs.recommendedPercent ? 'text-red-600' : 'text-green-600'}">${formatPercent(needs.currentPercent)} vs ${formatPercent(needs.recommendedPercent)} target</p>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Wants (30%)</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Entertainment, dining, hobbies</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-gray-900 dark:text-white">${formatCurrency(wants.current)}</span>
            <p class="text-sm ${wants.currentPercent > wants.recommendedPercent ? 'text-red-600' : 'text-green-600'}">${formatPercent(wants.currentPercent)} vs ${formatPercent(wants.recommendedPercent)} target</p>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Savings (20%)</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Emergency fund, retirement, investments</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-gray-900 dark:text-white">${formatCurrency(savings.current)}</span>
            <p class="text-sm ${savings.currentPercent < savings.recommendedPercent ? 'text-red-600' : 'text-green-600'}">${formatPercent(savings.currentPercent)} vs ${formatPercent(savings.recommendedPercent)} target</p>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Recommendations</h3>
      
      <ul class="space-y-3">
        ${result.recommendations
          .map(
            (rec) => `
          <li class="flex items-start gap-3">
            <span class="text-blue-600 dark:text-blue-400 mt-1">•</span>
            <span class="text-gray-700 dark:text-gray-300">${rec}</span>
          </li>
        `
          )
          .join('')}
      </ul>
    </div>
  `;
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

  const form = document.getElementById('calculator-form');

  if (!(form instanceof HTMLFormElement)) {
    console.error('Budget form not found');
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Show loading state
    const calculateBtn = document.getElementById('calculate-btn');
    if (calculateBtn) {
      calculateBtn.disabled = true;
      calculateBtn.textContent = 'Calculating...';
    }

    // Hide previous results
    const resultsSection = document.getElementById('results-section');
    const resultsContainer = document.getElementById('results-container');
    const summaryCards = document.getElementById('summary-cards');
    resultsSection?.classList.add('hidden');
    resultsContainer?.classList.add('hidden');
    summaryCards?.classList.add('hidden');

    try {
      const formData = new FormData(form);

      // Parse the simple form fields from CalculatorTemplate.tsx
      const monthlyIncome = parseNumber(formData.get('monthlyIncome')) || 0;
      const housing = parseNumber(formData.get('housing')) || 0;
      const utilities = parseNumber(formData.get('utilities')) || 0;
      const food = parseNumber(formData.get('food')) || 0;
      const transportation = parseNumber(formData.get('transportation')) || 0;
      const savingsGoal = parseNumber(formData.get('savingsGoal')) || 0;

      if (monthlyIncome <= 0) throw new Error('Please enter a valid monthly income');
      if (housing <= 0) throw new Error('Please enter housing costs');

      // Create simplified income and expense arrays
      const income = [
        {
          name: 'Primary Income',
          monthlyAmount: monthlyIncome,
          type: 'salary' as IncomeType,
          recurring: true,
        },
      ];

      const expenses = [
        {
          name: 'Housing',
          monthlyAmount: housing,
          type: 'housing' as ExpenseType,
          isFixed: true,
          isEssential: true,
        },
        {
          name: 'Utilities',
          monthlyAmount: utilities,
          type: 'utilities' as ExpenseType,
          isFixed: false,
          isEssential: true,
        },
        {
          name: 'Food & Groceries',
          monthlyAmount: food,
          type: 'food' as ExpenseType,
          isFixed: false,
          isEssential: true,
        },
        {
          name: 'Transportation',
          monthlyAmount: transportation,
          type: 'transportation' as ExpenseType,
          isFixed: false,
          isEssential: true,
        },
      ].filter((expense) => expense.monthlyAmount > 0);

      const input = {
        income,
        expenses,
        debts: [],
        savingsGoalMonthly: savingsGoal,
        optimizationGoal: 'balance' as OptimizationGoal,
      };

      const result = BudgetEngine.analyze(input);

      storeAnalysisResult('analyze_budget', result);
      displayResults(result);

      // Show results
      resultsSection?.classList.remove('hidden');
      resultsContainer?.classList.remove('hidden');
      summaryCards?.classList.remove('hidden');

      // Dispatch calculator completion event for journey integration
      window.dispatchEvent(
        new CustomEvent('calculator-completed', {
          detail: {
            calculatorId: 'budget',
            result: result,
            formData: input,
          },
        })
      );
    } catch (error) {
      console.error('Budget calculation error:', error);
      alert(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      // Reset button state
      if (calculateBtn) {
        calculateBtn.disabled = false;
        calculateBtn.textContent = 'Calculate';
      }
    }
  });

  // Add reset handler
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn instanceof HTMLButtonElement) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      const resultsSection = document.getElementById('results-section');
      const resultsContainer = document.getElementById('results-container');
      const summaryCards = document.getElementById('summary-cards');
      resultsSection?.classList.add('hidden');
      resultsContainer?.classList.add('hidden');
      summaryCards?.classList.add('hidden');
    });
  }
};

export {};

initBudgetPage();
