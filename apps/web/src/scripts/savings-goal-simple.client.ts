/**
 * Simplified Savings Goal Calculator Client Script
 *
 * This is a simplified version that works with the generic IndividualCalculatorPage.astro structure
 */

import { storeAnalysisResult } from './analysis-results';
import { registerChatButton } from './chat-actions';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatCurrency = (value: number | string | undefined): string => {
  if (value === undefined || value === null) return 'N/A';
  const numeric = typeof value === 'number' ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(numeric)) return 'N/A';
  return currencyFormatter.format(numeric);
};

const formatPercent = (value: number | string | undefined): string => {
  if (value === undefined || value === null) return 'N/A';
  const numeric = typeof value === 'number' ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(numeric)) return 'N/A';
  return `${numeric.toFixed(1)}%`;
};

interface SavingsGoalInputs {
  goalAmount: number;
  currentSavings: number;
  targetDateYears: number;
  annualReturnRate: number;
  inflationRate: number;
  goalType: string;
  monthlyContribution: number;
}

interface SavingsGoalResults {
  monthsToGoal: number;
  yearsToGoal: number;
  targetDate: string;
  finalBalance: number;
  totalContributions: number;
  totalInterestEarned: number;
  effectiveAnnualReturn: number;
  goalAchieved: boolean;
  monthsToReachGoal: number;
}

class SimpleSavingsGoalCalculator {
  calculateMonthlyContribution(
    goalAmount: number,
    currentSavings: number,
    targetYears: number,
    annualReturnRate: number,
    inflationRate: number
  ): number {
    const effectiveRate = annualReturnRate - inflationRate;
    const monthlyRate = effectiveRate / 12;
    const totalMonths = targetYears * 12;

    // Calculate future value of current savings
    const futureValueOfCurrentSavings = currentSavings * Math.pow(1 + effectiveRate, targetYears);

    // Calculate how much more we need to save
    const remainingGoal = goalAmount - futureValueOfCurrentSavings;

    if (remainingGoal <= 0) {
      return 0; // Already have enough
    }

    // Calculate monthly payment needed using annuity formula
    const monthlyContribution =
      remainingGoal * (monthlyRate / (Math.pow(1 + monthlyRate, totalMonths) - 1));

    return monthlyContribution;
  }

  calculate(inputs: SavingsGoalInputs): SavingsGoalResults {
    const {
      goalAmount,
      currentSavings,
      targetDateYears,
      annualReturnRate,
      inflationRate,
      goalType,
      monthlyContribution,
    } = inputs;

    // Calculate effective annual return (nominal - inflation)
    const effectiveAnnualReturn = annualReturnRate - inflationRate;
    const monthlyRate = effectiveAnnualReturn / 12;
    const totalMonths = targetDateYears * 12;

    // Calculate final balance using the calculated monthly contribution
    let balance = currentSavings;
    let totalContributions = 0;

    // Simulate monthly contributions and interest
    for (let month = 0; month < totalMonths; month++) {
      totalContributions += monthlyContribution;
      balance = balance * (1 + monthlyRate) + monthlyContribution;
    }

    const totalInterestEarned = balance - currentSavings - totalContributions;
    const targetDate = new Date();
    targetDate.setFullYear(targetDate.getFullYear() + targetDateYears);

    return {
      monthsToGoal: totalMonths,
      yearsToGoal: targetDateYears,
      targetDate: targetDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
      finalBalance: balance,
      totalContributions,
      totalInterestEarned,
      effectiveAnnualReturn: effectiveAnnualReturn * 100,
      goalAchieved: balance >= goalAmount,
      monthsToReachGoal: totalMonths,
    };
  }
}

