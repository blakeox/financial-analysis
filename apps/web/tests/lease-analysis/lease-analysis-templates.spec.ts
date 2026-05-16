import { expect, test } from '@playwright/test';

test.describe('Enhanced Lease Analysis - Templates & History', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/lease-analysis');
  });

  test('template selection and loading', async ({ page }) => {
    // Check that templates are visible
    await expect(page.locator('text=Quick Start Templates')).toBeVisible();

    // Should show first 3 templates (actual names from component)
    await expect(page.locator('text=Downtown Office Space')).toBeVisible();
    await expect(page.locator('text=Industrial Warehouse')).toBeVisible();
    await expect(page.locator('text=Shopping Center Retail')).toBeVisible();

    // Click on office lease template
    await page.click('text=Downtown Office Space');

    // Wait longer for React state to update and form to populate
    await page.waitForTimeout(1000);

    // Form should be populated with template values (equipment lease format)
    await expect(page.locator('select')).toHaveValue('equipment');
    // Check equipment cost was populated
    const equipmentCostInput = page
      .locator('label:has-text("Equipment Cost")')
      .locator('..')
      .locator('input');
    await expect(equipmentCostInput).toHaveValue('50000', { timeout: 3000 });

    // Check annual rate (template has annualRate: 0.065, displayed as 6.5%)
    const rateInput = page
      .locator('label:has-text("Annual Interest Rate")')
      .locator('..')
      .locator('input');
    // Wait for the value to update from default to template value
    await expect(rateInput).toHaveValue('6.5', { timeout: 5000 });
  });

  test('view all templates functionality', async ({ page }) => {
    // Click "View All Templates" button
    const viewAllButton = page.locator('button:has-text("View All Templates")');
    await expect(viewAllButton).toBeVisible();
    // Note: This button currently shows/hides templates modal - checking count in button text
    await expect(viewAllButton).toContainText('3'); // Shows count

    // Check that templates show category badges (inside template cards, not form)
    await expect(page.locator('.inline-flex:has-text("office")').first()).toBeVisible(); // category badge
    await expect(page.locator('.inline-flex:has-text("warehouse")').first()).toBeVisible();
    await expect(page.locator('.inline-flex:has-text("retail")').first()).toBeVisible();

    // All 3 default templates should be visible without clicking
    await expect(page.locator('text=Downtown Office Space')).toBeVisible();
    await expect(page.locator('text=Industrial Warehouse')).toBeVisible();
    await expect(page.locator('text=Shopping Center Retail')).toBeVisible();

    // Click on a template to load it
    await page.click('text=Industrial Warehouse');

    // Form should update with equipment lease values - wait for the actual value change
    await expect(page.locator('select')).toHaveValue('equipment');
    const equipmentCostInput = page
      .locator('label:has-text("Equipment Cost")')
      .locator('..')
      .locator('input');
    await expect(equipmentCostInput).toHaveValue('150000', { timeout: 3000 });
  });

  test('save analysis functionality', async ({ page }) => {
    // Fill out a basic form using label-based selectors
    const equipmentCostInput = page
      .locator('label:has-text("Equipment Cost")')
      .locator('..')
      .locator('input');
    await equipmentCostInput.fill('150000');

    const rateInput = page
      .locator('label:has-text("Annual Interest Rate")')
      .locator('..')
      .locator('input');
    await rateInput.fill('7.5');

    const termInput = page.locator('label:has-text("Term")').locator('..').locator('input');
    await termInput.fill('84');

    await page.selectOption('select', 'equipment');

    // Mock API endpoint that would be called
    await page.route('**/v1/api/analysis/enhanced-lease', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          leaseType: 'equipment',
          termMonths: 36,
          startDate: '2024-01-01',
          endDate: '2026-12-31',
          schedule: [],
          metrics: {
            averageMonthlyPayment: 1000,
            totalCost: 36000,
            totalInterest: 6000,
            presentValue: 35000,
            effectiveAnnualRate: 0.065,
          },
          renewalOptions: [],
          riskAnalysis: {
            flexibilityScore: 75,
            earlyTerminationCost: 5000,
            renewalRisk: 'medium',
          },
          insights: {
            effectiveRent: 1000,
            occupancyCost: 1000,
            totalCommitment: 36000,
            flexibilityRating: 'good',
            recommendations: [],
          },
        }),
      });
    });

    // Analyze the lease
    await page.click('button:has-text("Analyze")');
    // Wait for results to appear - look for the Financial Summary heading which indicates results are rendered
    await expect(page.locator('h3:has-text("Financial Summary")')).toBeVisible({ timeout: 10000 });

    // Save the analysis - look for "Save Current" button in Analysis History card
    await page.click('button:has-text("Save Current")');

    // Should show save modal/form
    await expect(page.locator('text=Save Analysis')).toBeVisible();

    // Fill in save details
    await page.fill('input[placeholder*="analysis name"]', 'Retail Space Downtown');
    await page.fill('textarea[placeholder*="description"]', 'Prime retail location analysis');

    // Confirm save - need to be specific about which Save button (in the modal)
    await page.locator('div.fixed.inset-0').locator('button:has-text("Save")').click();

    // Should show in saved analyses section
    await expect(page.locator('text=Retail Space Downtown')).toBeVisible();
    await expect(page.locator('text=Prime retail location analysis')).toBeVisible();
  });

  test('load saved analysis', async ({ page }) => {
    // Mock localStorage with saved analysis
    await page.addInitScript(() => {
      const savedAnalysis = {
        id: 'test-analysis-1',
        name: 'Test Lease Analysis',
        description: 'Previously saved analysis',
        savedAt: new Date().toISOString(),
        formData: {
          leaseType: 'equipment',
          principal: 120000,
          annualRate: 0.065,
          termMonths: 72,
        },
        result: {
          leaseType: 'equipment',
          termMonths: 72,
          startDate: '2024-01-01',
          endDate: '2030-01-01',
          schedule: [],
          metrics: {
            totalCost: 144000,
            averageMonthlyPayment: 2200,
            presentValue: 140000,
            effectiveAnnualRate: 0.065,
          },
          renewalOptions: [],
          riskAnalysis: {
            flexibilityScore: 75,
            earlyTerminationCost: 10000,
            renewalRisk: 'medium',
          },
          insights: {
            effectiveRent: 2200,
            occupancyCost: 2200,
            totalCommitment: 144000,
            flexibilityRating: 'good',
            recommendations: [],
          },
        },
      };

      localStorage.setItem('lease-analyses', JSON.stringify([savedAnalysis]));
    });

    // Reload page to pick up localStorage
    await page.reload();

    // Should show saved analysis
    await expect(page.locator('text=Test Lease Analysis')).toBeVisible();
    await expect(page.locator('text=Previously saved analysis')).toBeVisible();

    // Click to load the analysis
    await page.click('text=Test Lease Analysis');

    // The loadAnalysis function should execute and display results
    // Since we have result data in the saved analysis, it should render the results section
    await page.waitForTimeout(1500);

    // Verify that results are displayed with the saved analysis data
    // The mocked result has totalCost: 144000, check for the Financial Summary heading
    await expect(page.locator('h3:has-text("Financial Summary")')).toBeVisible({ timeout: 5000 });
  });

  test('delete saved analysis', async ({ page }) => {
    // Mock localStorage with saved analysis
    await page.addInitScript(() => {
      const savedAnalysis = {
        id: 'test-analysis-delete',
        name: 'Analysis to Delete',
        description: 'This will be deleted',
        savedAt: new Date().toISOString(),
        formData: {},
        result: null,
      };

      localStorage.setItem('lease-analyses', JSON.stringify([savedAnalysis]));
    });

    await page.reload();

    // Wait for saved analysis to appear
    await expect(page.locator('text=Analysis to Delete')).toBeVisible();

    // Find the saved analysis entry and click its delete button (trash icon with title="Delete analysis")
    // The button is a sibling of the content, not nested deeply
    const deleteButton = page
      .locator('text=Analysis to Delete')
      .locator('..')
      .locator('..')
      .locator('button[title="Delete analysis"]');
    await deleteButton.click();

    // No confirmation modal - deletes immediately

    // Analysis should be removed
    await expect(page.locator('text=Analysis to Delete')).not.toBeVisible();
  });

  test('empty state when no saved analyses', async ({ page }) => {
    // Clear localStorage
    await page.addInitScript(() => {
      localStorage.removeItem('lease-analyses');
    });

    await page.reload();

    // Should show empty state
    await expect(page.locator('text=No saved analyses yet')).toBeVisible();
    await expect(page.locator('text=Save your first analysis to see it here')).toBeVisible();
  });
});
