import { test, expect } from '@playwright/test';

test.describe('Chat Panel Context Awareness', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should show Pricing Strategy context on pricing calculator', async ({ page }) => {
    await page.goto('/calculator/pricing-strategy');
    
    // Open chat panel
    const chatToggle = page.locator('#chat-toggle');
    await expect(chatToggle).toBeVisible();
    await chatToggle.click();
    
    // Wait for chat panel to be visible
    const chatPanel = page.locator('#chat-panel');
    await expect(chatPanel).toHaveClass(/visible/);
    
    // Check context indicator shows correct calculator
    const contextIndicator = page.locator('#context-indicator');
    await expect(contextIndicator).toContainText('Pricing Strategy');
    
    // Check system message shows relevant examples
    const systemMessage = page.locator('.system-message');
    await expect(systemMessage).toContainText(/margin|cost|pricing/i);
    
    // Verify examples are pricing-related, not amortization
    await expect(systemMessage).not.toContainText(/interest rate|20-year term/i);
  });

  test('should show Amortization context on mortgage calculator', async ({ page }) => {
    await page.goto('/calculator/amortization');
    
    const chatToggle = page.locator('#chat-toggle');
    await chatToggle.click();
    
    const chatPanel = page.locator('#chat-panel');
    await expect(chatPanel).toHaveClass(/visible/);
    
    const contextIndicator = page.locator('#context-indicator');
    await expect(contextIndicator).toContainText(/Mortgage|Loan/i);
    
    const systemMessage = page.locator('.system-message');
    await expect(systemMessage).toContainText(/interest|term|amortization/i);
  });

  test('should show Auto Loan context on auto loan calculator', async ({ page }) => {
    await page.goto('/calculator/auto-loan');
    
    const chatToggle = page.locator('#chat-toggle');
    await chatToggle.click();
    
    const contextIndicator = page.locator('#context-indicator');
    await expect(contextIndicator).toContainText('Auto Loan');
    
    const systemMessage = page.locator('.system-message');
    await expect(systemMessage).toContainText(/car|vehicle|auto/i);
  });

  test('should show Retirement context on retirement calculator', async ({ page }) => {
    await page.goto('/calculator/retirement');
    
    const chatToggle = page.locator('#chat-toggle');
    await chatToggle.click();
    
    const contextIndicator = page.locator('#context-indicator');
    await expect(contextIndicator).toContainText('Retirement');
    
    const systemMessage = page.locator('.system-message');
    await expect(systemMessage).toContainText(/age|retirement|savings/i);
  });

  test('should show EBITDA context on EBITDA calculator', async ({ page }) => {
    await page.goto('/ebitda-forecasting');
    
    const chatToggle = page.locator('#chat-toggle');
    await chatToggle.click();
    
    const contextIndicator = page.locator('#context-indicator');
    await expect(contextIndicator).toContainText('EBITDA');
    
    const systemMessage = page.locator('.system-message');
    await expect(systemMessage).toContainText(/revenue|growth|EBITDA/i);
  });

  test('should show Lease Analysis context on lease page', async ({ page }) => {
    await page.goto('/lease-analysis');
    
    const chatToggle = page.locator('#chat-toggle');
    await chatToggle.click();
    
    const contextIndicator = page.locator('#context-indicator');
    await expect(contextIndicator).toContainText('Lease');
    
    const systemMessage = page.locator('.system-message');
    await expect(systemMessage).toContainText(/lease|interest|month/i);
  });
});

