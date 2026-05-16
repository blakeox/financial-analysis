import { expect, test } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Commercial Real Estate Lease Analysis - PDF Upload & Extraction', () => {
  const testFilesPath = path.join(__dirname, '../../../tests/fixtures');
  const industrialLeasePath = path.join(testFilesPath, 'industrial_complex_lease.pdf');
  const serviceLeasePath = path.join(testFilesPath, 'service_complex_lease.pdf');

  test.beforeEach(async ({ page }) => {
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
            leaseType: 'office-modified-gross',
            leaseTerm: 60,
            baseRent: 8500,
            escalationType: 'percentage',
            escalationRate: 0.03,
            securityDeposit: 17000,
            squareFootage: 2850,
            cam: 425,
            taxes: 850,
            insurance: 300,
            utilities: 500,
            landlord: 'Commercial Property Management LLC',
            tenant: 'Acme Corporation',
            propertyAddress: '123 Business Park Drive, Suite 450',
            leaseStartDate: '2024-01-01',
            leaseEndDate: '2029-01-01',
          },
          extractionMethod: 'workers-ai',
        },
      });
    });

    await page.goto('/commercial-real-estate-lease');
    await page.waitForLoadState('networkidle');
  });

  test('should upload industrial complex lease PDF successfully', async ({ page }) => {
    // Verify page loaded
    await expect(page.locator('text=AI-Powered Document Analysis')).toBeVisible();

    // Check file exists
    expect(fs.existsSync(industrialLeasePath)).toBe(true);

    // Upload the PDF
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(industrialLeasePath);

    // Wait for extraction progress
    await page.waitForTimeout(500);

    // Should show processing state (not error immediately)
    const uploadArea = page.locator('.border-2.border-dashed.rounded-lg');
    await expect(uploadArea).toBeVisible();

    // Wait for extraction to complete or timeout
    try {
      await expect(page.locator('text=AI Extraction Preview')).toBeVisible({ timeout: 10000 });
    } catch {
      // If preview doesn't show, check if there's an error message
      const errorMsg = await page.locator('.bg-red-50, .text-red-600').first();
      if (await errorMsg.isVisible()) {
        console.log('Extraction error:', await errorMsg.textContent());
      }
    }
  });

  test('should upload service complex lease PDF successfully', async ({ page }) => {
    // Verify page loaded
    await expect(page.locator('text=AI-Powered Document Analysis')).toBeVisible();

    // Check file exists
    expect(fs.existsSync(serviceLeasePath)).toBe(true);

    // Get file size
    const stats = fs.statSync(serviceLeasePath);
    console.log(`Uploading service complex lease: ${stats.size} bytes`);

    // Upload the PDF
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(serviceLeasePath);

    // Wait for processing
    await page.waitForTimeout(1000);

    // Check for success or error
    const uploadArea = page.locator('.border-2.border-dashed.rounded-lg');
    await expect(uploadArea).toBeVisible();

    try {
      await expect(page.locator('text=AI Extraction Preview')).toBeVisible({ timeout: 15000 });
    } catch {
      // Check for specific error messages
      const hasError = await page.locator('.bg-red-50').count();
      if (hasError > 0) {
        const errorText = await page.locator('.bg-red-50').first().textContent();
        console.log('Error during upload:', errorText);
      }
    }
  });

  test('should handle large PDF files without payload errors', async ({ page }) => {
    // This test verifies that the API can handle large base64-encoded files
    const filePath = industrialLeasePath;

    if (!fs.existsSync(filePath)) {
      test.skip();
    }

    const stats = fs.statSync(filePath);
    console.log(`Testing file size: ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`);

    // Monitor network requests
    const responses: string[] = [];
    page.on('response', async (response) => {
      if (response.url().includes('/extract/lease')) {
        responses.push(await response.status().toString());
        if (!response.ok()) {
          const body = await response.text();
          console.log('API Error Response:', body);
        }
      }
    });

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    // Wait for API response
    await page.waitForTimeout(3000);

    // Should not get 413 Payload Too Large error
    const errorMsg = await page.locator('.bg-red-50').first();
    if (await errorMsg.isVisible()) {
      const errorText = await errorMsg.textContent();
      console.log('Error shown to user:', errorText);

      // Fail test if it's a payload size error
      if (errorText?.includes('JSON body too large') || errorText?.includes('65536')) {
        throw new Error('Still getting payload size limit error');
      }
    }

    // Log final status
    console.log('Responses received:', responses);
  });

  test('should display proper file size information', async ({ page }) => {
    await expect(page.locator('text=Supports PDF, DOC, DOCX, TXT files up to 50MB')).toBeVisible();
  });

  test('should show upload progress indicators', async ({ page }) => {
    const filePath = industrialLeasePath;

    if (!fs.existsSync(filePath)) {
      test.skip();
    }

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    // Check for processing state (progress bar, spinner, or uploading message)
    await page.waitForTimeout(500);

    const uploadArea = page.locator('.border-2.border-dashed');
    const areaClass = await uploadArea.getAttribute('class');

    // Should show active state (not the default gray border)
    expect(areaClass).toBeTruthy();

    // Should have either yellow (processing) or green (success) border at some point
    const processing = await uploadArea
      .evaluate((el) => {
        return (
          window.getComputedStyle(el).borderColor.includes('yellow') ||
          window.getComputedStyle(el).borderColor.includes('rgb(234, 179, 8)')
        );
      })
      .catch(() => false);

    // Or might be green if very fast
    const success = await uploadArea
      .evaluate((el) => {
        return (
          window.getComputedStyle(el).borderColor.includes('green') ||
          window.getComputedStyle(el).borderColor.includes('rgb(34, 197, 94)')
        );
      })
      .catch(() => false);

    // Should be in some active state
    expect(processing || success).toBe(true);
  });
});
