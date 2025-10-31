import type { DebtPayoffResult } from '@financial-analysis/analysis';
import { DebtPayoffEngine } from '@financial-analysis/analysis';
import { storeAnalysisResult } from '../scripts/analysis-results';
import { registerChatButton } from './chat-actions';
import { formatCurrency } from '../utils/calculator-utilities';

type Strategy = 'avalanche' | 'snowball';

type CollectedDebt = {
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
};

const toCurrency = (value: string | undefined): string => {
  if (typeof value !== 'string') return '';
  const numeric = Number.parseFloat(value);
  return formatCurrency(numeric);
};

const appendDebtInputs = (index: number): void => {
  const container = document.getElementById('debts-container');
  if (!container) return;

  const debtHtml = `
    <div class="debt-item border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2">
          <label for="debt-name-${index}" class="block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">Debt Name</label>
          <input id="debt-name-${index}" type="text" name="debt-name-${index}" placeholder="Debt name" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm" />
        </div>
        <div>
          <label for="debt-balance-${index}" class="block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">Balance ($)</label>
          <input id="debt-balance-${index}" type="number" name="debt-balance-${index}" placeholder="Balance" min="0" step="100" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm" />
        </div>
        <div>
          <label for="debt-rate-${index}" class="block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">Interest Rate (% APR)</label>
          <input id="debt-rate-${index}" type="number" name="debt-rate-${index}" placeholder="APR %" min="0" max="100" step="0.01" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm" />
        </div>
        <div class="col-span-2">
          <label for="debt-minimum-${index}" class="block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">Minimum Payment ($)</label>
          <input id="debt-minimum-${index}" type="number" name="debt-minimum-${index}" placeholder="Minimum payment" min="0" step="10" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm" />
        </div>
      </div>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', debtHtml);
};

export const collectDebts = (formData: FormData, count: number): CollectedDebt[] => {
  const debts: CollectedDebt[] = [];

  for (let i = 0; i < count; i += 1) {
    const name = formData.get(`debt-name-${i}`);
    const balance = parseNumber(formData.get(`debt-balance-${i}`));
    const rate = parseNumber(formData.get(`debt-rate-${i}`));
    const minimum = parseNumber(formData.get(`debt-minimum-${i}`));

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

export const displayResults = (result: DebtPayoffResult): void => {
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

  // Render summary cards
  summaryCards.innerHTML = `
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-blue-900 dark:text-blue-100">Total Debt</h5>
      <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${toCurrency(primary.totalDebt)}</p>
    </div>
    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-green-900 dark:text-green-100">Avalanche Time</h5>
      <p class="text-2xl font-bold text-green-600 dark:text-green-400">${avalancheSummary ? formatMonths(avalancheSummary.totalMonthsToPayoff) : 'N/A'}</p>
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-purple-900 dark:text-purple-100">Snowball Time</h5>
      <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">${snowballSummary ? formatMonths(snowballSummary.totalMonthsToPayoff) : 'N/A'}</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-orange-900 dark:text-orange-100">Interest Saved</h5>
      <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">${toCurrency(primary.totalInterestSaved)}</p>
    </div>
  `;

  // Render detailed comparison
  resultsContainer.innerHTML = `
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
          const balance = parseNumber(parts[0]);
          const interestRate = parseNumber(parts[1]);
          const minimumPayment = parseNumber(parts[2]);

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
