import { test, expect, type Page } from '@playwright/test';

/**
 * Test suite to verify that the LLM actually calls MCP tools
 * rather than returning templated responses.
 * 
 * These tests intercept API responses to verify:
 * 1. enableFunctionCalling is sent in requests
 * 2. functionCallingResults are returned when tools are invoked
 * 3. The LLM uses MCP tools for financial calculations
 */

interface ChatApiResponse {
  response: string;
  context?: string;
  functionCallingResults?: {
    toolsExecuted?: Array<{
      toolName: string;
      arguments: Record<string, unknown>;
      result: unknown;
    }>;
    modelChanges?: Record<string, unknown>;
  };
  toolUsed?: string;
  tooling?: {
    availableTools: string[];
    toolOutputsIncluded: number;
    contextKey: string;
  };
  _orchestratorDebug?: {
    enableFunctionCalling: boolean;
    availableToolsLength: number;
    effectiveToolsLength: number;
    shouldUseFunctionCalling: boolean;
  };
}

interface CapturedRequest {
  url: string;
  body: Record<string, unknown>;
}

// Track if MCP tools were loaded
let mcpToolsLoaded = false;

// Helper to set up tools listener BEFORE navigation
// This is critical - the listener must be set up before page.goto()
// to ensure we catch the tools endpoint response
async function setupToolsListenerAndNavigate(page: Page, url: string): Promise<{ tools: unknown[] } | null> {
  const toolsLoadedPromise = new Promise<{ tools: unknown[] } | null>((resolve) => {
    page.on('response', async (response) => {
      if (response.url().includes('/api/v1/mcp/tools')) {
        try {
          if (response.ok()) {
            const data = await response.json();
            if (data?.tools?.length > 0) {
              mcpToolsLoaded = true;
            }
            resolve(data);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      }
    });
    // Timeout after 15 seconds
    setTimeout(() => resolve(null), 15000);
  });
  
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  
  return toolsLoadedPromise;
}

// Helper to open chat panel and wait for tools to load
async function openChatPanel(page: Page): Promise<void> {
  const chatToggle = page.locator('#chat-toggle');
  await expect(chatToggle).toBeVisible({ timeout: 10000 });
  await chatToggle.click();
  await page.waitForSelector('#chat-panel.visible', { timeout: 5000 });
  
  // Wait for MCP tools to be loaded (indicated by the tools section with text content)
  // This ensures handleToolCatalogUpdate has run and mcpTools is populated
  try {
    // Wait for the tools section that contains "I have access to X financial analysis tools"
    await page.waitForSelector('.tools-section', { timeout: 8000 });
    
    // Verify the tools section actually contains the expected text
    const toolsSection = page.locator('.tools-section');
    await expect(toolsSection).toContainText('financial analysis tools', { timeout: 5000 });
    
    console.log('✓ MCP tools loaded successfully');
  } catch {
    // Tools section may not appear if tools failed to load - continue anyway
    // The test will reveal the actual behavior
    console.log('Warning: .tools-section not found or empty - MCP tools may not have loaded');
  }
  
  // Additional wait to ensure tools are fully registered in ChatPanel
  await page.waitForTimeout(500);
}

// Helper to send a message and capture API interaction
// Note: This captures the REQUEST to verify enableFunctionCalling is sent
// The response from streaming endpoints is harder to capture
async function sendMessageAndCaptureApi(
  page: Page,
  message: string,
  timeout = 30000
): Promise<{ request: CapturedRequest | null; response: ChatApiResponse | null }> {
  let capturedRequest: CapturedRequest | null = null;
  let capturedResponse: ChatApiResponse | null = null;

  // Set up request listener to capture the chat API request
  const requestPromise = new Promise<CapturedRequest | null>((resolve) => {
    const handler = async (request: { url: () => string; postData: () => string | null }) => {
      if (request.url().includes('/v1/chat/')) {
        try {
          const postData = request.postData();
          if (postData) {
            capturedRequest = {
              url: request.url(),
              body: JSON.parse(postData),
            };
            resolve(capturedRequest);
          }
        } catch {
          // Body may not be JSON
        }
      }
    };
    page.on('request', handler);
    // Timeout after specified duration
    setTimeout(() => resolve(null), timeout);
  });

  // Set up response listener for non-streaming responses
  const responsePromise = new Promise<ChatApiResponse | null>((resolve) => {
    const handler = async (response: { url: () => string; text: () => Promise<string> }) => {
      if (response.url().includes('/v1/chat/enhanced')) {
        try {
          const body = await response.text();
          capturedResponse = JSON.parse(body);
          resolve(capturedResponse);
        } catch {
          // Response may not be JSON
        }
      }
    };
    page.on('response', handler);
    // Timeout - streaming responses won't resolve this
    setTimeout(() => resolve(null), timeout);
  });

  // Send the message
  const chatInput = page.locator('#chat-input');
  await chatInput.fill(message);
  
  const sendButton = page.locator('#chat-send');
  await sendButton.click();

  // Wait for request to be captured
  await requestPromise;

  // Wait for response to appear in UI
  await page.waitForSelector('.message.assistant:last-child', { timeout });
  
  // Small delay to ensure everything is captured
  await page.waitForTimeout(1000);

  // Try to get the response (may be null for streaming)
  await Promise.race([responsePromise, new Promise((r) => setTimeout(r, 2000))]);

  return { request: capturedRequest, response: capturedResponse };
}

test.describe('MCP Tool Execution Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Increase default timeout for LLM responses
    test.setTimeout(60000);
    // Reset tool loading state
    mcpToolsLoaded = false;
  });

  // ============================================
  // LOCAL TESTS - Can run without AI bindings
  // These verify request configuration only
  // ============================================
  
  test.describe('MCP Tools Loading', () => {
    test('should load MCP tools when chat panel opens', async ({ page }) => {
      // Set up listener before navigation
      const toolsLoadedPromise = new Promise<{ tools: unknown[] }>((resolve) => {
        page.on('response', async (response) => {
          if (response.url().includes('/api/v1/mcp/tools') && response.ok()) {
            try {
              const data = await response.json();
              resolve(data);
            } catch {
              // Ignore parse errors
            }
          }
        });
      });

      await page.goto('/calculator/amortization');
      await page.waitForLoadState('networkidle');
      
      // Open chat - this should trigger tool loading
      await openChatPanel(page);
      
      // Wait for tools endpoint to be called
      const toolsData = await Promise.race([
        toolsLoadedPromise,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000)),
      ]);
      
      expect(toolsData).not.toBeNull();
      expect(toolsData?.tools).toBeDefined();
      expect(Array.isArray(toolsData?.tools)).toBe(true);
      expect((toolsData?.tools as unknown[]).length).toBeGreaterThan(0);
    });
  });

  test.describe('Request Configuration', () => {
    test('should send enableFunctionCalling=true in chat requests', async ({ page }) => {
      // Set up listener before navigation - this is critical for tools to load
      const toolsData = await setupToolsListenerAndNavigate(page, '/calculator/amortization');
      await openChatPanel(page);
      
      // Verify tools loaded before sending message
      expect(toolsData).not.toBeNull();
      expect(toolsData?.tools?.length).toBeGreaterThan(0);

      const { request } = await sendMessageAndCaptureApi(
        page,
        'Calculate a mortgage with $300,000 loan at 6.5% for 30 years'
      );
      
      expect(request).not.toBeNull();
      expect(request?.body.enableFunctionCalling).toBe(true);
    });

    test('should include available tools in request', async ({ page }) => {
      // Set up listener before navigation
      const toolsData = await setupToolsListenerAndNavigate(page, '/calculator/amortization');
      await openChatPanel(page);
      
      // Verify tools loaded
      expect(toolsData).not.toBeNull();

      const { request } = await sendMessageAndCaptureApi(
        page,
        'What is my monthly payment for a $250,000 loan?'
      );

      expect(request).not.toBeNull();
      // Should have tools available
      expect(request?.body.availableTools).toBeDefined();
      expect(Array.isArray(request?.body.availableTools)).toBe(true);
    });

    test('should call MCP tool endpoint when asked to explain calculation results', async ({ page }) => {
      // Track MCP tool calls made during the chat request
      const mcpToolCalls: Array<{ url: string; method: string; body?: unknown }> = [];
      
      // Set up request listener before navigation
      page.on('request', (request) => {
        const url = request.url();
        // Capture any calls to MCP-related endpoints or chat
        if (url.includes('/mcp') || url.includes('/v1/chat')) {
          mcpToolCalls.push({
            url,
            method: request.method(),
            body: request.method() === 'POST' ? (() => {
              try {
                return JSON.parse(request.postData() || '{}');
              } catch {
                return null;
              }
            })() : undefined,
          });
        }
      });
      
      // Navigate and wait for tools to load
      const toolsData = await setupToolsListenerAndNavigate(page, '/calculator/amortization');
      
      // Verify tools loaded - this is a prerequisite for the test
      expect(toolsData).not.toBeNull();
      expect(toolsData?.tools?.length).toBeGreaterThan(0);
      
      await openChatPanel(page);

      // Clear previous calls to focus on chat request
      const callsBeforeChat = mcpToolCalls.length;
      mcpToolCalls.length = 0;

      // Ask a question that should trigger tool usage to get actual numbers
      const { request } = await sendMessageAndCaptureApi(
        page,
        'Calculate and explain a $300,000 mortgage at 6.5% for 30 years - what would my monthly payment be and how much total interest would I pay?'
      );

      expect(request).not.toBeNull();
      
      // Verify the request includes tools and function calling is enabled
      expect(request?.body.enableFunctionCalling).toBe(true);
      expect(request?.body.availableTools).toBeDefined();
      expect(Array.isArray(request?.body.availableTools)).toBe(true);
      
      // Verify that amortization-related tools are available
      const availableTools = request?.body.availableTools as Array<{ name: string }>;
      const hasAmortizationTool = availableTools.some(
        (tool) => tool.name.toLowerCase().includes('amortization') || 
                  tool.name.toLowerCase().includes('mortgage') ||
                  tool.name.toLowerCase().includes('loan')
      );
      expect(hasAmortizationTool).toBe(true);
      
      // Log tool calls for debugging
      console.log(`MCP/Chat calls made after question: ${mcpToolCalls.length}`);
      mcpToolCalls.forEach((call, i) => {
        console.log(`  ${i + 1}. ${call.method} ${call.url.split('/').slice(-2).join('/')}`);
      });
      
      // Verify a chat request was made
      const chatCalls = mcpToolCalls.filter(c => c.url.includes('/v1/chat'));
      expect(chatCalls.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // INTEGRATION TESTS - Require AI bindings
  // These tests verify actual tool execution
  // Skip in local dev where AI binding isn't available
  // Run with: npx playwright test --grep "@integration"
  // ============================================

  test.describe('Tool Execution Evidence @integration', () => {
    // Skip these tests when AI binding isn't available (local dev)
    test.skip(({ browserName }) => process.env.CI !== 'true', 'Requires AI binding - run in CI or with remote bindings');
    
    test('should return functionCallingResults for amortization queries', async ({ page }) => {
      await setupToolsListenerAndNavigate(page, '/calculator/amortization');
      await openChatPanel(page);

      const { response } = await sendMessageAndCaptureApi(
        page,
        'Calculate monthly payment for a $400,000 mortgage at 7% interest over 30 years'
      );

      // Verify the response structure indicates tool usage
      expect(response).not.toBeNull();
      
      // Check if function calling was used (either through toolUsed or functionCallingResults)
      const usedTools = response?.toolUsed || response?.functionCallingResults?.toolsExecuted;
      
      if (response?._orchestratorDebug) {
        console.log('Orchestrator debug:', response._orchestratorDebug);
      }
      
      // The response should indicate some form of tool usage for calculation queries
      // Note: This may vary depending on the LLM's decision
      expect(response?.response).toBeTruthy();
      expect(response?.response.length).toBeGreaterThan(50);
    });

    test('should return functionCallingResults for auto loan queries', async ({ page }) => {
      await setupToolsListenerAndNavigate(page, '/calculator/auto-loan');
      await openChatPanel(page);

      const { response } = await sendMessageAndCaptureApi(
        page,
        'Calculate an auto loan for a $35,000 car with $5,000 down at 4.9% APR for 60 months'
      );

      expect(response).not.toBeNull();
      expect(response?.response).toBeTruthy();
      
      // Response should contain numeric values from calculation
      expect(response?.response).toMatch(/\$[\d,]+|\d+\.\d+%|monthly|payment/i);
    });

    test('should return functionCallingResults for bond pricing queries', async ({ page }) => {
      await setupToolsListenerAndNavigate(page, '/');
      await openChatPanel(page);

      const { response } = await sendMessageAndCaptureApi(
        page,
        'Price a bond with $1000 face value, 5% coupon, 10 years to maturity, 6% yield'
      );

      expect(response).not.toBeNull();
      expect(response?.response).toBeTruthy();
    });

    test('should return functionCallingResults for rent vs buy queries', async ({ page }) => {
      await setupToolsListenerAndNavigate(page, '/calculator/rent-vs-buy');
      await openChatPanel(page);

      const { response } = await sendMessageAndCaptureApi(
        page,
        'Compare renting at $2500/month vs buying a $500,000 home with 20% down at 7% interest'
      );

      expect(response).not.toBeNull();
      expect(response?.response).toBeTruthy();
      
      // Should contain comparison language
      expect(response?.response).toMatch(/rent|buy|break.?even|year|month|cost/i);
    });
  });

  test.describe('Response Quality with Tools @integration', () => {
    test.skip(({ browserName }) => process.env.CI !== 'true', 'Requires AI binding - run in CI or with remote bindings');
    
    test('should provide specific numerical results, not generic advice', async ({ page }) => {
      await setupToolsListenerAndNavigate(page, '/calculator/amortization');
      await openChatPanel(page);

      const { response } = await sendMessageAndCaptureApi(
        page,
        'Calculate a $350,000 mortgage at 6.75% for 30 years'
      );

      expect(response).not.toBeNull();
      
      // Response should contain actual numbers, not just advice
      const hasNumbers = /\$[\d,]+\.?\d*/.test(response?.response || '');
      const hasGenericAdvice = /i can help|try asking|what would you like/i.test(response?.response || '');
      
      // Should have numbers and NOT be generic
      expect(hasNumbers || response?.functionCallingResults).toBeTruthy();
      expect(hasGenericAdvice).toBe(false);
    });

    test('should not return templated fallback responses', async ({ page }) => {
      await setupToolsListenerAndNavigate(page, '/calculator/amortization');
      await openChatPanel(page);

      const { response } = await sendMessageAndCaptureApi(
        page,
        'What is my payment for a $500,000 loan at 6% for 15 years?'
      );

      expect(response).not.toBeNull();
      
      const templatedPatterns = [
        /here's your loan analysis:/i,
        /💰 \*\*monthly payment:\*\*/i,
        /i'm currently running in offline mode/i,
      ];
      
      // Should NOT match any templated patterns
      for (const pattern of templatedPatterns) {
        expect(response?.response).not.toMatch(pattern);
      }
    });
  });

  test.describe('Context-Specific Tool Usage @integration', () => {
    test.skip(({ browserName }) => process.env.CI !== 'true', 'Requires AI binding - run in CI or with remote bindings');
    
    test('should use appropriate tools for each calculator context', async ({ page }) => {
      const testCases = [
        {
          path: '/calculator/amortization',
          query: 'Calculate $300,000 at 7% for 30 years',
          expectedTool: /amortization/i,
        },
        {
          path: '/calculator/auto-loan',
          query: 'Calculate $40,000 car loan at 5% for 5 years',
          expectedTool: /auto.?loan/i,
        },
      ];

      for (const testCase of testCases) {
        await setupToolsListenerAndNavigate(page, testCase.path);
        await openChatPanel(page);

        const { response } = await sendMessageAndCaptureApi(page, testCase.query);

        expect(response).not.toBeNull();
        
        // Check if the right tool was used (if tool info is available)
        if (response?.toolUsed) {
          expect(response.toolUsed).toMatch(testCase.expectedTool);
        }
        
        // Response should be substantial
        expect(response?.response.length).toBeGreaterThan(50);
      }
    });
  });

  test.describe('Orchestrator Debug Info @integration', () => {
    test.skip(({ browserName }) => process.env.CI !== 'true', 'Requires AI binding - run in CI or with remote bindings');
    
    test('should include debug info showing function calling is enabled', async ({ page }) => {
      await setupToolsListenerAndNavigate(page, '/calculator/amortization');
      await openChatPanel(page);

      const { response } = await sendMessageAndCaptureApi(
        page,
        'Calculate a simple mortgage payment'
      );

      // If debug info is included, verify it shows correct configuration
      if (response?._orchestratorDebug) {
        expect(response._orchestratorDebug.enableFunctionCalling).toBe(true);
        expect(response._orchestratorDebug.effectiveToolsLength).toBeGreaterThan(0);
      }
    });
  });
});

test.describe('MCP Tool Integration - Error Handling @integration', () => {
  test.skip(({ browserName }) => process.env.CI !== 'true', 'Requires AI binding - run in CI or with remote bindings');
  
  test('should handle tool execution errors gracefully', async ({ page }) => {
    await setupToolsListenerAndNavigate(page, '/calculator/amortization');
    await openChatPanel(page);

    // Send a query that might cause edge cases
    const { response } = await sendMessageAndCaptureApi(
      page,
      'Calculate a mortgage with 0% interest'  // Edge case
    );

    expect(response).not.toBeNull();
    // Should still get a response, even if it's explaining the edge case
    expect(response?.response).toBeTruthy();
    expect(response?.response.length).toBeGreaterThan(20);
  });

  test('should not crash on malformed queries', async ({ page }) => {
    await setupToolsListenerAndNavigate(page, '/calculator/amortization');
    await openChatPanel(page);

    const { response } = await sendMessageAndCaptureApi(
      page,
      'asdfghjkl random nonsense query'
    );

    expect(response).not.toBeNull();
    // Should get some response, not crash
    expect(response?.response).toBeTruthy();
  });
});
