/**
 * PII Redactor Service
 * Detects and redacts sensitive personal information from text
 */

export class PIIRedactor {
  /**
   * Redact sensitive information from text
   */
  static redact(text: string): string {
    if (!text) return text;

    let redacted = text;

    // Social Security Numbers (US)
    // Pattern: 000-00-0000
    redacted = redacted.replace(
      /\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g,
      '[REDACTED_SSN]'
    );

    // Credit Card Numbers
    // Pattern: 16 digits, optionally separated by dashes or spaces
    redacted = redacted.replace(/\b(?:\d{4}[- ]?){3}\d{4}\b/g, '[REDACTED_CC]');

    // Phone Numbers (US)
    // Pattern: (555) 555-5555, 555-555-5555, 555.555.5555
    redacted = redacted.replace(
      /\b(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\b/g,
      '[REDACTED_PHONE]'
    );

    // Email Addresses
    // Pattern: user@domain.com
    // Note: We might want to allow emails in some contexts, but for now we redact
    redacted = redacted.replace(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      '[REDACTED_EMAIL]'
    );

    return redacted;
  }
}
