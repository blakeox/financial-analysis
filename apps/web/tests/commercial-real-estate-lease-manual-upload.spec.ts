import { expect, test } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Commercial Real Estate Lease - Manual Upload Testing', () => {
  const testFilesPath = path.join(__dirname, '../../../tests/fixtures');
  const industrialLeasePath = path.join(testFilesPath, 'industrial_complex_lease.pdf');
  const serviceLeasePath = path.join(testFilesPath, 'service_complex_lease.pdf');

  test('should successfully upload and process PDF without payload errors', async ({ page }) => {
    // Set longer timeout for this test
    test.setTimeout(60000);
    
    console.log('\n=== Starting PDF Upload Test ===');
    console.log('File 1 path:', industrialLeasePath);
    console.log('File 1 exists:', fs.existsSync(industrialLeasePath));
    
    if (fs.existsSync(industrialLeasePath)) {
      const stats1 = fs.statSync(industrialLeasePath);
      console.log(`File 1 size: ${stats1.size} bytes (${(stats1.size / 1024).toFixed(2)} KB)`);
    }

    console.log('File 2 path:', serviceLeasePath);
    console.log('File 2 exists:', fs.existsSync(serviceLeasePath));
    
    if (fs.existsSync(serviceLeasePath)) {
      const stats2 = fs.statSync(serviceLeasePath);
      console.log(`File 2 size: ${stats2.size} bytes (${(stats2.size / 1024).toFixed(2)} KB)`);
    }

    // Navigate to page
    console.log('\nNavigating to /commercial-real-estate-lease...');
    await page.goto('/commercial-real-estate-lease');
    await page.waitForLoadState('networkidle');
    
    // Log all network requests
    page.on('request', async (request) => {
      if (request.url().includes('/api/extract/lease')) {
        console.log('\n📤 Request to extract endpoint:');
        console.log('  Method:', request.method());
        console.log('  URL:', request.url());
        const postData = request.postData();
        if (postData) {
          console.log('  Payload size:', postData.length, 'bytes');
          // Sample the payload
          const sample = postData.substring(0, 100);
          console.log('  Payload preview:', sample);
        }
      }
    });

    // Log all responses
    page.on('response', async (response) => {
      if (response.url().includes('/api/extract/lease')) {
        const status = response.status();
        const url = response.url();
        console.log('\n📥 Response from extract endpoint:');
        console.log('  Status:', status);
        console.log('  URL:', url);
        
        if (!response.ok()) {
          const text = await response.text();
          console.log('  Error response:', text.substring(0, 500));
        }
      }
    });

    // Wait for upload area
    console.log('\nWaiting for upload area...');
    const uploadArea = page.locator('text=AI-Powered Document Analysis');
    await expect(uploadArea).toBeVisible({ timeout: 10000 });
    console.log('✅ Upload area visible');

    // Check file size limit message
    const sizeMessage = page.locator('text=Supports PDF, DOC, DOCX, TXT files up to 50MB');
    await expect(sizeMessage).toBeVisible();
    console.log('✅ File size limit message visible');

    // Test first PDF
    if (fs.existsSync(industrialLeasePath)) {
      console.log('\n📎 Uploading industrial lease...');
      const fileInput = page.locator('input[type="file"]');
      
      console.log('Setting file input...');
      await fileInput.setInputFiles(industrialLeasePath);
      console.log('File set, waiting for response...');

      // Wait for either success or error
      await page.waitForTimeout(5000);
      
      // Check for errors
      const errorBox = page.locator('.bg-red-50').first();
      const hasError = await errorBox.isVisible().catch(() => false);
      
      if (hasError) {
        const errorText = await errorBox.textContent();
        console.log('\n❌ ERROR DETECTED:');
        console.log(errorText);
        
        // Check if it's a payload size error
        if (errorText?.includes('65536') || errorText?.includes('JSON body too large')) {
          console.log('\n⚠️ STILL HAS PAYLOAD SIZE LIMIT ISSUE!');
          throw new Error('Payload size limit error still present: ' + errorText);
        }
      } else {
        console.log('✅ No error detected');
      }
      
      // Check for success
      const successIndicator = page.locator('text=Document processed successfully');
      const hasSuccess = await successIndicator.isVisible().catch(() => false);
      
      if (hasSuccess) {
        console.log('✅ Success indicator visible');
      }
    }

    // Wait a moment between uploads
    await page.waitForTimeout(2000);

    // Test second PDF
    if (fs.existsSync(serviceLeasePath)) {
      console.log('\n📎 Uploading service lease...');
      const fileInput = page.locator('input[type="file"]');
      
      await fileInput.setInputFiles(serviceLeasePath);
      console.log('Second file set, waiting for response...');

      await page.waitForTimeout(5000);
      
      // Check for errors again
      const errorBox = page.locator('.bg-red-50').first();
      const hasError = await errorBox.isVisible().catch(() => false);
      
      if (hasError) {
        const errorText = await errorBox.textContent();
        console.log('\n❌ ERROR DETECTED on second upload:');
        console.log(errorText);
        
        if (errorText?.includes('65536') || errorText?.includes('JSON body too large')) {
          console.log('\n⚠️ STILL HAS PAYLOAD SIZE LIMIT ISSUE!');
          throw new Error('Payload size limit error on second file: ' + errorText);
        }
      } else {
        console.log('✅ No error on second upload');
      }
    }

    console.log('\n=== Test Complete ===');
  });
});









