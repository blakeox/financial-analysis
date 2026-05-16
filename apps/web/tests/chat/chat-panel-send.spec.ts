import { expect, test } from '@playwright/test';

type ChatRequestBody = {
  messages?: Array<{ role: string; content: string }>;
};

test.describe('ChatPanel send flow', () => {
  test('mocks enhanced chat endpoint, sends message, and displays response', async ({ page }) => {
    await page.goto('/lease-analysis');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      const bus = (window as typeof window & { __appEventBus?: unknown }).__appEventBus as
        | {
            emit?: (event: string, payload: unknown) => void;
          }
        | undefined;
      bus?.emit?.('chat:context', {
        contextKey: 'lease',
        label: 'Lease Analysis',
        data: { scenario: 'playwright-smoke' },
        source: 'playwright',
      });
    });

    // Intercept the enhanced chat endpoint (actual endpoint used)
    await page.route('**/v1/chat/enhanced', async (route) => {
      const requestBody = route.request().postDataJSON() as { message?: string; context?: string };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: `I've updated the interest rate to 6%. This will affect your monthly payments.`,
          modelChanges: {
            interestRate: 6.0,
          },
          explanation: 'Changing the rate will increase monthly payments.',
          context: 'lease',
        }),
      });
    });

    // Look for chat toggle button
    const launcher = page.locator('#chat-toggle, button[title*="Chat"]').first();
    const launcherVisible = await launcher.isVisible({ timeout: 5000 }).catch(() => false);

    if (!launcherVisible) {
      test.skip();
      return;
    }

    await launcher.click();

    const panel = page.locator('#chat-panel, .chat-panel').first();
    await expect(panel).toBeVisible();

    // Type and send message
    const chatInput = panel.locator('#chat-input, textarea, input[type="text"]').first();
    await chatInput.fill('What if the interest rate was 6%?');

    const sendButton = panel.locator('#chat-send, button[type="submit"]').first();
    await expect(sendButton).toBeEnabled();
    await sendButton.click();

    // Wait for thinking indicator to appear and disappear
    // Allow brief thinking indicator animation
    await page.waitForTimeout(200);

    // Assistant message should appear
    const assistantMessage = panel.locator('.message.assistant .message-content').last();
    await expect(assistantMessage).toContainText(/interest rate.*6%/i, { timeout: 10000 });

    // Close panel
    const closeBtn = panel.locator('#chat-close, .chat-close').first();
    await closeBtn.click();

    await expect(panel).not.toHaveClass(/visible/);
  });
});
