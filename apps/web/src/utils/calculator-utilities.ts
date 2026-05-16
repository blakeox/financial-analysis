import { storeAnalysisResult } from '../scripts/analysis/analysis-results';

/**
 * Shared Calculator Utilities
 *
 * Common utilities for all calculator client scripts to reduce duplication
 * and ensure consistency across the application.
 */

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Standard currency formatter (2 decimal places)
 */
export const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Whole number currency formatter (no decimals)
 */
export const CURRENCY_WHOLE_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Standard percentage formatter (2 decimal places)
 */
export const PERCENT_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Simple percentage formatter (1 decimal place)
 */
export const PERCENT_SIMPLE_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * Number formatter with commas
 */
export const NUMBER_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

// ============================================================================
// PARSING UTILITIES
// ============================================================================

/**
 * Parse a FormData entry to a number, handling currency symbols and commas
 */
export function parseNumber(
  value: FormDataEntryValue | string | number | null | undefined
): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (value instanceof File) {
    return null;
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,%\s]/g, '');
    if (cleaned.length === 0) return 0;
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

/**
 * Parse a FormData entry to a number with fallback
 */
export function parseNumberWithFallback(
  value: FormDataEntryValue | null,
  fallback = Number.NaN
): number {
  if (value === null) return fallback;
  const numericValue = typeof value === 'string' ? Number.parseFloat(value) : Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

/**
 * Coerce any value to a number, handling various formats
 */
export function coerceNumber(value: unknown, fallback = Number.NaN): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/[$,]/g, ''));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

/**
 * Check if a value is a finite number
 */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

// ============================================================================
// FORMATTING FUNCTIONS
// ============================================================================

/**
 * Format a value as currency (2 decimal places)
 */
export function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  const numeric = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (!Number.isFinite(numeric)) return value?.toString() || 'N/A';
  return CURRENCY_FORMATTER.format(numeric);
}

/**
 * Format a value as currency (whole number, no decimals)
 */
export function formatCurrencyWhole(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  const numeric = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (!Number.isFinite(numeric)) return value?.toString() || 'N/A';
  return CURRENCY_WHOLE_FORMATTER.format(numeric);
}

/**
 * Format a value as percentage (2 decimal places)
 */
export function formatPercent(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  const numeric = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (!Number.isFinite(numeric)) return value?.toString() || 'N/A';
  return PERCENT_FORMATTER.format(numeric / 100);
}

/**
 * Format a value as percentage (decimal form, e.g., 0.05 -> 5%)
 */
export function formatPercentDecimal(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  const numeric = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (!Number.isFinite(numeric)) return value?.toString() || 'N/A';
  return PERCENT_FORMATTER.format(numeric);
}

/**
 * Format a value as percentage (simple, 1 decimal place)
 */
export function formatPercentSimple(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  const numeric = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (!Number.isFinite(numeric)) return value?.toString() || 'N/A';
  return PERCENT_SIMPLE_FORMATTER.format(numeric / 100);
}

/**
 * Format a value as a number with commas
 */
export function formatNumber(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  const numeric = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (!Number.isFinite(numeric)) return value?.toString() || 'N/A';
  return NUMBER_FORMATTER.format(numeric);
}

/**
 * Format a value as months text
 */
export function formatMonths(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  const numeric = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (!Number.isFinite(numeric)) return value?.toString() || 'N/A';
  return `${numeric} ${numeric === 1 ? 'month' : 'months'}`;
}

/**
 * Format a value as years text
 */
export function formatYears(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  const numeric = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (!Number.isFinite(numeric)) return value?.toString() || 'N/A';
  return `${numeric} ${numeric === 1 ? 'year' : 'years'}`;
}

// ============================================================================
// DOM MANIPULATION UTILITIES
// ============================================================================

/**
 * Common DOM element IDs used across calculators
 */
export const DOM_IDS = {
  // Form elements
  FORM: 'calculator-form',
  CALCULATE_BUTTON: 'calculate-btn',
  RESET_BUTTON: 'reset-btn',

  // Results elements
  RESULTS_SECTION: 'results-section',
  RESULTS_CONTAINER: 'results-container',
  SUMMARY_CARDS: 'summary-cards',
  LOADING_STATE: 'loading-state',
  ERROR_STATE: 'error-state',
  ERROR_MESSAGE: 'error-message',
} as const;

/**
 * Show results section
 */
