import { test, expect } from '@playwright/test';

/**
 * Comprehensive test suite to ensure chat responses are helpful and specific,
 * not generic or unhelpful, across all pages of the website.
 *
 * This test suite prevents regression of issues where the chat gives generic
 * responses like "I can help you find the right financial calculator" instead
 * of actually helping users.
 */

// Generic response patterns that should NEVER appear
const GENERIC_RESPONSE_PATTERNS = [
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
];

// Helper function to check if response is generic/unhelpful
function isGenericResponse(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return GENERIC_RESPONSE_PATTERNS.some((pattern) => pattern.test(normalized));
}

// Helper function to send chat message and get response
async function sendChatMessage(page: any, message: string, timeout = 5000): Promise<string> {
  const chatInput = page.locator('#chat-input');
  await chatInput.fill(message);

  const sendButton = page.locator('#chat-send');
  await sendButton.click();

  // Wait for response
  await page.waitForTimeout(2000);

  // Get the last assistant message
  const assistantMessages = page.locator('.message.assistant');
  const count = await assistantMessages.count();

  if (count === 0) {
    return '';
  }

  const lastMessage = assistantMessages.last();
  const text = await lastMessage.textContent();
  return text || '';
}

// Helper function to open chat panel
async function openChatPanel(page: any) {
  const chatToggle = page.locator('#chat-toggle');
  await expect(chatToggle).toBeVisible({ timeout: 5000 });
  await chatToggle.click();

  // Wait for panel to be visible
  await page.waitForSelector('#chat-panel.visible', { timeout: 3000 });
}

