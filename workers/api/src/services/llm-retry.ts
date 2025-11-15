/**
 * LLM Retry Handler with Exponential Backoff
 * Provides robust error handling and retry logic for AI calls
 */

export interface RetryOptions {
  maxRetries?: number;
  backoffMs?: number;
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

export class LLMRetryHandler {
  /**
   * Execute operation with retry logic
   */
  async callWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      backoffMs = 1000,
      onRetry,
      shouldRetry = () => true,
    } = options;

    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await operation();
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry if error is not retriable
        if (!shouldRetry(lastError)) {
          throw lastError;
        }

        // Last attempt, throw the error
        if (attempt === maxRetries - 1) {
          throw lastError;
        }

        // Calculate backoff delay (exponential)
        const delay = backoffMs * Math.pow(2, attempt);
        
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Callback for monitoring
        if (onRetry) {
          onRetry(attempt + 1, lastError);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Determine if error is retriable
   */
  static isRetriableError(error: Error): boolean {
    const retriablePatterns = [
      /timeout/i,
      /network/i,
      /connection/i,
      /rate limit/i,
      /429/i,
      /503/i,
      /504/i,
    ];

    const message = error.message.toLowerCase();
    return retriablePatterns.some((pattern) => pattern.test(message));
  }

  /**
   * Determine if error is a validation error (not retriable)
   */
  static isValidationError(error: Error): boolean {
    const validationPatterns = [
      /invalid/i,
      /validation/i,
      /schema/i,
      /malformed/i,
      /parse/i,
    ];

    const message = error.message.toLowerCase();
    return validationPatterns.some((pattern) => pattern.test(message));
  }
}

/**
 * Default shouldRetry function for LLM calls
 */
export function defaultShouldRetry(error: Error): boolean {
  // Don't retry validation errors
  if (LLMRetryHandler.isValidationError(error)) {
    return false;
  }

  // Retry network/timeout errors
  return LLMRetryHandler.isRetriableError(error);
}



