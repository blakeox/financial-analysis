import { expect, test, type Page } from '@playwright/test';

type ToolDefinition = {
  name: string;
};

type ToolCatalogResponse = {
  tools: ToolDefinition[];
};

type ChatRequestBody = {
  message?: string;
  enableFunctionCalling?: boolean;
  availableTools?: ToolDefinition[];
  conversationHistory?: unknown[];
  history?: unknown[];
};

async function stubChatTransport(page: Page): Promise<void> {
  await page.route('**/v1/chat/stream', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: ['data: {"token":"Stubbed chat response."}', '', 'data: [DONE]', ''].join('\n'),
    });
  });

  await page.route('**/v1/chat/enhanced', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        response: 'Stubbed chat response.',
      }),
    });
  });
}

async function loadEmbeddedChatAndTools(page: Page, path: string): Promise<ToolCatalogResponse> {
  const toolsResponsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/v1/mcp/tools') && response.ok()
  );

  await page.goto(path);
  await page.waitForLoadState('networkidle');

  const chatPanel = page.locator('#chat-panel[data-chat-variant="embedded"]');
  await expect(chatPanel).toBeVisible();

  const toolsResponse = await toolsResponsePromise;
  return (await toolsResponse.json()) as ToolCatalogResponse;
}

async function sendMessageAndCaptureChatRequest(
  page: Page,
  message: string
): Promise<ChatRequestBody> {
  const assistantMessageCount = await page.locator('.message.assistant').count();
  const requestPromise = page.waitForRequest(
    (request) => request.url().includes('/v1/chat/') && request.method() === 'POST'
  );

  const chatInput = page.locator('#chat-input');
  await chatInput.fill(message);
  await chatInput.press('Enter');

  const request = await requestPromise;

  await page.waitForFunction(
    (count) => document.querySelectorAll('.message.assistant').length > count,
    assistantMessageCount
  );

  return JSON.parse(request.postData() || '{}') as ChatRequestBody;
}

function toolNames(tools: ToolDefinition[] | undefined): string[] {
  return (tools ?? []).map((tool) => tool.name.toLowerCase());
}

test.describe('Chat MCP request contracts', () => {
  test.beforeEach(async ({ page }) => {
    await stubChatTransport(page);
  });

  test('loads MCP tools when the chat panel opens', async ({ page }) => {
    const toolsData = await loadEmbeddedChatAndTools(page, '/calculator/amortization');

    expect(Array.isArray(toolsData.tools)).toBe(true);
    expect(toolsData.tools.length).toBeGreaterThan(0);
    expect(toolNames(toolsData.tools)).toEqual(
      expect.arrayContaining([
        'calculate_capm',
        'analyze_risk_adjusted_returns',
        'calculate_npv_irr',
      ])
    );
  });

  test('sends function-calling configuration with the tool catalog', async ({ page }) => {
    await loadEmbeddedChatAndTools(page, '/calculator/amortization');

    const requestBody = await sendMessageAndCaptureChatRequest(
      page,
      'Calculate a $300,000 mortgage at 6.5% for 30 years'
    );

    expect(requestBody.enableFunctionCalling).toBe(true);
    expect(Array.isArray(requestBody.availableTools)).toBe(true);
    expect((requestBody.availableTools ?? []).length).toBeGreaterThan(0);

    const names = toolNames(requestBody.availableTools);
    expect(
      names.some(
        (name) =>
          name.includes('amortization') || name.includes('mortgage') || name.includes('loan')
      )
    ).toBe(true);
  });

  test('keeps context-appropriate tool catalogs when switching calculators', async ({ page }) => {
    await loadEmbeddedChatAndTools(page, '/calculator/amortization');
    const amortizationRequest = await sendMessageAndCaptureChatRequest(
      page,
      'Show my payment for a $250,000 mortgage'
    );

    await loadEmbeddedChatAndTools(page, '/calculator/auto-loan');
    const autoLoanRequest = await sendMessageAndCaptureChatRequest(
      page,
      'Calculate a $35,000 auto loan for 60 months'
    );

    const amortizationNames = toolNames(amortizationRequest.availableTools);
    const autoLoanNames = toolNames(autoLoanRequest.availableTools);

    expect(
      amortizationNames.some(
        (name) =>
          name.includes('amortization') || name.includes('mortgage') || name.includes('loan')
      )
    ).toBe(true);
    expect(
      autoLoanNames.some(
        (name) => name.includes('auto') || name.includes('vehicle') || name.includes('loan')
      )
    ).toBe(true);
  });

  test('keeps function calling enabled across follow-up requests', async ({ page }) => {
    await loadEmbeddedChatAndTools(page, '/calculator/amortization');

    const firstRequest = await sendMessageAndCaptureChatRequest(
      page,
      'What is my monthly payment for a $300,000 mortgage?'
    );
    const secondRequest = await sendMessageAndCaptureChatRequest(page, 'What if I put 20% down?');

    expect(firstRequest.enableFunctionCalling).toBe(true);
    expect(secondRequest.enableFunctionCalling).toBe(true);
    expect((firstRequest.availableTools ?? []).length).toBeGreaterThan(0);
    expect((secondRequest.availableTools ?? []).length).toBeGreaterThan(0);
  });
});
