/**
 * Token Estimation Utility
 * Provides approximate token counting for cost estimation and monitoring
 */

/**
 * Estimate token count for a given text
 * Uses approximate 1 token ≈ 4 characters for English text
 * 
 * @param text - The text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokens(text: string): number {
  if (!text || text.length === 0) {
    return 0;
  }

  // Rough estimation: ~4 characters per token for English
  // This is a conservative estimate for common models
  return Math.ceil(text.length / 4);
}

/**
 * Estimate tokens for structured data (JSON)
 * JSON tokens are typically more dense
 * 
 * @param data - The data to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokensFromJSON(data: any): number {
  if (!data) {
    return 0;
  }

  // Convert to string if not already
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
  
  // JSON is more token-dense, estimate higher
  return Math.ceil(jsonStr.length / 3);
}

/**
 * Estimate tokens for prompt + response combined
 * 
 * @param prompt - The prompt text
 * @param response - The response text or object
 * @returns Object with separate and total token estimates
 */
export function estimateTokensCombined(
  prompt: string,
  response: string | any
): {
  promptTokens: number;
  responseTokens: number;
  totalTokens: number;
} {
  const promptTokens = estimateTokens(prompt);
  
  const responseTokens = typeof response === 'string'
    ? estimateTokens(response)
    : estimateTokensFromJSON(response);

  return {
    promptTokens,
    responseTokens,
    totalTokens: promptTokens + responseTokens,
  };
}

/**
 * Estimate cost based on model and tokens
 * 
 * @param model - The model identifier
 * @param promptTokens - Number of prompt tokens
 * @param responseTokens - Number of response tokens
 * @returns Estimated cost in USD
 */
export function estimateCost(
  model: string,
  promptTokens: number,
  responseTokens: number
): number {
  // Prices per 1M tokens (as of common models)
  const prices: Record<string, { input: number; output: number }> = {
    '@cf/meta/llama-3-8b-instruct': { input: 0.05, output: 0.15 },
    '@cf/meta/llama-3.1-8b-instruct': { input: 0.05, output: 0.15 },
    '@hf/meta-llama/Meta-Llama-3-8B-Instruct': { input: 0.05, output: 0.15 },
    '@cf/meta/llama-3.1-70b-instruct': { input: 0.65, output: 0.65 },
    '@cf/meta/llama-3-70b-instruct': { input: 0.65, output: 0.65 },
    default: { input: 0.10, output: 0.30 },
  };

  const modelPrices = prices[model] || prices.default;
  if (!modelPrices) {
    return 0;
  }
  const inputCost = (promptTokens / 1_000_000) * modelPrices.input;
  const outputCost = (responseTokens / 1_000_000) * modelPrices.output;
  
  return inputCost + outputCost;
}

