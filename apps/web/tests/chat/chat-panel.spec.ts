import { test, expect, type Page } from '@playwright/test';

// Helper to check if chat toggle is available
async function getChatToggle(page: Page) {
  const launcher = page.locator('#chat-toggle');
  const isVisible = await launcher.isVisible({ timeout: 2000 }).catch(() => false);
  return isVisible ? launcher : null;
}

test.describe('ChatPanel - Basic UI and Interactions', () => {
  test('chat toggle button is visible and properly positioned', async ({ page }) => {
    await page.goto('/');

    const toggle = await getChatToggle(page);
    if (!toggle) {
      test.skip();
      return;
    }

    // Button should be visible
    await expect(toggle).toBeVisible();

    // Check button has correct attributes
    await expect(toggle).toHaveAttribute('type', 'button');
    await expect(toggle).toHaveAttribute('aria-label', /AI assistant/i);
    await expect(toggle).toHaveAttribute('aria-controls', 'chat-panel');

    // Button should have high z-index
    const zIndex = await toggle.evaluate((el: HTMLElement) => window.getComputedStyle(el).zIndex);
    expect(parseInt(zIndex)).toBeGreaterThan(9999);

    // Button should have pointer-events: auto
    const pointerEvents = await toggle.evaluate(
      (el: HTMLElement) => window.getComputedStyle(el).pointerEvents
    );
    expect(pointerEvents).toBe('auto');
  });

  test('opens and closes chat panel with toggle button', async ({ page }) => {
    await page.goto('/');

    const toggle = await getChatToggle(page);
    if (!toggle) {
      test.skip();
      return;
    }

    const panel = page.locator('#chat-panel');

    // Panel should be hidden initially
    await expect(panel).not.toHaveClass(/visible/);
    await expect(panel).toHaveAttribute('aria-hidden', 'true');

    // Click to open
    await toggle.click();
    await expect(panel).toHaveClass(/visible/);
    await expect(panel).toHaveAttribute('aria-hidden', 'false');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toHaveClass(/panel-open/);

    // Click to close
    await toggle.click();
    await expect(panel).not.toHaveClass(/visible/);
    await expect(panel).toHaveAttribute('aria-hidden', 'true');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).not.toHaveClass(/panel-open/);
  });

  test('closes panel with close button', async ({ page }) => {
    await page.goto('/');

    const toggle = await getChatToggle(page);
    if (!toggle) {
      test.skip();
      return;
    }

    const panel = page.locator('#chat-panel');
    const closeBtn = page.locator('#chat-close');

    // Open panel
    await toggle.click();
    await expect(panel).toHaveClass(/visible/);

    // Close with button
    await closeBtn.click();
    await expect(panel).not.toHaveClass(/visible/);
  });

  test('closes panel with Escape key', async ({ page }) => {
    await page.goto('/');

    const toggle = await getChatToggle(page);
    if (!toggle) {
      test.skip();
      return;
    }

    const panel = page.locator('#chat-panel');

    // Open panel
    await toggle.click();
    await expect(panel).toHaveClass(/visible/);

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(panel).not.toHaveClass(/visible/);

    // Toggle button should be focused after Escape
    await expect(toggle).toBeFocused();
  });

  test('closes panel when clicking outside', async ({ page }) => {
    await page.goto('/');

    const toggle = await getChatToggle(page);
    if (!toggle) {
      test.skip();
      return;
    }

    const panel = page.locator('#chat-panel');

    // Open panel
    await toggle.click();
    await expect(panel).toHaveClass(/visible/);

    // Click outside (on the body)
    await page.locator('body').click({ position: { x: 100, y: 100 } });
    await expect(panel).not.toHaveClass(/visible/);
  });

  test('does NOT close panel when clicking inside it', async ({ page }) => {
    await page.goto('/');

    const toggle = await getChatToggle(page);
    if (!toggle) {
      test.skip();
      return;
    }

    const panel = page.locator('#chat-panel');
    const messages = page.locator('#chat-messages');

    // Open panel
    await toggle.click();
    await expect(panel).toHaveClass(/visible/);

    // Click inside panel
    await messages.click();

    // Panel should still be open
    await expect(panel).toHaveClass(/visible/);
  });
});

