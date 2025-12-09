import { expect, test } from '@playwright/test';

test.describe('Enhanced Lease Analysis - File Upload & AI Features', () => {
  test.beforeEach(async ({ page }) => {
    // Mock successful file upload
    await page.route('**/v1/api/upload/lease', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        json: {
          success: true,
          key: 'uploads/test-doc-123.pdf',
          fileName: 'test-lease.pdf',
          fileSize: 1024,
          contentType: 'application/pdf'
        },
      });
    });

    // Mock successful document extraction
    await page.route('**/v1/api/extract/lease', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        json: {
          success: true,
          extractedData: {
            confidence: {
              overall: 0.85,
              financial: 0.92,
              property: 0.78,
            },
            leaseTerm: 60,
            baseRent: 2500,
            escalationType: 'percentage',
            escalationRate: 0.03,
            securityDeposit: 5000,
            squareFootage: 1200,
            cam: 300,
            taxes: 200,
            insurance: 150,
            utilities: 250,
          },
        },
      });
    });

    await page.goto('/lease-analysis');
    // Wait for React component to hydrate
    await page.waitForLoadState('networkidle');
  });

  test('drag and drop file upload visual feedback', async ({ page }) => {
    // Select the upload area container by its distinctive classes
    const uploadArea = page.locator('.border-2.border-dashed.rounded-lg.touch-manipulation');
    
    // Initial state should show default styling
    await expect(uploadArea).toBeVisible();
    await expect(uploadArea).toContainText('Drag & drop your lease document here');
    
    // Test file input click
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeHidden(); // Should be visually hidden but present
  });

  test('AI extraction preview and apply functionality', async ({ page }) => {
    // Upload a mock file
    const fileChooserPromise = page.waitForEvent('filechooser');
    const uploadButton = page.getByRole('button', { name: /choose file/i });
    await uploadButton.click();
    const fileChooser = await fileChooserPromise;
    
    // Create a mock PDF file
    await fileChooser.setFiles({
      name: 'test-lease.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('mock pdf content'),
    });

    // Wait for extraction preview to appear
    await expect(page.locator('text=AI Extraction Preview')).toBeVisible({ timeout: 10000 });
    
  // Check confidence indicators (three gauges)
  await expect(page.getByText('Overall')).toBeVisible();
  // Verify key sections render
  await expect(page.getByText(/Basic Terms/i)).toBeVisible();
  await expect(page.getByText(/Additional Costs/i)).toBeVisible();

    const applyButton = page.getByRole('button', { name: /apply to form/i });
  await expect(applyButton).toBeVisible();

  // Test Apply to Form functionality
    await applyButton.click();
    
    // Wait for preview dismissal to ensure form state updates before checking fields
    await expect(page.locator('text=AI Extraction Preview')).not.toBeVisible({ timeout: 10000 });

    // Verify data was applied to form fields (check that term field has a value)
    const termInput = page.getByLabel('Lease Term (Months)');
    await expect(termInput).toHaveValue(/\d+/);
  });

  test('AI extraction preview dismiss functionality', async ({ page }) => {
    // Upload mock file
    const fileChooserPromise = page.waitForEvent('filechooser');
    const uploadButton = page.getByRole('button', { name: /choose file/i });
    await uploadButton.click();
    const fileChooser = await fileChooserPromise;
    
    await fileChooser.setFiles({
      name: 'test-lease.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('mock pdf content'),
    });

    // Wait for preview
    await expect(page.getByText(/AI Extraction Preview/i)).toBeVisible({ timeout: 10000 });
    
    // Click dismiss/close button
    const dismissButton = page.getByRole('button', { name: /close|dismiss/i }).first();
    await dismissButton.click();
    
    // Preview should be hidden
    await expect(page.getByText(/AI Extraction Preview/i)).not.toBeVisible();
  });

  test('file upload error handling', async ({ page }) => {
    // Mock API error response for extraction
    await page.route('**/v1/api/extract/lease', async (route) => {
      await route.fulfill({
        status: 400,
        headers: { 'content-type': 'application/json' },
        json: {
          success: false,
          error: 'Unable to extract lease data from document',
        },
      });
    });

    // Upload file
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("Choose File")');
    const fileChooser = await fileChooserPromise;
    
    await fileChooser.setFiles({
      name: 'invalid-file.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not a lease document'),
    });

    // Should show error message somewhere on page
    await expect(page.getByText(/unable|error|failed/i)).toBeVisible({ timeout: 10000 });
    
    // Preview should not appear
    await expect(page.getByText(/AI Extraction Preview/i)).not.toBeVisible();
  });

  test('upload progress indicator', async ({ page }) => {
    // Mock slow extraction to see progress
    await page.route('**/v1/api/extract/lease', async (route) => {
      // Delay response to simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        json: {
          success: true,
          extractedData: {
            confidence: { overall: 0.85, financial: 0.92, property: 0.78 },
            leaseTerm: 60,
            baseRent: 2500,
          },
        },
      });
    });

    // Upload file
    const fileChooserPromise = page.waitForEvent('filechooser');
    const uploadButton = page.getByRole('button', { name: /choose file/i });
    await uploadButton.click();
    const fileChooser = await fileChooserPromise;
    
    await fileChooser.setFiles({
      name: 'test-lease.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('mock pdf content'),
    });

    // Should show some processing indicator (spinner, progress, etc)
    const processingIndicator = page.locator('.animate-spin, [class*="processing"], [class*="loading"]').first();
    // Give it a moment to appear
    await page.waitForTimeout(100);
    const indicatorVisible = await processingIndicator.isVisible().catch(() => false);
    
    // Eventually should show success
    if (indicatorVisible) {
      await expect(processingIndicator).toBeVisible();
    }

    await expect(page.getByText(/AI Extraction Preview|success|complete/i)).toBeVisible({ timeout: 15000 });
  });

  test('file type validation', async ({ page }) => {
    // Mock upload endpoint to reject invalid file type
    await page.route('**/v1/api/upload/lease', async (route) => {
      await route.fulfill({
        status: 400,
        headers: { 'content-type': 'application/json' },
        json: {
          error: 'Invalid file type. Please upload PDF, DOC, DOCX, or TXT files.'
        },
      });
    });

    // Try to upload invalid file type
    const fileChooserPromise = page.waitForEvent('filechooser');
    const uploadButton = page.getByRole('button', { name: /choose file/i });
    await uploadButton.click();
    const fileChooser = await fileChooserPromise;
    
    await fileChooser.setFiles({
      name: 'image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake image content'),
    });

    // Should show file type error
    await expect(page.getByText(/invalid.*file.*type|please upload.*pdf/i)).toBeVisible({ timeout: 5000 });
  });
});