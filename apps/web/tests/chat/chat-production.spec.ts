import { test, expect } from '@playwright/test';

// Skip the webServer - we're testing production directly
test.use({ baseURL: 'https://fanalyx.com' });

test('chat stream works on production', async ({ page }) => {
  // Collect network requests
  const streamRequests: { url: string; status: number; body: string }[] = [];
  
  page.on('response', async (response) => {
    if (response.url().includes('/v1/chat/stream')) {
      const body = await response.text().catch(() => '(failed to read body)');
      streamRequests.push({
        url: response.url(),
        status: response.status(),
        body: body.substring(0, 500),
      });
      console.log('Stream response:', {
        status: response.status(),
        bodyPreview: body.substring(0, 200),
      });
    }
  });

  // Listen for console messages
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('ChatPanel') || text.includes('ChatTransport') || text.includes('chunk') || text.includes('token') || text.includes('Stream')) {
      console.log(`[Browser] ${text}`);
    }
  });

  // Go to production site
  await page.goto('https://fanalyx.com/calculators');
  
  // Wait for page to be ready (not networkidle as SSE keeps connection)
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);  // Give scripts time to initialize
  
  // Find and click the chat toggle button
  const chatToggle = page.locator('#chat-toggle');
  await expect(chatToggle).toBeVisible({ timeout: 10000 });
  await chatToggle.click();
  
  // Wait for chat panel to open
  await page.waitForTimeout(500);
  
  // Type a message
  const chatInput = page.locator('#chat-input');
  await expect(chatInput).toBeVisible({ timeout: 5000 });
  await chatInput.fill('Hello');
  
  // Send the message
  const sendButton = page.locator('#chat-send');
  await sendButton.click();
  
  // Wait for the response to stream
  await page.waitForTimeout(5000);
  
  // Check for assistant message
  const assistantMessages = page.locator('.chat-message.assistant .message-content');
  const count = await assistantMessages.count();
  console.log('Assistant message count:', count);
  
  if (count > 0) {
    const lastMessage = assistantMessages.last();
    const content = await lastMessage.textContent();
    console.log('Last assistant message:', content?.substring(0, 200));
  }
  
  // Check network requests
  console.log('Stream requests made:', streamRequests.length);
  for (const req of streamRequests) {
    console.log('Request:', req);
  }
  
  // Verify we got a response
  expect(streamRequests.length).toBeGreaterThan(0);
  expect(streamRequests[0].status).toBe(200);
  expect(streamRequests[0].body).toContain('data:');
});
