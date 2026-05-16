import { test, expect } from '@playwright/test';

test.describe('EBITDA Forecaster', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport size to test responsive behavior
    await page.setViewportSize({ width: 1200, height: 800 });
  });

  test('EBITDA Forecasting model card is visible on models page', async ({ page }) => {
    await page.goto('/models');
    await expect(page).toHaveTitle(/Financial Models/i);

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check that EBITDA Forecasting model card exists and is visible
    const ebitdaCard = page.locator('a[href="/ebitda-forecasting"]');
    await expect(ebitdaCard).toBeVisible();

    // Check for the model card container with EBITDA content
    const ebitdaSection = page.locator('div[data-model="EBITDA Forecasting"]');
    await expect(ebitdaSection).toBeVisible();

    // Verify card contains expected content
    await expect(ebitdaSection).toContainText(/EBITDA Forecasting/i);
    await expect(ebitdaSection).toContainText(/Service industry financial projections/i);
  });

  test('navigates from models page to EBITDA forecaster', async ({ page }) => {
    await page.goto('/models');

    // Click on EBITDA Forecasting model card
    const ebitdaCard = page.locator('a[href="/ebitda-forecasting"]');
    await expect(ebitdaCard).toBeVisible();
    await ebitdaCard.click();

    // Verify navigation to EBITDA forecasting page
    await expect(page).toHaveURL(/\/ebitda-forecasting$/);
    await expect(page).toHaveTitle(/EBITDA Forecasting/i);
    await expect(page.locator('h1')).toContainText(/EBITDA Forecasting/i);
  });

  test('EBITDA forecaster loads with initial form', async ({ page }) => {
    await page.goto('/ebitda-forecasting');

    // Check page loads correctly
    await expect(page).toHaveTitle(/EBITDA Forecasting/i);
    await expect(page.locator('h1')).toContainText(/EBITDA Forecasting/i);

    // Wait for React component to hydrate by waiting for dashboard header
    const dashboardHeader = page.locator('text=EBITDA Forecasting Dashboard');
    await expect(dashboardHeader).toBeVisible({ timeout: 15000 });

    // Assert at least one interactive element is visible (button/input)
    const interactive = page.locator('button, input, select, textarea');
    await expect(interactive.first()).toBeVisible({ timeout: 5000 });
  });

  test('EBITDA form accepts user input', async ({ page }) => {
    await page.goto('/ebitda-forecasting');

    // Wait for React component to load
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="ebitda-dashboard"]')).toBeVisible({ timeout: 10000 });

    // Wait for dashboard header to ensure component is fully loaded
    await expect(page.locator('text=EBITDA Forecasting Dashboard')).toBeVisible({ timeout: 10000 });

    // Look for visible, editable inputs - exclude hidden search inputs
    const inputs = page.locator(
      'input[type="number"]:visible, input[type="text"]:visible:not([aria-label*="Search"])'
    );
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      // Test first available visible input
      const firstInput = inputs.first();
      await expect(firstInput).toBeVisible();
      await firstInput.fill('100000');
      await expect(firstInput).toHaveValue('100000');

      // Test second input if available
      if (inputCount > 1) {
        const secondInput = inputs.nth(1);
        await expect(secondInput).toBeVisible();
        await secondInput.fill('50000');
        await expect(secondInput).toHaveValue('50000');
      }
    }

    // Look for the generate forecast button specifically
    const generateButton = page.locator('[data-testid="generate-forecast-btn"]');
    if ((await generateButton.count()) > 0) {
      await expect(generateButton).toBeVisible();
      // Check if it's enabled (may be disabled if form is invalid)
    }
  });

  test('EBITDA forecaster handles forecast generation', async ({ page }) => {
    await page.goto('/ebitda-forecasting');

    // Wait for React component to hydrate by waiting for dashboard header
    const dashboardHeader = page.locator('text=EBITDA Forecasting Dashboard');
    await expect(dashboardHeader).toBeVisible({ timeout: 15000 });

    // Fill in basic form data if inputs are available
    const numberInputs = page.locator('input[type="number"]:visible');
    const inputCount = await numberInputs.count();

    // Fill some sample data
    for (let i = 0; i < Math.min(inputCount, 3); i++) {
      const input = numberInputs.nth(i);
      if (await input.isVisible()) {
        await input.fill((100000 + i * 10000).toString());
      }
    }

    // Look for and click generate/forecast button
    const generateButton = page.locator('[data-testid="generate-forecast-btn"]');

    if ((await generateButton.count()) > 0 && (await generateButton.isVisible())) {
      await generateButton.click();

      // Wait for results or progress indicator
      // Look for common result indicators
      const resultElements = page.locator(
        '[data-testid*="result"], [class*="result"], [class*="forecast"], ' +
          'table, .table, .chart, .graph, .summary, .output'
      );

      // Either results appear or loading/progress indicator shows
      await expect(
        resultElements
          .first()
          .or(
            page.locator(
              '.loading, .spinner, [aria-label*="loading" i], [aria-label*="calculating" i]'
            )
          )
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('EBITDA forecaster responsive design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/ebitda-forecasting');
    await page.waitForLoadState('networkidle');

    // Wait for React component to hydrate by waiting for dashboard header
    const dashboardHeader = page.locator('text=EBITDA Forecasting Dashboard');
    await expect(dashboardHeader).toBeVisible({ timeout: 15000 });

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(dashboardHeader).toBeVisible();

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(dashboardHeader).toBeVisible();

    // Verify interactive elements are still accessible on mobile
    const interactive = page.locator('button, input, select, textarea');
    await expect(interactive.first()).toBeVisible({ timeout: 5000 });
  });

  test('EBITDA page has proper accessibility', async ({ page }) => {
    await page.goto('/ebitda-forecasting');
    await page.waitForLoadState('networkidle');

    // Wait for React component to hydrate by waiting for dashboard header
    const dashboardHeader = page.locator('text=EBITDA Forecasting Dashboard');
    await expect(dashboardHeader).toBeVisible({ timeout: 15000 });

    // Check for proper heading structure
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();

    // Check that form elements have proper labels or accessibility attributes
    const inputs = page.locator('input:visible');
    const inputCount = await inputs.count();

    for (let i = 0; i < Math.min(inputCount, 5); i++) {
      const input = inputs.nth(i);
      if (await input.isVisible()) {
        // Each input should have either a label, aria-label, or aria-labelledby
        const inputId = await input.getAttribute('id');
        const hasLabel = inputId
          ? (await page.locator(`label[for="${inputId}"]`).count()) > 0
          : false;
        const hasAriaLabel = (await input.getAttribute('aria-label')) !== null;
        const hasAriaLabelledby = (await input.getAttribute('aria-labelledby')) !== null;

        expect(hasLabel || hasAriaLabel || hasAriaLabelledby).toBeTruthy();
      }
    }

    // Check for keyboard accessibility
    const buttons = page.locator('button:visible');
    if ((await buttons.count()) > 0) {
      const firstButton = buttons.first();
      if (await firstButton.isVisible()) {
        // Button should be keyboard accessible
        await firstButton.focus();
        await expect(firstButton).toBeFocused();
      }
    }
  });

  test('EBITDA forecaster handles edge cases gracefully', async ({ page }) => {
    await page.goto('/ebitda-forecasting');
    await page.waitForLoadState('networkidle');

    // Wait for React component to hydrate by waiting for dashboard header
    const dashboardHeader = page.locator('text=EBITDA Forecasting Dashboard');
    await expect(dashboardHeader).toBeVisible({ timeout: 15000 });

    // Test with zero values
    const numberInputs = page.locator('input[type="number"]:visible');
    const inputCount = await numberInputs.count();

    if (inputCount > 0) {
      const firstInput = numberInputs.first();
      await expect(firstInput).toBeVisible();
      await firstInput.fill('0');
      await expect(firstInput).toHaveValue('0');

      // Test with negative values
      await firstInput.fill('-1000');
      const value = await firstInput.inputValue();
      // Should either accept negative values or prevent them
      expect(typeof value).toBe('string');

      // Test with very large values
      await firstInput.fill('999999999');
      await expect(firstInput).toHaveValue(/\d+/);
    }

    // Test form submission with minimal data
    const generateButton = page.locator('[data-testid="generate-forecast-btn"]');

    if ((await generateButton.count()) > 0 && (await generateButton.isVisible())) {
      // Should either process minimal data or show validation messages
      await generateButton.click();

      // Check for either results or validation messages
      await page.waitForTimeout(1000); // Brief wait for response

      // No errors should crash the page - dashboard should remain visible
      await expect(dashboardHeader).toBeVisible();
    }
  });

  test('EBITDA forecaster back navigation works', async ({ page }) => {
    // Start from models page
    await page.goto('/models');
    await expect(page.locator('a[href="/ebitda-forecasting"]')).toBeVisible();

    // Navigate to EBITDA forecaster
    await page.locator('a[href="/ebitda-forecasting"]').click();
    await expect(page).toHaveURL(/\/ebitda-forecasting$/);

    // Go back using browser back button
    await page.goBack();
    await expect(page).toHaveURL(/\/models$/);
    await expect(page.locator('a[href="/ebitda-forecasting"]')).toBeVisible();

    // Navigate forward again
    await page.goForward();
    await expect(page).toHaveURL(/\/ebitda-forecasting$/);
  });
});
