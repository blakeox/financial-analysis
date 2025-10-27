import { storeAnalysisResult } from './analysis-results';
import { SavingsGoalEngine } from '@financial-analysis/analysis';
import type { SavingsGoalResult } from '@financial-analysis/analysis';
import type { FormControllerState } from '@financial-analysis/tools';
import { z } from 'zod';

const numericField = (message: string) =>
  z.preprocess((value) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') {
        return Number.NaN;
      }
      const numeric = Number(trimmed);
      return Number.isFinite(numeric) ? numeric : Number.NaN;
    }
    if (typeof value === 'number') {
      return value;
    }
    return Number.NaN;
  }, z.number().refine((numeric) => Number.isFinite(numeric), { message }));

export const SavingsGoalFormSchema = z.object({
  goalAmount: numericField('Please provide valid numeric inputs')
    .refine((value) => value > 0, { message: 'Goal amount must be positive' })
    .refine((value) => value <= 100_000_000, {
      message: 'Goal amount cannot exceed $100M',
    }),
  currentSavings: numericField('Please provide valid numeric inputs')
    .refine((value) => value >= 0, { message: 'Current savings cannot be negative' })
    .refine((value) => value <= 100_000_000, {
      message: 'Current savings cannot exceed $100M',
    }),
  monthlyContribution: numericField('Please provide valid numeric inputs')
    .refine((value) => value >= 0, { message: 'Monthly contribution cannot be negative' })
    .refine((value) => value <= 10_000_000, {
      message: 'Monthly contribution cannot exceed $10M',
    }),
  annualReturnRate: numericField('Please provide valid numeric inputs')
    .refine((value) => value >= 0, { message: 'Annual return rate cannot be negative' })
    .refine((value) => value <= 100, { message: 'Annual return rate cannot exceed 100%' })
    .transform((value) => value / 100),
  inflationRate: numericField('Please provide valid numeric inputs')
    .refine((value) => value >= 0, { message: 'Inflation rate cannot be negative' })
    .refine((value) => value <= 100, { message: 'Inflation rate cannot exceed 100%' })
    .transform((value) => value / 100),
  goalType: z
    .enum(['general', 'emergency_fund', 'home_down_payment', 'education', 'retirement'])
    .default('general'),
});

type SavingsGoalFormValues = z.infer<typeof SavingsGoalFormSchema>;

export const DEFAULT_VALUES: SavingsGoalFormValues = {
  goalAmount: 50_000,
  currentSavings: 5_000,
  monthlyContribution: 1_000,
  annualReturnRate: 0.05,
  inflationRate: 0.03,
  goalType: 'general',
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

export type ScreenRefs = {
  loading: HTMLElement | null;
  error: HTMLElement | null;
  errorMessage: HTMLElement | null;
  results: HTMLElement | null;
};

export const parseNumber = (value: FormDataEntryValue | null): number => {
  if (value === null) return Number.NaN;
  const numericValue = typeof value === 'string' ? Number.parseFloat(value) : Number(value);
  return Number.isFinite(numericValue) ? numericValue : Number.NaN;
};

export const serializeForm = (form: HTMLFormElement): Record<string, string> => {
  const formData = new FormData(form);
  const entries: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    entries[key] = typeof value === 'string' ? value : '';
  }
  return entries;
};

const setLoadingState = (refs: ScreenRefs, button: HTMLButtonElement | null, loading: boolean) => {
  refs.loading?.classList.toggle('hidden', !loading);
  if (button) {
    button.disabled = loading;
  }
};

const clearFieldErrors = (form: HTMLFormElement) => {
  const invalidFields = form.querySelectorAll('[data-field-error="true"]');
  invalidFields.forEach((field) => {
    field.removeAttribute('data-field-error');
    field.classList.remove('border-red-500', 'focus:ring-red-500');
    field.setAttribute('aria-invalid', 'false');
  });
};

export const applyFieldErrors = (form: HTMLFormElement, state: FormControllerState<SavingsGoalFormValues>) => {
  clearFieldErrors(form);

  if (state.errors.length === 0) {
    return;
  }

  state.errors.forEach((error) => {
    const [fieldName] = error.path.split('.');
    const field = form.querySelector<HTMLElement>(`[name="${fieldName}"]`);
    if (!field) {
      return;
    }
    field.setAttribute('data-field-error', 'true');
    field.setAttribute('aria-invalid', 'true');
    field.classList.add('border-red-500', 'focus:ring-red-500');
  });
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
    if (el) el.textContent = currencyFormatter.format(Number.parseFloat(value));
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

export const describeValidationErrors = (state: FormControllerState<SavingsGoalFormValues>): string => {
  if (state.errors.length === 0) {
    return '';
  }
  if (state.errors.length === 1) {
    return state.errors[0].message;
  }
  const uniqueMessages = Array.from(new Set(state.errors.map((error) => error.message)));
  return `Please correct the following issues:\n• ${uniqueMessages.join('\n• ')}`;
};

export const calculate = async (
  button: HTMLButtonElement | null,
  refs: ScreenRefs,
  state: FormControllerState<SavingsGoalFormValues>
): Promise<void> => {
  setLoadingState(refs, button, true);
  refs.error?.classList.add('hidden');
  refs.results?.classList.add('hidden');

  try {
    const payload = {
      goalAmount: state.values.goalAmount,
      currentSavings: state.values.currentSavings,
      monthlyContribution: state.values.monthlyContribution,
      annualReturnRate: state.values.annualReturnRate,
      inflationRate: state.values.inflationRate,
      goalType: state.values.goalType,
    };

    const result = SavingsGoalEngine.analyze(payload);
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
    setLoadingState(refs, button, false);
  }
};


