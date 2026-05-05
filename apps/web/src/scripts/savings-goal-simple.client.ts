/**
 * Simplified Savings Goal Calculator Client Script
 *
 * This is a simplified version that works with the generic IndividualCalculatorPage.astro structure
 */

import { storeAnalysisResult } from './analysis-results';
import { registerChatButton } from './chat-actions';
import {
  formatCurrencyWhole as formatCurrency,
  formatPercentSimple as formatPercent,
} from '../utils/calculator-utilities';

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
  inflationAdjustedGoal?: number;
  realValue?: number;
  milestones?: Array<{ percent: number; amount: number; months: number; date: string }>;
  progressPercent?: number;
  goalType?: string;
  goalTypeLabel?: string;
  goalStrategy?: string;
}

// Calculate inflation-adjusted goal and milestones
function calculateInflationImpact(
  goalAmount: number,
  currentSavings: number,
  targetYears: number,
  inflationRate: number,
  annualReturnRate: number,
  monthlyContribution: number
): {
  inflationAdjustedGoal: number;
  realValue: number;
  milestones: Array<{ percent: number; amount: number; months: number; date: string }>;
  progressPercent: number;
} {
  // Inflation-adjusted goal (what you need in future dollars)
  const inflationAdjustedGoal = goalAmount * Math.pow(1 + inflationRate, targetYears);
  
  // Calculate progress milestones (25%, 50%, 75%, 100%)
  const milestones: Array<{ percent: number; amount: number; months: number; date: string }> = [];
  const monthlyRate = annualReturnRate / 12;
  const totalMonths = targetYears * 12;
  
  let balance = currentSavings;
  const checkpoints = [0.25, 0.50, 0.75, 1.0];
  let checkpointIndex = 0;
  
  for (let month = 0; month <= totalMonths && checkpointIndex < checkpoints.length; month++) {
    if (month > 0) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
    }
    
    const progress = balance / goalAmount;
    
    if (progress >= checkpoints[checkpointIndex]) {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + month);
      
      milestones.push({
        percent: checkpoints[checkpointIndex] * 100,
        amount: balance,
        months: month,
        date: targetDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
      });
      
      checkpointIndex++;
    }
  }
  
  // If we didn't hit all milestones, project them
  while (milestones.length < 4) {
    const percent = checkpoints[milestones.length];
    const targetAmount = goalAmount * percent;
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + totalMonths);
    
    milestones.push({
      percent: percent * 100,
      amount: targetAmount,
      months: totalMonths,
      date: targetDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
    });
  }
  
  // Real value (purchasing power in today's dollars)
  const finalBalance = currentSavings * Math.pow(1 + annualReturnRate, targetYears) +
    monthlyContribution * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
  const realValue = finalBalance / Math.pow(1 + inflationRate, targetYears);
  
  // Current progress percentage
  const progressPercent = Math.min(100, (currentSavings / goalAmount) * 100);
  
  return {
    inflationAdjustedGoal,
    realValue,
    milestones,
    progressPercent,
  };
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

    const goalProfiles: Record<string, { label: string; strategy: string }> = {
      emergency: {
        label: 'Emergency Fund',
        strategy: 'Favor liquidity and low-risk accounts—automate transfers after paydays until you reach 3-6 months of expenses.',
      },
      education: {
        label: 'Education Savings',
        strategy: 'Use tax-advantaged accounts (529, ESA) and escalate contributions each semester to stay ahead of tuition needs.',
      },
      home: {
        label: 'Home Purchase',
        strategy: 'Pair disciplined contributions with debt payoff and keep savings in safe accounts until you are within 12 months of closing.',
      },
      retirement: {
        label: 'Retirement Bridge Goal',
        strategy: 'Maximize employer matches, automate annual contribution increases, and stay diversified to protect long-term purchasing power.',
      },
      general: {
        label: 'General Savings',
        strategy: 'Maintain steady monthly contributions and revisit the goal quarterly to align with lifestyle changes.',
      },
    };

    const goalProfile = goalProfiles[goalType] ?? {
      label: 'Custom Goal',
      strategy: 'Set automated transfers, keep a short-term buffer, and adjust contributions when income rises.',
    };

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

    // Calculate inflation impact and milestones
    const inflationImpact = calculateInflationImpact(
      goalAmount,
      currentSavings,
      targetDateYears,
      inflationRate,
      annualReturnRate,
      monthlyContribution
    );

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
      inflationAdjustedGoal: inflationImpact.inflationAdjustedGoal,
      realValue: inflationImpact.realValue,
      milestones: inflationImpact.milestones,
      progressPercent: inflationImpact.progressPercent,
      goalType,
      goalTypeLabel: goalProfile.label,
      goalStrategy: goalProfile.strategy,
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

  // Render summary cards with inflation adjustment
  summaryCards.innerHTML = `
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-blue-900 dark:text-blue-100">Time to Goal</h5>
      <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${result.yearsToGoal.toFixed(1)} years</p>
      <p class="text-xs text-blue-700 dark:text-blue-300 mt-1">${result.targetDate}</p>
    </div>
    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-green-900 dark:text-green-100">Final Balance</h5>
      <p class="text-2xl font-bold text-green-600 dark:text-green-400">${formatCurrency(result.finalBalance)}</p>
      ${result.realValue ? `<p class="text-xs text-green-700 dark:text-green-300 mt-1">Real value: ${formatCurrency(result.realValue)}</p>` : ''}
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-purple-900 dark:text-purple-100">Progress</h5>
      <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">${result.progressPercent?.toFixed(0) || 0}%</p>
      <p class="text-xs text-purple-700 dark:text-purple-300 mt-1">of goal achieved</p>
      ${result.goalTypeLabel ? `<p class="text-xs text-purple-700 dark:text-purple-300 mt-1">Goal: ${result.goalTypeLabel}</p>` : ''}
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-orange-900 dark:text-orange-100">Interest Earned</h5>
      <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">${formatCurrency(result.totalInterestEarned)}</p>
      ${result.inflationAdjustedGoal ? `<p class="text-xs text-orange-700 dark:text-orange-300 mt-1">Inflation adj: ${formatCurrency(result.inflationAdjustedGoal)}</p>` : ''}
    </div>
  `;

  // Render detailed breakdown
  resultsContainer.innerHTML = `
    ${result.milestones && result.milestones.length > 0 ? `
    <!-- Progress Bar and Milestones -->
    <div class="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 mb-6 border border-purple-200 dark:border-purple-700">
      <h3 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <span>🎯</span> Savings Milestones
      </h3>
      <p class="fa-script-copy-muted mb-4">Track your progress toward your goal</p>
      
      <!-- Visual Progress Bar -->
      <div class="mb-6">
        <div class="flex justify-between text-sm mb-2">
          <span class="text-gray-600 dark:text-gray-400">Current Progress</span>
          <span class="font-semibold text-gray-900 dark:text-white">${result.progressPercent?.toFixed(1) || 0}%</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative">
          <div class="bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2" style="width: ${result.progressPercent || 0}%">
            ${(result.progressPercent || 0) > 10 ? '<span class="text-white text-xs font-bold">🚀</span>' : ''}
          </div>
          <!-- Milestone markers -->
          <div class="absolute top-0 left-1/4 w-0.5 h-6 bg-white opacity-50"></div>
          <div class="absolute top-0 left-1/2 w-0.5 h-6 bg-white opacity-50"></div>
          <div class="absolute top-0 left-3/4 w-0.5 h-6 bg-white opacity-50"></div>
        </div>
      </div>
      
      <!-- Milestone Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        ${result.milestones.map((milestone, idx) => {
          const achieved = (result.progressPercent || 0) >= milestone.percent;
          const colors = ['blue', 'purple', 'indigo', 'green'];
          const color = colors[idx];
          return `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-3 border-2 ${achieved ? `border-${color}-500` : 'border-gray-200 dark:border-gray-700'}">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-xl">${achieved ? '✅' : '⏳'}</span>
                <span class="font-semibold text-gray-900 dark:text-white">${milestone.percent}%</span>
              </div>
              <p class="fa-script-note mb-1">${formatCurrency(milestone.amount)}</p>
              <p class="fa-script-note">${milestone.date}</p>
              <p class="fa-script-note">${milestone.months} months</p>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    ` : ''}

      ${result.goalStrategy ? `
      <div class="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <div class="flex items-center gap-3 mb-3">
          <span class="text-2xl">🧠</span>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Strategy Guidance</h3>
            ${result.goalTypeLabel ? `<p class="fa-script-copy-subtle">Optimized for ${result.goalTypeLabel}</p>` : ''}
          </div>
        </div>
        <p class="fa-script-copy-strong leading-relaxed">${result.goalStrategy}</p>
      </div>
      ` : ''}
    
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Savings Goal Timeline</h3>
      
      <div class="space-y-4">
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="fa-script-label">Target Date</span>
            <p class="fa-script-copy-subtle">When you'll reach your goal</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-gray-900 dark:text-white">${result.targetDate}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="fa-script-label">Months to Goal</span>
            <p class="fa-script-copy-subtle">Time remaining</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-gray-900 dark:text-white">${result.monthsToGoal} months</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="fa-script-label">Years to Goal</span>
            <p class="fa-script-copy-subtle">Time remaining</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-gray-900 dark:text-white">${result.yearsToGoal.toFixed(1)} years</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="fa-script-label">Effective Annual Return</span>
            <p class="fa-script-copy-subtle">After inflation</p>
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
            <span class="fa-script-label">Final Balance</span>
            <p class="fa-script-copy-subtle">Total amount saved</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-green-600 dark:text-green-400">${formatCurrency(result.finalBalance)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="fa-script-label">Total Contributions</span>
            <p class="fa-script-copy-subtle">Amount you'll contribute</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-blue-600 dark:text-blue-400">${formatCurrency(result.totalContributions)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="fa-script-label">Interest Earned</span>
            <p class="fa-script-copy-subtle">Growth from investments</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-purple-600 dark:text-purple-400">${formatCurrency(result.totalInterestEarned)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="fa-script-label">Goal Achievement</span>
            <p class="fa-script-copy-subtle">Status</p>
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

      // Parse form data
      const goalAmount = parseNumber(formData.get('goalAmount'));
      const currentSavings = parseNumber(formData.get('currentSavings'));
      const targetDateYears = parseNumber(formData.get('targetDate'));
      const annualReturnRate = parseNumber(formData.get('interestRate'));
      const inflationRate = parseNumber(formData.get('inflationRate'));
      const goalType = String(formData.get('goalType') || 'general');

      const calculator = new SimpleSavingsGoalCalculator();

      // Calculate monthly contribution needed to reach goal in target time
      const monthlyContribution = calculator.calculateMonthlyContribution(
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
