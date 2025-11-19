/**
 * AI Field Highlighting Utility
 *
 * This utility provides functions for highlighting form fields when they are
 * modified by AI/LLM systems. It creates smooth animations and visual indicators
 * to show users which fields have been changed.
 */

export interface FieldUpdateEvent {
  fieldName: string;
  value: string | number | boolean;
  isAIModified?: boolean;
  reason?: string;
}

export interface HighlightOptions {
  duration?: number;
  showBadge?: boolean;
  badgeText?: string;
  animationType?: 'pulse' | 'glow' | 'scale';
  retryOnError?: boolean;
  maxRetries?: number;
}

type HighlightValue = string | number | boolean;
type HighlightableField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

class AIFieldHighlighter {
  private static instance: AIFieldHighlighter;
  private originalValues: Map<string, HighlightValue> = new Map();
  private isInitialized = false;

  static getInstance(): AIFieldHighlighter {
    if (!AIFieldHighlighter.instance) {
      AIFieldHighlighter.instance = new AIFieldHighlighter();
    }
    return AIFieldHighlighter.instance;
  }

  /**
   * Initialize the field highlighter system
   */
  init(): void {
    if (this.isInitialized) return;

    // Store original form values
    this.storeOriginalValues();

    // Set up event listeners
    this.setupEventListeners();

    // Set up mutation observer for external changes
    this.setupMutationObserver();

    this.isInitialized = true;
    console.log('AI Field Highlighter initialized');
  }

