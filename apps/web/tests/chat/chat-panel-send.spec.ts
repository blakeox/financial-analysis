import { expect, test } from '@playwright/test';

type ChatRequestBody = {
  messages?: Array<{ role: string; content: string }>;
};

test.describe('ChatPanel send flow', () => {
  test('mocks enhanced chat endpoint, sends message, and displays response', async ({ page }) => {
    await page.goto('/status');
    await page.waitForLoadState('networkidle');

    await page.route('**/v1/chat/stream', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: [
          'data: {"token":"The status page is healthy. "}',
          '',
          'data: {"token":"Storage is below the hard limit and uploads remain available."}',
          '',
          'data: [DONE]',
          '',
        ].join('\n'),
      });
    });

    const launcher = page.locator('#chat-toggle');
    await expect(launcher).toBeVisible();
    await launcher.click();

    const panel = page.locator('#chat-panel');
    await expect(panel).toHaveClass(/visible/);

    // Type and send message
    const chatInput = panel.locator('#chat-input');
    await chatInput.fill('What is the current storage status?');

    const sendButton = panel.locator('#chat-send');
    await expect(sendButton).toBeEnabled();
    await sendButton.click();

    // Assistant message should appear
    const assistantMessage = panel.locator('.message.assistant .message-content').last();
    await expect(assistantMessage).toContainText(/storage is below the hard limit/i, {
      timeout: 10000,
    });

    // Close panel
    const closeBtn = panel.locator('#chat-close');
    await closeBtn.click();

    await expect(panel).not.toHaveClass(/visible/);
  });
});
