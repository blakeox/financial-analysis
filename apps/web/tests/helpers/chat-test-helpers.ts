/**
 * Helper utilities for chat response quality testing
 */

import type { Page } from '@playwright/test';

// Generic response patterns that should NEVER appear
export const GENERIC_RESPONSE_PATTERNS = [
  /^hi — i can help you find the right financial calculator/i,
  /^what calculators are available\?/i,
  /^show me business tools/i,
  /^i need help with retirement planning/i,
  /i have access to \d+ financial analysis tools\. ask me to analyze/i,
  /^what models do you have\?/i,
  /^i can help update the models model\. try:/i,
  /^hi — select a model or ask about available tools\./i,
  /^hi — i can help with finance tools and quick analysis\./i,
  /i can help update the \w+ model\. try:.*say "help"/i,
  /ask me to analyze specific scenarios or say "help" for examples/i,
  /^i can help update the \w+ model\. try:/i,
  /say "help" for more examples/i,
  /i can help update the general model\. try:/i,
  /i can change interest rates, amounts, and terms\. ask for a specific value/i,
];

/**
 * Check if a response is generic/unhelpful
 */
export function isGenericResponse(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return GENERIC_RESPONSE_PATTERNS.some(pattern => pattern.test(normalized));
}

/**
 * Send a chat message and get the response
 */
export async function sendChatMessage(
  page: Page,
  message: string,
  timeout = 10000
): Promise<string> {
  try {
    const chatInput = page.locator('#chat-input');
    await chatInput.waitFor({ state: 'visible', timeout: 5000 });
    await chatInput.fill(message);
    
    const sendButton = page.locator('#chat-send');
    await sendButton.waitFor({ state: 'visible', timeout: 5000 });
    await sendButton.click();
    
    // Wait for response - look for new assistant message
    const initialCount = await page.locator('.message.assistant').count();
    
    // Wait for a new message to appear (up to timeout)
    await page.waitForFunction(
      (initial) => {
        const messages = document.querySelectorAll('.message.assistant');
        return messages.length > initial;
      },
      initialCount,
      { timeout }
    );
    
    // Get the last assistant message
    const assistantMessages = page.locator('.message.assistant');
    const count = await assistantMessages.count();
    
    if (count === 0) {
      return '';
    }
    
    const lastMessage = assistantMessages.last();
    await lastMessage.waitFor({ state: 'visible', timeout: 2000 });
    const text = await lastMessage.textContent();
    return text || '';
  } catch (error) {
    // If timeout or error, try to get any existing message
    const assistantMessages = page.locator('.message.assistant');
    const count = await assistantMessages.count();
    if (count > 0) {
      const lastMessage = assistantMessages.last();
      const text = await lastMessage.textContent();
      return text || '';
    }
    return '';
  }
}

/**
 * Open the chat panel
 */
export async function openChatPanel(page: Page): Promise<void> {
  const chatToggle = page.locator('#chat-toggle');
  await chatToggle.waitFor({ state: 'visible', timeout: 5000 });
  await chatToggle.click();
  
  // Wait for panel to be visible
  await page.waitForSelector('#chat-panel.visible', { timeout: 3000 });
}

/**
 * Get system message text from chat panel
 */
export async function getSystemMessage(page: Page): Promise<string> {
  try {
    const systemMessage = page.locator('.system-message');
    await systemMessage.waitFor({ state: 'visible', timeout: 5000 });
    const text = await systemMessage.textContent();
    return text || '';
  } catch (error) {
    // Try alternative selector
    const altMessage = page.locator('[class*="system"], [class*="welcome"]').first();
    const text = await altMessage.textContent();
    return text || '';
  }
}

/**
 * Check if response is helpful (not generic, has content, doesn't just repeat question)
 */
export function isHelpfulResponse(response: string, question: string): boolean {
  // Empty response is not helpful
  if (!response || response.trim().length === 0) {
    return false;
  }
  
  // Should not be generic
  if (isGenericResponse(response)) {
    return false;
  }
  
  // Should have meaningful content
  if (response.length < 20) {
    return false;
  }
  
  // Should not just repeat the question
  const responseLower = response.toLowerCase().trim();
  const questionLower = question.toLowerCase().trim();
  
  if (responseLower === questionLower) {
    return false;
  }
  
  // If it contains the question, should add significant value
  if (responseLower.includes(questionLower) && questionLower.length > 10) {
    return response.length > question.length + 20;
  }
  
  // Should contain some actual content (not just punctuation or whitespace)
  const hasContent = /[a-zA-Z0-9]/.test(response);
  if (!hasContent) {
    return false;
  }
  
  return true;
}

/**
 * Verify field was updated
 */
export async function verifyFieldUpdate(
  page: Page,
  fieldSelector: string,
  expectedValue: string
): Promise<boolean> {
  const field = page.locator(fieldSelector).first();
  const count = await field.count();
  
  if (count === 0) {
    return false;
  }
  
  const value = await field.inputValue();
  return value === expectedValue || value.includes(expectedValue);
}

/**
 * List of all major pages to test
 */
export const TEST_PAGES = [
  // Home and main pages
  { path: '/', name: 'Home', type: 'home' },
  { path: '/models', name: 'Models', type: 'models' },
  { path: '/calculators', name: 'Calculators', type: 'list' },
  
  // Calculator pages
  { path: '/amortization', name: 'Amortization', type: 'calculator' },
  { path: '/ebitda-forecasting', name: 'EBITDA Forecasting', type: 'calculator' },
  { path: '/lease-analysis', name: 'Lease Analysis', type: 'calculator' },
  { path: '/calculator/pricing-strategy', name: 'Pricing Strategy', type: 'calculator' },
  { path: '/calculator/auto-loan', name: 'Auto Loan', type: 'calculator' },
  { path: '/calculator/retirement', name: 'Retirement', type: 'calculator' },
  { path: '/calculator/savings-goal', name: 'Savings Goal', type: 'calculator' },
  { path: '/calculator/debt-payoff', name: 'Debt Payoff', type: 'calculator' },
  { path: '/calculator/student-loans', name: 'Student Loans', type: 'calculator' },
  { path: '/calculator/budget', name: 'Budget', type: 'calculator' },
  
  // Journey pages
  { path: '/journey/startup-planning', name: 'Startup Planning', type: 'journey' },
  { path: '/journey/home-buying', name: 'Home Buying', type: 'journey' },
  { path: '/journey/young-professional', name: 'Young Professional', type: 'journey' },
  { path: '/journey/family-planning', name: 'Family Planning', type: 'journey' },
  { path: '/journey/business-growth', name: 'Business Growth', type: 'journey' },
  
  // Journey step pages
  { path: '/journey/home-buying/step/financial-snapshot', name: 'Financial Snapshot', type: 'journey-step' },
  { path: '/journey/home-buying/step/goal-planning', name: 'Goal Planning', type: 'journey-step' },
  { path: '/journey/young-professional/step/financial-snapshot', name: 'Financial Snapshot', type: 'journey-step' },
  { path: '/journey/startup-planning/step/initial-capital-investment', name: 'Initial Capital Investment', type: 'journey-step' },
  { path: '/journey/startup-planning/step/startup-budget', name: 'Startup Budget', type: 'journey-step' },
] as const;

