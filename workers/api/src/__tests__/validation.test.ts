import { describe, it, expect } from 'vitest';
import {
  validateChatMessage,
  validateRequestSize,
  detectThreats,
  MAX_MESSAGE_LENGTH,
  MAX_REQUEST_BODY_SIZE,
} from '../lib/validation';

describe('validateChatMessage', () => {
  it('should accept valid messages', () => {
    const result = validateChatMessage('Hello, this is a valid message!');
    expect(result.valid).toBe(true);
    expect(result.sanitizedValue).toBe('Hello, this is a valid message!');
    expect(result.error).toBeUndefined();
  });

  it('should reject null messages', () => {
    const result = validateChatMessage(null);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Message is required and must be a string');
    expect(result.code).toBe('MESSAGE_REQUIRED');
  });

  it('should reject undefined messages', () => {
    const result = validateChatMessage(undefined);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Message is required and must be a string');
    expect(result.code).toBe('MESSAGE_REQUIRED');
  });

  it('should reject empty messages', () => {
    const result = validateChatMessage('   ');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Message cannot be empty');
    expect(result.code).toBe('MESSAGE_EMPTY');
  });

  it('should reject messages exceeding max length', () => {
    const longMessage = 'a'.repeat(MAX_MESSAGE_LENGTH + 1);
    const result = validateChatMessage(longMessage);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds maximum length');
    expect(result.code).toBe('MESSAGE_TOO_LONG');
  });

  it('should accept messages at max length', () => {
    const maxMessage = 'a'.repeat(MAX_MESSAGE_LENGTH);
    const result = validateChatMessage(maxMessage);
    expect(result.valid).toBe(true);
    expect(result.sanitizedValue).toBe(maxMessage);
  });

  it('should sanitize script tags', () => {
    const malicious = '<script>alert("XSS")</script>Hello';
    const result = validateChatMessage(malicious);
    expect(result.valid).toBe(true);
    expect(result.sanitizedValue).not.toContain('<script');
    expect(result.sanitizedValue).toContain('Hello');
  });

  it('should sanitize iframe tags', () => {
    const malicious = '<iframe src="evil.com"></iframe>Safe text';
    const result = validateChatMessage(malicious);
    expect(result.valid).toBe(true);
    expect(result.sanitizedValue).not.toContain('<iframe');
    expect(result.sanitizedValue).toContain('Safe text');
  });

  it('should sanitize javascript: protocol', () => {
    const malicious = 'Click <a href="javascript:alert(1)">here</a>';
    const result = validateChatMessage(malicious);
    expect(result.valid).toBe(true);
    expect(result.sanitizedValue).not.toContain('javascript:');
  });

  it('should sanitize event handlers', () => {
    const malicious = '<div onmouseover="alert(1)">Click me</div>';
    const result = validateChatMessage(malicious);
    expect(result.valid).toBe(true);
    expect(result.sanitizedValue).not.toContain('onmouseover=');
  });

  it('should remove control characters', () => {
    const withControlChars = 'Hello\x00\x01World';
    const result = validateChatMessage(withControlChars);
    expect(result.valid).toBe(true);
    expect(result.sanitizedValue).toBe('HelloWorld');
  });

  it('should preserve newlines and tabs', () => {
    const withWhitespace = 'Line 1\nLine 2\tTabbed';
    const result = validateChatMessage(withWhitespace);
    expect(result.valid).toBe(true);
    expect(result.sanitizedValue).toContain('\n');
    expect(result.sanitizedValue).toContain('\t');
  });
});

describe('validateRequestSize', () => {
  it('should accept valid request sizes', () => {
    const result = validateRequestSize('1000');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should accept null Content-Length', () => {
    const result = validateRequestSize(null);
    expect(result.valid).toBe(true);
  });

  it('should reject oversized requests', () => {
    const size = String(MAX_REQUEST_BODY_SIZE + 1);
    const result = validateRequestSize(size);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds maximum size');
    expect(result.code).toBe('REQUEST_TOO_LARGE');
  });

  it('should accept max size requests', () => {
    const size = String(MAX_REQUEST_BODY_SIZE);
    const result = validateRequestSize(size);
    expect(result.valid).toBe(true);
  });

  it('should reject invalid Content-Length', () => {
    const result = validateRequestSize('invalid');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid Content-Length header');
    expect(result.code).toBe('INVALID_CONTENT_LENGTH');
  });

  it('should reject negative Content-Length', () => {
    const result = validateRequestSize('-100');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid Content-Length header');
    expect(result.code).toBe('INVALID_CONTENT_LENGTH');
  });
});

describe('detectThreats', () => {
  it('should detect SQL injection patterns', () => {
    const threats = detectThreats('SELECT * FROM users WHERE id=1');
    expect(threats).toContain('SQL_INJECTION');
  });

  it('should detect UNION-based SQL injection', () => {
    const threats = detectThreats('1 UNION SELECT password FROM users');
    expect(threats).toContain('SQL_INJECTION');
  });

  it('should detect NoSQL injection patterns', () => {
    const threats = detectThreats('{ $where: function() { return true } }');
    expect(threats).toContain('NOSQL_INJECTION');
  });

  it('should detect XSS attempts', () => {
    const threats = detectThreats('<script>alert(1)</script>');
    expect(threats).toContain('XSS_ATTEMPT');
  });

  it('should detect event handler XSS attempts', () => {
    const threats = detectThreats('<div onmouseover="alert(1)">Hover me</div>');
    expect(threats).toContain('XSS_ATTEMPT');
  });

  it('should detect path traversal', () => {
    const threats = detectThreats('../../etc/passwd');
    expect(threats).toContain('PATH_TRAVERSAL');
  });

  it('should detect command injection', () => {
    const threats = detectThreats('file.txt; bash -c "rm -rf /"');
    expect(threats).toContain('COMMAND_INJECTION');
  });

  it('should return empty array for safe input', () => {
    const threats = detectThreats('This is a normal, safe message');
    expect(threats).toEqual([]);
  });

  it('should detect multiple threats', () => {
    const threats = detectThreats('<script>alert(1)</script> SELECT * FROM users WHERE 1=1');
    expect(threats.length).toBeGreaterThan(1);
    expect(threats).toContain('XSS_ATTEMPT');
    expect(threats).toContain('SQL_INJECTION');
  });

  it('should handle financial queries without false positives', () => {
    const threats = detectThreats('Change interest rate to 5.5%');
    expect(threats).toEqual([]);
  });

  it('should handle numeric data without false positives', () => {
    const threats = detectThreats('Loan amount is $250,000 with 15 year term');
    expect(threats).toEqual([]);
  });

  it('should avoid SQL false positives from plain English words', () => {
    const threats = detectThreats('The dropdown from the menu was updated yesterday');
    expect(threats).not.toContain('SQL_INJECTION');
  });

  it('should avoid NoSQL false positives from currency and braces', () => {
    const threats = detectThreats('Use {$500} as the placeholder in the template');
    expect(threats).not.toContain('NOSQL_INJECTION');
  });

  it('should avoid command injection false positives from shell substrings', () => {
    const threats = detectThreats('The executive should review the $500 expense report');
    expect(threats).not.toContain('COMMAND_INJECTION');
  });
});
