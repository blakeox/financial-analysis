import { test, expect } from '@playwright/test';

test.describe('Chat Stream Debug', () => {
  test('should stream response when sending a message', async ({ page }) => {
    // Listen for console messages
    page.on('console', (msg) => {
      console.log(`[Browser ${msg.type()}]`, msg.text());
    });

    // Capture SSE response body
    let responseChunks: string[] = [];
    
    // Listen for network requests
    page.on('request', (request) => {
      if (request.url().includes('/v1/chat')) {
        console.log(`[Network Request] ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', async (response) => {
      if (response.url().includes('/v1/chat/stream')) {
        console.log(`[Network Response] ${response.status()} ${response.url()}`);
        console.log(`[Network Response] Headers:`, response.headers());
        
        // Try to capture the response body
        try {
          const body = await response.text();
          console.log(`[Network Response] Body length: ${body.length}`);
          console.log(`[Network Response] Body preview: ${body.substring(0, 500)}`);
          responseChunks.push(body);
        } catch (e) {
          console.log(`[Network Response] Could not read body: ${e}`);
        }
      }
    });

    // Navigate to a page with chat
    await page.goto('/journey/');
    await page.waitForLoadState('networkidle');

    // Click the chat toggle button
    const chatToggle = page.locator('#chat-toggle');
    await expect(chatToggle).toBeVisible();
    console.log('[Test] Clicking chat toggle...');
    await chatToggle.click();

    // Wait for chat panel to be visible
    const chatPanel = page.locator('#chat-panel');
    await expect(chatPanel).toBeVisible();
    console.log('[Test] Chat panel is visible');

    // Find the input and type a message
    const chatInput = page.locator('#chat-input');
    await expect(chatInput).toBeVisible();
    console.log('[Test] Chat input is visible');

    await chatInput.fill('Hello');
    console.log('[Test] Filled input with "Hello"');

    // Listen for the stream request
    const streamRequestPromise = page.waitForRequest(
      (request) => request.url().includes('/v1/chat/stream'),
      { timeout: 10000 }
    ).catch(() => null);

    // Submit the form - the button is #chat-send not #send-btn
    const sendButton = page.locator('#chat-send');
    await expect(sendButton).toBeVisible();
    console.log('[Test] Send button is visible, clicking...');
    await sendButton.click();

    // Wait for the request
    const streamRequest = await streamRequestPromise;
    if (streamRequest) {
      console.log('[Test] Stream request made:', streamRequest.url());
      console.log('[Test] Request headers:', JSON.stringify(streamRequest.headers()));
      console.log('[Test] Request body:', streamRequest.postData());
    } else {
      console.log('[Test] ❌ No stream request was made within timeout!');
    }

    // Wait a bit and check for response in the chat
    await page.waitForTimeout(8000);

    // Log captured response chunks
    console.log(`[Test] Captured ${responseChunks.length} response chunk(s)`);

    // Check if there's an assistant message
    const assistantMessages = page.locator('.message.assistant .message-content');
    const count = await assistantMessages.count();
    console.log(`[Test] Found ${count} assistant messages`);

    if (count > 0) {
      const lastMessage = assistantMessages.last();
      const content = await lastMessage.textContent();
      console.log(`[Test] Last assistant message: "${content?.substring(0, 100)}..."`);
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: 'chat-debug.png', fullPage: true });
    console.log('[Test] Screenshot saved to chat-debug.png');
  });
});
