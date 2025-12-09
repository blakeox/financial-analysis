import { expect, test } from '@playwright/test';

test.describe('Enhanced Lease Analysis - Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the API endpoints (both old and new routes for compatibility)
    await page.route('**/v1/api/analysis/**', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        json: {
          leaseType: 'equipment',
          termMonths: 48,
          startDate: '2024-01-01',
          endDate: '2027-12-31',
          metrics: {
            totalCost: 120000,
            averageMonthlyPayment: 2000,
            presentValue: 110000,
            effectiveAnnualRate: 0.065,
          },
          schedule: Array.from({ length: 48 }, (_, i) => ({
            month: i + 1,
            payment: 2000,
            interest: 500,
            principal: 1500,
            balance: 100000 - (1500 * (i + 1)),
            escalatedPayment: 2000 + (i * 10),
            additionalCosts: { total: 300 },
            totalPayment: 2300 + (i * 10),
            cumulativePaid: (2300 + (i * 10)) * (i + 1),
          })),
          renewalOptions: [],
          riskAnalysis: {
            flexibilityScore: 75,
            renewalRisk: 'medium',
            marketComparability: 'high',
          },
          insights: {
            effectiveRent: 2000,
            occupancyCost: 2500,
            totalCommitment: 120000,
            flexibilityRating: 'medium',
            recommendations: ['Consider renewal options', 'Review market rates'],
          },
          leaseVsBuy: {
            recommendation: 'lease',
            leaseOption: {
              totalCost: 120000,
              monthlyPayment: 2000,
            },
            buyOption: {
              totalLoanCost: 140000,
              loanPayment: 2333,
            },
          },
        },
      });
    });

    await page.goto('/lease-analysis');
    // Wait for React component to hydrate
    await page.waitForLoadState('networkidle');
  });

  test('page loads with header and main sections', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Lease Analysis/);

    // Check main header
    await expect(page.locator('text=🏗️ Enhanced Lease Analysis')).toBeVisible();
    
    // Check main sections are present
    await expect(page.locator('text=🤖 AI-Powered Document Analysis')).toBeVisible();
    await expect(page.locator('text=Quick Start Templates')).toBeVisible();
    await expect(page.locator('text=Saved Analyses')).toBeVisible();
  });

  test('form tabs are functional', async ({ page }) => {
    // Wait for the form to load
    await expect(page.locator('[role="tablist"]')).toBeVisible();

    // Check all tabs are present using role selectors to avoid strict mode violations
    await expect(page.getByRole('tab', { name: 'Basic' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Terms' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Options' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Compare' })).toBeVisible();

    // Test tab switching
    await page.getByRole('tab', { name: 'Terms' }).click();
    await expect(page.locator('text=Escalation Type')).toBeVisible();

    await page.getByRole('tab', { name: 'Options' }).click();
    await expect(page.locator('text=Renewal Options')).toBeVisible();

    await page.getByRole('tab', { name: 'Compare' }).click();
    await expect(page.locator('text=Lease vs Buy Analysis')).toBeVisible();

    // Go back to Basic
    await page.getByRole('tab', { name: 'Basic' }).click();
    await expect(page.locator('label:has-text("Equipment Cost")')).toBeVisible();
  });

  test('basic form submission works', async ({ page }) => {
    // Wait for form to be ready and React to hydrate
    await expect(page.locator('[role="tablist"]')).toBeVisible();
    await page.waitForTimeout(500); // Brief wait for React hydration
    
    // Fill out basic form fields using getByLabel for proper label association
    await page.getByLabel('Equipment Cost').fill('100000');
    await page.getByLabel('Annual Interest Rate').fill('6.5');
    await page.getByLabel('Residual Value').fill('10000');
    await page.getByLabel('Lease Term (Months)').fill('48');

    // Submit the analysis - look for button with "Analyze Lease" text
    const analyzeButton = page.locator('button:has-text("Analyze Lease")');
    
    // Set up a promise to wait for the API call
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/v1/api/analysis/') && response.status() === 200
    );
    
    await analyzeButton.click();
    
    // Wait for API response
    await responsePromise;

    // Wait for results to appear
    await expect(page.locator('text=Financial Summary')).toBeVisible({ timeout: 5000 });
  });

  test('error handling for invalid inputs', async ({ page }) => {
    // Wait for form to be ready and React to hydrate
    await expect(page.locator('[role="tablist"]')).toBeVisible();
    await page.waitForTimeout(500); // Brief wait for React hydration
    
    // Mock API to return an error
    await page.route('**/v1/api/analysis/**', async (route) => {
      await route.fulfill({
        status: 400,
        headers: { 'content-type': 'application/json' },
        json: {
          error: {
            message: 'Invalid input: Equipment cost must be positive',
          },
        },
      });
    });
    
    // Fill valid looking data (component should handle negative validation or API will reject)
    await page.getByLabel('Equipment Cost').fill('100000');
    await page.getByLabel('Annual Interest Rate').fill('6.5');
    await page.getByLabel('Residual Value').fill('10000');
    await page.getByLabel('Lease Term (Months)').fill('48');
    
    // Try to submit
    await page.click('button:has-text("Analyze Lease")');
    
    // Should show error message, not financial summary
    await page.waitForTimeout(1000); // Wait for error to appear
    await expect(page.locator('text=Financial Summary')).not.toBeVisible();
  });

  test('responsive design on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that mobile-optimized elements are visible
    await expect(page.locator('[role="tablist"]')).toBeVisible();
    
    // Tabs should stack on mobile (2 columns instead of 4)
    const tabsList = page.locator('[role="tablist"]');
    await expect(tabsList).toHaveClass(/grid-cols-2/);

    // Check that drag-and-drop area is touch-friendly by selecting the container div
    const uploadArea = page.locator('.border-2.border-dashed.rounded-lg.touch-manipulation');
    await expect(uploadArea).toHaveClass(/touch-manipulation/);
  });
});