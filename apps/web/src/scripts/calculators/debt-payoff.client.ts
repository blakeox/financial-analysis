import type { DebtPayoffResult } from '@financial-analysis/analysis';
import { DebtPayoffEngine } from '@financial-analysis/analysis';
import { storeAnalysisResult } from '../analysis/analysis-results';
import { registerChatButton } from '../chat/chat-actions';
import { formatCurrency, parseNumber } from '../../utils/calculator-utilities';

// Currency formatter for displaying monetary values
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

type Strategy = 'avalanche' | 'snowball';

type CollectedDebt = {
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
};

// Credit Score Impact Calculator
interface CreditScoreImpact {
  currentEstimate: number;
  projectedImprovement: number;
  finalEstimate: number;
  factors: {
    paymentHistory: { current: number; projected: number; impact: string };
    creditUtilization: { current: number; projected: number; impact: string };
    debtToIncome: { current: number; projected: number; impact: string };
  };
  timeline: Array<{ month: number; score: number }>;
}

function estimateCreditScoreImpact(
  totalDebt: number,
  monthsToPayoff: number,
  totalCreditLimit: number = totalDebt * 3, // Assume credit limit is 3x debt
  currentPaymentHistory: number = 100, // % of on-time payments
  monthlyIncome: number = 0
): CreditScoreImpact {
  // Current credit utilization (30% of score)
  const currentUtilization = (totalDebt / totalCreditLimit) * 100;
  
  // Estimate current score based on utilization
  let currentScore = 580; // Start with fair credit
  if (currentUtilization < 10) currentScore = 750;
  else if (currentUtilization < 30) currentScore = 700;
  else if (currentUtilization < 50) currentScore = 650;
  else if (currentUtilization < 75) currentScore = 600;
  
  // Adjust for payment history (35% of score)
  if (currentPaymentHistory >= 100) currentScore += 50;
  else if (currentPaymentHistory >= 95) currentScore += 30;
  else if (currentPaymentHistory >= 90) currentScore += 10;
  else currentScore -= 20;
  
  // Projected improvement
  const projectedUtilization = 0; // Debt-free
  let projectedScore = 750; // Excellent credit after payoff
  
  // Calculate improvement trajectory
  const scoreImprovement = projectedScore - currentScore;
  const monthlyImprovement = scoreImprovement / monthsToPayoff;
  
  // Generate timeline
  const timeline: Array<{ month: number; score: number }> = [];
  for (let month = 0; month <= monthsToPayoff; month += Math.max(1, Math.floor(monthsToPayoff / 10))) {
    const score = Math.min(850, Math.round(currentScore + (monthlyImprovement * month)));
    timeline.push({ month, score });
  }
  
  // Debt-to-income ratio
  const currentDTI = monthlyIncome > 0 ? ((totalDebt * 0.03) / monthlyIncome) * 100 : 0; // Assume 3% monthly payment
  const projectedDTI = 0;
  
  return {
    currentEstimate: Math.round(currentScore),
    projectedImprovement: Math.round(scoreImprovement),
    finalEstimate: Math.round(projectedScore),
    factors: {
      paymentHistory: {
        current: currentPaymentHistory,
        projected: 100,
        impact: currentPaymentHistory < 100 ? 'Maintaining on-time payments will boost your score' : 'Keep up the great payment history!',
      },
      creditUtilization: {
        current: Math.round(currentUtilization),
        projected: Math.round(projectedUtilization),
        impact: currentUtilization > 30 ? 'Reducing utilization below 30% will significantly improve your score' : 'Your utilization is healthy',
      },
      debtToIncome: {
        current: Math.round(currentDTI),
        projected: Math.round(projectedDTI),
        impact: 'Lower DTI improves loan approval odds and rates',
      },
    },
    timeline,
  };
}

const toCurrency = (value: string | undefined): string => {
  if (typeof value !== 'string') return '';
  const numeric = Number.parseFloat(value);
  return formatCurrency(numeric);
};

