/**
 * Server-side validation utilities for API inputs
 * Provides defense-in-depth alongside client-side validation
 */

// Security constants - match client-side limits
export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_REQUEST_BODY_SIZE = 50_000; // 50KB max request body
export const DANGEROUS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // Event handlers like onclick=, onload=, etc.
];

/**
 * Validation result with detailed error information
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
  sanitizedValue?: string;
}

/**
 * Validate and sanitize chat message input
 * @param message - User message to validate
 * @returns ValidationResult with sanitized message or error details
 */
export function validateChatMessage(message: string | null | undefined): ValidationResult {
  // Check for empty/null message
  if (!message || typeof message !== 'string') {
    return {
      valid: false,
      error: 'Message is required and must be a string',
      code: 'MESSAGE_REQUIRED',
    };
  }

  const trimmedMessage = message.trim();

  // Check for empty after trimming
  if (trimmedMessage.length === 0) {
    return {
      valid: false,
      error: 'Message cannot be empty',
      code: 'MESSAGE_EMPTY',
    };
  }

  // Check length limit
  if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`,
      code: 'MESSAGE_TOO_LONG',
    };
  }

  // Sanitize message - remove dangerous patterns
  let sanitized = trimmedMessage;
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Check for control characters (except newlines and tabs)
  // eslint-disable-next-line no-control-regex
  const hasControlChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(sanitized);
  if (hasControlChars) {
    // Remove control characters
    // eslint-disable-next-line no-control-regex
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }

  return {
    valid: true,
    sanitizedValue: sanitized,
  };
}

/**
 * Validate request body size to prevent memory exhaustion
 * @param contentLength - Content-Length header value
 * @returns ValidationResult
 */
export function validateRequestSize(contentLength: string | null): ValidationResult {
  if (!contentLength) {
    // Allow requests without Content-Length (will be caught by JSON parsing)
    return { valid: true };
  }

  const size = parseInt(contentLength, 10);
  
  if (isNaN(size) || size < 0) {
    return {
      valid: false,
      error: 'Invalid Content-Length header',
      code: 'INVALID_CONTENT_LENGTH',
    };
  }

  if (size > MAX_REQUEST_BODY_SIZE) {
    return {
      valid: false,
      error: `Request body exceeds maximum size of ${MAX_REQUEST_BODY_SIZE} bytes`,
      code: 'REQUEST_TOO_LARGE',
    };
  }

  return { valid: true };
}

/**
 * Detect potentially malicious input patterns
 * @param input - String to analyze
 * @returns Array of detected threat patterns
 */
export function detectThreats(input: string): string[] {
  const threats: string[] = [];

  // SQL injection patterns
  if (/(\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b).*(\bFROM\b|\bWHERE\b)/i.test(input)) {
    threats.push('SQL_INJECTION');
  }

  // NoSQL injection patterns
  if (/\$\w+\s*:\s*{/.test(input) || /\{\s*\$\w+/.test(input)) {
    threats.push('NOSQL_INJECTION');
  }

  // XSS patterns (already sanitized, but log if detected)
  if (/<script|<iframe|javascript:|on\w+\s*=/i.test(input)) {
    threats.push('XSS_ATTEMPT');
  }

  // Path traversal
  if (/\.\.\/|\.\.\\/.test(input)) {
    threats.push('PATH_TRAVERSAL');
  }

  // Command injection
  if (/[;&|`$]/.test(input) && /(\bsh\b|\bbash\b|\bcmd\b|\bexec\b)/i.test(input)) {
    threats.push('COMMAND_INJECTION');
  }

  return threats;
}
