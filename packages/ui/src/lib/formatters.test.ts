import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatCurrencyOptional,
  formatPercentage,
  formatPercentageOptional,
  formatNumber,
  formatDate,
  truncate,
  formatFileSize,
} from './formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('formats positive numbers as US currency with no decimals', () => {
      expect(formatCurrency(50000)).toBe('$50,000');
      expect(formatCurrency(1234567)).toBe('$1,234,567');
      expect(formatCurrency(100)).toBe('$100');
    });

    it('formats negative numbers correctly', () => {
      expect(formatCurrency(-50000)).toBe('-$50,000');
      expect(formatCurrency(-1234.56)).toBe('-$1,235'); // Rounds to nearest dollar
    });

    it('formats zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0');
    });

    it('rounds to nearest dollar', () => {
      expect(formatCurrency(1234.49)).toBe('$1,234');
      expect(formatCurrency(1234.50)).toBe('$1,235');
      expect(formatCurrency(1234.99)).toBe('$1,235');
    });

    it('handles large numbers', () => {
      expect(formatCurrency(1000000000)).toBe('$1,000,000,000');
    });
  });

  describe('formatCurrencyOptional', () => {
    it('formats defined values as currency', () => {
      expect(formatCurrencyOptional(50000)).toBe('$50,000');
      expect(formatCurrencyOptional(0)).toBe('$0');
    });

    it('returns default fallback for undefined values', () => {
      expect(formatCurrencyOptional(undefined)).toBe('-');
    });

    it('returns custom fallback for undefined values', () => {
      expect(formatCurrencyOptional(undefined, 'N/A')).toBe('N/A');
      expect(formatCurrencyOptional(undefined, '')).toBe('');
    });
  });

  describe('formatPercentage', () => {
    it('formats decimal values as percentages', () => {
      expect(formatPercentage(0.05)).toBe('5.0%');
      expect(formatPercentage(0.1)).toBe('10.0%');
      expect(formatPercentage(0.125)).toBe('12.5%');
    });

    it('handles zero correctly', () => {
      expect(formatPercentage(0)).toBe('0.0%');
    });

    it('handles negative percentages', () => {
      expect(formatPercentage(-0.05)).toBe('-5.0%');
    });

    it('handles values greater than 1', () => {
      expect(formatPercentage(1.5)).toBe('150.0%');
    });

    it('formats with 1-2 decimal places', () => {
      expect(formatPercentage(0.12345)).toBe('12.35%');
      expect(formatPercentage(0.1)).toBe('10.0%');
    });
  });

  describe('formatPercentageOptional', () => {
    it('formats defined values as percentages', () => {
      expect(formatPercentageOptional(0.05)).toBe('5.0%');
      expect(formatPercentageOptional(0)).toBe('0.0%');
    });

    it('returns default fallback for undefined values', () => {
      expect(formatPercentageOptional(undefined)).toBe('-');
    });

    it('returns custom fallback for undefined values', () => {
      expect(formatPercentageOptional(undefined, 'N/A')).toBe('N/A');
    });
  });

  describe('formatNumber', () => {
    it('formats numbers with default zero decimals', () => {
      expect(formatNumber(1234567)).toBe('1,234,567');
      expect(formatNumber(100)).toBe('100');
    });

    it('formats numbers with specified decimals', () => {
      expect(formatNumber(1234.5678, 2)).toBe('1,234.57');
      expect(formatNumber(100, 3)).toBe('100.000');
      expect(formatNumber(1234.1, 1)).toBe('1,234.1');
    });

    it('handles zero correctly', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(0, 2)).toBe('0.00');
    });

    it('handles negative numbers', () => {
      expect(formatNumber(-1234567)).toBe('-1,234,567');
      expect(formatNumber(-1234.56, 2)).toBe('-1,234.56');
    });
  });

  describe('formatDate', () => {
    it('formats Date objects with default options', () => {
      const date = new Date('2025-10-11T12:00:00Z');
      const formatted = formatDate(date);
      // Check that it contains expected parts (format may vary by locale)
      expect(formatted).toContain('Oct');
      expect(formatted).toContain('2025');
    });

    it('formats date strings with default options', () => {
      const formatted = formatDate('2025-10-11');
      expect(formatted).toContain('Oct');
      expect(formatted).toContain('2025');
    });

    it('formats with custom options', () => {
      const date = new Date('2025-10-11T12:00:00Z');
      const formatted = formatDate(date, { year: 'numeric', month: 'long' });
      expect(formatted).toContain('October');
      expect(formatted).toContain('2025');
    });
  });

  describe('truncate', () => {
    it('truncates text longer than maxLength', () => {
      expect(truncate('This is a long text', 10)).toBe('This is a ...');
      expect(truncate('Hello World!', 5)).toBe('Hello...');
    });

    it('does not truncate text shorter than maxLength', () => {
      expect(truncate('Short', 10)).toBe('Short');
      expect(truncate('Hello', 5)).toBe('Hello');
    });

    it('handles exact length correctly', () => {
      expect(truncate('Hello', 5)).toBe('Hello');
    });

    it('handles empty strings', () => {
      expect(truncate('', 10)).toBe('');
    });

    it('handles zero maxLength', () => {
      expect(truncate('Hello', 0)).toBe('...');
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(100)).toBe('100 B');
      expect(formatFileSize(1023)).toBe('1023 B');
    });

    it('formats kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1.00 KB');
      expect(formatFileSize(1536)).toBe('1.50 KB');
      expect(formatFileSize(10240)).toBe('10.00 KB');
    });

    it('formats megabytes correctly', () => {
      expect(formatFileSize(1048576)).toBe('1.00 MB');
      expect(formatFileSize(1572864)).toBe('1.50 MB');
      expect(formatFileSize(10485760)).toBe('10.00 MB');
    });

    it('formats gigabytes correctly', () => {
      expect(formatFileSize(1073741824)).toBe('1.00 GB');
      expect(formatFileSize(2147483648)).toBe('2.00 GB');
    });

    it('formats terabytes correctly', () => {
      expect(formatFileSize(1099511627776)).toBe('1.00 TB');
    });

    it('stops at terabytes for very large values', () => {
      expect(formatFileSize(1125899906842624)).toBe('1024.00 TB');
    });
  });
});