  /**
   * Highlight a field change with animation and validation
   */
  highlightFieldChange(fieldName: string, newValue: HighlightValue, options: HighlightOptions = {}): boolean {
    const {
      duration = 2000,
      showBadge = true,
      badgeText = 'AI',
      animationType = 'pulse',
      retryOnError = true,
      maxRetries = 3,
    } = options;

    const field = this.findField(fieldName);
    if (!field) {
      console.warn(`Field not found: ${fieldName}`);
      return false;
    }

    // Store original value for potential rollback
    const originalValue = this.getFieldValue(field);

    // Normalize the value based on field type and constraints
    let normalizedValue: HighlightValue = newValue;

    // Handle percentage fields (convert decimal to percentage)
    if (fieldName.toLowerCase().includes('rate') || fieldName.toLowerCase().includes('percent')) {
      if (typeof newValue === 'number' && newValue < 1) {
        normalizedValue = newValue * 100; // Convert decimal to percentage
        console.log(`Converted decimal ${newValue} to percentage ${normalizedValue}`);
      }
    }

    // Handle step constraints
    if (field instanceof HTMLInputElement && field.step && field.step !== 'any' && typeof normalizedValue === 'number') {
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
    this.setFieldValue(field, normalizedValue);

    // Validate the field after setting the value
    let isValid = field.checkValidity();

    if (!isValid && retryOnError) {
      console.warn(`Validation failed for field ${fieldName}, attempting error recovery`);

      let attempts = 0;
      let fixedValue: HighlightValue = normalizedValue;

      while (!isValid && attempts < maxRetries) {
        attempts += 1;

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
            fixedValue = parseFloat(
              fixedValue.toFixed(step.toString().split('.')[1]?.length || 0)
            );
          }
        }

        this.setFieldValue(field, fixedValue);
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
          `Could not fix validation error for ${fieldName} after ${maxRetries} retry attempts, rolling back to original value`
        );
        this.setFieldValue(field, originalValue);
        return false;
      }
    }

    // Apply highlighting
    this.applyHighlight(field, duration, showBadge, badgeText, animationType, isValid);

    // Dispatch events
    this.dispatchFieldEvents(field);

    console.log(
      `Field ${fieldName} highlighted with new value: ${normalizedValue}${
        !isValid ? ' (with validation warning)' : ''
      }`
    );
    return isValid;
  }

  /**
   * Update multiple fields at once
   */
  updateMultipleFields(updates: FieldUpdateEvent[]): void {
    updates.forEach((update) => {
      this.highlightFieldChange(update.fieldName, update.value, {
        showBadge: update.isAIModified !== false,
        badgeText: update.reason ? `AI: ${update.reason}` : 'AI',
      });
    });
  }

  /**
   * Reset a field to its original value
   */
  resetField(fieldName: string): boolean {
    const field = this.findField(fieldName);
    if (!field) return false;

    const originalValue = this.originalValues.get(fieldName);
    if (originalValue !== undefined) {
      this.setFieldValue(field, originalValue);
      field.classList.remove('ai-modified-field');
      return true;
    }
    return false;
  }

  /**
   * Reset all fields to their original values
   */
  resetAllFields(): void {
    this.originalValues.forEach((value, fieldName) => {
      this.resetField(fieldName);
    });
  }

  /**
   * Get all AI-modified fields
   */
  getAIModifiedFields(): string[] {
    const modifiedFields: string[] = [];
    const form = document.getElementById('calculator-form');

    if (form) {
      const inputs = form.querySelectorAll('input, select, textarea');
      inputs.forEach((input) => {
        if (input.classList.contains('ai-modified-field')) {
          modifiedFields.push(input.name || input.id);
        }
      });
    }

    return modifiedFields;
  }

  private findField(fieldName: string): HighlightableField | null {
    const selectors: (Element | null)[] = [
      document.querySelector(`[name="${fieldName}"]`),
      document.querySelector(`#${fieldName}`),
      document.querySelector(`[data-field-id="${fieldName}"]`),
    ];

    for (const candidate of selectors) {
      if (
        candidate instanceof HTMLInputElement ||
        candidate instanceof HTMLSelectElement ||
        candidate instanceof HTMLTextAreaElement
      ) {
        return candidate;
      }
    }

    return null;
  }

  private getFieldValue(field: HighlightableField): HighlightValue {
    if (field instanceof HTMLInputElement) {
      if (field.type === 'checkbox' || field.type === 'radio') {
        return field.checked;
      }
      return field.value;
    }
    return field.value;
  }

  private setFieldValue(field: HighlightableField, value: HighlightValue): void {
    if (field instanceof HTMLInputElement) {
      if (field.type === 'checkbox' || field.type === 'radio') {
        field.checked = Boolean(value);
      } else {
        field.value = typeof value === 'string' ? value : String(value ?? '');
      }
      return;
    }

    field.value = typeof value === 'string' ? value : String(value ?? '');
  }

  private applyHighlight(
    field: HighlightableField,
    duration: number,
    showBadge: boolean,
    badgeText: string,
    animationType: string,
    isValid: boolean = true
  ): void {
    // Add highlight classes
    field.classList.add('field-highlight', 'ai-modified-field');

    // Create AI indicator badge
    if (showBadge) {
      this.createAIBadge(field, badgeText, duration, isValid);
    }

    // Remove highlight class after animation
    setTimeout(() => {
      field.classList.remove('field-highlight');
    }, duration);
  }

  private createAIBadge(
    field: HighlightableField,
    badgeText: string,
    duration: number,
    isValid: boolean = true
  ): void {
    const container = field.closest('.field-container') || field.parentElement;
    if (!container || container.querySelector('.ai-indicator')) return;

    const badge = document.createElement('div');
    badge.className = 'ai-indicator';
    badge.textContent = isValid ? badgeText : 'AI ⚠️';
    badge.title = isValid
      ? 'This field was modified by AI'
      : 'This field was modified by AI (validation warning)';

    if (!isValid) {
      badge.style.background = 'linear-gradient(135deg, #f59e0b, #ef4444)';
    }

    if (container instanceof HTMLElement) {
      container.style.position = 'relative';
      container.appendChild(badge);

      // Remove badge after animation
      setTimeout(() => {
        if (badge.parentElement) {
          badge.parentElement.removeChild(badge);
        }
      }, duration);
    }
  }

  private dispatchFieldEvents(field: HighlightableField): void {
    field.dispatchEvent(new Event('change', { bubbles: true }));
    field.dispatchEvent(new Event('input', { bubbles: true }));
  }

  private storeOriginalValues(): void {
    const form = document.getElementById('calculator-form');
    if (!form) return;

    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach((input) => {
      if (input instanceof HTMLInputElement) {
        if (input.type === 'checkbox' || input.type === 'radio') {
          this.originalValues.set(input.name, input.checked);
        } else {
          this.originalValues.set(input.name, input.value);
        }
      } else if (input instanceof HTMLSelectElement || input instanceof HTMLTextAreaElement) {
        this.originalValues.set(input.name, input.value);
      }
    });
  }

  private setupEventListeners(): void {
    // Listen for AI field updates from external sources
    window.addEventListener('ai-field-update', (event: CustomEvent<FieldUpdateEvent>) => {
      const { fieldName, value, isAIModified = true } = event.detail;
      this.highlightFieldChange(fieldName, value, { showBadge: isAIModified });
    });

    // Listen for bulk field updates
    window.addEventListener('ai-bulk-field-update', (event: CustomEvent<FieldUpdateEvent[]>) => {
      this.updateMultipleFields(event.detail);
    });
  }

  private setupMutationObserver(): void {
    const form = document.getElementById('calculator-form');
    if (!form) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          (mutation.attributeName === 'value' || mutation.attributeName === 'checked')
        ) {
          const target = mutation.target;
          if (
            target instanceof HTMLInputElement ||
            target instanceof HTMLSelectElement ||
            target instanceof HTMLTextAreaElement
          ) {
            const currentValue =
              target instanceof HTMLInputElement &&
              (target.type === 'checkbox' || target.type === 'radio')
                ? target.checked
                : target.value;
            const originalValue = this.originalValues.get(target.name);

            if (originalValue !== currentValue && !target.classList.contains('field-highlight')) {
              // This appears to be an external change, highlight it
              target.classList.add('field-highlight', 'ai-modified-field');
              setTimeout(() => {
                target.classList.remove('field-highlight');
              }, 2000);
            }
          }
        }
      });
    });

    observer.observe(form, {
      attributes: true,
      attributeFilter: ['value', 'checked'],
      subtree: true,
    });
  }
}

// Global functions for easy access
export const highlightFieldChange = (
  fieldName: string,
  value: HighlightValue,
  options?: HighlightOptions
): boolean => {
  return AIFieldHighlighter.getInstance().highlightFieldChange(fieldName, value, options);
};

export const updateMultipleFields = (updates: FieldUpdateEvent[]): void => {
  AIFieldHighlighter.getInstance().updateMultipleFields(updates);
};

export const resetField = (fieldName: string): boolean => {
  return AIFieldHighlighter.getInstance().resetField(fieldName);
};

export const resetAllFields = (): void => {
  AIFieldHighlighter.getInstance().resetAllFields();
};

export const getAIModifiedFields = (): string[] => {
  return AIFieldHighlighter.getInstance().getAIModifiedFields();
};

export const initAIFieldHighlighter = (): void => {
  AIFieldHighlighter.getInstance().init();
};

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAIFieldHighlighter);
  } else {
    initAIFieldHighlighter();
  }
}

// Export the class for advanced usage
export { AIFieldHighlighter };
