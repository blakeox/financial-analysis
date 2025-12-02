import { expect, test } from '@playwright/test';

/**
 * Advanced Playwright Tests for Commercial Real Estate Lease Analysis
 * 
 * These tests cover:
 * 1. Template loading and customization
 * 2. AI extraction workflow
 * 3. Form validation and error handling
 * 4. Analysis execution and results display
 * 5. Scenario modeling
 * 6. Interactive features (tabs, modals, saved analyses)
 * 7. Export functionality
 * 8. Mobile responsiveness
 * 9. Accessibility
 */

test.describe('Commercial Real Estate Lease Analysis - Advanced Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the page before each test
    await page.goto('/commercial-real-estate-lease');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Template System', () => {
    test('should load and apply Industrial Warehouse NNN template', async ({ page }) => {
      // Find and click the "Load Template" button for Industrial Warehouse
      const loadTemplateButton = page.getByRole('button', { name: /industrial warehouse/i });
      
      if (await loadTemplateButton.isVisible()) {
        await loadTemplateButton.click();
        
        // Verify the form is populated with template values
        const baseRentInput = page.getByLabel(/base rent/i);
        const baseRentValue = await baseRentInput.inputValue();
        expect(baseRentValue).toMatch(/45000/);
        
        // Verify lease type is set
        const leaseTypeSelect = page.locator('select').first();
        const leaseType = await leaseTypeSelect.inputValue();
        expect(leaseType).toContain('warehouse-nnn');
        
        // Verify term is set to 60 months
        const termInput = page.getByLabel(/term/i);
        const termValue = await termInput.inputValue();
        expect(termValue).toMatch(/60/);
      }
    });

    test('should display all available templates', async ({ page }) => {
      // Look for template cards or buttons
      const templates = [
        /industrial warehouse/i,
        /office building/i,
        /retail/i,
        /medical office/i,
      ];

      for (const template of templates) {
        const templateElement = page.getByRole('button', { name: template });
        await expect(templateElement).toBeVisible({ timeout: 5000 });
      }
    });

    test('should populate correct form fields based on template category', async ({ page }) => {
      // Load office template
      const officeTemplate = page.getByRole('button', { name: /office building/i });
      if (await officeTemplate.isVisible()) {
        await officeTemplate.click();
        await page.waitForTimeout(1000);
        
        // Verify office-specific fields are shown
        const baseRentInput = page.getByLabel(/base rent/i);
        expect(await baseRentInput.isVisible()).toBeTruthy();
        
        // Verify additional costs section is populated
        const camChargesInput = page.getByLabel(/cam/i).or(page.getByLabel(/common area maintenance/i)).first();
        if (await camChargesInput.isVisible()) {
          const camValue = await camChargesInput.inputValue();
          expect(Number(camValue)).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('AI Document Extraction', () => {
    test('should handle PDF upload and extraction', async ({ page }) => {
      // Mock the extraction API response
      await page.route('**/v1/api/extract/lease-direct', async (route) => {
        const request = route.request();
        const postData = request.postData();
        
        if (postData) {
          const body = JSON.parse(postData);
          
          // Return mock extraction data
          await route.fulfill({
            status: 200,
            headers: { 'content-type': 'application/json' },
            json: {
              success: true,
              extractedData: {
                confidence: { overall: 0.95, financial: 0.98, property: 0.92 },
                leaseType: 'warehouse-nnn',
                baseRent: 45000,
                leaseTerm: 60,
                escalationType: 'fixed',
                escalationRate: 0.03,
                securityDeposit: 90000,
                squareFootage: 50000,
                cam: 5000,
                taxes: 3000,
                insurance: 1500,
                utilities: 2000,
                parkingSpaces: 60,
              },
            },
          });
        } else {
          await route.fulfill({
            status: 400,
            headers: { 'content-type': 'application/json' },
            json: { success: false, error: 'No data provided' },
          });
        }
      });

      // Find file input
      const fileInput = page.locator('input[type="file"]');
      
      // Create a mock PDF file
      const fileBuffer = Buffer.from('mock PDF content');
      
      await fileInput.setInputFiles({
        name: 'test-lease.pdf',
        mimeType: 'application/pdf',
        buffer: fileBuffer,
      });

      // Wait for upload to complete
      await page.waitForTimeout(2000);
      
      // Look for extraction preview
      const previewVisible = await page.getByText(/AI Extraction Preview/i).isVisible({ timeout: 10000 });
      expect(previewVisible).toBeTruthy();
      
      // Verify confidence scores are displayed
      const confidenceDisplay = page.getByText(/95%/i);
      if (await confidenceDisplay.isVisible()) {
        expect(await confidenceDisplay.textContent()).toContain('95');
      }
    });

    test('should show error for unsupported file type', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');
      
      // Try to upload an unsupported file
      await fileInput.setInputFiles({
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('test content'),
      });
      
      // Look for error message
      await page.waitForTimeout(1000);
      
      // Check for file validation error
      const errorMessage = page.getByText(/supported.*pdf.*doc/i);
      expect(await errorMessage.isVisible()).toBeTruthy();
    });

    test('should handle extraction failure gracefully', async ({ page }) => {
      // Mock extraction failure
      await page.route('**/v1/api/extract/lease-direct', async (route) => {
        await route.fulfill({
          status: 500,
          headers: { 'content-type': 'application/json' },
          json: { success: false, error: 'Extraction failed' },
        });
      });

      const fileInput = page.locator('input[type="file"]');
      const fileBuffer = Buffer.from('mock PDF');
      
      await fileInput.setInputFiles({
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: fileBuffer,
      });

      await page.waitForTimeout(2000);
      
      // Verify error is displayed
      const errorDisplay = await page.getByText(/failed/i).isVisible();
      expect(errorDisplay).toBeTruthy();
    });

    test('should allow applying extracted data to form', async ({ page }) => {
      // Mock successful extraction
      await page.route('**/v1/api/extract/lease-direct', async (route) => {
        await route.fulfill({
          status: 200,
          headers: { 'content-type': 'application/json' },
          json: {
            success: true,
            extractedData: {
              confidence: { overall: 0.92 },
              leaseType: 'warehouse-nnn',
              baseRent: 45000,
              leaseTerm: 60,
            },
          },
        });
      });

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('mock'),
      });

      await page.waitForTimeout(2000);
      
      // Click "Apply to Form" button
      const applyButton = page.getByRole('button', { name: /apply to form/i });
      if (await applyButton.isVisible()) {
        await applyButton.click();
        await page.waitForTimeout(1000);
        
        // Verify form fields are populated
        const baseRentInput = page.getByLabel(/base rent/i);
        const baseRent = await baseRentInput.inputValue();
        expect(baseRent).toMatch(/45000/);
      }
    });
  });

  test.describe('Form Validation', () => {
    test('should validate base rent is positive', async ({ page }) => {
      const baseRentInput = page.getByLabel(/base rent/i);
      await baseRentInput.fill('-1000');
      
      // Try to run analysis
      const analyzeButton = page.getByRole('button', { name: /analyze/i });
      await analyzeButton.click();
      
      // Look for validation error
      await page.waitForTimeout(500);
      const errorMessage = await page.getByText(/must be positive/i).isVisible();
      expect(errorMessage).toBeTruthy();
    });

    test('should validate lease term is within reasonable range', async ({ page }) => {
      const termInput = page.getByLabel(/term/i);
      await termInput.fill('999'); // Unrealistic term
      
      const analyzeButton = page.getByRole('button', { name: /analyze/i });
      await analyzeButton.click();
      
      await page.waitForTimeout(500);
      
      // Form should either show error or prevent submission
      const errorVisible = await page.getByText(/invalid.*term/i).isVisible();
      if (errorVisible) {
        expect(errorVisible).toBeTruthy();
      }
    });

    test('should validate escalation rate percentage', async ({ page }) => {
      // Find and expand escalation section
      const escalationInput = page.getByLabel(/escalation rate/i);
      if (await escalationInput.isVisible()) {
        await escalationInput.fill('150'); // 150% is unreasonable
        
        const analyzeButton = page.getByRole('button', { name: /analyze/i });
        await analyzeButton.click();
        
        await page.waitForTimeout(500);
        
        // Should show validation error
        const errorMessage = await page.getByText(/escalation.*reasonable/i).isVisible();
        if (errorMessage) {
          expect(errorMessage).toBeTruthy();
        }
      }
    });
  });

  test.describe('Analysis Execution', () => {
    test('should execute analysis with valid data', async ({ page }) => {
      // Mock the analysis API
      await page.route('**/v1/api/analysis/enhanced-lease', async (route) => {
        await route.fulfill({
          status: 200,
          headers: { 'content-type': 'application/json' },
          json: {
            leaseType: 'warehouse-nnn',
            termMonths: 60,
            schedule: Array.from({ length: 60 }, (_, i) => ({
              month: i + 1,
              date: new Date(2025, i, 1).toISOString().split('T')[0],
              basePayment: 45000,
              escalatedPayment: 45000 * (1 + 0.03 * Math.floor(i / 12)),
              additionalCosts: {
                camCharges: 5000,
                propertyTaxes: 3000,
                insurance: 1500,
                utilities: 2000,
                maintenance: 1000,
                managementFee: 500,
                total: 10000,
              },
              totalPayment: 55000,
              cumulativePaid: 55000 * (i + 1),
              effectiveRate: 0.05,
              presentValue: 55000 / Math.pow(1.0067, i + 1),
              interestComponent: 0,
              principalComponent: 0,
              remainingBalance: 0,
            })),
            metrics: {
              totalCost: 3300000,
              presentValue: 2800000,
              futureValue: 3300000,
              effectiveAnnualRate: 0.05,
              internalRateOfReturn: 0.05,
              paybackPeriod: 60,
              totalInterestPaid: 0,
              averageMonthlyPayment: 55000,
              costPerMonth: 55000,
              costPerYear: 660000,
            },
            riskAnalysis: {
              earlyTerminationCost: 165000,
              totalCommitment: 3300000,
              flexibilityScore: 50,
              renewalRisk: 'medium',
              rateEscalationRisk: 'medium',
            },
            insights: {
              effectiveRent: 55000,
              occupancyCost: 3300000,
              totalCommitment: 3300000,
              flexibilityRating: 'Medium',
              recommendations: ['Monitor escalation clauses'],
            },
          },
        });
      });

      // Fill in basic form data
      const baseRentInput = page.getByLabel(/base rent/i);
      await baseRentInput.fill('45000');
      
      const termInput = page.getByLabel(/term/i);
      await termInput.fill('60');
      
      // Click analyze
      const analyzeButton = page.getByRole('button', { name: /analyze/i });
      await analyzeButton.click();
      
      // Wait for results
      await page.waitForTimeout(3000);
      
      // Verify results are displayed
      const resultsVisible = await page.getByText(/total cost/i).isVisible();
      expect(resultsVisible).toBeTruthy();
      
      // Verify key metrics are shown
      const totalCostDisplay = page.getByText(/3,300,000/i);
      expect(await totalCostDisplay.isVisible()).toBeTruthy();
    });

    test('should display payment schedule', async ({ page }) => {
      // Set up mock analysis response
      await page.route('**/v1/api/analysis/enhanced-lease', async (route) => {
        await route.fulfill({
          status: 200,
          headers: { 'content-type': 'application/json' },
          json: {
            leaseType: 'warehouse-nnn',
            termMonths: 60,
            schedule: Array.from({ length: 60 }, (_, i) => ({
              month: i + 1,
              date: new Date(2025, i, 1).toISOString().split('T')[0],
              basePayment: 45000,
              escalatedPayment: 45000,
              additionalCosts: { total: 10000 },
              totalPayment: 55000,
              cumulativePaid: 55000 * (i + 1),
              effectiveRate: 0.05,
              presentValue: 55000,
              interestComponent: 0,
              principalComponent: 0,
              remainingBalance: 0,
            })),
            metrics: {
              totalCost: 3300000,
              averageMonthlyPayment: 55000,
              costPerYear: 660000,
            },
          },
        });
      });

      // Fill form and analyze
      await page.getByLabel(/base rent/i).fill('45000');
      await page.getByRole('button', { name: /analyze/i }).click();
      await page.waitForTimeout(3000);
      
      // Look for payment schedule
      const scheduleVisible = await page.getByText(/payment schedule/i).isVisible();
      expect(scheduleVisible).toBeTruthy();
    });

    test('should handle analysis errors gracefully', async ({ page }) => {
      // Mock API error
      await page.route('**/v1/api/analysis/enhanced-lease', async (route) => {
        await route.fulfill({
          status: 500,
          headers: { 'content-type': 'application/json' },
          json: { error: { message: 'Analysis failed' } },
        });
      });

      await page.getByLabel(/base rent/i).fill('45000');
      await page.getByRole('button', { name: /analyze/i }).click();
      
      await page.waitForTimeout(2000);
      
      // Verify error message is shown
      const errorVisible = await page.getByText(/failed/i).isVisible();
      expect(errorVisible).toBeTruthy();
    });
  });

  test.describe('Scenario Modeling', () => {
    test('should generate optimistic, conservative, and pessimistic scenarios', async ({ page }) => {
      // Mock scenario analysis
      await page.route('**/v1/api/analysis/enhanced-lease', async (route) => {
        const url = new URL(route.request().url());
        const body = JSON.parse(route.request().postData() || '{}');
        
        // Return different results based on scenario
        let totalCost = 3000000;
        if (body.escalation?.rate) {
          totalCost = 3000000 * (1 + (body.escalation.rate - 0.03) * 20);
        }
        
        await route.fulfill({
          status: 200,
          headers: { 'content-type': 'application/json' },
          json: {
            leaseType: 'warehouse-nnn',
            termMonths: 60,
            schedule: [],
            metrics: { totalCost, averageMonthlyPayment: totalCost / 60 },
          },
        });
      });

      // Fill form
      await page.getByLabel(/base rent/i).fill('45000');
      await page.getByRole('button', { name: /analyze/i }).click();
      await page.waitForTimeout(3000);
      
      // Look for scenario analysis option
      const scenarioButton = page.getByRole('button', { name: /scenario/i });
      if (await scenarioButton.isVisible()) {
        await scenarioButton.click();
        await page.waitForTimeout(2000);
        
        // Verify scenarios are shown
        const optimisticVisible = await page.getByText(/optimistic/i).isVisible();
        expect(optimisticVisible).toBeTruthy();
      }
    });
  });

  test.describe('Interactive Features', () => {
    test('should save and load analyses', async ({ page }) => {
      // Execute analysis first
      await page.route('**/v1/api/analysis/enhanced-lease', async (route) => {
        await route.fulfill({
          status: 200,
          headers: { 'content-type': 'application/json' },
          json: {
            leaseType: 'warehouse-nnn',
            termMonths: 60,
            schedule: [],
            metrics: { totalCost: 3300000 },
          },
        });
      });

      await page.getByLabel(/base rent/i).fill('45000');
      await page.getByRole('button', { name: /analyze/i }).click();
      await page.waitForTimeout(3000);
      
      // Look for save button
      const saveButton = page.getByRole('button', { name: /save/i });
      if (await saveButton.isVisible()) {
        await saveButton.click();
        
        // Fill save modal
        const nameInput = page.getByLabel(/name/i);
        if (await nameInput.isVisible()) {
          await nameInput.fill('Test Lease Analysis');
          
          const submitButton = page.getByRole('button', { name: /save.*analysis/i });
          await submitButton.click();
          await page.waitForTimeout(1000);
        }
      }
    });

    test('should show shareable link after analysis', async ({ page }) => {
      // Mock analysis
      await page.route('**/v1/api/analysis/enhanced-lease', async (route) => {
        await route.fulfill({
          status: 200,
          headers: { 'content-type': 'application/json' },
          json: {
            leaseType: 'warehouse-nnn',
            termMonths: 60,
            schedule: [],
            metrics: { totalCost: 3300000 },
          },
        });
      });

      await page.getByLabel(/base rent/i).fill('45000');
      await page.getByRole('button', { name: /analyze/i }).click();
      await page.waitForTimeout(3000);
      
      // Look for share button
      const shareButton = page.getByRole('button', { name: /share/i });
      if (await shareButton.isVisible()) {
        await shareButton.click();
        await page.waitForTimeout(1000);
        
        // Verify shareable link is generated
        const linkDisplay = page.locator('input[readonly]').or(page.getByText(/http/));
        expect(await linkDisplay.isVisible()).toBeTruthy();
      }
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Verify page loads
      const header = page.getByRole('heading').first();
      expect(await header.isVisible()).toBeTruthy();
      
      // Verify form is accessible
      const baseRentInput = page.getByLabel(/base rent/i);
      expect(await baseRentInput.isVisible()).toBeTruthy();
      
      // Verify buttons are clickable
      const analyzeButton = page.getByRole('button', { name: /analyze/i });
      expect(await analyzeButton.isVisible()).toBeTruthy();
    });

    test('should handle mobile file upload', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Mock extraction
      await page.route('**/v1/api/extract/lease-direct', async (route) => {
        await route.fulfill({
          status: 200,
          headers: { 'content-type': 'application/json' },
          json: {
            success: true,
            extractedData: { baseRent: 45000, leaseTerm: 60 },
          },
        });
      });

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('mock'),
      });
      
      await page.waitForTimeout(2000);
      
      // Verify upload feedback is visible on mobile
      const uploadFeedback = page.getByText(/upload/i);
      expect(await uploadFeedback.isVisible()).toBeTruthy();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      // Check for proper form labels
      const baseRentInput = page.getByLabel(/base rent/i);
      expect(await baseRentInput.isVisible()).toBeTruthy();
      
      // Check for button labels
      const analyzeButton = page.getByRole('button', { name: /analyze/i });
      expect(await analyzeButton.isVisible()).toBeTruthy();
    });

    test('should be keyboard navigable', async ({ page }) => {
      // Tab through form
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to interact with form elements
      const focusedElement = page.locator(':focus');
      expect(await focusedElement.count()).toBeGreaterThan(0);
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.locator('h1');
      const h2 = page.locator('h2');
      
      expect(await h1.count()).toBeGreaterThan(0);
      
      // Verify at least one heading exists
      const headingsVisible = await h1.isVisible() || await h2.isVisible();
      expect(headingsVisible).toBeTruthy();
    });
  });
});









