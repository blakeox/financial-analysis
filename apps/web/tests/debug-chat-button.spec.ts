import { test, expect } from '@playwright/test';

test.describe('Debug Chat Button Click Issue', () => {
  test('investigate why button is not clickable', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
    });

    // Navigate to amortization page
    await page.goto('http://localhost:8788/amortization');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for chat panel to initialize
    await page.waitForTimeout(1000);
    
    // Find the button
    const button = page.locator('#chat-toggle');
    
    // Check if button exists
    await expect(button).toBeVisible();
    console.log('✅ Button is visible');
    
    // Get button properties
    const buttonBox = await button.boundingBox();
    console.log('Button bounding box:', buttonBox);
    
    const buttonStyles = await button.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        position: computed.position,
        zIndex: computed.zIndex,
        pointerEvents: computed.pointerEvents,
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        cursor: computed.cursor,
        userSelect: computed.userSelect,
      };
    });
    console.log('Button computed styles:', buttonStyles);
    
    // Check what element is at the button's center
    if (buttonBox) {
      const centerX = buttonBox.x + buttonBox.width / 2;
      const centerY = buttonBox.y + buttonBox.height / 2;
      
      const elementAtCenter = await page.evaluate(({ x, y }) => {
        const el = document.elementFromPoint(x, y);
        if (!el) return null;
        return {
          tag: el.tagName,
          id: el.id,
          className: el.className,
          isButton: el.id === 'chat-toggle',
        };
      }, { x: centerX, y: centerY });
      
      console.log('Element at button center:', elementAtCenter);
      
      if (!elementAtCenter?.isButton) {
        console.error('❌ BUTTON IS COVERED by:', elementAtCenter);
      } else {
        console.log('✅ Button is topmost element');
      }
    }
    
    // Try to click the button
    console.log('Attempting to click button...');
    
    try {
      // Try normal click
      await button.click({ timeout: 5000 });
      console.log('✅ Normal click succeeded');
    } catch (error) {
      const err = error as Error;
      console.error('❌ Normal click failed:', err.message);
      
      // Try force click
      try {
        await button.click({ force: true, timeout: 5000 });
        console.log('✅ Force click succeeded');
      } catch (forceError) {
        const fErr = forceError as Error;
        console.error('❌ Force click also failed:', fErr.message);
      }
    }
    
    // Check if panel opened
    const panel = page.locator('#chat-panel');
    const panelVisible = await panel.evaluate((el) => {
      return el.classList.contains('visible');
    });
    
    console.log('Panel visible after click?', panelVisible);
    
    // Try clicking via JavaScript
    console.log('Trying JavaScript click...');
    await button.evaluate((el: HTMLButtonElement) => el.click());
    await page.waitForTimeout(500);
    
    const panelVisibleAfterJS = await panel.evaluate((el) => {
      return el.classList.contains('visible');
    });
    console.log('Panel visible after JS click?', panelVisibleAfterJS);
    
    // Check for any overlays or blocking elements
    const blockingElements = await page.evaluate(() => {
      const elements: Array<{ tag: string; id: string; zIndex: string; pointerEvents: string }> = [];
      const allFixed = document.querySelectorAll('[style*="position: fixed"], [style*="position:fixed"]');
      allFixed.forEach((el) => {
        const computed = window.getComputedStyle(el);
        if (computed.position === 'fixed') {
          elements.push({
            tag: el.tagName,
            id: el.id || '(no id)',
            zIndex: computed.zIndex,
            pointerEvents: computed.pointerEvents,
          });
        }
      });
      return elements;
    });
    
    console.log('All fixed position elements:', blockingElements);
  });
  
  test('test mousedown and click events', async ({ page }) => {
    await page.goto('http://localhost:8788/amortization');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const button = page.locator('#chat-toggle');
    
    // Listen for mousedown events
    await page.evaluate(() => {
      const btn = document.getElementById('chat-toggle');
      if (btn) {
        btn.addEventListener('mousedown', (e) => {
          console.log('[TEST] Mousedown event fired!', e.type);
        });
        btn.addEventListener('click', (e) => {
          console.log('[TEST] Click event fired!', e.type);
        });
      }
    });
    
    console.log('Clicking button with Playwright...');
    await button.click();
    
    await page.waitForTimeout(500);
    
    // Check console logs
    const logs = await page.evaluate(() => {
      return 'Check browser console for event logs';
    });
    console.log(logs);
  });
});