export const collectDebts = (formData: FormData, count: number): CollectedDebt[] => {
  const debts: CollectedDebt[] = [];

  for (let i = 0; i < count; i += 1) {
    const name = formData.get(`debt-name-${i}`);
    const balance = parseNumber(formData.get(`debt-balance-${i}`)) ?? Number.NaN;
    const rate = parseNumber(formData.get(`debt-rate-${i}`)) ?? Number.NaN;
    const minimum = parseNumber(formData.get(`debt-minimum-${i}`)) ?? Number.NaN;

    if (
      typeof name === 'string' &&
      name.trim() &&
      !Number.isNaN(balance) &&
      !Number.isNaN(rate) &&
      !Number.isNaN(minimum)
    ) {
      debts.push({
        name: name.trim(),
        balance,
        interestRate: rate / 100,
        minimumPayment: minimum,
      });
    }
  }

  return debts;
};

export const formatMonths = (months: number): string => {
  const years = (months / 12).toFixed(1);
  return `${months} ${months === 1 ? 'month' : 'months'} (${years} ${years === '1.0' ? 'year' : 'years'})`;
};

export const describeSavings = (
  result: DebtPayoffResult,
  primaryStrategy: Strategy
): string | null => {
  const alternative = result.alternativeStrategy;
  if (!alternative) return null;

  const comparison = Number.parseFloat(result.comparisonSavings ?? '0');
  const monthDifference = alternative.totalMonthsToPayoff - result.summary.totalMonthsToPayoff;
  const primaryLabel = primaryStrategy === 'avalanche' ? 'Avalanche' : 'Snowball';
  const alternativeLabel = primaryStrategy === 'avalanche' ? 'Snowball' : 'Avalanche';

  if (Number.isFinite(comparison) && comparison !== 0) {
    const absComparison = currencyFormatter.format(Math.abs(comparison));

    if (comparison > 0) {
      return `💡 ${primaryLabel} saves you ${absComparison} in interest!`;
    }

    const absMonthDifference = Math.abs(monthDifference);
    if (absMonthDifference > 0) {
      return `💡 ${alternativeLabel} pays off ${absMonthDifference} months faster!`;
    }

    return `💡 ${alternativeLabel} saves you ${absComparison} in interest!`;
  }

  if (Number.isFinite(monthDifference) && monthDifference !== 0) {
    const absMonthDifference = Math.abs(monthDifference);
    return `💡 ${primaryLabel} pays off ${absMonthDifference} months faster!`;
  }

  return `💡 ${alternativeLabel} performs on par with ${primaryLabel}; review details to pick your preference.`;
};

export const buildTimeline = (result: DebtPayoffResult, primaryStrategy: Strategy): string => {
  const timelineEntries: Array<{ name: string; monthsToPayoff: number }> = [];
  const summary =
    primaryStrategy === result.summary.strategy ? result.summary : result.alternativeStrategy;

  if (summary) {
    summary.debtSummaries
      .slice()
      .sort((a, b) => a.monthsToPayoff - b.monthsToPayoff)
      .forEach((debt) => {
        if (Number.isFinite(debt.monthsToPayoff)) {
          timelineEntries.push({ name: debt.name, monthsToPayoff: debt.monthsToPayoff });
        }
      });
  }

  return timelineEntries
    .map(
      (entry, index) => `
        <div class="flex justify-between items-center text-sm">
          <span class="font-medium">${index + 1}. ${entry.name}</span>
          <span class="text-gray-600 dark:text-gray-400">Month ${entry.monthsToPayoff}</span>
        </div>
      `
    )
    .join('');
};