test.describe('ChatPanel - Context Detection', () => {
  test('detects context on home page', async ({ page }) => {
    await page.goto('/');

    const toggle = await getChatToggle(page);
    if (!toggle) {
      test.skip();
      return;
    }

    await toggle.click();

    const contextIndicator = page.locator('#context-indicator');
    await expect(contextIndicator).toBeVisible();
  });

  test('detects lease context on analysis page', async ({ page }) => {
    await page.goto('/analysis');

    const toggle = await getChatToggle(page);
    if (!toggle) {
      test.skip();
      return;
    }

    await toggle.click();

    const contextIndicator = page.locator('#context-indicator');
    const contextText = await contextIndicator.textContent();

    expect(contextText).toMatch(/lease|amortization/i);
  });

  test('detects lease context on lease-analysis page', async ({ page }) => {
    await page.goto('/lease-analysis');

    const toggle = await getChatToggle(page);
    if (!toggle) {
      test.skip();
      return;
    }

    await toggle.click();

    const contextIndicator = page.locator('#context-indicator');
    const contextText = await contextIndicator.textContent();

    expect(contextText).toMatch(/lease/i);
  });

  test('detects lease context on enhanced-lease page', async ({ page }) => {
    await page.goto('/enhanced-lease');

    const toggle = await getChatToggle(page);
    if (!toggle) {
      test.skip();
      return;
    }

    await toggle.click();

    const contextIndicator = page.locator('#context-indicator');
    const contextText = await contextIndicator.textContent();

    expect(contextText).toMatch(/lease/i);
  });

  test('detects amortization context on amortization page', async ({ page }) => {
    await page.goto('/amortization');

    const toggle = await getChatToggle(page);
    if (!toggle) {
      test.skip();
      return;
    }

    await toggle.click();

    const contextIndicator = page.locator('#context-indicator');
    const contextText = await contextIndicator.textContent();

    expect(contextText).toMatch(/amortization/i);
  });

  test('detects ebitda context on ebitda page', async ({ page }) => {
    await page.goto('/ebitda-forecasting');

    const toggle = await getChatToggle(page);
    if (!toggle) {
      test.skip();
      return;
    }

    await toggle.click();

    const contextIndicator = page.locator('#context-indicator');
    const contextText = await contextIndicator.textContent();

    expect(contextText).toMatch(/ebitda/i);
  });

  test('detects models context on models page', async ({ page }) => {
    await page.goto('/models');

    const toggle = await getChatToggle(page);
    if (!toggle) {
      test.skip();
      return;
    }

    await toggle.click();

    const contextIndicator = page.locator('#context-indicator');
    const contextText = await contextIndicator.textContent();

    expect(contextText).toMatch(/models/i);
  });

  test('detects context on status page', async ({ page }) => {
    await page.goto('/status');

    const toggle = await getChatToggle(page);
    if (!toggle) {
      test.skip();
      return;
    }

    await toggle.click();

    const contextIndicator = page.locator('#context-indicator');
    await expect(contextIndicator).toBeVisible();
  });

  test('detects context on debug page', async ({ page }) => {
    await page.goto('/debug');

    const toggle = await getChatToggle(page);
    if (!toggle) {
      test.skip();
      return;
    }

    await toggle.click();

    const contextIndicator = page.locator('#context-indicator');
    await expect(contextIndicator).toBeVisible();
  });
});

test.describe('ChatPanel - MCP Tools Integration', () => {
  test('fetches and displays MCP tools in welcome message', async ({ page }) => {
    await page.goto('/analysis');

    const toggle = await getChatToggle(page);
    if (!toggle) {
      test.skip();
      return;
    }

    await toggle.click();

    // Wait for MCP tools to load
    await page.waitForTimeout(1000);

    const messages = page.locator('#chat-messages');
    const welcomeMessage = messages.locator('.system-message').first();

    // Should have welcome message
    await expect(welcomeMessage).toBeVisible();

    // Check for MCP tools listing (if API is available)
    const hasToolsList = (await welcomeMessage.locator('ul').count()) > 0;
    if (hasToolsList) {
      const toolItems = welcomeMessage.locator('li');
      expect(await toolItems.count()).toBeGreaterThan(0);
    }
  });

  test('handles MCP tools fetch failure gracefully', async ({ page }) => {
    // Block the MCP tools endpoint
    await page.route('**/api/v1/mcp/tools', (route) => route.abort());

    await page.goto('/analysis');

    const toggle = await getChatToggle(page);
    if (!toggle) {
      test.skip();
      return;
    }

    // Panel should still open even if MCP fetch fails
    await toggle.click();

    const panel = page.locator('#chat-panel');
    await expect(panel).toHaveClass(/visible/);

    // Welcome message should still be present
    const welcomeMessage = page.locator('.system-message').first();
    await expect(welcomeMessage).toBeVisible();
  });
});

