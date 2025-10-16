/**
 * Form utilities and helpers for handling common form patterns.
 * @module formUtils
 */

import type { ChangeEvent, Dispatch, SetStateAction } from 'react';

type FormElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const identityParser = <T>(value: string) => value as unknown as T;

/**
 * Creates a type-safe onChange handler for form inputs.
 * Extracts value from event and calls callback with the parsed value.
 * 
 * @param callback - Function to call with the parsed value
 * @param parser - Optional parser function (defaults to identity)
 * @returns Event handler function
 * @example
 * <input onChange={createChangeHandler(setValue)} />
 * <input onChange={createChangeHandler(setValue, Number)} />
 */
export function createChangeHandler<T = string>(
  callback: (value: T) => void,
  parser: (value: string) => T = identityParser
): (event: ChangeEvent<FormElement>) => void {
  return (event) => {
    callback(parser(event.target.value));
  };
}

/**
 * Creates an onChange handler that updates a specific field in an object.
 * 
 * @param setter - State setter function
 * @param field - Field name to update
 * @param parser - Optional parser function
 * @returns Event handler function
 * @example
 * <input onChange={createFieldHandler(setFormData, 'name')} />
 * <input onChange={createFieldHandler(setFormData, 'age', Number)} />
 */
export function createFieldHandler<T extends Record<string, unknown>, K extends keyof T>(
  setter: Dispatch<SetStateAction<T>>,
  field: K,
  parser: (value: string) => T[K] = identityParser
): (event: ChangeEvent<FormElement>) => void {
  return (event) => {
    const parsedValue = parser(event.target.value);
    setter((prev) => {
      const currentValue = prev[field] as T[K];
      if (Object.is(currentValue, parsedValue)) {
        return prev;
      }
      return {
        ...prev,
        [field]: parsedValue,
      };
    });
  };
}

/**
 * Common parsers for form values.
 */
export const parsers = {
  /** Parse value as number */
  number: (value: string): number => Number(value),
  
  /** Parse value as number or undefined if empty */
  optionalNumber: (value: string): number | undefined => 
    value === '' ? undefined : Number(value),
  
  /** Parse value as integer */
  int: (value: string): number => parseInt(value, 10),
  
  /** Parse value as float */
  float: (value: string): number => parseFloat(value),
  
  /** Parse value as boolean (checkbox) */
  boolean: (value: string): boolean => value === 'true' || value === '1',
  
  /** Parse value as percentage (divide by 100) */
  percentage: (value: string): number => Number(value) / 100,
  
  /** Parse value as date */
  date: (value: string): Date => new Date(value),
  
  /** Trim whitespace */
  trim: (value: string): string => value.trim(),
  
  /** Parse JSON string */
  json: <T = unknown>(value: string): T => JSON.parse(value),
} as const;

/**
 * Creates a debounced onChange handler.
 * Useful for expensive operations like API calls or complex validations.
 * 
 * @param callback - Function to call with the value
 * @param delay - Delay in milliseconds
 * @param parser - Optional parser function
 * @returns Event handler function
 * @example
 * <input onChange={createDebouncedHandler(handleSearch, 500)} />
 */
export function createDebouncedHandler<T = string>(
  callback: (value: T) => void,
  delay: number,
  parser: (value: string) => T = identityParser
): (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return (event) => {
    const value = event.target.value;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      callback(parser(value));
    }, delay);
  };
}

/**
 * Creates a form reset handler.
 * 
 * @param setter - State setter function
 * @param initialValues - Initial form values
 * @returns Reset handler function
 * @example
 * const handleReset = createResetHandler(setFormData, initialFormData);
 */
export function createResetHandler<T>(
  setter: Dispatch<SetStateAction<T>>,
  initialValues: T
): () => void {
  return () => setter(initialValues);
}

/**
 * Validates form fields and returns errors.
 * 
 * @param values - Form values to validate
 * @param rules - Validation rules object
 * @returns Object with field errors
 * @example
 * const errors = validateForm(formData, {
 *   email: (value) => !value ? 'Required' : !value.includes('@') ? 'Invalid email' : null,
 *   age: (value) => value < 18 ? 'Must be 18+' : null,
 * });
 */
export function validateForm<T extends Record<string, unknown>>(
  values: T,
  rules: Partial<Record<keyof T, (value: T[keyof T]) => string | null>>
): Partial<Record<keyof T, string>> {
  const errors: Partial<Record<keyof T, string>> = {};

  for (const [field, validator] of Object.entries(rules) as Array<
    [keyof T, (value: T[keyof T]) => string | null]
  >) {
    const error = validator(values[field]);
    if (error) {
      errors[field] = error;
    }
  }

  return errors;
}

/**
 * Checks if form has any errors.
 * 
 * @param errors - Errors object from validateForm
 * @returns true if there are any errors
 */
export function hasErrors<T extends Record<string, unknown>>(
  errors: Partial<Record<keyof T, string>>
): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Gets error message for a field.
 * 
 * @param errors - Errors object
 * @param field - Field name
 * @returns Error message or undefined
 */
export function getFieldError<T extends Record<string, unknown>>(
  errors: Partial<Record<keyof T, string>>,
  field: keyof T
): string | undefined {
  return errors[field];
}
