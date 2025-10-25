import { describe, it, expect } from 'vitest';
import {
  validateFile,
  validateNumberRange,
  validateRequired,
  validateEmail,
  clamp,
} from './validation';

describe('validation', () => {
  describe('validateFile', () => {
    it('returns null for valid files within size limit', () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      expect(validateFile(file)).toBeNull();
    });

    it('returns error for files exceeding default size limit (10MB)', () => {
      const largeContent = new Array(11 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'large.txt', { type: 'text/plain' });
      const error = validateFile(file);
      expect(error).toContain('File size must be less than');
      expect(error).toContain('10MB');
    });

    it('returns error for files exceeding custom size limit', () => {
      const content = new Array(2 * 1024 * 1024).fill('a').join('');
      const file = new File([content], 'test.txt', { type: 'text/plain' });
      const error = validateFile(file, { maxSizeBytes: 1024 * 1024 });
      expect(error).toContain('File size must be less than');
      expect(error).toContain('1MB');
    });

    it('returns null for allowed file types (Set)', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const allowedTypes = new Set(['application/pdf', 'image/png']);
      expect(validateFile(file, { allowedTypes })).toBeNull();
    });

    it('returns null for allowed file types (Array)', () => {
      const file = new File(['content'], 'test.png', { type: 'image/png' });
      const allowedTypes = ['application/pdf', 'image/png'];
      expect(validateFile(file, { allowedTypes })).toBeNull();
    });

    it('returns error for disallowed file types', () => {
      const file = new File(['content'], 'test.exe', { type: 'application/x-msdownload' });
      const allowedTypes = ['application/pdf', 'image/png'];
  expect(validateFile(file, { allowedTypes })).toBe('Invalid file type. Please upload a PDF, Word document, or text file.');
    });

    it('validates both size and type together', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const allowedTypes = ['application/pdf'];
      expect(validateFile(file, { maxSizeBytes: 1024 * 1024, allowedTypes })).toBeNull();
    });

    it('prioritizes size validation over type validation', () => {
      const largeContent = new Array(2 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'test.exe', { type: 'application/x-msdownload' });
      const allowedTypes = ['application/pdf'];
      const error = validateFile(file, { maxSizeBytes: 1024 * 1024, allowedTypes });
      expect(error).toContain('File size must be less than');
    });

    it('handles files with zero size', () => {
      const file = new File([], 'empty.txt', { type: 'text/plain' });
      expect(validateFile(file)).toBeNull();
    });

    it('handles files exactly at size limit', () => {
      const content = new Array(1024 * 1024).fill('a').join('');
      const file = new File([content], 'test.txt', { type: 'text/plain' });
      expect(validateFile(file, { maxSizeBytes: 1024 * 1024 })).toBeNull();
    });
  });

  describe('validateNumberRange', () => {
    it('returns null for valid numbers within range', () => {
      expect(validateNumberRange(5, 0, 10)).toBeNull();
      expect(validateNumberRange(0, 0, 10)).toBeNull();
      expect(validateNumberRange(10, 0, 10)).toBeNull();
    });

    it('returns error for numbers below minimum', () => {
      const error = validateNumberRange(-1, 0, 10);
      expect(error).toBe('Value must be at least 0');
    });

    it('returns error for numbers above maximum', () => {
      const error = validateNumberRange(11, 0, 10);
      expect(error).toBe('Value must be at most 10');
    });

    it('uses custom field name in error messages', () => {
      let error = validateNumberRange(-1, 0, 10, 'Age');
      expect(error).toBe('Age must be at least 0');

      error = validateNumberRange(11, 0, 10, 'Age');
      expect(error).toBe('Age must be at most 10');
    });

    it('returns error for NaN values', () => {
      const error = validateNumberRange(NaN, 0, 10);
      expect(error).toBe('Value must be a valid number');
    });

    it('returns error for NaN with custom field name', () => {
      const error = validateNumberRange(NaN, 0, 10, 'Price');
      expect(error).toBe('Price must be a valid number');
    });

    it('handles negative ranges', () => {
      expect(validateNumberRange(-5, -10, 0)).toBeNull();
      expect(validateNumberRange(-11, -10, 0)).toBe('Value must be at least -10');
      expect(validateNumberRange(1, -10, 0)).toBe('Value must be at most 0');
    });

    it('handles decimal values', () => {
      expect(validateNumberRange(5.5, 0, 10)).toBeNull();
      expect(validateNumberRange(0.1, 0, 10)).toBeNull();
      expect(validateNumberRange(10.1, 0, 10)).toBe('Value must be at most 10');
    });

    it('handles single value range (min === max)', () => {
      expect(validateNumberRange(5, 5, 5)).toBeNull();
      expect(validateNumberRange(4, 5, 5)).toBe('Value must be at least 5');
      expect(validateNumberRange(6, 5, 5)).toBe('Value must be at most 5');
    });
  });

  describe('validateRequired', () => {
    it('returns null for non-empty strings', () => {
      expect(validateRequired('hello', 'Name')).toBeNull();
      expect(validateRequired('a', 'Name')).toBeNull();
    });

    it('returns error for empty strings', () => {
      expect(validateRequired('', 'Name')).toBe('Name is required');
    });

    it('returns error for undefined values', () => {
      expect(validateRequired(undefined, 'Email')).toBe('Email is required');
    });

    it('returns error for whitespace-only strings', () => {
      expect(validateRequired('   ', 'Username')).toBe('Username is required');
      expect(validateRequired('\t\n', 'Password')).toBe('Password is required');
    });

    it('uses custom field name in error messages', () => {
      expect(validateRequired('', 'First Name')).toBe('First Name is required');
      expect(validateRequired(undefined, 'Last Name')).toBe('Last Name is required');
    });

    it('accepts strings with leading/trailing whitespace and content', () => {
      expect(validateRequired('  hello  ', 'Name')).toBeNull();
      expect(validateRequired('\nhello\n', 'Name')).toBeNull();
    });
  });

  describe('validateEmail', () => {
    it('returns true for valid email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.com')).toBe(true);
      expect(validateEmail('user+tag@example.co.uk')).toBe(true);
      expect(validateEmail('user_name@example-domain.com')).toBe(true);
    });

    it('returns false for emails without @ symbol', () => {
      expect(validateEmail('testexample.com')).toBe(false);
      expect(validateEmail('test')).toBe(false);
    });

    it('returns false for emails without domain', () => {
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });

    it('returns false for emails without TLD', () => {
      expect(validateEmail('test@example')).toBe(false);
    });

    it('returns false for emails with spaces', () => {
      expect(validateEmail('test @example.com')).toBe(false);
      expect(validateEmail('test@ example.com')).toBe(false);
      expect(validateEmail('test@example .com')).toBe(false);
    });

    it('returns false for empty strings', () => {
      expect(validateEmail('')).toBe(false);
    });

    it('returns false for multiple @ symbols', () => {
      expect(validateEmail('test@@example.com')).toBe(false);
      expect(validateEmail('test@example@com')).toBe(false);
    });

    it('handles email-like but invalid formats', () => {
      expect(validateEmail('test@.com')).toBe(false);
    });
  });

  describe('clamp', () => {
    it('returns value when within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });

    it('returns min when value is below range', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(-100, 0, 10)).toBe(0);
    });

    it('returns max when value is above range', () => {
      expect(clamp(15, 0, 10)).toBe(10);
      expect(clamp(100, 0, 10)).toBe(10);
    });

    it('handles negative ranges', () => {
      expect(clamp(-5, -10, 0)).toBe(-5);
      expect(clamp(-15, -10, 0)).toBe(-10);
      expect(clamp(5, -10, 0)).toBe(0);
    });

    it('handles decimal values', () => {
      expect(clamp(5.5, 0, 10)).toBe(5.5);
      expect(clamp(-0.5, 0, 10)).toBe(0);
      expect(clamp(10.5, 0, 10)).toBe(10);
    });

    it('handles single value range (min === max)', () => {
      expect(clamp(5, 5, 5)).toBe(5);
      expect(clamp(3, 5, 5)).toBe(5);
      expect(clamp(7, 5, 5)).toBe(5);
    });

    it('handles very large numbers', () => {
      expect(clamp(1000000, 0, 100)).toBe(100);
      expect(clamp(-1000000, 0, 100)).toBe(0);
    });

    it('handles zero as boundaries', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(5, -10, 0)).toBe(0);
      expect(clamp(0, -10, 10)).toBe(0);
    });

    it('handles inverted ranges (clamps to max when min > max)', () => {
      // Math.min(Math.max(value, min), max) when min > max
      expect(clamp(5, 10, 0)).toBe(0); // max(5, 10) = 10, min(10, 0) = 0
      expect(clamp(-5, 10, 0)).toBe(0); // max(-5, 10) = 10, min(10, 0) = 0
      expect(clamp(15, 10, 0)).toBe(0); // max(15, 10) = 15, min(15, 0) = 0
    });
  });
});