export const displayResults = (result: DebtPayoffResult, enableCreditScore: boolean = true): void => {
  // Use the generic results structure from IndividualCalculatorPage.astro
  const resultsContainer = document.getElementById('results-container');
  const summaryCards = document.getElementById('summary-cards');

  if (!resultsContainer || !summaryCards) {
    console.error('Required DOM elements not found for debt-payoff results');
    return;
  }

  const primary = result.summary;
  const alternative = result.alternativeStrategy;
  const primaryIsAvalanche = primary.strategy === 'avalanche';
  const avalancheSummary = primaryIsAvalanche ? primary : alternative;
  const snowballSummary = primaryIsAvalanche ? alternative : primary;

  const totalDebtBalance = Number.parseFloat(result.input.totalDebtBalance);
  const creditScore =
    enableCreditScore && Number.isFinite(totalDebtBalance)
      ? estimateCreditScoreImpact(totalDebtBalance, primary.totalMonthsToPayoff)
      : null;
  const interestSavingsDisplay = toCurrency(result.comparisonSavings);

  // Calculate debt-free date
  const debtFreeDate = new Date();
  debtFreeDate.setMonth(debtFreeDate.getMonth() + primary.totalMonthsToPayoff);
  const debtFreeDateStr = debtFreeDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  
  // Calculate credit score impact
  // Render summary cards with enhancements
  summaryCards.innerHTML = `
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-blue-900 dark:text-blue-100">Total Debt</h5>
      <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${toCurrency(result.input.totalDebtBalance)}</p>
      ${creditScore ? `<p class="text-xs text-blue-700 dark:text-blue-300 mt-1">Credit Score: ${creditScore.currentEstimate} → ${creditScore.finalEstimate}</p>` : ''}
    </div>
    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-green-900 dark:text-green-100">Debt-Free Date</h5>
      <p class="text-lg font-bold text-green-600 dark:text-green-400">${debtFreeDateStr}</p>
      <p class="text-xs text-green-700 dark:text-green-300 mt-1">${primary.totalMonthsToPayoff} months from now</p>
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-purple-900 dark:text-purple-100">Best Strategy</h5>
      <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">${primaryIsAvalanche ? 'Avalanche' : 'Snowball'}</p>
      <p class="text-xs text-purple-700 dark:text-purple-300 mt-1">${formatMonths(primary.totalMonthsToPayoff)}</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-orange-900 dark:text-orange-100">Interest Saved</h5>
      <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">${interestSavingsDisplay}</p>
      ${alternative ? `<p class="text-xs text-orange-700 dark:text-orange-300 mt-1">vs ${primaryIsAvalanche ? 'Snowball' : 'Avalanche'}</p>` : ''}
    </div>
  `;

  // Render detailed comparison
  resultsContainer.innerHTML = `
    ${creditScore ? `
    <!-- Credit Score Impact -->
    <div class="bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 mb-6 border border-blue-200 dark:border-blue-700">
      <h3 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <span>📈</span> Credit Score Impact Projection
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Estimated improvement as you pay off debt</p>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Estimate</p>
          <p class="text-3xl font-bold ${creditScore.currentEstimate < 650 ? 'text-red-600 dark:text-red-400' : creditScore.currentEstimate < 700 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}">${creditScore.currentEstimate}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${creditScore.currentEstimate < 580 ? 'Poor' : creditScore.currentEstimate < 650 ? 'Fair' : creditScore.currentEstimate < 700 ? 'Good' : 'Excellent'}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 text-center flex items-center justify-center">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Projected Improvement</p>
            <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">+${creditScore.projectedImprovement}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">points</p>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Debt-Free Score</p>
          <p class="text-3xl font-bold text-green-600 dark:text-green-400">${creditScore.finalEstimate}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Excellent</p>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Key Factors</h4>
        <div class="space-y-3">
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-600 dark:text-gray-400">Credit Utilization</span>
              <span class="font-semibold">${creditScore.factors.creditUtilization.current}% → ${creditScore.factors.creditUtilization.projected}%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div class="bg-blue-600 h-2 rounded-full" style="width: ${Math.min(100, creditScore.factors.creditUtilization.current)}%"></div>
            </div>
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">${creditScore.factors.creditUtilization.impact}</p>
          </div>
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-600 dark:text-gray-400">Payment History</span>
              <span class="font-semibold">${creditScore.factors.paymentHistory.current}% → ${creditScore.factors.paymentHistory.projected}%</span>
            </div>
            <p class="text-xs text-gray-600 dark:text-gray-400">${creditScore.factors.paymentHistory.impact}</p>
          </div>
        </div>
      </div>
    </div>
    ` : ''}
    
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Strategy Comparison</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Avalanche Method</h4>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Time to Payoff:</span>
              <span class="font-semibold text-gray-900 dark:text-white">${avalancheSummary ? formatMonths(avalancheSummary.totalMonthsToPayoff) : 'N/A'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Total Interest:</span>
              <span class="font-semibold text-gray-900 dark:text-white">${avalancheSummary ? toCurrency(avalancheSummary.totalInterestPaid) : 'N/A'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Total Paid:</span>
              <span class="font-semibold text-gray-900 dark:text-white">${avalancheSummary ? toCurrency(avalancheSummary.totalAmountPaid) : 'N/A'}</span>
            </div>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-3">Pays highest interest debts first</p>
        </div>
        
        <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Snowball Method</h4>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Time to Payoff:</span>
              <span class="font-semibold text-gray-900 dark:text-white">${snowballSummary ? formatMonths(snowballSummary.totalMonthsToPayoff) : 'N/A'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Total Interest:</span>
              <span class="font-semibold text-gray-900 dark:text-white">${snowballSummary ? toCurrency(snowballSummary.totalInterestPaid) : 'N/A'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Total Paid:</span>
              <span class="font-semibold text-gray-900 dark:text-white">${snowballSummary ? toCurrency(snowballSummary.totalAmountPaid) : 'N/A'}</span>
            </div>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-3">Pays smallest debts first</p>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Payoff Timeline</h3>
      
      <div class="space-y-3">
        ${primary.debtSummaries
          .slice()
          .sort((a, b) => a.monthsToPayoff - b.monthsToPayoff)
          .map(
            (debt, index) => `
            <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
              <span class="font-medium text-gray-900 dark:text-white">${index + 1}. ${debt.name}</span>
              <span class="text-gray-600 dark:text-gray-400">${formatMonths(debt.monthsToPayoff)}</span>
            </div>
          `
          )
          .join('')}
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Recommendations</h3>
      
      <div class="space-y-4">
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 class="font-semibold text-blue-900 dark:text-blue-100 mb-2">Best Strategy</h4>
          <p class="text-blue-800 dark:text-blue-200">${primary.strategy === 'avalanche' ? 'Avalanche method saves more money in interest' : 'Snowball method provides psychological motivation'}</p>
        </div>
        
        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <h4 class="font-semibold text-green-900 dark:text-green-100 mb-2">Savings Summary</h4>
          <p class="text-green-800 dark:text-green-200">${describeSavings(result, primary.strategy) || 'Review the comparison above to choose your preferred strategy.'}</p>
        </div>
      </div>
    </div>
  `;
};

