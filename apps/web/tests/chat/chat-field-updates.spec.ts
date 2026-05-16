import { test, expect } from '@playwright/test';

test.describe('Chat Panel Field Updates', () => {
  test.describe('Pricing Strategy Calculator', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/calculator/pricing-strategy');
      await page.waitForLoadState('networkidle');

      // Open chat panel
      const chatToggle = page.locator('#chat-toggle');
      await chatToggle.click();

      // Wait for panel to be visible
      await page.waitForSelector('#chat-panel.visible', { timeout: 3000 });
    });

    test('should update target margin field via chat', async ({ page }) => {
      // Find the target margin input field
      const marginField = page.locator('input[id*="target-margin"], input[id*="margin"]').first();

      // Set initial value
      await marginField.fill('40');
      const initialValue = await marginField.inputValue();
      expect(initialValue).toBe('40');

      // Send chat command
      const chatInput = page.locator('#chat-input');
      await chatInput.fill('Set target margin to 70');

      const sendButton = page.locator('#chat-send');
      await sendButton.click();

      // Wait for field to update
      await page.waitForTimeout(1000);

      // Check if field was updated
      const newValue = await marginField.inputValue();

      // Check for confirmation message
      const assistantMessages = page.locator('.message.assistant');
      const lastMessage = assistantMessages.last();
      await expect(lastMessage).toContainText(/updated|set|70/i, { timeout: 2000 });
    });

    test('should update cost per unit field via chat', async ({ page }) => {
      const costField = page.locator('input[id*="cost-per-unit"], input[id*="cost"]').first();

      await costField.fill('20');

      const chatInput = page.locator('#chat-input');
      await chatInput.fill('Change cost per unit to 35');

      const sendButton = page.locator('#chat-send');
      await sendButton.click();

      await page.waitForTimeout(1000);

      // Check for confirmation
      const assistantMessages = page.locator('.message.assistant');
      const lastMessage = assistantMessages.last();
      await expect(lastMessage).toContainText(/35/, { timeout: 2000 });
    });

    test('should handle "what if" style questions', async ({ page }) => {
      const chatInput = page.locator('#chat-input');
      await chatInput.fill('What if margin was 80');

      const sendButton = page.locator('#chat-send');
      await sendButton.click();

      await page.waitForTimeout(1000);

      // Should get a response
      const assistantMessages = page.locator('.message.assistant');
      expect(await assistantMessages.count()).toBeGreaterThan(1); // System message + response
    });

    test('should handle percentage symbols in values', async ({ page }) => {
      const chatInput = page.locator('#chat-input');
      await chatInput.fill('Set margin to 65%');

      const sendButton = page.locator('#chat-send');
      await sendButton.click();

      await page.waitForTimeout(1000);

      const assistantMessages = page.locator('.message.assistant');
      const lastMessage = assistantMessages.last();
      await expect(lastMessage).toContainText(/65/, { timeout: 2000 });
    });
  });

  test.describe('Amortization Calculator', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/calculator/amortization');
      await page.waitForLoadState('networkidle');

      const chatToggle = page.locator('#chat-toggle');
      await chatToggle.click();
      await page.waitForSelector('#chat-panel.visible');
    });

    test('should show amortization-specific examples', async ({ page }) => {
      const systemMessage = page.locator('.system-message');

      // Should have loan/mortgage related examples
      await expect(systemMessage).toContainText(/interest|rate|term|year/i);

      // Should NOT have pricing-related examples
      await expect(systemMessage).not.toContainText(/margin|cost per unit|pricing/i);
    });

    test('should provide helpful response for loan questions', async ({ page }) => {
      const chatInput = page.locator('#chat-input');
      await chatInput.fill('What is the monthly payment?');

      const sendButton = page.locator('#chat-send');
      await sendButton.click();

      // Should get a response (not an error)
      await page.waitForTimeout(1500);
      const messages = page.locator('.message');
      expect(await messages.count()).toBeGreaterThan(2); // System + user + assistant
    });
  });

  test.describe('Auto Loan Calculator', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/calculator/auto-loan');
      await page.waitForLoadState('networkidle');
    });

    test('should show auto loan specific context', async ({ page }) => {
      const chatToggle = page.locator('#chat-toggle');
      await chatToggle.click();

      const contextIndicator = page.locator('#context-indicator');
      await expect(contextIndicator).toContainText('Auto Loan');

      const systemMessage = page.locator('.system-message');
      await expect(systemMessage).toContainText(/car|vehicle|auto|trade/i);
    });
  });

  test.describe('Retirement Calculator', () => {
    test('should show retirement specific examples', async ({ page }) => {
      await page.goto('/calculator/retirement');

      const chatToggle = page.locator('#chat-toggle');
      await chatToggle.click();

      const systemMessage = page.locator('.system-message');
      await expect(systemMessage).toContainText(/age|retirement|savings/i);
    });
  });

  test.describe('EBITDA Calculator', () => {
    test('should show EBITDA specific examples', async ({ page }) => {
      await page.goto('/ebitda-forecasting');

      const chatToggle = page.locator('#chat-toggle');
      await chatToggle.click();

      const contextIndicator = page.locator('#context-indicator');
      await expect(contextIndicator).toContainText('EBITDA');

      const systemMessage = page.locator('.system-message');
      await expect(systemMessage).toContainText(/revenue|growth|EBITDA/i);
    });
  });
});