const displayResults = (result: SavingsGoalResults): void => {
  const resultsContainer = document.getElementById('results-container');
  const summaryCards = document.getElementById('summary-cards');

  if (!resultsContainer || !summaryCards) {
    console.error('Required DOM elements not found for savings goal results');
    return;
  }

  // Render summary cards
  summaryCards.innerHTML = `
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-blue-900 dark:text-blue-100">Time to Goal</h5>
      <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${result.yearsToGoal.toFixed(1)} years</p>
    </div>
    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-green-900 dark:text-green-100">Final Balance</h5>
      <p class="text-2xl font-bold text-green-600 dark:text-green-400">${formatCurrency(result.finalBalance)}</p>
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-purple-900 dark:text-purple-100">Total Contributions</h5>
      <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">${formatCurrency(result.totalContributions)}</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-orange-900 dark:text-orange-100">Interest Earned</h5>
      <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">${formatCurrency(result.totalInterestEarned)}</p>
    </div>
  `;

  // Render detailed breakdown
  resultsContainer.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Savings Goal Timeline</h3>
      
      <div class="space-y-4">
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Target Date</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">When you'll reach your goal</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-gray-900 dark:text-white">${result.targetDate}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Months to Goal</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Time remaining</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-gray-900 dark:text-white">${result.monthsToGoal} months</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Years to Goal</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Time remaining</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-gray-900 dark:text-white">${result.yearsToGoal.toFixed(1)} years</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Effective Annual Return</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">After inflation</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-green-600 dark:text-green-400">${formatPercent(result.effectiveAnnualReturn)}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Financial Breakdown</h3>
      
      <div class="space-y-4">
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Final Balance</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Total amount saved</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-green-600 dark:text-green-400">${formatCurrency(result.finalBalance)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Total Contributions</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Amount you'll contribute</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-blue-600 dark:text-blue-400">${formatCurrency(result.totalContributions)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Interest Earned</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Growth from investments</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-purple-600 dark:text-purple-400">${formatCurrency(result.totalInterestEarned)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Goal Achievement</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Status</p>
          </div>
          <div class="text-right">
            <span class="font-semibold ${result.goalAchieved ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">${result.goalAchieved ? 'Achieved' : 'Not Achieved'}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Key Insights</h3>
      
      <div class="space-y-4">
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 class="font-semibold text-blue-900 dark:text-blue-100 mb-2">Timeline Analysis</h4>
          <p class="text-blue-800 dark:text-blue-200">${result.yearsToGoal <= 5 ? 'Great! You can reach your goal in a reasonable timeframe.' : result.yearsToGoal <= 10 ? 'Your goal is achievable with consistent saving.' : 'Consider increasing your monthly contribution or adjusting your timeline.'}</p>
        </div>
        
        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <h4 class="font-semibold text-green-900 dark:text-green-100 mb-2">Contribution Strategy</h4>
          <p class="text-green-800 dark:text-green-200">${result.totalContributions > result.totalInterestEarned ? 'Your contributions are the primary driver of growth.' : 'Investment returns are significantly boosting your savings.'}</p>
        </div>
        
        <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <h4 class="font-semibold text-purple-900 dark:text-purple-100 mb-2">Optimization Tips</h4>
          <p class="text-purple-800 dark:text-purple-200">${result.effectiveAnnualReturn > 5 ? 'Your return assumptions are optimistic - consider conservative planning.' : result.effectiveAnnualReturn < 2 ? 'Consider higher-return investments or increasing contributions.' : 'Your return assumptions are reasonable for long-term planning.'}</p>
        </div>
      </div>
    </div>
  `;
};

const parseNumber = (value: FormDataEntryValue | null): number => {
  if (value === null) return Number.NaN;
  const numericValue = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isFinite(numericValue) ? numericValue : Number.NaN;
};

const initSavingsGoalPage = (): void => {
  registerChatButton('#savings-goal-chat-button', 'Savings Goal Calculator', {
    tool: 'analyze_savings_goal',
  });

  const form = document.getElementById('calculator-form');

  if (!(form instanceof HTMLFormElement)) {
    console.error('Savings goal form not found');
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

      // Parse form data
      const goalAmount = parseNumber(formData.get('goalAmount'));
      const currentSavings = parseNumber(formData.get('currentSavings'));
      const targetDateYears = parseNumber(formData.get('targetDate'));
      const annualReturnRate = parseNumber(formData.get('interestRate'));
      const inflationRate = parseNumber(formData.get('inflationRate'));
      const goalType = String(formData.get('goalType') || 'general');

      // Calculate monthly contribution needed to reach goal in target time
      const monthlyContribution = this.calculateMonthlyContribution(
        goalAmount,
        currentSavings,
        targetDateYears,
        annualReturnRate / 100,
        inflationRate / 100
      );

      // Validate required fields
      if (Number.isNaN(goalAmount) || goalAmount <= 0) {
        throw new Error('Please enter a valid goal amount');
      }
      if (Number.isNaN(currentSavings) || currentSavings < 0) {
        throw new Error('Please enter a valid current savings amount');
      }
      if (Number.isNaN(targetDateYears) || targetDateYears <= 0) {
        throw new Error('Please enter a valid target date');
      }
      if (Number.isNaN(annualReturnRate) || annualReturnRate < 0 || annualReturnRate > 100) {
        throw new Error('Please enter a valid annual return rate (0-100%)');
      }

      const inputs: SavingsGoalInputs = {
        goalAmount,
        currentSavings,
        targetDateYears,
        annualReturnRate: annualReturnRate / 100, // Convert to decimal
        inflationRate: Number.isNaN(inflationRate) ? 3 : inflationRate / 100, // Convert to decimal
        goalType,
        monthlyContribution,
      };

      const calculator = new SimpleSavingsGoalCalculator();
      const result = calculator.calculate(inputs);

      // Store result for chatbot integration
      storeAnalysisResult('analyze_savings_goal', result);

      // Display results
      displayResults(result);

      // Show results
      resultsSection?.classList.remove('hidden');
      resultsContainer?.classList.remove('hidden');
      summaryCards?.classList.remove('hidden');

      // Dispatch calculator completion event for journey integration
      window.dispatchEvent(
        new CustomEvent('calculator-completed', {
          detail: {
            calculatorId: 'savings-goal',
            result: result,
            formData: inputs,
          },
        })
      );
    } catch (error) {
      console.error('Savings goal calculation error:', error);
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

initSavingsGoalPage();
