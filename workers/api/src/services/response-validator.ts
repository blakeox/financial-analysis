/**
 * LLM Response Validator
 * Validates AI responses for quality and completeness before returning to users
 */

export interface ValidationResult {
  valid: boolean;
  issues: string[];
  canRetry: boolean;
  confidence?: number;
}

export class ResponseValidator {
  private static readonly MAX_RESPONSE_LENGTH = 12000;
  private static readonly MIN_RESPONSE_LENGTH = 50;
  
  private static readonly ERROR_PATTERNS = [
    /i cannot/i,
    /i don't understand/i,
    /i'm not sure/i,
    /error occurred/i,
    /something went wrong/i,
    /unable to/i,
    /sorry, i/i,
  ];

  private static readonly LOW_CONFIDENCE_PATTERNS = [
    /i think/i,
    /maybe/i,
    /perhaps/i,
    /not sure/i,
    /uncertain/i,
  ];

  /**
   * Validate LLM response
   */
  static validateLLMResponse(response: unknown, expectedFormat?: 'json' | 'text'): ValidationResult {
    const issues: string[] = [];

    // Check for null/undefined
    if (!response || !response) {
      return { 
        valid: false, 
        issues: ['Empty or null response'],
        canRetry: true,
      };
    }

    // Extract response string
    let responseStr = '';
    if (typeof response === 'string') {
      responseStr = response;
    } else if (typeof response === 'object' && response !== null) {
      if ('response' in response) {
        responseStr = String(response.response);
      } else if ('text' in response) {
        responseStr = String(response.text);
      } else {
        responseStr = JSON.stringify(response);
      }
    } else {
      responseStr = String(response);
    }

    // Length validation
    if (responseStr.length > this.MAX_RESPONSE_LENGTH) {
      issues.push(`Response exceeds maximum length (${this.MAX_RESPONSE_LENGTH} chars)`);
    }

    if (responseStr.length < this.MIN_RESPONSE_LENGTH) {
      issues.push('Response too short - may be incomplete');
    }

    // Format validation
    if (expectedFormat === 'json') {
      const jsonValidation = this.validateJSON(responseStr);
      if (!jsonValidation.valid) {
        issues.push(...jsonValidation.issues);
      }
    }

    // Error pattern detection
    for (const pattern of this.ERROR_PATTERNS) {
      if (pattern.test(responseStr)) {
        issues.push('Response contains error indicators');
        break;
      }
    }

    // Confidence scoring
    const confidence = this.calculateConfidence(responseStr);
    if (confidence < 0.5) {
      issues.push(`Low confidence response (${Math.round(confidence * 100)}%)`);
    }

    // Determine if retriable
    const canRetry = this.canRetryResponse(issues);

    return {
      valid: issues.length === 0,
      issues,
      canRetry,
      confidence,
    };
  }

  /**
   * Validate JSON response
   */
  private static validateJSON(str: string): ValidationResult {
    try {
      JSON.parse(str);
      return { valid: true, issues: [], canRetry: false };
    } catch (error) {
      console.warn('ResponseValidator JSON parse failed:', error);
      return { 
        valid: false, 
        issues: ['Invalid JSON format'],
        canRetry: true,
      };
    }
  }

  /**
   * Calculate confidence score
   */
  private static calculateConfidence(responseStr: string): number {
    let score = 1.0;

    // Deduct for low confidence patterns
    for (const pattern of this.LOW_CONFIDENCE_PATTERNS) {
      if (pattern.test(responseStr)) {
        score -= 0.1;
      }
    }

    // Deduct for error patterns
    for (const pattern of this.ERROR_PATTERNS) {
      if (pattern.test(responseStr)) {
        score -= 0.3;
      }
    }

    // Deduct for very short responses
    if (responseStr.length < 100) {
      score -= 0.2;
    }

    // Deduct for excessive length (potential truncation)
    if (responseStr.length > 10000) {
      score -= 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Determine if response can be retried
   */
  private static canRetryResponse(issues: string[]): boolean {
    // Don't retry if too many issues
    if (issues.length > 3) {
      return false;
    }

    // Don't retry if hard errors
    const hardErrors = ['Empty or null response', 'Invalid JSON format'];
    if (issues.some((issue) => hardErrors.some((he) => issue.includes(he)))) {
      // Actually, these ARE retriable
      return true;
    }

    // Don't retry if perfect response
    if (issues.length === 0) {
      return false;
    }

    // Retry if minor issues
    return true;
  }

  /**
   * Extract and validate JSON from mixed response
   */
  static extractJSON(responseStr: string): { success: boolean; data?: any; error?: string } {
    try {
      // Try parsing entire string
      const parsed = JSON.parse(responseStr);
      return { success: true, data: parsed };
    } catch {
      // Try extracting JSON block
      const jsonMatch = responseStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return { success: true, data: parsed };
        } catch {
          return { success: false, error: 'Failed to parse JSON block' };
        }
      }
      return { success: false, error: 'No JSON found in response' };
    }
  }
}

