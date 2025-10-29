/**
 * End-to-End Journey Tests with Playwright
 * Tests complete user workflows through journeys
 */

import { expect, test } from '@playwright/test';

test.describe('Financial Journey E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the journeys page
    await page.goto('/journeys');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Personal Finance Journeys', () => {
    test('Young Professional Journey - Complete Workflow', async ({ page }) => {
      // Click on Young Professional journey
      await page.click('[data-scenario-id="young-professional"]');
      await page.waitForURL('/journey/young-professional');

      // Verify journey page loads
      await expect(page.locator('h1')).toContainText('Young Professional Journey');

      // Start with student loan calculator
      await page.click('[data-model-id="student-loan"] a');
      await page.waitForURL('/calculator/student-loans');

      // Fill out student loan form
      await page.fill('input[name="principal"]', '50000');
      await page.fill('input[name="rate"]', '4.5');
      await page.fill('input[name="term"]', '10');
      await page.click('button[type="submit"]');

      // Verify results are displayed
      await expect(page.locator('#results-content')).toBeVisible();

      // Check for journey navigation
      await expect(page.locator('.journey-navigation')).toBeVisible();
      await expect(page.locator('#journey-next-btn')).toBeVisible();

      // Click next step
      await page.click('#journey-next-btn');
      await page.waitForURL('/calculator/budget');

      // Fill out budget calculator
      await page.fill('input[name="monthlyIncome"]', '5000');
      await page.fill('input[name="monthlyExpenses"]', '3500');
      await page.click('button[type="submit"]');

      // Verify budget results
      await expect(page.locator('#results-content')).toBeVisible();

      // Continue to retirement calculator
      await page.click('#journey-next-btn');
      await page.waitForURL('/calculator/retirement');

      // Fill out retirement calculator
      await page.fill('input[name="currentAge"]', '30');
      await page.fill('input[name="retirementAge"]', '65');
      await page.fill('input[name="currentSavings"]', '25000');
      await page.fill('input[name="monthlyContribution"]', '500');
      await page.click('button[type="submit"]');

      // Complete journey
      await page.click('#journey-next-btn');
      await page.waitForURL('/journey-analysis/young-professional');

      // Verify analysis page loads
      await expect(page.locator('h1')).toContainText('Journey Analysis Complete');
      await expect(page.locator('#ai-analysis-content')).toBeVisible();
      await expect(page.locator('#key-metrics')).toBeVisible();
      await expect(page.locator('#action-items')).toBeVisible();
    });

    test('Family Planning Journey - Complete Workflow', async ({ page }) => {
      // Click on Family Planning journey
      await page.click('[data-scenario-id="family-planning"]');
      await page.waitForURL('/journey/family-planning');

      // Start with mortgage calculator
      await page.click('[data-model-id="amortization"] a');
      await page.waitForURL('/calculator/amortization');

      // Fill out mortgage form
      await page.fill('input[name="principal"]', '300000');
      await page.fill('input[name="rate"]', '6.0');
      await page.fill('input[name="term"]', '30');
      await page.click('button[type="submit"]');

      // Verify mortgage results
      await expect(page.locator('#results-content')).toBeVisible();

      // Continue through journey
      await page.click('#journey-next-btn');
      await page.waitForURL('/calculator/savings-goal');

      // Fill out savings goal calculator
      await page.fill('input[name="goalAmount"]', '50000');
      await page.fill('input[name="currentSavings"]', '10000');
      await page.fill('input[name="yearsToGoal"]', '5');
      await page.click('button[type="submit"]');

      // Complete journey
      await page.click('#journey-next-btn');
      await page.waitForURL('/journey-analysis/family-planning');

      // Verify analysis page
      await expect(page.locator('h1')).toContainText('Journey Analysis Complete');
    });

    test('Home Buying Journey - Complete Workflow', async ({ page }) => {
      // Click on Home Buying journey
      await page.click('[data-scenario-id="home-buying"]');
      await page.waitForURL('/journey/home-buying');

      // Start with mortgage calculator
      await page.click('[data-model-id="amortization"] a');
      await page.waitForURL('/calculator/amortization');

      // Fill out mortgage form
      await page.fill('input[name="principal"]', '400000');
      await page.fill('input[name="rate"]', '5.5');
      await page.fill('input[name="term"]', '30');
      await page.click('button[type="submit"]');

      // Continue through journey
      await page.click('#journey-next-btn');
      await page.waitForURL('/calculator/savings-goal');

      // Fill out savings goal for down payment
      await page.fill('input[name="goalAmount"]', '80000');
      await page.fill('input[name="currentSavings"]', '20000');
      await page.fill('input[name="yearsToGoal"]', '3');
      await page.click('button[type="submit"]');

      // Complete journey
      await page.click('#journey-next-btn');
      await page.waitForURL('/journey-analysis/home-buying');

      // Verify analysis page
      await expect(page.locator('h1')).toContainText('Journey Analysis Complete');
    });
  });

  test.describe('Business Finance Journeys', () => {
    test('M&A Analysis Journey - Complete Workflow', async ({ page }) => {
      // Switch to Business Finance tab
      await page.click('button[data-category="business"]');

      // Click on M&A Analysis journey
      await page.click('[data-scenario-id="ma-analysis-journey"]');
      await page.waitForURL('/journey/ma-analysis-journey');

      // Start with M&A calculator
      await page.click('[data-model-id="ma-analysis"] a');
      await page.waitForURL('/calculator/ma-analysis');

      // Fill out M&A form
      await page.fill('input[name="acquirerRevenue"]', '100000000');
      await page.fill('input[name="targetRevenue"]', '50000000');
      await page.fill('input[name="acquirerEPS"]', '2.50');
      await page.fill('input[name="targetEPS"]', '1.80');
      await page.fill('input[name="exchangeRatio"]', '0.8');
      await page.click('button[type="submit"]');

      // Verify M&A results
      await expect(page.locator('#results-content')).toBeVisible();

      // Continue to DCF valuation
      await page.click('#journey-next-btn');
      await page.waitForURL('/calculator/dcf-valuation');

      // Fill out DCF form
      await page.fill('input[name="revenue"]', '50000000');
      await page.fill('input[name="growthRate"]', '0.05');
      await page.fill('input[name="discountRate"]', '0.10');
      await page.fill('input[name="terminalGrowthRate"]', '0.03');
      await page.click('button[type="submit"]');

      // Complete journey
      await page.click('#journey-next-btn');
      await page.waitForURL('/journey-analysis/ma-analysis-journey');

      // Verify analysis page
      await expect(page.locator('h1')).toContainText('Journey Analysis Complete');
    });

    test('Startup Financial Planning Journey - Complete Workflow', async ({ page }) => {
      // Switch to Business Finance tab
      await page.click('button[data-category="business"]');

      // Click on Startup Planning journey
      await page.click('[data-scenario-id="startup-planning"]');
      await page.waitForURL('/journey/startup-planning');

      // Start with budget calculator
      await page.click('[data-model-id="budget"] a');
      await page.waitForURL('/calculator/budget');

      // Fill out budget form
      await page.fill('input[name="monthlyIncome"]', '15000');
      await page.fill('input[name="monthlyExpenses"]', '12000');
      await page.click('button[type="submit"]');

      // Continue to savings goal calculator
      await page.click('#journey-next-btn');
      await page.waitForURL('/calculator/savings-goal');

      // Fill out savings goal for runway
      await page.fill('input[name="goalAmount"]', '100000');
      await page.fill('input[name="currentSavings"]', '25000');
      await page.fill('input[name="yearsToGoal"]', '2');
      await page.click('button[type="submit"]');

      // Complete journey
      await page.click('#journey-next-btn');
      await page.waitForURL('/journey-analysis/startup-planning');

      // Verify analysis page
      await expect(page.locator('h1')).toContainText('Journey Analysis Complete');
    });
  });

  test.describe('Journey Navigation and State Management', () => {
    test('Journey Progress Tracking', async ({ page }) => {
      // Start Young Professional journey
      await page.click('[data-scenario-id="young-professional"]');
      await page.waitForURL('/journey/young-professional');

      // Check progress indicator
      await expect(page.locator('.progress-bar')).toBeVisible();
      await expect(page.locator('.progress-percentage')).toContainText('0%');

      // Complete first step
      await page.click('[data-model-id="student-loan"] a');
      await page.waitForURL('/calculator/student-loans');

      // Fill form and submit
      await page.fill('input[name="principal"]', '50000');
      await page.fill('input[name="rate"]', '4.5');
      await page.fill('input[name="term"]', '10');
      await page.click('button[type="submit"]');

      // Check journey navigation shows progress
      await expect(page.locator('.journey-navigation')).toBeVisible();
      await expect(page.locator('.progress-percentage')).toContainText('25%');
      await expect(page.locator('#journey-next-btn')).toBeVisible();
    });

    test('Journey Step Skipping', async ({ page }) => {
      // Start journey with optional steps
      await page.click('[data-scenario-id="young-professional"]');
      await page.waitForURL('/journey/young-professional');

      // Go to student loan calculator
      await page.click('[data-model-id="student-loan"] a');
      await page.waitForURL('/calculator/student-loans');

      // Fill form
      await page.fill('input[name="principal"]', '50000');
      await page.fill('input[name="rate"]', '4.5');
      await page.fill('input[name="term"]', '10');
      await page.click('button[type="submit"]');

      // Skip to next step
      await page.click('#journey-skip-btn');

      // Should navigate to next step
      await page.waitForURL('/calculator/budget');
    });

    test('Journey Back Navigation', async ({ page }) => {
      // Start journey
      await page.click('[data-scenario-id="young-professional"]');
      await page.waitForURL('/journey/young-professional');

      // Go to first calculator
      await page.click('[data-model-id="student-loan"] a');
      await page.waitForURL('/calculator/student-loans');

      // Fill form and go to next step
      await page.fill('input[name="principal"]', '50000');
      await page.fill('input[name="rate"]', '4.5');
      await page.fill('input[name="term"]', '10');
      await page.click('button[type="submit"]');
      await page.click('#journey-next-btn');

      // Go back to previous step
      await page.click('#journey-previous-btn');
      await page.waitForURL('/calculator/student-loans');
    });
  });

  test.describe('Journey Analysis Features', () => {
    test('Analysis Page Features', async ({ page }) => {
      // Complete a journey first
      await page.click('[data-scenario-id="young-professional"]');
      await page.waitForURL('/journey/young-professional');

      // Complete all steps quickly
      await page.click('[data-model-id="student-loan"] a');
      await page.waitForURL('/calculator/student-loans');
      await page.fill('input[name="principal"]', '50000');
      await page.fill('input[name="rate"]', '4.5');
      await page.fill('input[name="term"]', '10');
      await page.click('button[type="submit"]');
      await page.click('#journey-next-btn');

      await page.waitForURL('/calculator/budget');
      await page.fill('input[name="monthlyIncome"]', '5000');
      await page.fill('input[name="monthlyExpenses"]', '3500');
      await page.click('button[type="submit"]');
      await page.click('#journey-next-btn');

      await page.waitForURL('/calculator/retirement');
      await page.fill('input[name="currentAge"]', '30');
      await page.fill('input[name="retirementAge"]', '65');
      await page.fill('input[name="currentSavings"]', '25000');
      await page.fill('input[name="monthlyContribution"]', '500');
      await page.click('button[type="submit"]');
      await page.click('#journey-next-btn');

      // Should be on analysis page
      await page.waitForURL('/journey-analysis/young-professional');

      // Check analysis page features
      await expect(page.locator('#journey-summary')).toBeVisible();
      await expect(page.locator('#ai-analysis-content')).toBeVisible();
      await expect(page.locator('#detailed-insights')).toBeVisible();
      await expect(page.locator('#key-metrics')).toBeVisible();
      await expect(page.locator('#action-items')).toBeVisible();

      // Check export buttons
      await expect(page.locator('#export-pdf-btn')).toBeVisible();
      await expect(page.locator('#share-results-btn')).toBeVisible();

      // Check AI chat button
      await expect(page.locator('#chat-with-ai-btn')).toBeVisible();
    });

    test('Analysis Export Functionality', async ({ page }) => {
      // Complete journey and reach analysis page
      await page.click('[data-scenario-id="young-professional"]');
      await page.waitForURL('/journey/young-professional');

      // Quick completion for testing
      await page.click('[data-model-id="student-loan"] a');
      await page.waitForURL('/calculator/student-loans');
      await page.fill('input[name="principal"]', '50000');
      await page.fill('input[name="rate"]', '4.5');
      await page.fill('input[name="term"]', '10');
      await page.click('button[type="submit"]');
      await page.click('#journey-next-btn');

      await page.waitForURL('/calculator/budget');
      await page.fill('input[name="monthlyIncome"]', '5000');
      await page.fill('input[name="monthlyExpenses"]', '3500');
      await page.click('button[type="submit"]');
      await page.click('#journey-next-btn');

      await page.waitForURL('/journey-analysis/young-professional');

      // Test export PDF button
      await page.click('#export-pdf-btn');
      // Should show alert or download

      // Test share results button
      await page.click('#share-results-btn');
      // Should show share dialog or copy to clipboard
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('Invalid Form Input Handling', async ({ page }) => {
      // Start journey
      await page.click('[data-scenario-id="young-professional"]');
      await page.waitForURL('/journey/young-professional');

      // Go to calculator
      await page.click('[data-model-id="student-loan"] a');
      await page.waitForURL('/calculator/student-loans');

      // Try invalid inputs
      await page.fill('input[name="principal"]', '-1000');
      await page.fill('input[name="rate"]', '150');
      await page.fill('input[name="term"]', '0');
      await page.click('button[type="submit"]');

      // Should show validation errors
      await expect(page.locator('.error-message')).toBeVisible();
    });

    test('Journey Interruption and Recovery', async ({ page }) => {
      // Start journey
      await page.click('[data-scenario-id="young-professional"]');
      await page.waitForURL('/journey/young-professional');

      // Complete first step
      await page.click('[data-model-id="student-loan"] a');
      await page.waitForURL('/calculator/student-loans');
      await page.fill('input[name="principal"]', '50000');
      await page.fill('input[name="rate"]', '4.5');
      await page.fill('input[name="term"]', '10');
      await page.click('button[type="submit"]');

      // Navigate away
      await page.goto('/models');

      // Return to journey
      await page.goto('/journey/young-professional');

      // Should maintain progress
      await expect(page.locator('.progress-percentage')).toContainText('25%');
    });

    test('Empty Journey Data Handling', async ({ page }) => {
      // Try to access analysis page without completing journey
      await page.goto('/journey-analysis/young-professional');

      // Should show appropriate message
      await expect(page.locator('#ai-analysis-content')).toContainText('No journey data available');
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('Journey Navigation on Mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Navigate to journeys
      await page.goto('/journeys');

      // Should show mobile-friendly layout
      await expect(page.locator('.journey-navigation')).toBeVisible();

      // Start journey
      await page.click('[data-scenario-id="young-professional"]');
      await page.waitForURL('/journey/young-professional');

      // Go to calculator
      await page.click('[data-model-id="student-loan"] a');
      await page.waitForURL('/calculator/student-loans');

      // Fill form
      await page.fill('input[name="principal"]', '50000');
      await page.fill('input[name="rate"]', '4.5');
      await page.fill('input[name="term"]', '10');
      await page.click('button[type="submit"]');

      // Check mobile navigation
      await expect(page.locator('.journey-navigation')).toBeVisible();
      await expect(page.locator('#journey-next-btn')).toBeVisible();
    });
  });
});

