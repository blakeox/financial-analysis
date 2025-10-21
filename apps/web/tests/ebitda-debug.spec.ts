import { test } from '@playwright/test';

test.describe('EBITDA Debug', () => {
  test('debug what is on the page', async ({ page }) => {
    await page.goto('/ebitda-forecasting');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/ebitda-debug.png', fullPage: true });
    
    // Get the HTML of the dashboard container
    const containerHTML = await page.locator('[data-testid="ebitda-dashboard"]').innerHTML().catch(() => 'CONTAINER NOT FOUND');
    console.log('Container HTML:', containerHTML);
    
    // Check if loading spinner is visible
    const loadingSpinner = page.locator('text=Loading EBITDA Dashboard');
    const spinnerVisible = await loadingSpinner.isVisible().catch(() => false);
    console.log('Loading spinner visible:', spinnerVisible);
    
    // Check if dashboard header is visible
    const dashboardHeader = page.locator('text=EBITDA Forecasting Dashboard');
    const headerVisible = await dashboardHeader.isVisible().catch(() => false);
    console.log('Dashboard header visible:', headerVisible);
    
    // Check all text content on the page
    const allText = await page.locator('body').textContent();
    console.log('Page text:', allText);
    
    // Check for any console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });
    
    // Wait a bit to see if anything changes
    await page.waitForTimeout(5000);
    
    // Check again after waiting
    const headerVisibleAfterWait = await dashboardHeader.isVisible().catch(() => false);
    console.log('Dashboard header visible after 5s wait:', headerVisibleAfterWait);
    
    // Take another screenshot
    await page.screenshot({ path: 'test-results/ebitda-debug-after-wait.png', fullPage: true });
  });
});
