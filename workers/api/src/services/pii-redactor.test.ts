import { describe, it, expect } from 'vitest';
import { PIIRedactor } from './pii-redactor';

describe('PIIRedactor', () => {
  it('should redact SSNs', () => {
    const input = 'My SSN is 123-45-6789.';
    const expected = 'My SSN is [REDACTED_SSN].';
    expect(PIIRedactor.redact(input)).toBe(expected);
  });

  it('should redact email addresses', () => {
    const input = 'Contact me at test.user@example.com.';
    const expected = 'Contact me at [REDACTED_EMAIL].';
    expect(PIIRedactor.redact(input)).toBe(expected);
  });

  it('should redact phone numbers', () => {
    const input = 'Call me at 555-123-4567.';
    const expected = 'Call me at [REDACTED_PHONE].';
    expect(PIIRedactor.redact(input)).toBe(expected);
  });

  it('should redact credit card numbers', () => {
    const input = 'My card is 4111-1111-1111-1111.';
    const expected = 'My card is [REDACTED_CC].';
    expect(PIIRedactor.redact(input)).toBe(expected);
  });

  it('should handle multiple PII types in one string', () => {
    const input = 'My SSN is 123-45-6789 and email is test@example.com.';
    const expected = 'My SSN is [REDACTED_SSN] and email is [REDACTED_EMAIL].';
    expect(PIIRedactor.redact(input)).toBe(expected);
  });

  it('should not redact non-PII text', () => {
    const input = 'Hello world! This is a safe string.';
    expect(PIIRedactor.redact(input)).toBe(input);
  });
});
