/**
 * Form Controller Utility
 *
 * Provides a simple form controller for calculator pages with validation and event handling.
 */

import {
  clearFormFieldErrors,
  setFieldError,
  setFormFieldErrors,
} from '../scripts/_shared/form-field-errors';
import { hideError, showError } from './calculator-utilities';

export interface FormValidationRule {
  type: 'number' | 'text' | 'email';
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
}

export interface FormControllerConfig {
  [key: string]: FormValidationRule;
}

function getFieldControl(
  form: HTMLFormElement,
  fieldName: string
): HTMLInputElement | HTMLSelectElement | null {
  const field = form.querySelector(`[name="${fieldName}"]`);
  if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) {
    return field;
  }
  return null;
}

export function createModelFormController(formId: string, config: FormControllerConfig) {
  const form = document.getElementById(formId) as HTMLFormElement;

  if (!form) {
    console.error(`Form with id "${formId}" not found`);
    return {
      onSubmit: () => {},
      onReset: () => {},
      showError: () => {},
      validateForm: () => false,
      getFormData: () => ({}),
    };
  }

  const validateField = (input: HTMLInputElement, rule: FormValidationRule): boolean => {
    const value = input.value.trim();

    if (rule.required && !value) {
      return false;
    }

    if (rule.type === 'number' && value) {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return false;
      if (rule.min !== undefined && numValue < rule.min) return false;
      if (rule.max !== undefined && numValue > rule.max) return false;
    }

    if (rule.pattern && value) {
      const regex = new RegExp(rule.pattern);
      if (!regex.test(value)) return false;
    }

    return true;
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const fieldErrors: Record<string, string> = {};

    Object.entries(config).forEach(([fieldName, rule]) => {
      const input = getFieldControl(form, fieldName);
      if (!input) return;

      const fieldValid = validateField(input as HTMLInputElement, rule);
      if (!fieldValid) {
        isValid = false;
        fieldErrors[fieldName] = 'Please check this value and try again.';
      }
    });

    if (!isValid) {
      setFormFieldErrors(form, fieldErrors);
    } else {
      clearFormFieldErrors(form);
    }

    return isValid;
  };

  const getFormData = (): Record<string, unknown> => {
    const formData = new FormData(form);
    const data: Record<string, unknown> = {};

    Object.keys(config).forEach((key) => {
      const value = formData.get(key);
      if (value !== null) {
        const rule = config[key];
        if (rule.type === 'number') {
          data[key] = parseFloat(value.toString()) || 0;
        } else {
          data[key] = value.toString();
        }
      }
    });

    return data;
  };

  const showFormControllerError = (message: string): void => {
    showError(message);
  };

  const onSubmit = (callback: (data: Record<string, unknown>) => void): void => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      hideError();

      if (validateForm()) {
        const data = getFormData();
        callback(data);
      } else {
        showFormControllerError('Please check your inputs and try again.');
      }
    });
  };

  const onReset = (callback: () => void): void => {
    const resetButton = form.querySelector('[type="reset"], #reset-btn') as HTMLButtonElement;
    if (resetButton) {
      resetButton.addEventListener('click', (event) => {
        event.preventDefault();
        form.reset();
        clearFormFieldErrors(form);
        hideError();

        const legacyFormError = document.getElementById('form-error');
        legacyFormError?.classList.add('hidden');

        callback();
      });
    }
  };

  return {
    onSubmit,
    onReset,
    showError: showFormControllerError,
    validateForm,
    getFormData,
    setFieldError: (fieldName: string, message: string) => {
      const field = getFieldControl(form, fieldName);
      if (field) {
        setFieldError(field, message);
      }
    },
    clearFieldErrors: () => clearFormFieldErrors(form),
  };
}
