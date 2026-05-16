import { expect, test } from '@playwright/test';

test.describe('Chatbot Journey Integration', () => {
  test('should show journey-specific context in chatbot', async ({ page }) => {
    // Navigate to a journey page
    await page.goto('/journey/young-professional');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Open the chatbot to see the context indicator
    const chatToggle = page.locator('#chat-toggle');
    await chatToggle.click();

    // Check that the chatbot context indicator shows the journey name
    const contextIndicator = page.locator('#context-indicator');
    await expect(contextIndicator).toBeVisible();
    await expect(contextIndicator).toHaveText('Young Professional Journey');
  });

  test('should update chatbot context when switching between journeys', async ({ page }) => {
    // Start on Young Professional Journey
    await page.goto('/journey/young-professional');
    await page.waitForLoadState('networkidle');

    // Open chatbot
    await page.locator('#chat-toggle').click();

    let contextIndicator = page.locator('#context-indicator');
    await expect(contextIndicator).toHaveText('Young Professional Journey');

    // Close chatbot
    await page.locator('#chat-close').click();

    // Navigate to Family Planning Journey
    await page.goto('/journey/family-planning');
    await page.waitForLoadState('networkidle');

    // Open chatbot again
    await page.locator('#chat-toggle').click();

    contextIndicator = page.locator('#context-indicator');
    await expect(contextIndicator).toHaveText('Family Planning Journey');
  });

  test('should provide journey context to chatbot', async ({ page }) => {
    // Navigate to a journey page
    await page.goto('/journey/home-buying');
    await page.waitForLoadState('networkidle');

    // Check that journey context is available in the global scope
    const journeyContext = await page.evaluate(() => {
      return (window as any).currentJourney;
    });

    expect(journeyContext).toBeTruthy();
    expect(journeyContext.id).toBe('home-buying');
    expect(journeyContext.title).toBe('Home Buying Journey');
    expect(journeyContext.models).toBeInstanceOf(Array);
    expect(journeyContext.workflowSteps).toBeInstanceOf(Array);
  });

  test('should show appropriate context for different journey types', async ({ page }) => {
    // Test Home Buying Journey (should map to amortization context)
    await page.goto('/journey/home-buying');
    await page.waitForLoadState('networkidle');

    await page.locator('#chat-toggle').click();
    const contextIndicator = page.locator('#context-indicator');
    await expect(contextIndicator).toHaveText('Home Buying Journey');

    // Close chatbot
    await page.locator('#chat-close').click();

    // Test Young Professional Journey (should map to general context)
    await page.goto('/journey/young-professional');
    await page.waitForLoadState('networkidle');

    await page.locator('#chat-toggle').click();
    await expect(contextIndicator).toHaveText('Young Professional Journey');
  });

  test('should maintain chatbot functionality on journey pages', async ({ page }) => {
    // Navigate to a journey page
    await page.goto('/journey/investment-portfolio');
    await page.waitForLoadState('networkidle');

    // Open the chatbot
    const chatToggle = page.locator('#chat-toggle');
    await chatToggle.click();

    // Check that the chat panel is visible
    const chatPanel = page.locator('#chat-panel');
    await expect(chatPanel).toBeVisible();

    // Check that the context indicator shows the journey
    const contextIndicator = page.locator('#context-indicator');
    await expect(contextIndicator).toHaveText('Investment Portfolio Build');

    // Check that the input field is available
    const chatInput = page.locator('#chat-input');
    await expect(chatInput).toBeVisible();
    await expect(chatInput).toBeEnabled();
  });
});