export function showResults(): void {
  const resultsSection = document.getElementById(DOM_IDS.RESULTS_SECTION);
  const resultsContainer = document.getElementById(DOM_IDS.RESULTS_CONTAINER);
  const summaryCards = document.getElementById(DOM_IDS.SUMMARY_CARDS);

  resultsSection?.classList.remove('hidden');
  resultsContainer?.classList.remove('hidden');
  summaryCards?.classList.remove('hidden');
}

/**
 * Hide results section
 */
export function hideResults(): void {
  const resultsSection = document.getElementById(DOM_IDS.RESULTS_SECTION);
  const resultsContainer = document.getElementById(DOM_IDS.RESULTS_CONTAINER);
  const summaryCards = document.getElementById(DOM_IDS.SUMMARY_CARDS);

  resultsSection?.classList.add('hidden');
  resultsContainer?.classList.add('hidden');
  summaryCards?.classList.add('hidden');
}

/**
 * Show error message
 */
export function showError(message: string): void {
  const errorState = document.getElementById(DOM_IDS.ERROR_STATE);
  const errorMessage = document.getElementById(DOM_IDS.ERROR_MESSAGE);

  errorState?.classList.remove('hidden');
  if (errorMessage) {
    errorMessage.textContent = message;
  }
}

/**
 * Hide error message
 */
export function hideError(): void {
  const errorState = document.getElementById(DOM_IDS.ERROR_STATE);
  errorState?.classList.add('hidden');
}

/**
 * Set loading state for button
 */
export function setLoadingState(button: HTMLButtonElement | null, isLoading: boolean): void {
  if (!button) return;
  button.disabled = isLoading;
  button.textContent = isLoading ? 'Calculating...' : 'Calculate';
  button.setAttribute('aria-busy', isLoading ? 'true' : 'false');
}

/**
 * Show loading state
 * @param button - Optional button to disable during loading
 */
export function showLoading(button?: HTMLButtonElement | null): void {
  const loadingState = document.getElementById(DOM_IDS.LOADING_STATE);
  loadingState?.classList.remove('hidden');
  if (button) {
    setLoadingState(button, true);
  }
}

/**
 * Hide loading state
 * @param button - Optional button to re-enable after loading
 */
export function hideLoading(button?: HTMLButtonElement | null): void {
  const loadingState = document.getElementById(DOM_IDS.LOADING_STATE);
  loadingState?.classList.add('hidden');
  if (button) {
    setLoadingState(button, false);
  }
}

/**
 * Reset form
 */
export function resetForm(form: HTMLFormElement): void {
  form.reset();
  hideResults();
  hideError();
}

// ============================================================================
// CALCULATOR PATTERN UTILITIES
// ============================================================================

/**
 * Standard calculator result storage and event dispatch
 */
export interface CalculatorResultPayload<ResultType = unknown, FormDataType = unknown> {
  calculatorId: string;
  result: ResultType;
  formData: FormDataType;
}

/**
 * Store result and dispatch calculator completion event
 */
export function handleCalculatorResult<ResultType = unknown, FormDataType = unknown>(
  payload: CalculatorResultPayload<ResultType, FormDataType>
): void {
  const { calculatorId, result, formData } = payload;

  // Store result for chatbot integration
  storeAnalysisResult(`analyze_${calculatorId}`, result);

  // Dispatch calculator completion event for journey integration
  window.dispatchEvent(
    new CustomEvent('calculator-completed', {
      detail: {
        calculatorId,
        result,
        formData,
      },
    })
  );
}

/**
 * Safe error handler for calculators
 */
export function handleCalculatorError(error: unknown): string {
  console.error('Calculator error:', error);
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

/**
 * Standard reset button handler
 */
export function setupResetButton(form: HTMLFormElement): void {
  const resetBtn = document.getElementById(DOM_IDS.RESET_BUTTON);
  if (resetBtn instanceof HTMLButtonElement) {
    resetBtn.addEventListener('click', () => {
      resetForm(form);
    });
  }
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate a number is within a range
 */
export function validateRange(value: number, min: number, max: number, fieldName: string): void {
  if (value < min || value > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}`);
  }
}

/**
 * Validate a number is positive
 */
export function validatePositive(value: number, fieldName: string): void {
  if (value <= 0) {
    throw new Error(`${fieldName} must be greater than zero`);
  }
}

/**
 * Validate a number is non-negative
 */
export function validateNonNegative(value: number, fieldName: string): void {
  if (value < 0) {
    throw new Error(`${fieldName} cannot be negative`);
  }
}

/**
 * Validate a percentage is between 0-100
 */
export function validatePercentage(value: number, fieldName: string): void {
  validateRange(value, 0, 100, fieldName);
}
