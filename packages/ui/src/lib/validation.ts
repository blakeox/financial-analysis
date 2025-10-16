/**
 * Shared validation utilities for form inputs and file uploads.
 * @module validation
 */

/**
 * Validate that a file meets size and type requirements.
 * @param file - The file to validate
 * @param options - Validation options
 * @returns Error message if invalid, null if valid
 */
export function validateFile(
  file: File,
  options: {
    maxSizeBytes?: number;
    allowedTypes?: Set<string> | string[];
  } = {}
): string | null {
  const { maxSizeBytes = 10 * 1024 * 1024, allowedTypes } = options;

  if (file.size > maxSizeBytes) {
    const maxMB = Math.floor(maxSizeBytes / 1024 / 1024);
    return `File size must be less than ${maxMB}MB`;
  }

  if (allowedTypes) {
    const typesSet = allowedTypes instanceof Set ? allowedTypes : new Set(allowedTypes);
    if (!typesSet.has(file.type)) {
      return 'File type not supported';
    }
  }

  return null;
}

/**
 * Validate that a number is within a specified range.
 * @param value - The number to validate
 * @param min - Minimum allowed value (inclusive)
 * @param max - Maximum allowed value (inclusive)
 * @param fieldName - Name of the field for error messages
 * @returns Error message if invalid, null if valid
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName: string = 'Value'
): string | null {
  if (isNaN(value)) {
    return `${fieldName} must be a valid number`;
  }
  if (value < min) {
    return `${fieldName} must be at least ${min}`;
  }
  if (value > max) {
    return `${fieldName} must be at most ${max}`;
  }
  return null;
}

/**
 * Validate that a string is not empty.
 * @param value - The string to validate
 * @param fieldName - Name of the field for error messages
 * @returns Error message if invalid, null if valid
 */
export function validateRequired(value: string | undefined, fieldName: string): string | null {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
}

/**
 * Validate an email address format.
 * @param email - The email to validate
 * @returns True if valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Clamp a number to a specified range.
 * @param value - The number to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
