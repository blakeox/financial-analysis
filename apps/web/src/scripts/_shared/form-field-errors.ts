/**
 * Accessible field-level validation styling for template calculator forms.
 */

import { hideError, showError } from '../../utils/calculator-utilities';

export type FormFieldControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const ERROR_MESSAGE_FIELD_RULES: Array<{ pattern: RegExp; field: string }> = [
  { pattern: /loan amount|principal/i, field: 'principal' },
  { pattern: /annual rate|annualRate/i, field: 'annualRate' },
  { pattern: /loan term \(months\)|term in months/i, field: 'termMonths' },
  { pattern: /vehicle loan term/i, field: 'loanTerm' },
  { pattern: /vehicle price/i, field: 'vehiclePrice' },
  { pattern: /sales tax/i, field: 'salesTaxRate' },
  { pattern: /interest rate/i, field: 'interestRate' },
  { pattern: /debt information|debt/i, field: 'debts' },
  { pattern: /monthly income/i, field: 'monthlyIncome' },
  { pattern: /housing/i, field: 'housing' },
  { pattern: /current age/i, field: 'currentAge' },
  { pattern: /retirement age/i, field: 'retirementAge' },
  { pattern: /current income/i, field: 'currentIncome' },
  { pattern: /expected annual return|annual return/i, field: 'expectedAnnualReturn' },
];

export function inferFieldNameFromError(message: string): string | null {
  for (const rule of ERROR_MESSAGE_FIELD_RULES) {
    if (rule.pattern.test(message)) {
      return rule.field;
    }
  }
  return null;
}

export function getFormFieldControl(
  form: HTMLFormElement,
  fieldName: string
): FormFieldControl | null {
  const field = form.querySelector<FormFieldControl>(`[name="${fieldName}"]`);
  return field ?? null;
}

function getFieldErrorElement(field: FormFieldControl): HTMLElement | null {
  const container = field.closest('.field-container');
  if (!container) return null;
  return container.querySelector<HTMLElement>('.field-error');
}

export function clearFieldError(field: FormFieldControl): void {
  field.removeAttribute('data-field-error');
  field.removeAttribute('aria-invalid');
  field.classList.remove('fa-field-error');

  const errorElement = getFieldErrorElement(field);
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.classList.add('hidden');
    errorElement.removeAttribute('role');
  }
}

export function clearFormFieldErrors(form: HTMLFormElement): void {
  form.querySelectorAll<FormFieldControl>('[data-field-error="true"]').forEach((field) => {
    clearFieldError(field);
  });
}

export function setFieldError(field: FormFieldControl, message?: string): void {
  if (!message) {
    clearFieldError(field);
    return;
  }

  field.setAttribute('data-field-error', 'true');
  field.setAttribute('aria-invalid', 'true');
  field.classList.add('fa-field-error');

  const errorElement = getFieldErrorElement(field);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    errorElement.setAttribute('role', 'alert');
  }
}

export function setFormFieldErrors(form: HTMLFormElement, errors: Record<string, string>): void {
  clearFormFieldErrors(form);

  for (const [fieldName, message] of Object.entries(errors)) {
    const field = getFormFieldControl(form, fieldName);
    if (field) {
      setFieldError(field, message);
    }
  }
}

/**
 * Show a page-level error and highlight the matching field when possible.
 */
export function handleCalculatorFormError(form: HTMLFormElement, error: unknown): void {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  clearFormFieldErrors(form);

  const fieldName = inferFieldNameFromError(message);
  if (fieldName) {
    setFormFieldErrors(form, { [fieldName]: message });
  }

  showError(message);
}

export function clearCalculatorFormErrors(form: HTMLFormElement): void {
  clearFormFieldErrors(form);
  hideError();
}
