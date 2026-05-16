/**
 * Field Highlighting System for AI-Modified Fields
 *
 * Provides visual feedback when fields are modified by AI, including:
 * - Animation effects
 * - AI badge indicators
 * - Validation with error recovery
 */

export interface HighlightOptions {
  showBadge?: boolean;
  badgeText?: string;
  duration?: number;
  retryOnError?: boolean;
  maxRetries?: number;
}

type HighlightValue = string | number | boolean;
type HighlightableField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export type HighlightFieldChangeFn = (
  fieldName: string,
  newValue: HighlightValue,
  isAIModified?: boolean,
  options?: HighlightOptions
) => boolean;

declare global {
  interface Window {
    highlightFieldChange: HighlightFieldChangeFn;
  }
}

const isHighlightableField = (element: Element | null): element is HighlightableField => {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  );
};

const findFieldElement = (fieldName: string): HighlightableField | null => {
  const selectors = [
    document.querySelector(`[name="${fieldName}"]`),
    document.getElementById(fieldName),
    document.querySelector(`[data-field-id="${fieldName}"]`),
  ];

  for (const candidate of selectors) {
    if (isHighlightableField(candidate)) {
      return candidate;
    }
  }

  return null;
};

const getFieldValue = (field: HighlightableField): HighlightValue => {
  if (field instanceof HTMLInputElement) {
    if (field.type === 'checkbox' || field.type === 'radio') {
      return field.checked;
    }
    return field.value;
  }
  return field.value;
};

const setFieldValue = (field: HighlightableField, value: HighlightValue): void => {
  if (field instanceof HTMLInputElement) {
    if (field.type === 'checkbox' || field.type === 'radio') {
      field.checked = Boolean(value);
      return;
    }
    field.value = typeof value === 'string' ? value : String(value ?? '');
    return;
  }

  field.value = typeof value === 'string' ? value : String(value ?? '');
};

/**
 * Highlight a field change, typically from AI modification
 */
export function highlightFieldChange(
  fieldName: string,
  newValue: HighlightValue,
  _isAIModified: boolean = true,
  options: HighlightOptions = {}
): boolean {
  const {
    showBadge = true,
    badgeText = 'AI',
    duration = 2000,
    retryOnError = true,
    maxRetries = 3,
  } = options;

  const field = findFieldElement(fieldName);

  if (!field) {
    console.warn(`Field not found: ${fieldName}`);
    return false;
  }

  // Store original value for potential rollback
  const originalValue = getFieldValue(field);

  // Normalize the value based on field type and constraints
  let normalizedValue: HighlightValue = newValue;

  // Handle percentage fields (convert decimal to percentage)
  if (
    (fieldName.toLowerCase().includes('rate') || fieldName.toLowerCase().includes('percent')) &&
    typeof newValue === 'number' &&
    newValue < 1
  ) {
    normalizedValue = newValue * 100; // Convert decimal to percentage
    console.log(`Converted decimal ${newValue} to percentage ${normalizedValue}`);
  }

  // Handle step constraints
  if (
    field instanceof HTMLInputElement &&
    field.step &&
    field.step !== 'any' &&
    typeof normalizedValue === 'number'
  ) {
    const step = parseFloat(field.step);
    if (step > 0) {
      normalizedValue = Math.round(normalizedValue / step) * step;
      normalizedValue = parseFloat(
        normalizedValue.toFixed(step.toString().split('.')[1]?.length || 0)
      );
    }
  }

  // Validate min/max constraints
  if (field instanceof HTMLInputElement && typeof normalizedValue === 'number') {
    if (field.min && normalizedValue < parseFloat(field.min)) {
      normalizedValue = parseFloat(field.min);
    }
    if (field.max && normalizedValue > parseFloat(field.max)) {
      normalizedValue = parseFloat(field.max);
    }
  }

  // Set the new value
  setFieldValue(field, normalizedValue);

  // Validate the field after setting the value
  let isValid = field.checkValidity();

  if (!isValid && retryOnError) {
    console.warn(`Validation failed for field ${fieldName}, attempting error recovery`);

    let attempts = 0;
    let fixedValue: HighlightValue = normalizedValue;

    while (!isValid && attempts < maxRetries) {
      attempts += 1;

      // Handle step validation errors first, as these are the most common.
      if (
        field instanceof HTMLInputElement &&
        field.step &&
        field.step !== 'any' &&
        typeof fixedValue === 'number'
      ) {
        const step = parseFloat(field.step);
        const remainder = fixedValue % step;
        if (remainder !== 0) {
          fixedValue = Math.round(fixedValue / step) * step;
          fixedValue = parseFloat(fixedValue.toFixed(step.toString().split('.')[1]?.length || 0));
        }
      }

      setFieldValue(field, fixedValue);
      isValid = field.checkValidity();

      if (isValid) {
        normalizedValue = fixedValue;
        console.log(
          `Successfully fixed validation error for ${fieldName} after ${attempts} attempt(s): ${originalValue} → ${normalizedValue}`
        );
      }
    }

    if (!isValid) {
      console.error(
        `Could not fix validation error for ${fieldName} after ${maxRetries} retry attempts, rolling back.`
      );
      if (typeof originalValue !== 'undefined') {
        setFieldValue(field, originalValue);
      }
      return false;
    }
  }

  // Add highlighting classes
  field.classList.add('field-highlight');
  field.classList.add('ai-modified-field');

  // Create AI indicator badge with error state if validation failed
  const container = (field.closest('.field-container') as HTMLElement | null) || field.parentElement;
  if (container && showBadge && !container.querySelector('.ai-indicator')) {
    const badge = document.createElement('div');
    badge.className = isValid ? 'ai-indicator' : 'ai-indicator ai-indicator-warning';
    badge.textContent = isValid ? badgeText : 'AI ⚠️';
    badge.title = isValid
      ? 'This field was modified by AI'
      : 'This field was modified by AI (validation warning)';

    container.style.position = 'relative';
    container.appendChild(badge);

    // Remove badge after animation
    setTimeout(() => {
      if (badge.parentElement) {
        badge.parentElement.removeChild(badge);
      }
    }, duration);
  }

  // Remove highlight class after animation
  setTimeout(() => {
    field.classList.remove('field-highlight');
  }, duration);

  // Dispatch change event to trigger any form validation
  field.dispatchEvent(new Event('change', { bubbles: true }));
  field.dispatchEvent(new Event('input', { bubbles: true }));

  // Log the change for debugging
  console.log(
    `Field ${fieldName} updated by AI to: ${normalizedValue}${!isValid ? ' (with validation warning)' : ''}`
  );

  return isValid;
}

// Expose to window
if (typeof window !== 'undefined') {
  window.highlightFieldChange = highlightFieldChange;
}