const initDebtPayoffPage = () => {
  registerChatButton('#debt-chat-button', 'Debt Payoff Optimizer', { tool: 'analyze_debt_payoff' });

  const form = document.getElementById('calculator-form');

  if (!(form instanceof HTMLFormElement)) {
    console.error('Debt payoff form not found');
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

      // Parse debt information from the text field
      const debtInfo = formData.get('debts') as string;
      const extraPayment = parseNumber(formData.get('extraPayment')) || 0;
      const strategy = formData.get('strategy') as string;

      if (!debtInfo || !debtInfo.trim()) {
        throw new Error('Please enter debt information');
      }

      // Parse debt information from text format: "balance,interest_rate,minimum_payment"
      const debtLines = debtInfo
        .trim()
        .split('\n')
        .filter((line) => line.trim());
      const debts: CollectedDebt[] = [];

      debtLines.forEach((line, index) => {
        const parts = line.split(',').map((part) => part.trim());
        if (parts.length >= 3) {
          const balance = parseNumber(parts[0]) ?? Number.NaN;
          const interestRate = parseNumber(parts[1]) ?? Number.NaN;
          const minimumPayment = parseNumber(parts[2]) ?? Number.NaN;

          if (
            !Number.isNaN(balance) &&
            !Number.isNaN(interestRate) &&
            !Number.isNaN(minimumPayment)
          ) {
            debts.push({
              name: `Debt ${index + 1}`,
              balance,
              interestRate: interestRate / 100, // Convert percentage to decimal
              minimumPayment,
            });
          }
        }
      });

      if (debts.length === 0) {
        throw new Error(
          'Please enter valid debt information in the format: balance,interest_rate,minimum_payment'
        );
      }

      const result = DebtPayoffEngine.analyze({
        debts,
        extraMonthlyPayment: extraPayment,
        strategy: strategy === 'compare' ? 'avalanche' : (strategy as Strategy) || 'avalanche',
      });

      storeAnalysisResult('analyze_debt_payoff', result);
      displayResults(result);

      // Show results
      resultsSection?.classList.remove('hidden');
      resultsContainer?.classList.remove('hidden');
      summaryCards?.classList.remove('hidden');

      // Dispatch calculator completion event for journey integration
      window.dispatchEvent(
        new CustomEvent('calculator-completed', {
          detail: {
            calculatorId: 'debt-payoff',
            result: result,
            formData: { debts, extraMonthlyPayment: extraPayment, strategy },
          },
        })
      );
    } catch (error) {
      console.error('Debt payoff calculation error:', error);
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

initDebtPayoffPage();

export {};
