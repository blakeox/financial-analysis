/**
 * Form Controller Utility
 *
 * Provides a simple form controller for calculator pages with validation and event handling.
 */

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

    Object.entries(config).forEach(([fieldName, rule]) => {
      const input = form.querySelector(`[name="${fieldName}"]`) as HTMLInputElement;
      if (input) {
        const fieldValid = validateField(input, rule);
        if (!fieldValid) {
          isValid = false;
          input.classList.add('border-rose-500');
        } else {
          input.classList.remove('border-rose-500');
        }
      }
    });

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

  const showError = (message: string): void => {
    // Simple error display - could be enhanced with toast notifications
    console.error('Form validation error:', message);

    // Create or update error message element
    let errorElement = document.getElementById('form-error');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.id = 'form-error';
      errorElement.className =
        'mb-4 rounded border border-rose-400 bg-rose-100 px-4 py-3 text-rose-700';
      form.insertBefore(errorElement, form.firstChild);
    }

    errorElement.textContent = message;
    errorElement.classList.remove('hidden');

    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorElement?.classList.add('hidden');
    }, 5000);
  };

  const onSubmit = (callback: (data: Record<string, unknown>) => void): void => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      if (validateForm()) {
        const data = getFormData();
        callback(data);
      } else {
        showError('Please check your inputs and try again.');
      }
    });
  };

  const onReset = (callback: () => void): void => {
    const resetButton = form.querySelector('[type="reset"], #reset-btn') as HTMLButtonElement;
    if (resetButton) {
      resetButton.addEventListener('click', (event) => {
        event.preventDefault();
        form.reset();

        // Clear validation errors
        form.querySelectorAll('.border-rose-500').forEach((element) => {
          element.classList.remove('border-rose-500');
        });

        const errorElement = document.getElementById('form-error');
        if (errorElement) {
          errorElement.classList.add('hidden');
        }

        callback();
      });
    }
  };

  return {
    onSubmit,
    onReset,
    showError,
    validateForm,
    getFormData,
  };
}
