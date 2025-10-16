import { describe, it, expect } from 'vitest';
import { parsers, validateForm, hasErrors, getFieldError } from './formUtils';

describe('formUtils', () => {
  describe('parsers', () => {
    describe('number', () => {
      it('parses valid number strings', () => {
        expect(parsers.number('123')).toBe(123);
        expect(parsers.number('456.78')).toBe(456.78);
        expect(parsers.number('-100')).toBe(-100);
      });

      it('returns 0 for empty strings', () => {
        expect(parsers.number('')).toBe(0);
      });

      it('returns NaN for invalid strings', () => {
        expect(parsers.number('abc')).toBeNaN();
        expect(parsers.number('12abc')).toBeNaN();
      });

      it('handles zero correctly', () => {
        expect(parsers.number('0')).toBe(0);
        expect(parsers.number('0.0')).toBe(0);
      });
    });

    describe('optionalNumber', () => {
      it('parses valid number strings', () => {
        expect(parsers.optionalNumber('123')).toBe(123);
        expect(parsers.optionalNumber('456.78')).toBe(456.78);
      });

      it('returns undefined for empty strings', () => {
        expect(parsers.optionalNumber('')).toBeUndefined();
      });

      it('returns NaN for invalid strings', () => {
        expect(parsers.optionalNumber('abc')).toBeNaN();
      });
    });

    describe('int', () => {
      it('parses integer strings', () => {
        expect(parsers.int('123')).toBe(123);
        expect(parsers.int('-456')).toBe(-456);
      });

      it('truncates decimal values', () => {
        expect(parsers.int('123.99')).toBe(123);
        expect(parsers.int('456.01')).toBe(456);
      });

      it('returns NaN for invalid strings', () => {
        expect(parsers.int('abc')).toBeNaN();
      });
    });

    describe('float', () => {
      it('parses float strings', () => {
        expect(parsers.float('123.456')).toBe(123.456);
        expect(parsers.float('-789.012')).toBe(-789.012);
      });

      it('parses integers as floats', () => {
        expect(parsers.float('100')).toBe(100);
      });

      it('returns NaN for invalid strings', () => {
        expect(parsers.float('abc')).toBeNaN();
      });
    });

    describe('boolean', () => {
      it('returns true for "true"', () => {
        expect(parsers.boolean('true')).toBe(true);
      });

      it('returns true for "1"', () => {
        expect(parsers.boolean('1')).toBe(true);
      });

      it('returns false for other strings', () => {
        expect(parsers.boolean('false')).toBe(false);
        expect(parsers.boolean('0')).toBe(false);
        expect(parsers.boolean('')).toBe(false);
        expect(parsers.boolean('anything')).toBe(false);
      });
    });

    describe('percentage', () => {
      it('converts percentage strings to decimals', () => {
        expect(parsers.percentage('5')).toBe(0.05);
        expect(parsers.percentage('10')).toBe(0.1);
        expect(parsers.percentage('100')).toBe(1);
      });

      it('handles decimal inputs', () => {
        expect(parsers.percentage('5.5')).toBe(0.055);
        expect(parsers.percentage('0.5')).toBe(0.005);
      });

      it('handles zero', () => {
        expect(parsers.percentage('0')).toBe(0);
      });

      it('handles negative percentages', () => {
        expect(parsers.percentage('-5')).toBe(-0.05);
      });

      it('returns 0 for empty strings', () => {
        expect(parsers.percentage('')).toBe(0);
      });

      it('returns NaN / 100 for invalid strings', () => {
        expect(parsers.percentage('abc')).toBeNaN();
      });
    });

    describe('date', () => {
      it('parses valid date strings', () => {
        const date = parsers.date('2025-10-11');
        expect(date).toBeInstanceOf(Date);
        expect(date.getFullYear()).toBe(2025);
      });

      it('parses ISO date strings', () => {
        const date = parsers.date('2025-10-11T12:00:00Z');
        expect(date).toBeInstanceOf(Date);
        expect(date.getFullYear()).toBe(2025);
      });

      it('returns Invalid Date for invalid strings', () => {
        const date = parsers.date('invalid');
        expect(date).toBeInstanceOf(Date);
        expect(date.toString()).toBe('Invalid Date');
      });
    });

    describe('trim', () => {
      it('removes leading and trailing whitespace', () => {
        expect(parsers.trim('  hello  ')).toBe('hello');
        expect(parsers.trim('\n\tworld\n')).toBe('world');
      });

      it('does not modify strings without whitespace', () => {
        expect(parsers.trim('hello')).toBe('hello');
      });

      it('handles empty strings', () => {
        expect(parsers.trim('')).toBe('');
      });

      it('preserves internal whitespace', () => {
        expect(parsers.trim('  hello world  ')).toBe('hello world');
      });
    });

    describe('json', () => {
      it('parses valid JSON strings', () => {
        expect(parsers.json('{"key":"value"}')).toEqual({ key: 'value' });
        expect(parsers.json('[1,2,3]')).toEqual([1, 2, 3]);
      });

      it('parses primitive JSON values', () => {
        expect(parsers.json('123')).toBe(123);
        expect(parsers.json('"hello"')).toBe('hello');
        expect(parsers.json('true')).toBe(true);
      });

      it('throws for invalid JSON', () => {
        expect(() => parsers.json('invalid')).toThrow();
        expect(() => parsers.json('{invalid}')).toThrow();
      });
    });
  });

  describe('validateForm', () => {
    it('returns empty object when all rules pass', () => {
      const values = { email: 'test@example.com', age: 25 };
      const rules = {
        email: (value: unknown) => (typeof value === 'string' && value.includes('@') ? null : 'Invalid email'),
        age: (value: unknown) => (typeof value === 'number' && value >= 18 ? null : 'Must be 18+'),
      };
      
      const errors = validateForm(values, rules);
      expect(errors).toEqual({});
    });

    it('returns errors when rules fail', () => {
      const values = { email: 'invalid', age: 15 };
      const rules = {
        email: (value: unknown) => (typeof value === 'string' && value.includes('@') ? null : 'Invalid email'),
        age: (value: unknown) => (typeof value === 'number' && value >= 18 ? null : 'Must be 18+'),
      };
      
      const errors = validateForm(values, rules);
      expect(errors).toEqual({
        email: 'Invalid email',
        age: 'Must be 18+',
      });
    });

    it('validates only specified fields', () => {
      const values = { email: 'test@example.com', age: 25, name: '' };
      const rules = {
        email: (value: unknown) => (typeof value === 'string' && value.includes('@') ? null : 'Invalid email'),
      };
      
      const errors = validateForm(values, rules);
      expect(errors).toEqual({});
    });

    it('handles missing values', () => {
      const values = { email: undefined as unknown as string };
      const rules = {
        email: (value: unknown) => (value ? null : 'Required'),
      };
      
      const errors = validateForm(values, rules);
      expect(errors).toEqual({ email: 'Required' });
    });
  });

  describe('hasErrors', () => {
    it('returns true when errors object has keys', () => {
      expect(hasErrors({ email: 'Invalid' })).toBe(true);
      expect(hasErrors({ email: 'Invalid', age: 'Too young' })).toBe(true);
    });

    it('returns false when errors object is empty', () => {
      expect(hasErrors({})).toBe(false);
    });
  });

  describe('getFieldError', () => {
    it('returns error message for field with error', () => {
      const errors = { email: 'Invalid email', age: 'Too young' };
      expect(getFieldError(errors, 'email')).toBe('Invalid email');
      expect(getFieldError(errors, 'age')).toBe('Too young');
    });

    it('returns undefined for field without error', () => {
      const errors = { email: 'Invalid email' };
      expect(getFieldError(errors, 'name' as 'email')).toBeUndefined();
    });

    it('returns undefined for empty errors object', () => {
      expect(getFieldError({}, 'email')).toBeUndefined();
    });
  });
});
