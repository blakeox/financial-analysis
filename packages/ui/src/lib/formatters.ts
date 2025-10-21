/**
 * Shared formatting utilities for consistent display across all UI components.
 * @module formatters
 */

/**
 * Format a number as US currency with no decimal places.
 * @param value - The numeric value to format
 * @returns Formatted currency string (e.g., "$50,000")
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a number as US currency or return fallback if undefined.
 * @param value - The numeric value to format (or undefined)
 * @param fallback - Fallback string to return if value is undefined
 * @returns Formatted currency string or fallback
 */
export function formatCurrencyOptional(
  value: number | undefined,
  fallback: string = '-'
): string {
  return value !== undefined ? formatCurrency(value) : fallback;
}

/**
 * Format a decimal as a percentage with 1-2 decimal places.
 * @param value - The decimal value to format (e.g., 0.05 for 5%)
 * @returns Formatted percentage string (e.g., "5.0%")
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a decimal as a percentage or return fallback if undefined.
 * @param value - The decimal value to format (or undefined)
 * @param fallback - Fallback string to return if value is undefined
 * @returns Formatted percentage string or fallback
 */
export function formatPercentageOptional(
  value: number | undefined,
  fallback: string = '-'
): string {
  return value !== undefined ? formatPercentage(value) : fallback;
}

/**
 * Format a number with commas for thousands separators.
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string (e.g., "1,234,567")
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a date as a localized string.
 * @param date - Date string or Date object
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Truncate text to a maximum length with ellipsis.
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

/**
 * Format file size in human-readable format.
 * @param bytes - File size in bytes
 * @returns Formatted size string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}
