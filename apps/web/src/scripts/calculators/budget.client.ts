import type { BudgetResult } from '@financial-analysis/analysis';
import { BudgetEngine } from '@financial-analysis/analysis';
import { storeAnalysisResult } from '../analysis/analysis-results';
import { registerChatButton } from '../chat/chat-actions';
import { formatCurrency, formatPercentSimple } from '../../utils/calculator-utilities';

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

// Emergency Fund Progress Tracker
interface EmergencyFundProgress {
  currentAmount: number;
  targetAmount: number;
  monthsOfExpenses: number;
  targetMonths: number;
  percentComplete: number;
  monthsToComplete: number;
  status: 'none' | 'starter' | 'partial' | 'complete' | 'excess';
  recommendation: string;
}

function calculateEmergencyFundProgress(
  currentAmount: number,
  monthlyExpenses: number,
  monthlySavings: number,
  targetMonths: number = 6
): EmergencyFundProgress {
  const targetAmount = monthlyExpenses * targetMonths;
  const monthsOfExpenses = currentAmount / monthlyExpenses;
  const percentComplete = (currentAmount / targetAmount) * 100;
  const remaining = Math.max(0, targetAmount - currentAmount);
  const monthsToComplete = monthlySavings > 0 ? Math.ceil(remaining / monthlySavings) : Infinity;
  
  let status: EmergencyFundProgress['status'] = 'none';
  let recommendation = '';
  
  if (monthsOfExpenses === 0) {
    status = 'none';
    recommendation = 'Start building your emergency fund! Aim for at least 1 month of expenses first.';
  } else if (monthsOfExpenses < 1) {
    status = 'starter';
    recommendation = 'Good start! Continue building toward 3-6 months of expenses for full protection.';
  } else if (monthsOfExpenses < 3) {
    status = 'partial';
    recommendation = 'Making progress! Aim for at least 3 months to cover most emergencies.';
  } else if (monthsOfExpenses < targetMonths) {
    status = 'partial';
    recommendation = `Almost there! ${(targetMonths - monthsOfExpenses).toFixed(1)} more months to reach your ${targetMonths}-month goal.`;
  } else if (monthsOfExpenses >= targetMonths && monthsOfExpenses < targetMonths + 3) {
    status = 'complete';
    recommendation = 'Excellent! You have a solid emergency fund. Consider investing excess savings.';
  } else {
    status = 'excess';
    recommendation = 'Your emergency fund is well-funded! Consider investing excess funds for growth.';
  }
  
  return {
    currentAmount,
    targetAmount,
    monthsOfExpenses,
    targetMonths,
    percentComplete: Math.min(100, percentComplete),
    monthsToComplete,
    status,
    recommendation,
  };
}

export const parseNumber = (value: FormDataEntryValue | null): number => {
  if (value === null) return Number.NaN;
  const numericValue = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isFinite(numericValue) ? numericValue : Number.NaN;
};

// Use shared utilities for formatting
const formatPercent = (value: string | undefined): string => {
  if (!value) return 'N/A';
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) return value;
  return formatPercentSimple(numeric);
};

export const displayResults = (result: BudgetResult, emergencyFundAmount: number = 0): void => {
  // Use the generic results structure from IndividualCalculatorPage.astro
  const resultsContainer = document.getElementById('results-container');
  const summaryCards = document.getElementById('summary-cards');

  if (!resultsContainer || !summaryCards) {
    console.error('Required DOM elements not found for budget results');
    return;
  }

  // Calculate emergency fund progress
  const monthlyExpenses = parseFloat(result.expenseSummary.totalMonthlyExpenses || '0');
  const monthlySavings = parseFloat(result.metrics.monthlyNetIncome || '0');
  const emergencyFund = calculateEmergencyFundProgress(emergencyFundAmount, monthlyExpenses, monthlySavings);

  // Render summary cards with emergency fund
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
      <p class="text-xs text-purple-700 dark:text-purple-300 mt-1">${emergencyFund.monthsOfExpenses.toFixed(1)} months saved</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-orange-900 dark:text-orange-100">Savings Rate</h5>
      <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">${formatPercent(result.metrics.savingsRate)}</p>
      <p class="text-xs text-orange-700 dark:text-orange-300 mt-1">Emergency fund: ${emergencyFund.percentComplete.toFixed(0)}%</p>
    </div>
  `;

  // Render detailed breakdown
  const { needs, wants, savings } = result.budgetRuleAnalysis;

  resultsContainer.innerHTML = `
    <!-- Emergency Fund Progress Tracker -->
    <div class="bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 mb-6 border border-green-200 dark:border-green-700">
      <h3 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <span>🛡️</span> Emergency Fund Progress
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">${emergencyFund.recommendation}</p>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Fund</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">${formatCurrency(emergencyFund.currentAmount)}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${emergencyFund.monthsOfExpenses.toFixed(1)} months</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Target Fund</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">${formatCurrency(emergencyFund.targetAmount)}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${emergencyFund.targetMonths} months</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Time to Complete</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">${emergencyFund.monthsToComplete === Infinity ? 'N/A' : `${emergencyFund.monthsToComplete} mo`}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">At current savings</p>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
        <div class="flex justify-between text-sm mb-2">
          <span class="text-gray-600 dark:text-gray-400">Progress</span>
          <span class="font-semibold text-gray-900 dark:text-white">${emergencyFund.percentComplete.toFixed(1)}%</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
          <div class="bg-linear-to-r from-green-500 to-emerald-500 h-4 rounded-full transition-all duration-500" style="width: ${emergencyFund.percentComplete}%"></div>
        </div>
        <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span>$0</span>
          <span class="font-semibold">${formatCurrency(emergencyFund.currentAmount)}</span>
          <span>${formatCurrency(emergencyFund.targetAmount)}</span>
        </div>
      </div>
    </div>
    
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
            (rec: string) => `
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
    const calculateBtn = document.querySelector<HTMLButtonElement>('#calculate-btn');
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