test.describe('Chat Response Quality - All Pages', () => {
  test.describe('Home Page', () => {
    test('should not give generic responses on home page', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await openChatPanel(page);

      // Test various questions that might trigger generic responses
      const testMessages = [
        'What calculators are available?',
        'Show me business tools',
        'I need help with retirement planning',
      ];

      for (const message of testMessages) {
        const response = await sendChatMessage(page, message);

        // Response should not be generic
        expect(isGenericResponse(response)).toBe(false);

        // Response should be helpful (not empty, not just repeating the question)
        expect(response.length).toBeGreaterThan(20);
        expect(response.toLowerCase()).not.toContain(message.toLowerCase());
      }
    });
  });

  test.describe('Calculator Pages', () => {
    const calculatorPages = [
      { path: '/amortization', name: 'Amortization' },
      { path: '/ebitda-forecasting', name: 'EBITDA Forecasting' },
      { path: '/lease-analysis', name: 'Lease Analysis' },
      { path: '/calculator/pricing-strategy', name: 'Pricing Strategy' },
      { path: '/calculator/auto-loan', name: 'Auto Loan' },
      { path: '/calculator/retirement', name: 'Retirement' },
      { path: '/calculator/savings-goal', name: 'Savings Goal' },
      { path: '/calculator/debt-payoff', name: 'Debt Payoff' },
      { path: '/calculator/student-loans', name: 'Student Loans' },
      { path: '/calculator/budget', name: 'Budget' },
    ];

    for (const { path, name } of calculatorPages) {
      test(`should show context-specific examples on ${name} page`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState('networkidle');

        await openChatPanel(page);

        // Check system message shows relevant examples, not generic ones
        const systemMessage = page.locator('.system-message');
        const systemText = await systemMessage.textContent();

        // Should not contain generic amortization examples on non-amortization pages
        if (path !== '/amortization' && path !== '/calculator/auto-loan') {
          expect(systemText).not.toContain('Set interest to 4.5%');
          expect(systemText).not.toContain('Show a 20-year term');
        }

        // Should not contain generic response patterns
        expect(isGenericResponse(systemText || '')).toBe(false);
      });

      test(`should give helpful responses on ${name} page`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState('networkidle');

        await openChatPanel(page);

        // Ask a relevant question
        const response = await sendChatMessage(page, 'What can you help me with?');

        // Should not be generic
        expect(isGenericResponse(response)).toBe(false);

        // Should be helpful (mention specific features or ask clarifying questions)
        expect(response.length).toBeGreaterThan(30);
      });
    }
  });

  test.describe('Journey Pages', () => {
    const journeyPages = [
      { path: '/journey/startup-planning', name: 'Startup Planning' },
      { path: '/journey/home-buying', name: 'Home Buying' },
      { path: '/journey/young-professional', name: 'Young Professional' },
      { path: '/journey/family-planning', name: 'Family Planning' },
      { path: '/journey/business-growth', name: 'Business Growth' },
    ];

    for (const { path, name } of journeyPages) {
      test(`should show journey-specific context on ${name} page`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState('networkidle');

        await openChatPanel(page);

        // Check context indicator
        const contextIndicator = page.locator('#context-indicator');
        const contextText = await contextIndicator.textContent();

        // Should show journey name or relevant context
        expect(contextText?.length).toBeGreaterThan(0);

        // System message should not be generic
        const systemMessage = page.locator('.system-message');
        const systemText = await systemMessage.textContent();
        expect(isGenericResponse(systemText || '')).toBe(false);
      });
    }
  });

  test.describe('Journey Step Pages - Field Updates', () => {
    test('should update income field on financial-snapshot page', async ({ page }) => {
      await page.goto('/journey/home-buying/step/financial-snapshot');
      await page.waitForLoadState('networkidle');

      await openChatPanel(page);

      // Check that system message shows relevant examples
      const systemMessage = page.locator('.system-message');
      const systemText = await systemMessage.textContent();

      // Should show income-related examples, not amortization examples
      expect(systemText).toMatch(/income|savings|debt/i);
      expect(systemText).not.toContain('Set interest to 4.5%');
      expect(systemText).not.toContain('Show a 20-year term');

      // Try to update income field
      const response = await sendChatMessage(page, 'What if my income is 80000');

      // Should not be generic response
      expect(isGenericResponse(response)).toBe(false);

      // Should acknowledge the update or provide helpful response
      expect(response.length).toBeGreaterThan(20);

      // Check if field was actually updated (if field update is supported)
      const incomeField = page.locator('input[name="annualIncome"], input[id*="income"]').first();
      if ((await incomeField.count()) > 0) {
        const value = await incomeField.inputValue();
        // Field should be updated or response should indicate update
        expect(value === '80000' || response.toLowerCase().includes('80000')).toBe(true);
      }
    });

    test('should update savings field on financial-snapshot page', async ({ page }) => {
      await page.goto('/journey/home-buying/step/financial-snapshot');
      await page.waitForLoadState('networkidle');

      await openChatPanel(page);

      const response = await sendChatMessage(page, 'Set my savings to 10000');

      expect(isGenericResponse(response)).toBe(false);
      expect(response.length).toBeGreaterThan(20);
    });

    test('should handle field updates on young-professional financial-snapshot', async ({
      page,
    }) => {
      await page.goto('/journey/young-professional/step/financial-snapshot');
      await page.waitForLoadState('networkidle');

      await openChatPanel(page);

      // Should show relevant examples
      const systemMessage = page.locator('.system-message');
      const systemText = await systemMessage.textContent();
      expect(isGenericResponse(systemText || '')).toBe(false);

      // Try field update
      const response = await sendChatMessage(page, 'What if my income is 60000');
      expect(isGenericResponse(response)).toBe(false);
    });

    test('should show amortization context on mortgage-related journey steps', async ({ page }) => {
      await page.goto('/journey/home-buying/step/goal-planning');
      await page.waitForLoadState('networkidle');

      await openChatPanel(page);

      // This step should show amortization/mortgage context
      const systemMessage = page.locator('.system-message');
      const systemText = await systemMessage.textContent();

      // Should mention mortgage/amortization, not generic responses
      expect(systemText).toMatch(/mortgage|interest|loan|amortization/i);
      expect(isGenericResponse(systemText || '')).toBe(false);
    });
  });

  test.describe('Models Page', () => {
    test('should not give generic "what models are available" response', async ({ page }) => {
      await page.goto('/models');
      await page.waitForLoadState('networkidle');

      await openChatPanel(page);

      // Ask about models
      const response = await sendChatMessage(page, 'What models are available?');

      // Should NOT be the generic response
      expect(isGenericResponse(response)).toBe(false);

      // Should actually list models or provide specific guidance
      expect(response.length).toBeGreaterThan(50);

      // Should mention specific models or calculators
      const hasSpecificContent =
        response.toLowerCase().includes('mortgage') ||
        response.toLowerCase().includes('retirement') ||
        response.toLowerCase().includes('ebitda') ||
        response.toLowerCase().includes('lease') ||
        response.toLowerCase().includes('calculator');

      expect(hasSpecificContent).toBe(true);
    });

    test('should give helpful response when asked about specific model', async ({ page }) => {
      await page.goto('/models');
      await page.waitForLoadState('networkidle');

      await openChatPanel(page);

      const response = await sendChatMessage(page, 'Tell me about lease analysis');

      expect(isGenericResponse(response)).toBe(false);
      expect(response.length).toBeGreaterThan(30);
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle vague questions without generic responses', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await openChatPanel(page);

      const vagueQuestions = ['Help', 'What can you do?', 'I need help', 'Show me tools'];

      for (const question of vagueQuestions) {
        const response = await sendChatMessage(page, question);

        // Should not be generic
        expect(isGenericResponse(response)).toBe(false);

        // Should provide specific guidance or ask clarifying questions
        expect(response.length).toBeGreaterThan(20);
      }
    });

    test('should handle field update requests correctly', async ({ page }) => {
      await page.goto('/amortization');
      await page.waitForLoadState('networkidle');

      await openChatPanel(page);

      // Try field update
      const response = await sendChatMessage(page, 'Set interest to 4.5%');

      // Should not be generic
      expect(isGenericResponse(response)).toBe(false);

      // Should acknowledge the update
      expect(response.toLowerCase()).toMatch(/updated|set|4\.5|interest/i);
    });

    test('should handle requests for unavailable tools gracefully', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await openChatPanel(page);

      const response = await sendChatMessage(page, 'Calculate my taxes');

      // Should not be generic
      expect(isGenericResponse(response)).toBe(false);

      // Should provide helpful alternative or explanation
      expect(response.length).toBeGreaterThan(20);
    });
  });

  test.describe('Response Quality Checks', () => {
    test('responses should not just repeat user questions', async ({ page }) => {
      await page.goto('/amortization');
      await page.waitForLoadState('networkidle');

      await openChatPanel(page);

      const questions = [
        'What calculators are available?',
        'Show me business tools',
        'I need help with retirement planning',
      ];

      for (const question of questions) {
        const response = await sendChatMessage(page, question);

        // Response should not just echo the question
        const responseLower = response.toLowerCase();
        const questionLower = question.toLowerCase();

        // Should not be identical or just repeat back
        expect(responseLower).not.toBe(questionLower);

        // Should add value (be longer or different)
        if (responseLower.includes(questionLower)) {
          expect(response.length).toBeGreaterThan(question.length + 20);
        }
      }
    });

    test('responses should be actionable or informative', async ({ page }) => {
      await page.goto('/calculator/pricing-strategy');
      await page.waitForLoadState('networkidle');

      await openChatPanel(page);

      const response = await sendChatMessage(page, 'How do I use this calculator?');

      // Should not be generic
      expect(isGenericResponse(response)).toBe(false);

      // Should provide actual guidance
      expect(response.length).toBeGreaterThan(40);

      // Should mention specific fields or actions
      const hasActionableContent =
        response.toLowerCase().includes('margin') ||
        response.toLowerCase().includes('cost') ||
        response.toLowerCase().includes('price') ||
        response.toLowerCase().includes('set') ||
        response.toLowerCase().includes('enter');

      expect(hasActionableContent).toBe(true);
    });
  });
});
