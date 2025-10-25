import { registerChatButton } from './chat-actions';
import { storeAnalysisResult } from '../scripts/analysis-results';
import { DebtPayoffEngine } from '@financial-analysis/analysis';
import type { DebtPayoffResult } from '@financial-analysis/analysis';

type Strategy = 'avalanche' | 'snowball';

type CollectedDebt = {
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const toCurrency = (value: string | undefined): string => {
  if (typeof value !== 'string') return '';
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? currencyFormatter.format(Math.abs(numeric)) : '';
};

export const parseNumber = (value: FormDataEntryValue | null): number => {
  if (value === null) return Number.NaN;
  const numericValue = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isFinite(numericValue) ? numericValue : Number.NaN;
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
  return `${months} months (${(months / 12).toFixed(1)} years)`;
};

export const describeSavings = (result: DebtPayoffResult, primaryStrategy: Strategy): string | null => {
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
  const summary = primaryStrategy === result.summary.strategy ? result.summary : result.alternativeStrategy;

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
      `,
    )
    .join('');
};

export const displayResults = (result: DebtPayoffResult): void => {
  const primary = result.summary;
  const alternative = result.alternativeStrategy;

  const primaryIsAvalanche = primary.strategy === 'avalanche';
  const avalancheSummary = primaryIsAvalanche ? primary : alternative;
  const snowballSummary = primaryIsAvalanche ? alternative : primary;

  const avalancheMonths = document.getElementById('avalanche-months');
  if (avalancheMonths && avalancheSummary) {
    avalancheMonths.textContent = formatMonths(avalancheSummary.totalMonthsToPayoff);
  }

  const avalancheInterest = document.getElementById('avalanche-interest');
  if (avalancheInterest && avalancheSummary) {
    avalancheInterest.textContent = toCurrency(avalancheSummary.totalInterestPaid);
  }

  const snowballMonths = document.getElementById('snowball-months');
  if (snowballMonths && snowballSummary) {
    snowballMonths.textContent = formatMonths(snowballSummary.totalMonthsToPayoff);
  }

  const snowballInterest = document.getElementById('snowball-interest');
  if (snowballInterest && snowballSummary) {
    snowballInterest.textContent = toCurrency(snowballSummary.totalInterestPaid);
  }

  const savingsElement = document.getElementById('savings-alert')?.querySelector('p');
  if (savingsElement) {
    const message = describeSavings(result, primary.strategy);
    savingsElement.textContent = message ?? '';
  }

  const timeline = document.getElementById('payoff-timeline');
  if (timeline) {
    timeline.innerHTML = buildTimeline(result, primary.strategy);
  }

  document.getElementById('results')?.classList.remove('hidden');
};

const initDebtPayoffPage = () => {
  registerChatButton('#debt-chat-button', 'Debt Payoff Optimizer', { tool: 'analyze_debt_payoff' });

  const form = document.getElementById('debt-form');
  const addDebtBtn = document.getElementById('add-debt-btn');

  if (!(form instanceof HTMLFormElement)) return;

  let debtCount = 1;

  addDebtBtn?.addEventListener('click', () => {
    appendDebtInputs(debtCount);
    debtCount += 1;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    document.getElementById('results')?.classList.add('hidden');
    document.getElementById('error')?.classList.add('hidden');
    document.getElementById('loading')?.classList.remove('hidden');

    try {
      const formData = new FormData(form);
      const monthlyExtraPayment = parseNumber(formData.get('monthlyExtraPayment')) || 0;
      const debts = collectDebts(formData, debtCount);

      if (debts.length === 0) throw new Error('Please add at least one debt');

      const result = DebtPayoffEngine.analyze({
        debts,
        extraMonthlyPayment: monthlyExtraPayment,
        strategy: 'avalanche',
      });
      storeAnalysisResult('analyze_debt_payoff', result);
      displayResults(result);
    } catch (error) {
      const errorEl = document.getElementById('error-message');
      if (errorEl) errorEl.textContent = error instanceof Error ? error.message : 'An error occurred';
      document.getElementById('error')?.classList.remove('hidden');
      console.error('Debt payoff calculation error:', error);
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

initDebtPayoffPage();

  export {};
