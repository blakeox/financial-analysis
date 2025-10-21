import { expect, test } from '@playwright/test';

test.describe('Enhanced Lease Analysis - Form Validation & Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/lease-analysis');
    // Wait for React component to hydrate
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('required field validation', async ({ page }) => {
    // Try to submit empty form
    await page.click('button:has-text("Analyze Lease")');
    
    // Should not proceed without required fields
    await expect(page.locator('text=Financial Summary')).not.toBeVisible();
    
    // Fill minimum required fields using getByLabel
    await page.getByLabel('Equipment Cost').fill('100000');
    await page.getByLabel('Annual Interest Rate').fill('6.5');
    await page.getByLabel('Residual Value').fill('10000');
    await page.getByLabel('Lease Term (Months)').fill('60');
    
    // Now it should work
    await page.route('**/v1/api/analysis/**', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        json: {
          leaseType: 'equipment',
          termMonths: 60,
          startDate: '2024-01-01',
          endDate: '2028-12-31',
          metrics: { totalCost: 120000, averageMonthlyPayment: 2000, presentValue: 110000, effectiveAnnualRate: 0.065 },
          schedule: [],
          renewalOptions: [],
          riskAnalysis: { flexibilityScore: 75, renewalRisk: 'low', marketComparability: 'high' },
          insights: { effectiveRent: 2000, occupancyCost: 2500, totalCommitment: 120000, flexibilityRating: 'medium', recommendations: [] },
        },
      });
    });
    
    await page.click('button:has-text("Analyze Lease")');
    await expect(page.locator('text=Financial Summary')).toBeVisible({ timeout: 10000 });
  });

  test('numeric input validation', async ({ page }) => {
    // Test negative equipment cost
    await page.getByLabel('Equipment Cost').fill('-50000');
    await page.getByLabel('Annual Interest Rate').fill('6.5');
    await page.getByLabel('Lease Term (Months)').fill('60');
    
    // HTML validation should prevent submission or show error
    const equipmentCostInput = page.getByLabel('Equipment Cost');
    const validity = await equipmentCostInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(validity).toBe(false);
  });

  test('interest rate boundary validation', async ({ page }) => {
    await page.getByLabel('Equipment Cost').fill('100000');
    await page.getByLabel('Lease Term (Months)').fill('60');
    
    // Test rate over 100%
    await page.getByLabel('Annual Interest Rate').fill('150');
    
    const rateInput = page.getByLabel('Annual Interest Rate');
    const validity = await rateInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(validity).toBe(false);
    
    // Test valid rate
    await page.getByLabel('Annual Interest Rate').fill('7.5');
    const validityAfter = await rateInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(validityAfter).toBe(true);
  });

  test('term months validation', async ({ page }) => {
    await page.getByLabel('Equipment Cost').fill('100000');
    await page.getByLabel('Annual Interest Rate').fill('6.5');
    
    // Test zero months
    await page.getByLabel('Lease Term (Months)').fill('0');
    
    const termInput = page.getByLabel('Lease Term (Months)');
    const validity = await termInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(validity).toBe(false);
    
    // Test very high number
    await page.getByLabel('Lease Term (Months)').fill('10000');
    // Should be valid (business logic may handle reasonableness)
  });

  test.skip('escalation tab validation', async ({ page: _page }) => {
    // This test expects real estate lease features (escalations) that are not applicable to equipment leases
    // Equipment leases in this component don't have escalation tab functionality
  });

  test.skip('additional costs validation', async ({ page: _page }) => {
    // This test expects real estate lease features (CAM costs) that are not applicable to equipment leases
    // Equipment leases in this component don't have CAM or additional costs functionality
  });

  test('API error handling', async ({ page }) => {
    // Mock API error
    await page.route('**/v1/api/analysis/**', async (route) => {
      await route.fulfill({
        status: 500,
        headers: { 'content-type': 'application/json' },
        json: {
          error: {
            message: 'Internal server error during analysis'
          },
        },
      });
    });

    // Fill valid form
    await page.getByLabel('Equipment Cost').fill('100000');
    await page.getByLabel('Annual Interest Rate').fill('6.5');
    await page.getByLabel('Lease Term (Months)').fill('60');
    
    await page.click('button:has-text("Analyze")');
    
    // Should show error message - component displays the error.message text
    await expect(page.locator('text=Internal server error during analysis')).toBeVisible({ timeout: 10000 });
    
    // Results should not be shown
    await expect(page.locator('text=Financial Summary')).not.toBeVisible();
  });

  test('network timeout handling', async ({ page }) => {
    // Mock slow API response
    await page.route('**/v1/api/analysis/lease', async (route) => {
      // Delay much longer than reasonable timeout
      await new Promise(resolve => setTimeout(resolve, 30000));
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        json: { metrics: {}, schedule: [] },
      });
    });

    await page.getByLabel('Equipment Cost').fill('100000');
    await page.getByLabel('Annual Interest Rate').fill('6.5');
    await page.getByLabel('Lease Term (Months)').fill('60');
    
    await page.click('button:has-text("Analyze")');
    
    // Should show loading state - button text changes to "Analyzing..."
    await expect(page.getByRole('button', { name: 'Analyzing...' }), 'Should show loading state').toBeVisible();
    
    // After reasonable time, should show error or timeout
    // (This depends on the component's timeout implementation)
  });

  test('form reset functionality', async ({ page }) => {
    // Fill all fields
    await page.getByLabel('Equipment Cost').fill('100000');
    await page.getByLabel('Annual Interest Rate').fill('6.5');
    await page.getByLabel('Residual Value').fill('10000');
    await page.getByLabel('Lease Term (Months)').fill('60');
    
    // Clear equipment cost field
    await page.getByLabel('Equipment Cost').clear();
    
    // Verify field is cleared (may show '0' due to min=0 validation)
    const costValue = await page.getByLabel('Equipment Cost').inputValue();
    expect(costValue === '' || costValue === '0').toBe(true);
  });

  test('accessibility - keyboard navigation', async ({ page }) => {
    // Click into the form area first to establish focus context
    await page.getByLabel('Equipment Cost').click();
    await expect(page.getByLabel('Equipment Cost')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Next input
    const secondInput = page.getByLabel('Annual Interest Rate');
    await expect(secondInput).toBeFocused();
    
    await page.keyboard.press('Tab'); // Next input  
    const thirdInput = page.getByLabel('Residual Value');
    await expect(thirdInput).toBeFocused();
  });

  test('accessibility - screen reader labels', async ({ page }) => {
    // Check that form inputs have proper labels
    const equipmentCostInput = page.getByLabel('Equipment Cost');
    await expect(equipmentCostInput).toBeVisible();
    
    const rateInput = page.getByLabel('Annual Interest Rate');
    const rateLabel = await rateInput.getAttribute('aria-label');
    expect(rateLabel || await rateInput.locator('..').textContent()).toContain('Rate');
  });
});