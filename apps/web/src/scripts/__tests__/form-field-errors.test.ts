import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearFormFieldErrors,
  inferFieldNameFromError,
  setFormFieldErrors,
} from '../_shared/form-field-errors';

describe('form-field-errors', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="calculator-form">
        <div class="field-container">
          <input name="principal" class="fa-input-surface" />
          <div class="field-error hidden"></div>
        </div>
        <div class="field-container">
          <input name="annualRate" class="fa-input-surface" />
          <div class="field-error hidden"></div>
        </div>
      </form>
      <div id="error" class="hidden">
        <p id="error-message"></p>
      </div>
    `;
  });

  it('infers field names from validation messages', () => {
    expect(inferFieldNameFromError('Please enter a valid loan amount')).toBe('principal');
    expect(inferFieldNameFromError('Annual rate must be between 0 and 100')).toBe('annualRate');
    expect(inferFieldNameFromError('Something else')).toBeNull();
  });

  it('applies fa-field-error and aria-invalid to fields', () => {
    const form = document.getElementById('calculator-form') as HTMLFormElement;
    setFormFieldErrors(form, { principal: 'Required' });

    const principal = form.querySelector<HTMLInputElement>('[name="principal"]');
    expect(principal?.classList.contains('fa-field-error')).toBe(true);
    expect(principal?.getAttribute('aria-invalid')).toBe('true');
    expect(principal?.closest('.field-container')?.querySelector('.field-error')?.textContent).toBe(
      'Required'
    );
  });

  it('clears field errors on reset', () => {
    const form = document.getElementById('calculator-form') as HTMLFormElement;
    setFormFieldErrors(form, { principal: 'Required' });
    clearFormFieldErrors(form);

    const principal = form.querySelector<HTMLInputElement>('[name="principal"]');
    expect(principal?.classList.contains('fa-field-error')).toBe(false);
    expect(principal?.getAttribute('aria-invalid')).toBeNull();
  });
});