test.describe('Chat Panel Field Updates', () => {
  test('should update target margin field on pricing calculator', async ({ page }) => {
    await page.goto('/calculator/pricing-strategy');
    
    // Wait for form to be ready
    await page.waitForSelector('input[id*="margin"], input[id*="target"]', { timeout: 5000 });
    
    // Open chat
    const chatToggle = page.locator('#chat-toggle');
    await chatToggle.click();
    
    // Wait for chat to be visible
    await page.waitForSelector('#chat-panel.visible', { timeout: 3000 });
    
    // Type a field update command
    const chatInput = page.locator('#chat-input');
    await chatInput.fill('Set target margin to 70');
    
    // Submit
    const sendButton = page.locator('#chat-send');
    await sendButton.click();
    
    // Wait for response
    await page.waitForTimeout(1000);
    
    // Check for confirmation message
    const messages = page.locator('.message.assistant');
    const lastMessage = messages.last();
    await expect(lastMessage).toContainText(/updated|set|changed/i);
    await expect(lastMessage).toContainText('70');
  });

  test('should provide user message in chat on field update', async ({ page }) => {
    await page.goto('/calculator/pricing-strategy');
    await page.waitForLoadState('networkidle');
    
    const chatToggle = page.locator('#chat-toggle');
    await chatToggle.click();
    
    const chatInput = page.locator('#chat-input');
    await chatInput.fill('Set margin to 75');
    
    const sendButton = page.locator('#chat-send');
    await sendButton.click();
    
    // Check user message appears
    const userMessage = page.locator('.message.user').last();
    await expect(userMessage).toContainText('Set margin to 75');
  });
});

test.describe('Chat Panel Context Switching', () => {
  test('should update context when navigating between calculators', async ({ page }) => {
    // Start on pricing strategy
    await page.goto('/calculator/pricing-strategy');
    
    const chatToggle = page.locator('#chat-toggle');
    await chatToggle.click();
    
    let contextIndicator = page.locator('#context-indicator');
    await expect(contextIndicator).toContainText('Pricing Strategy');
    
    // Navigate to amortization
    await page.goto('/calculator/amortization');
    
    // Context should update (chat should still be open or reopen)
    await page.waitForTimeout(500); // Give time for context to update
    
    contextIndicator = page.locator('#context-indicator');
    // Note: Context should change even if panel closed on navigation
  });

  test('should show context change notification when switching', async ({ page }) => {
    await page.goto('/calculator/pricing-strategy');
    
    const chatToggle = page.locator('#chat-toggle');
    await chatToggle.click();
    
    // Navigate to different calculator
    await page.goto('/calculator/amortization');
    
    // Reopen chat if it closed
    await page.waitForTimeout(500);
    const chatPanelVisible = await page.locator('#chat-panel').evaluate(el => 
      el.classList.contains('visible')
    );
    
    if (!chatPanelVisible) {
      await chatToggle.click();
    }
    
    // Check for context indicator update
    const contextIndicator = page.locator('#context-indicator');
    await expect(contextIndicator).toContainText(/Mortgage|Loan|Amortization/i);
  });
});

test.describe('Chat Panel UI/UX', () => {
  test('should open and close chat panel', async ({ page }) => {
    await page.goto('/calculator/pricing-strategy');
    
    const chatToggle = page.locator('#chat-toggle');
    const chatPanel = page.locator('#chat-panel');
    
    // Initially closed
    await expect(chatPanel).not.toHaveClass(/visible/);
    
    // Open
    await chatToggle.click();
    await expect(chatPanel).toHaveClass(/visible/);
    
    // Close
    const closeButton = page.locator('#chat-close');
    await closeButton.click();
    await expect(chatPanel).not.toHaveClass(/visible/);
  });

  test('should have accessible chat toggle button', async ({ page }) => {
    await page.goto('/calculator/pricing-strategy');
    
    const chatToggle = page.locator('#chat-toggle');
    await expect(chatToggle).toBeVisible();
    await expect(chatToggle).toHaveAttribute('aria-label');
    await expect(chatToggle).toHaveAttribute('aria-controls', 'chat-panel');
  });

  test('should have proper ARIA attributes on chat panel', async ({ page }) => {
    await page.goto('/calculator/pricing-strategy');
    
    const chatPanel = page.locator('#chat-panel');
    await expect(chatPanel).toHaveAttribute('role', 'dialog');
    await expect(chatPanel).toHaveAttribute('aria-modal', 'true');
    await expect(chatPanel).toHaveAttribute('aria-labelledby');
  });

  test('should enable send button when text is entered', async ({ page }) => {
    await page.goto('/calculator/pricing-strategy');
    
    const chatToggle = page.locator('#chat-toggle');
    await chatToggle.click();
    
    const chatInput = page.locator('#chat-input');
    const sendButton = page.locator('#chat-send');
    
    // Initially disabled
    await expect(sendButton).toBeDisabled();
    
    // Enter text
    await chatInput.fill('Test message');
    
    // Should be enabled
    await expect(sendButton).toBeEnabled();
  });

  test('should show character counter', async ({ page }) => {
    await page.goto('/calculator/pricing-strategy');
    
    const chatToggle = page.locator('#chat-toggle');
    await chatToggle.click();
    
    const charCounter = page.locator('#chat-char-counter');
    await expect(charCounter).toBeVisible();
    await expect(charCounter).toContainText('0/2000');
    
    // Type something
    const chatInput = page.locator('#chat-input');
    await chatInput.fill('Test');
    
    // Counter should update
    await expect(charCounter).toContainText('4/2000');
  });
});

