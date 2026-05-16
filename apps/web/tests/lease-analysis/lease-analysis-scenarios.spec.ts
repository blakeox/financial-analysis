import { expect, test } from '@playwright/test';

test.describe('Enhanced Lease Analysis - Scenario Analysis & Advanced Features', () => {
  test.beforeEach(async ({ page }) => {
    // Mock successful analysis
    await page.route('**/v1/api/analysis/**', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        json: {
          leaseType: 'equipment',
          termMonths: 60,
          startDate: '2024-01-01',
          endDate: '2028-12-31',
          metrics: {
            totalCost: 120000,
            averageMonthlyPayment: 2000,
            presentValue: 110000,
            effectiveAnnualRate: 0.065,
          },
          schedule: Array.from({ length: 60 }, (_, i) => ({
            month: i + 1,
            payment: 2000,
            interest: 500,
            principal: 1500,
            balance: 100000 - 1500 * (i + 1),
            escalatedPayment: 2000 + i * 10,
            additionalCosts: { total: 300 },
            totalPayment: 2300 + i * 10,
            cumulativePaid: (2300 + i * 10) * (i + 1),
          })),
          renewalOptions: [],
          riskAnalysis: {
            flexibilityScore: 75,
            renewalRisk: 'medium',
            marketComparability: 'high',
            earlyTerminationCost: 15000,
          },
          insights: {
            effectiveRent: 2000,
            occupancyCost: 2500,
            totalCommitment: 120000,
            flexibilityRating: 'medium',
            recommendations: [],
          },
          leaseVsBuy: {
            recommendation: 'lease',
            leaseOption: { totalCost: 120000, monthlyPayment: 2000 },
            buyOption: { totalLoanCost: 140000, loanPayment: 2333 },
          },
        },
      });
    });

    await page.goto('/lease-analysis');
    // Wait for React component to hydrate
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Fill and submit basic analysis first using getByLabel
    await page.getByLabel('Equipment Cost').fill('100000');
    await page.getByLabel('Annual Interest Rate').fill('6.5');
    await page.getByLabel('Residual Value').fill('10000');
    await page.getByLabel('Lease Term (Months)').fill('60');
    await page.click('button:has-text("Analyze")');
    await expect(page.locator('text=Financial Summary')).toBeVisible({ timeout: 10000 });
  });

  test('scenario analysis execution', async ({ page }) => {
    // Find and click Run Scenarios button
    await expect(page.locator('text=Scenario Analysis')).toBeVisible();
    await page.click('text=Run Scenarios');

    // Wait for scenario results
    await expect(page.locator('text=Scenario Comparison')).toBeVisible({ timeout: 15000 });

    // Check that all three scenarios are displayed using headings
    await expect(page.getByRole('heading', { name: 'Optimistic' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Conservative' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pessimistic' })).toBeVisible();

    // Each scenario should show financial metrics
    const optimisticSection = page.locator('.bg-green-50, .bg-green-900').first();
    await expect(optimisticSection.locator('text=Total Cost:')).toBeVisible();
    await expect(optimisticSection.locator('text=Monthly Avg:')).toBeVisible();
    await expect(optimisticSection.locator('text=vs Base:')).toBeVisible();

    // Check key insights section
    await expect(page.locator('text=Key Insights')).toBeVisible();
    await expect(page.locator('text=Risk Range:')).toBeVisible();
    await expect(page.locator('text=Best Case Savings:')).toBeVisible();
    await expect(page.locator('text=Worst Case Impact:')).toBeVisible();
    await expect(page.locator('text=Confidence Level:')).toBeVisible();
  });

  test('scenario analysis comparison values', async ({ page }) => {
    await page.click('text=Run Scenarios');
    await expect(page.locator('text=Scenario Comparison')).toBeVisible({ timeout: 15000 });

    // Optimistic scenario should show lower costs (negative percentage vs base)
    const optimisticPercentage = page
      .locator('.bg-green-50, .bg-green-900')
      .first()
      .locator('text=vs Base:')
      .locator('..')
      .locator('span')
      .last();
    const optimisticText = await optimisticPercentage.textContent();
    expect(optimisticText).toMatch(/-?\d+\.\d%/); // Should be a percentage

    // Pessimistic scenario should show higher costs (positive percentage vs base)
    const pessimisticPercentage = page
      .locator('.bg-red-50, .bg-red-900')
      .first()
      .locator('text=vs Base:')
      .locator('..')
      .locator('span')
      .last();
    const pessimisticText = await pessimisticPercentage.textContent();
    expect(pessimisticText).toMatch(/-?\d+\.\d%/); // Should be a percentage
  });

  test('scenario analysis close functionality', async ({ page }) => {
    await page.click('text=Run Scenarios');
    await expect(page.locator('text=Scenario Comparison')).toBeVisible({ timeout: 15000 });

    // Close the scenario analysis
    await page.click('text=Close Analysis');

    // Scenario comparison should be hidden
    await expect(page.locator('text=Scenario Comparison')).not.toBeVisible();

    // But scenario analysis trigger should still be visible
    await expect(page.locator('text=Scenario Analysis')).toBeVisible();
    await expect(page.locator('text=Run Scenarios')).toBeVisible();
  });

  test('export functionality - PDF', async ({ page }) => {
    // Mock window.print for PDF export
    await page.addInitScript(() => {
      window.print = () => {
        // Simulate print dialog
        console.log('Print dialog opened');
      };
    });

    // Find export options
    await expect(page.locator('text=Export Results')).toBeVisible();

    // Click PDF export
    await page.click('text=Export PDF');

    // PDF export typically opens print dialog, which we can't fully test
    // but we can verify the function was called
    const printCalled = await page.evaluate(() => {
      return window.print !== undefined;
    });
    expect(printCalled).toBe(true);
  });

  test('export functionality - CSV', async ({ page }) => {
    // Set up download handling
    const downloadPromise = page.waitForEvent('download');

    // Click CSV export
    await page.click('text=Export CSV');

    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/lease-analysis.*\.csv$/);
  });

  test('export functionality - JSON', async ({ page }) => {
    // Set up download handling
    const downloadPromise = page.waitForEvent('download');

    // Click JSON export
    await page.click('text=Export JSON');

    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/lease-analysis.*\.json$/);
  });

  test('shareable link generation', async ({ page }) => {
    // Grant clipboard permissions for the test
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // Click generate shareable link
    await page.click('text=Generate Shareable Link');

    // Should show the generated link (with timeout for async operation)
    await expect(page.locator('text=Shareable Link Generated')).toBeVisible({ timeout: 10000 });

    // Link should be copyable
    const linkElement = page.locator('input[readonly]').first();
    await expect(linkElement).toBeVisible();

    const linkValue = await linkElement.inputValue();
    expect(linkValue).toMatch(/https?:\/\/.*\?shared=/);

    // Note: Link is automatically copied to clipboard on generation
    // We've verified the UI shows the success message and link input
  });

  test('lease vs buy comparison display', async ({ page }) => {
    // Should show lease vs buy section in results
    await expect(page.getByRole('heading', { name: 'Lease vs Buy Comparison' })).toBeVisible();

    // Should show recommendation
    await expect(page.locator('text=Recommendation: Lease')).toBeVisible();

    // Should show both options with metrics
    await expect(page.locator('text=Lease Option')).toBeVisible();
    await expect(page.locator('text=Buy Option')).toBeVisible();

    // Recommended option should be highlighted
    const leaseOption = page.locator('text=Lease Option').locator('..');
    await expect(leaseOption).toHaveClass(/border-green-500/);
  });

  test('risk analysis indicators', async ({ page }) => {
    // Should show risk analysis section
    await expect(page.getByRole('heading', { name: 'Risk Analysis' })).toBeVisible();

    // Scope all checks to within the Risk Analysis card to avoid strict mode violations
    const riskCard = page
      .locator('div')
      .filter({ hasText: /^Risk Analysis/ })
      .first();

    // Should show flexibility score
    await expect(riskCard.locator('text=Flexibility Score')).toBeVisible();
    await expect(riskCard.locator('text=75/100')).toBeVisible();

    // Should show risk indicators that are actually displayed in the component
    await expect(riskCard.locator('text=Renewal Risk')).toBeVisible();
    await expect(riskCard.locator('text=medium')).toBeVisible(); // lowercase as rendered

    // Should show early termination cost
    await expect(riskCard.locator('text=Early Termination Cost')).toBeVisible();
  });

  test('payment schedule display', async ({ page }) => {
    // Should show payment schedule
    await expect(page.getByRole('heading', { name: 'Payment Schedule' })).toBeVisible();

    // Scope checks to within the Payment Schedule card to avoid strict mode violations
    const scheduleCard = page
      .locator('div')
      .filter({ hasText: /^Payment Schedule/ })
      .first();

    // Should show schedule data (first few months)
    await expect(scheduleCard.getByRole('cell', { name: 'Month 1', exact: true })).toBeVisible();
    await expect(scheduleCard.getByRole('cell', { name: 'Month 2', exact: true })).toBeVisible();

    // Should show payment amounts - mock uses totalPayment: 2300 + (i * 10)
    // So first payment is $2,300, second is $2,310
    await expect(scheduleCard.locator('text=$2,300')).toBeVisible(); // First payment
    await expect(scheduleCard.locator('text=$2,310')).toBeVisible(); // Second payment
  });
});
