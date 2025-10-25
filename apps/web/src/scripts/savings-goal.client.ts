import { registerChatButton } from './chat-actions';
import { storeAnalysisResult } from './analysis-results';
import { SavingsGoalEngine } from '@financial-analysis/analysis';
import type { SavingsGoalResult } from '@financial-analysis/analysis';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const formatCurrency = (value: string): string => {
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) return value;
  return currencyFormatter.format(numeric);
};

type ScreenRefs = {
  loading: HTMLElement | null;
  error: HTMLElement | null;
  errorMessage: HTMLElement | null;
  results: HTMLElement | null;
};

export const parseNumber = (value: FormDataEntryValue | null): number => {
  if (value === null) return Number.NaN;
  const numericValue = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isFinite(numericValue) ? numericValue : Number.NaN;
};

export const toRecommendationText = (entry: unknown): string | null => {
  if (typeof entry === 'string' && entry.trim()) return entry.trim();
  if (entry && typeof entry === 'object' && 'recommendation' in entry) {
    const recommendation = (entry as { recommendation?: unknown }).recommendation;
    if (typeof recommendation === 'string' && recommendation.trim()) return recommendation.trim();
  }
  return null;
};

export const displayResults = (result: SavingsGoalResult): void => {
  const summary = result.summary;

  const monthsEl = document.getElementById('months-to-goal');
  if (monthsEl) monthsEl.textContent = String(summary.monthsToGoal);

  const yearsEl = document.getElementById('years-to-goal');
  if (yearsEl) yearsEl.textContent = `${summary.yearsToGoal} years`;

  const targetDateEl = document.getElementById('target-date');
  if (targetDateEl) {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + summary.monthsToGoal);
    targetDateEl.textContent = targetDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  }

  const totals: Record<string, string> = {
    'total-saved': summary.finalBalance,
    'total-contributions': summary.totalContributions,
    'total-interest': summary.totalInterestEarned,
  };

  Object.entries(totals).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = formatCurrency(value);
  });

  const effectiveRateEl = document.getElementById('effective-rate');
  if (effectiveRateEl) {
    const rate = Number.parseFloat(summary.effectiveAnnualReturn);
    effectiveRateEl.textContent = Number.isFinite(rate)
      ? `${rate.toFixed(2)}%`
      : `${summary.effectiveAnnualReturn}%`;
  }

  const recommendationsEl = document.getElementById('recommendations-list');
  if (recommendationsEl) {
    const recommendationHtml = (result.recommendations.recommendations ?? [])
      .map(toRecommendationText)
      .filter((entry): entry is string => Boolean(entry))
      .map(
        (entry) => `
          <li class="flex gap-2">
            <span class="text-blue-600 dark:text-blue-400">•</span>
            <span class="text-gray-700 dark:text-gray-300">${entry}</span>
          </li>
        `,
      )
      .join('');

    recommendationsEl.innerHTML = recommendationHtml;
  }

  document.getElementById('results')?.classList.remove('hidden');
};

export const handleSubmit = async (
  form: HTMLFormElement,
  button: HTMLButtonElement | null,
  refs: ScreenRefs,
): Promise<void> => {
  refs.results?.classList.add('hidden');
  refs.error?.classList.add('hidden');
  refs.loading?.classList.remove('hidden');
  if (button) button.disabled = true;

  try {
    const formData = new FormData(form);

    const input = {
      goalAmount: parseNumber(formData.get('goalAmount')),
      currentSavings: parseNumber(formData.get('currentSavings')),
      monthlyContribution: parseNumber(formData.get('monthlyContribution')),
      annualReturnRate: parseNumber(formData.get('annualInterestRate')) / 100,
      inflationRate: parseNumber(formData.get('annualInflationRate')) / 100,
      goalType: 'general' as const,
    };

    if (
      Number.isNaN(input.goalAmount) ||
      Number.isNaN(input.currentSavings) ||
      Number.isNaN(input.monthlyContribution)
    ) {
      throw new Error('Please provide valid numeric inputs');
    }

    const result = SavingsGoalEngine.analyze(input);
    storeAnalysisResult('analyze_savings_goal', result);
    displayResults(result);
  } catch (error) {
    if (refs.errorMessage) {
      refs.errorMessage.textContent =
        error instanceof Error ? error.message : 'An unexpected error occurred';
    }
    refs.error?.classList.remove('hidden');
  console.error('Savings goal calculation error:', error);
  } finally {
    refs.loading?.classList.add('hidden');
    if (button) button.disabled = false;
  }
};

const initSavingsGoalPage = (): void => {
  registerChatButton('#savings-goal-chat-button', 'Savings Goal Planner', {
    tool: 'analyze_savings_goal',
  });

  const form = document.getElementById('savings-goal-form');
  if (!(form instanceof HTMLFormElement)) {
    console.error('Savings goal form not found');
    return;
  }

  const calculateBtn = document.getElementById('calculate-btn');
  const resetBtn = document.getElementById('reset-btn');

  const refs: ScreenRefs = {
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    errorMessage: document.getElementById('error-message'),
    results: document.getElementById('results'),
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void handleSubmit(form, calculateBtn instanceof HTMLButtonElement ? calculateBtn : null, refs);
  });

  if (resetBtn instanceof HTMLButtonElement) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      refs.results?.classList.add('hidden');
      refs.error?.classList.add('hidden');
    });
  }
};

export {};

initSavingsGoalPage();