test.describe('Chat Panel for All Calculator Types', () => {
  const calculators = [
    { path: '/calculator/pricing-strategy', name: 'Pricing Strategy' },
    { path: '/calculator/amortization', name: /Mortgage|Loan/ },
    { path: '/calculator/auto-loan', name: 'Auto Loan' },
    { path: '/calculator/retirement', name: 'Retirement' },
    { path: '/calculator/savings-goal', name: 'Savings Goal' },
    { path: '/calculator/debt-payoff', name: 'Debt Payoff' },
    { path: '/calculator/student-loans', name: 'Student Loan' },
    { path: '/calculator/budget', name: 'Budget' },
    { path: '/calculator/break-even', name: 'Break-Even' },
    { path: '/calculator/saas-metrics', name: 'SaaS' },
    { path: '/ebitda-forecasting', name: 'EBITDA' },
    { path: '/lease-analysis', name: 'Lease' },
  ];

  calculators.forEach(({ path, name }) => {
    test(`should work on ${path}`, async ({ page }) => {
      await page.goto(path);
      
      // Chat toggle should be visible
      const chatToggle = page.locator('#chat-toggle');
      await expect(chatToggle).toBeVisible({ timeout: 5000 });
      
      // Click to open
      await chatToggle.click();
      
      // Panel should open
      const chatPanel = page.locator('#chat-panel');
      await expect(chatPanel).toHaveClass(/visible/, { timeout: 3000 });
      
      // Context indicator should show correct calculator
      const contextIndicator = page.locator('#context-indicator');
      await expect(contextIndicator).toContainText(name, { timeout: 2000 });
      
      // System message should be present
      const systemMessage = page.locator('.system-message');
      await expect(systemMessage).toBeVisible();
      
      // Should have examples
      await expect(systemMessage).toContainText(/(Set|Change|What if|Show)/i);
    });
  });
});

test.describe('Chat Panel Error Handling', () => {
  test('should handle empty messages gracefully', async ({ page }) => {
    await page.goto('/calculator/pricing-strategy');
    
    const chatToggle = page.locator('#chat-toggle');
    await chatToggle.click();
    
    const sendButton = page.locator('#chat-send');
    
    // Send button should be disabled for empty input
    await expect(sendButton).toBeDisabled();
  });

  test('should handle very long messages', async ({ page }) => {
    await page.goto('/calculator/pricing-strategy');
    
    const chatToggle = page.locator('#chat-toggle');
    await chatToggle.click();
    
    const chatInput = page.locator('#chat-input');
    const longMessage = 'a'.repeat(2000);
    await chatInput.fill(longMessage);
    
    const charCounter = page.locator('#chat-char-counter');
    await expect(charCounter).toContainText('2000/2000');
    
    // Should still be able to send
    const sendButton = page.locator('#chat-send');
    await expect(sendButton).toBeEnabled();
  });

  test('should not accept messages over limit', async ({ page }) => {
    await page.goto('/calculator/pricing-strategy');
    
    const chatToggle = page.locator('#chat-toggle');
    await chatToggle.click();
    
    const chatInput = page.locator('#chat-input');
    
    // Input has maxlength attribute
    await expect(chatInput).toHaveAttribute('maxlength', '2000');
  });
});