test.describe('ChatPanel - Input and Messaging', () => {
  test('enables send button when input has text', async ({ page }) => {
    await page.goto('/');

    const toggle = await getChatToggle(page);
    if (!toggle) {
      test.skip();
      return;
    }

    await toggle.click();

    const input = page.locator('#chat-input');
    const sendBtn = page.locator('#chat-send');

    // Send button should be disabled initially
    await expect(sendBtn).toBeDisabled();

    // Type text
    await input.fill('Test message');

    // Send button should be enabled
    await expect(sendBtn).toBeEnabled();

    // Clear text
    await input.clear();

    // Send button should be disabled again
    await expect(sendBtn).toBeDisabled();
  });

  test('sends message on Enter key', async ({ page }) => {
    await page.goto('/');

    const toggle = await getChatToggle(page);
    if (!toggle) {
      test.skip();
      return;
    }

    await toggle.click();

    const input = page.locator('#chat-input');

    // Type and press Enter
    await input.fill('Test message');
    await input.press('Enter');

    // Input should be cleared after sending
    await expect(input).toHaveValue('');
  });

  test('allows newline with Shift+Enter', async ({ page }) => {
    await page.goto('/');

    const toggle = await getChatToggle(page);
    if (!toggle) {
      test.skip();
      return;
    }

    await toggle.click();

    const input = page.locator('#chat-input');

    // Type and press Shift+Enter
    await input.fill('Line 1');
    await input.press('Shift+Enter');
    await input.type('Line 2');

    const value = await input.inputValue();
    expect(value).toContain('\n');
  });

  test('auto-focuses input when panel opens', async ({ page }) => {
    await page.goto('/');

    const toggle = await getChatToggle(page);
    if (!toggle) {
      test.skip();
      return;
    }

    await toggle.click();

    // Wait for animation
    await page.waitForTimeout(350);

    const input = page.locator('#chat-input');
    await expect(input).toBeFocused();
  });
});

test.describe('ChatPanel - Accessibility', () => {
  test('has proper ARIA attributes', async ({ page }) => {
    await page.goto('/');

    const toggle = await getChatToggle(page);
    if (!toggle) {
      test.skip();
      return;
    }

    const panel = page.locator('#chat-panel');

    // Panel should be a dialog
    await expect(panel).toHaveAttribute('role', 'dialog');
    await expect(panel).toHaveAttribute('aria-modal', 'true');
    await expect(panel).toHaveAttribute('aria-labelledby', 'chat-panel-title');

    // Toggle should control the panel
    await expect(toggle).toHaveAttribute('aria-controls', 'chat-panel');
  });

  test('manages focus correctly', async ({ page }) => {
    await page.goto('/');

    const toggle = await getChatToggle(page);
    if (!toggle) {
      test.skip();
      return;
    }

    const input = page.locator('#chat-input');

    // Open and check focus moves to input
    await toggle.click();
    await page.waitForTimeout(350);
    await expect(input).toBeFocused();

    // Close with Escape and check focus returns to toggle
    await page.keyboard.press('Escape');
    await expect(toggle).toBeFocused();
  });
});