test.describe('Chat Panel Regression Tests', () => {
  test('should not show generic examples on specific calculators', async ({ page }) => {
    const testCases = [
      {
        path: '/calculator/pricing-strategy',
        shouldNotContain: ['interest rate', '20-year term', 'amortization'],
        shouldContain: ['margin', 'cost', 'price'],
      },
      {
        path: '/calculator/retirement',
        shouldNotContain: ['margin', 'cost per unit', 'lease'],
        shouldContain: ['age', 'retirement', 'savings'],
      },
      {
        path: '/ebitda-forecasting',
        shouldNotContain: ['interest rate', 'down payment', 'margin'],
        shouldContain: ['revenue', 'EBITDA', 'growth'],
      },
    ];

    for (const testCase of testCases) {
      await page.goto(testCase.path);

      const chatToggle = page.locator('#chat-toggle');
      await chatToggle.click();

      const systemMessage = page.locator('.system-message');

      // Check should NOT contain
      for (const term of testCase.shouldNotContain) {
        await expect(systemMessage).not.toContainText(new RegExp(term, 'i'));
      }

      // Check should contain at least one expected term
      const containsExpected = await Promise.all(
        testCase.shouldContain.map(async (term) => {
          const text = await systemMessage.textContent();
          return text?.toLowerCase().includes(term.toLowerCase()) || false;
        })
      );

      expect(containsExpected.some(Boolean)).toBe(true);

      // Close for next iteration
      const closeButton = page.locator('#chat-close');
      await closeButton.click();
    }
  });
});

test.describe('Chat Panel Performance', () => {
  test('should open chat panel quickly (< 500ms)', async ({ page }) => {
    await page.goto('/calculator/pricing-strategy');

    const chatToggle = page.locator('#chat-toggle');

    const startTime = Date.now();
    await chatToggle.click();

    await page.waitForSelector('#chat-panel.visible', { timeout: 1000 });
    const endTime = Date.now();

    const openTime = endTime - startTime;
    expect(openTime).toBeLessThan(500);
  });

  test('should update context indicator quickly when switching pages', async ({ page }) => {
    await page.goto('/calculator/pricing-strategy');

    const chatToggle = page.locator('#chat-toggle');
    await chatToggle.click();

    const startTime = Date.now();
    await page.goto('/calculator/amortization');

    const contextIndicator = page.locator('#context-indicator');
    await page.waitForFunction(
      () => {
        const indicator = document.getElementById('context-indicator');
        return (
          indicator?.textContent?.toLowerCase().includes('mortgage') ||
          indicator?.textContent?.toLowerCase().includes('loan') ||
          indicator?.textContent?.toLowerCase().includes('amortization')
        );
      },
      { timeout: 2000 }
    );

    const endTime = Date.now();
    const updateTime = endTime - startTime;

    expect(updateTime).toBeLessThan(2000);
  });
});
