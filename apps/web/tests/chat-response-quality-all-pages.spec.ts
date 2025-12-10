import { test, expect } from '@playwright/test';
import {
  TEST_PAGES,
  isGenericResponse,
  isHelpfulResponse,
  openChatPanel,
  sendChatMessage,
  getSystemMessage,
} from './helpers/chat-test-helpers.js';

/**
 * Comprehensive test that checks chat response quality on ALL pages
 * This test dynamically iterates through all major pages and verifies:
 * 1. System messages are not generic
 * 2. Responses to common questions are helpful
 * 3. Field updates work on appropriate pages
 */

test.describe('Chat Response Quality - All Pages Dynamic Test', () => {
  // Test each page type
  for (const pageInfo of TEST_PAGES) {
    test.describe(`${pageInfo.name} (${pageInfo.path})`, () => {
      test('system message should not be generic', async ({ page }) => {
        await page.goto(pageInfo.path);
        await page.waitForLoadState('networkidle');
        
        // Skip if page doesn't exist (404)
        const title = await page.title();
        const is404 = title.includes('404') || title.includes('Not Found') || 
                      (await page.locator('body').textContent())?.includes('404');
        
        test.skip(is404, `Page ${pageInfo.path} returns 404`);
        
        await openChatPanel(page);
        
        const systemText = await getSystemMessage(page);
        
        // Should not be generic
        expect(isGenericResponse(systemText)).toBe(false);
        
        // Should have content
        expect(systemText.length).toBeGreaterThan(10);
      });

      test('should give helpful response to "What can you help me with?"', async ({ page }) => {
        await page.goto(pageInfo.path);
        await page.waitForLoadState('networkidle');
        
        const title = await page.title();
        const is404 = title.includes('404') || title.includes('Not Found') || 
                      (await page.locator('body').textContent())?.includes('404');
        
        test.skip(is404, `Page ${pageInfo.path} returns 404`);
        
        await openChatPanel(page);
        
        const response = await sendChatMessage(page, 'What can you help me with?');
        
        // Should be helpful
        expect(isHelpfulResponse(response, 'What can you help me with?')).toBe(true);
      });

      test('should not give generic response to "What tools are available?"', async ({ page }) => {
        await page.goto(pageInfo.path);
        await page.waitForLoadState('networkidle');
        
        const title = await page.title();
        const is404 = title.includes('404') || title.includes('Not Found') || 
                      (await page.locator('body').textContent())?.includes('404');
        
        test.skip(is404, `Page ${pageInfo.path} returns 404`);
        
        await openChatPanel(page);
        
        const response = await sendChatMessage(page, 'What tools are available?');
        
        // Should NOT be generic
        expect(isGenericResponse(response)).toBe(false);
        
        // Should provide specific information
        expect(response.length).toBeGreaterThan(30);
      });
    });
  }

  // Special tests for journey step pages with field updates
  test.describe('Journey Step Pages - Field Updates', () => {
    const financialSnapshotPages = [
      '/journey/home-buying/step/financial-snapshot',
      '/journey/young-professional/step/financial-snapshot',
    ];

    for (const path of financialSnapshotPages) {
      test(`should update income field on ${path}`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        
        const title = await page.title();
        const is404 = title.includes('404') || title.includes('Not Found') || 
                      (await page.locator('body').textContent())?.includes('404');
        
        test.skip(is404, `Page ${path} returns 404`);
        
        await openChatPanel(page);
        
        // Check system message shows relevant examples
        const systemText = await getSystemMessage(page);
        expect(systemText).toMatch(/income|savings|debt/i);
        expect(systemText).not.toContain('Set interest to 4.5%');
        
        // Try field update
        const response = await sendChatMessage(page, 'What if my income is 80000');
        
        // Debug: log the actual response
        console.log(`[TEST DEBUG] Full response received: "${response}"`);
        console.log(`[TEST DEBUG] Response length: ${response.length}`);
        console.log(`[TEST DEBUG] Is generic: ${isGenericResponse(response)}`);
        
        if (isGenericResponse(response)) {
          console.log(`[DEBUG] Generic response detected: "${response.substring(0, 200)}"`);
        }
        
        // Should not be generic
        expect(isGenericResponse(response)).toBe(false);
        
        // Should acknowledge the update
        expect(response.length).toBeGreaterThan(20);
      });
    }
  });

  // Test calculator pages for field update capability
  test.describe('Calculator Pages - Field Updates', () => {
    const calculatorPages = [
      { path: '/amortization', fieldTest: 'Set interest to 4.5%' },
      { path: '/ebitda-forecasting', fieldTest: 'Set revenue to 500000' },
      { path: '/calculator/pricing-strategy', fieldTest: 'Set target margin to 70' },
    ];

    for (const { path, fieldTest } of calculatorPages) {
      test(`should handle field update on ${path}`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        
        const title = await page.title();
        const is404 = title.includes('404') || title.includes('Not Found') || 
                      (await page.locator('body').textContent())?.includes('404');
        
        test.skip(is404, `Page ${path} returns 404`);
        
        await openChatPanel(page);
        
        const response = await sendChatMessage(page, fieldTest);
        
        // Should not be generic
        expect(isGenericResponse(response)).toBe(false);
        
        // Should acknowledge the update
        expect(response.length).toBeGreaterThan(20);
      });
    }
  });

  // Test that responses are contextually appropriate
  test.describe('Contextual Appropriateness', () => {
    test('amortization page should show mortgage examples, not generic', async ({ page }) => {
      await page.goto('/amortization');
      await page.waitForLoadState('networkidle');
      
      await openChatPanel(page);
      
      const systemText = await getSystemMessage(page);
      
      // Should mention mortgage/loan terms
      expect(systemText).toMatch(/mortgage|loan|interest|term|amortization/i);
      
      // Should not be generic
      expect(isGenericResponse(systemText)).toBe(false);
    });

    test('financial snapshot should show income examples, not mortgage', async ({ page }) => {
      await page.goto('/journey/home-buying/step/financial-snapshot');
      await page.waitForLoadState('networkidle');
      
      const title = await page.title();
      const is404 = title.includes('404') || title.includes('Not Found') || 
                    (await page.locator('body').textContent())?.includes('404');
      
      test.skip(is404, 'Page returns 404');
      
      await openChatPanel(page);
      
      const systemText = await getSystemMessage(page);
      
      // Should mention income/assets/debts
      expect(systemText).toMatch(/income|savings|debt|financial/i);
      
      // Should NOT show mortgage-specific examples
      expect(systemText).not.toContain('Set interest to 4.5%');
      expect(systemText).not.toContain('Show a 20-year term');
      
      // Should not be generic
      expect(isGenericResponse(systemText)).toBe(false);
    });
  });
});

