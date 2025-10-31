/**
 * Field Highlighting System for AI-Modified Fields
 * 
 * Provides visual feedback when fields are modified by AI, including:
 * - Animation effects
 * - AI badge indicators
 * - Validation with error recovery
 */

interface HighlightOptions {
  showBadge?: boolean;
  badgeText?: string;
  duration?: number;
  retryOnError?: boolean;
  maxRetries?: number;
}

/**
 * Highlight a field change, typically from AI modification
 */
export function highlightFieldChange(
  fieldName: string,
  newValue: any,
  isAIModified: boolean = true,
  options: HighlightOptions = {}
): boolean {
  const {
    showBadge = true,
    badgeText = 'AI',
    duration = 2000,
    retryOnError = true,
    maxRetries = 3
  } = options;

  const field = document.querySelector(`[name="${fieldName}"]`) ||
    document.querySelector(`#${fieldName}`) ||
    document.querySelector(`[data-field-id="${fieldName}"]`);

  if (!field) {
    console.warn(`Field not found: ${fieldName}`);
    return false;
  }

  // Store original value for potential rollback
  const originalValue = (field as HTMLInputElement).value || (field as HTMLInputElement).checked;

  // Normalize the value based on field type and constraints
  let normalizedValue = newValue;

  // Handle percentage fields (convert decimal to percentage)
  if (fieldName.toLowerCase().includes('rate') || fieldName.toLowerCase().includes('percent')) {
    if (typeof newValue === 'number' && newValue < 1) {
      normalizedValue = newValue * 100; // Convert decimal to percentage
      console.log(`Converted decimal ${newValue} to percentage ${normalizedValue}`);
    }
  }

  // Handle step constraints
  if ((field as HTMLInputElement).step && (field as HTMLInputElement).step !== 'any') {
    const step = parseFloat((field as HTMLInputElement).step);
    if (step > 0) {
      normalizedValue = Math.round(normalizedValue / step) * step;
      normalizedValue = parseFloat(normalizedValue.toFixed(step.toString().split('.')[1]?.length || 0));
    }
  }

  // Validate min/max constraints
  if ((field as HTMLInputElement).min && normalizedValue < parseFloat((field as HTMLInputElement).min)) {
    normalizedValue = parseFloat((field as HTMLInputElement).min);
  }
  if ((field as HTMLInputElement).max && normalizedValue > parseFloat((field as HTMLInputElement).max)) {
    normalizedValue = parseFloat((field as HTMLInputElement).max);
  }

  // Set the new value
  if ((field as HTMLInputElement).type === 'checkbox' || (field as HTMLInputElement).type === 'radio') {
    (field as HTMLInputElement).checked = Boolean(normalizedValue);
  } else {
    (field as HTMLInputElement).value = normalizedValue;
  }

  // Validate the field after setting the value
  const isValid = (field as HTMLInputElement).checkValidity();

  if (!isValid && retryOnError) {
    console.warn(`Validation failed for field ${fieldName}, attempting error recovery`);

    // Try to fix common validation issues
    let fixedValue = normalizedValue;

    // Handle step validation errors
    if ((field as HTMLInputElement).step && (field as HTMLInputElement).step !== 'any') {
      const step = parseFloat((field as HTMLInputElement).step);
      const remainder = fixedValue % step;
      if (remainder !== 0) {
        fixedValue = Math.round(fixedValue / step) * step;
        fixedValue = parseFloat(fixedValue.toFixed(step.toString().split('.')[1]?.length || 0));
      }
    }

    // Try the fixed value
    (field as HTMLInputElement).value = fixedValue;
    const isFixedValid = (field as HTMLInputElement).checkValidity();

    if (isFixedValid) {
      console.log(`Successfully fixed validation error for ${fieldName}: ${normalizedValue} → ${fixedValue}`);
      normalizedValue = fixedValue;
    } else {
      // Rollback to original value if we can't fix it
      console.error(`Could not fix validation error for ${fieldName}, rolling back to original value`);
      (field as HTMLInputElement).value = originalValue as any;
      return false;
    }
  }

  // Add highlighting classes
  field.classList.add('field-highlight');
  field.classList.add('ai-modified-field');

  // Create AI indicator badge with error state if validation failed
  const container = field.closest('.field-container') || field.parentElement;
  if (container && showBadge && !container.querySelector('.ai-indicator')) {
    const badge = document.createElement('div');
    badge.className = 'ai-indicator';
    badge.textContent = isValid ? badgeText : 'AI ⚠️';
    badge.title = isValid ? 'This field was modified by AI' : 'This field was modified by AI (validation warning)';

    if (!isValid) {
      badge.style.background = 'linear-gradient(135deg, #f59e0b, #ef4444)';
    }

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
  console.log(`Field ${fieldName} updated by AI to: ${normalizedValue}${!isValid ? ' (with validation warning)' : ''}`);

  return isValid;
}

// Expose to window
if (typeof window !== 'undefined') {
  (window as any).highlightFieldChange = highlightFieldChange;
}