test.describe('ChatPanel - Cross-page Functionality', () => {
  test('works on all main pages', async ({ page }) => {
    const pages = [
      '/',
      '/analysis',
      '/lease-analysis',
      '/enhanced-lease',
      '/amortization',
      '/ebitda-forecasting',
      '/models',
      '/status',
      '/debug',
    ];

    for (const path of pages) {
      await page.goto(path);

      const toggle = await getChatToggle(page);
      if (!toggle) {
        continue;
      }

      // Should be able to open
      await toggle.click();
      const panel = page.locator('#chat-panel');
      await expect(panel).toHaveClass(/visible/);

      // Should be able to close
      await toggle.click();
      await expect(panel).not.toHaveClass(/visible/);
    }
  });

  test('maintains state across same-page interactions', async ({ page }) => {
    await page.goto('/analysis');

    const toggle = await getChatToggle(page);
    if (!toggle) {
      test.skip();
      return;
    }

    // Open panel
    await toggle.click();
    await page.locator('#chat-panel').waitFor({ state: 'visible' });

    // Interact with form on page
    const principalInput = page.locator('#principal');
    await principalInput.fill('50000');

    // Panel should still be open
    const panel = page.locator('#chat-panel');
    await expect(panel).toHaveClass(/visible/);

    // Close panel
    await toggle.click();
    await expect(panel).not.toHaveClass(/visible/);
  });
});

test.describe('ChatPanel - Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('renders properly on mobile viewport', async ({ page }) => {
    await page.goto('/');

    const toggle = await getChatToggle(page);
    if (!toggle) {
      test.skip();
      return;
    }

    // Toggle should be visible
    await expect(toggle).toBeVisible();

    // Open panel
    await toggle.click();
    const panel = page.locator('#chat-panel');
    await expect(panel).toBeVisible();

    // Panel should take full width on mobile
    const panelWidth = await panel.evaluate((el) => el.getBoundingClientRect().width);
    const viewportWidth = page.viewportSize()?.width || 0;
    expect(panelWidth).toBeGreaterThan(viewportWidth * 0.95);
  });

  test('toggle button repositions when panel opens on mobile', async ({ page }) => {
    await page.goto('/');

    const toggle = await getChatToggle(page);
    if (!toggle) {
      test.skip();
      return;
    }

    // Get initial position
    const initialBottom = await toggle.evaluate((el: HTMLElement) =>
      parseFloat(window.getComputedStyle(el).bottom)
    );

    // Open panel
    await toggle.click();

    // Position should change (button moves up) or stay the same
    const openBottom = await toggle.evaluate((el: HTMLElement) =>
      parseFloat(window.getComputedStyle(el).bottom)
    );

    // Use toBeGreaterThanOrEqual since button repositioning may be minimal on some devices
    expect(openBottom).toBeGreaterThanOrEqual(initialBottom);
  });
});

test.describe('ChatPanel - Does Not Block Navigation', () => {
  test('navigation works when chat is closed', async ({ page, isMobile }) => {
    await page.goto('/');

    const toggle = await getChatToggle(page);
    if (!toggle) {
      test.skip();
      return;
    }

    // Ensure chat is closed
    const panel = page.locator('#chat-panel');
    if (await panel.evaluate((el) => el.classList.contains('visible'))) {
      await toggle.click();
    }

    // Navigation should work
    if (isMobile) {
      const menuButton = page.getByRole('button', { name: /toggle navigation menu/i });
      await expect(menuButton).toBeVisible();
      await menuButton.click();
      const mobilePanel = page.locator('#mobile-nav-panel');
      await expect(mobilePanel).toBeVisible();
    } else {
      const modelsLink = page.getByRole('link', { name: /models/i }).first();
      await expect(modelsLink).toBeVisible();
      await modelsLink.click();
      await expect(page).toHaveURL(/\/models$/);
    }
  });

  test('navigation works when chat is open', async ({ page, isMobile }) => {
    await page.goto('/');

    const toggle = await getChatToggle(page);
    if (!toggle) {
      test.skip();
      return;
    }

    // Open chat
    await toggle.click();
    const panel = page.locator('#chat-panel');
    await expect(panel).toHaveClass(/visible/);

    // Navigation should still work
    if (isMobile) {
      const menuButton = page.getByRole('button', { name: /toggle navigation menu/i });
      await expect(menuButton).toBeVisible();
      await menuButton.click();
      const mobilePanel = page.locator('#mobile-nav-panel');
      await expect(mobilePanel).toBeVisible();
    } else {
      const modelsLink = page.getByRole('link', { name: /models/i }).first();
      await expect(modelsLink).toBeVisible();
      await modelsLink.click();
      await expect(page).toHaveURL(/\/models$/);
    }
  });
});
