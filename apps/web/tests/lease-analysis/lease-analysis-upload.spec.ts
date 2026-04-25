import { expect, test } from '@playwright/test';
import { mockLeaseAnalysis, openLeaseAnalysis } from './helpers';

test.describe('Lease analysis upload browser contracts', () => {
  test('uploads a PDF through the current direct-extraction endpoint and auto-applies the result', async ({
    page,
  }) => {
    await mockLeaseAnalysis(page);

    let extractionRequest: Record<string, unknown> | null = null;
    await page.route('**/v1/api/extract/lease-direct', async (route) => {
      extractionRequest = (route.request().postDataJSON() as Record<string, unknown> | null) ?? {};

      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        json: {
          success: true,
          extractedData: {
            leaseType: 'office-nnn',
            leaseTerm: 84,
            baseRent: 12000,
            escalationType: 'percentage',
            escalationRate: 0.035,
            securityDeposit: 24000,
            cam: 3000,
            taxes: 2000,
            insurance: 800,
            utilities: 1500,
          },
        },
      });
    });

    await openLeaseAnalysis(page);

    await page.getByLabel('Upload lease document').setInputFiles({
      name: 'office-lease.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('mock pdf content'),
    });

    await expect(page.getByText('Document processed successfully!')).toBeVisible();
    await expect(page.getByText('Form populated with extracted data')).toBeVisible();
    await expect(page.getByText('AI Extraction Preview')).not.toBeVisible();

    expect(extractionRequest).toMatchObject({
      fileName: 'office-lease.pdf',
      fileType: 'application/pdf',
      documentType: 'pdf',
    });

    await expect(page.locator('select').first()).toHaveValue('office-nnn');
    await expect(page.getByLabel('Monthly Base Rent')).toHaveValue('12000');
    await expect(page.getByLabel('Lease Term (Months)')).toHaveValue('84');
  });

  test('rejects unsupported file types before any extraction request is sent', async ({ page }) => {
    await mockLeaseAnalysis(page);

    let extractionCalled = false;
    await page.route('**/v1/api/extract/lease-direct', async (route) => {
      extractionCalled = true;
      await route.abort();
    });

    await openLeaseAnalysis(page);

    await page.getByLabel('Upload lease document').setInputFiles({
      name: 'photo.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('not a lease'),
    });

    await expect(
      page.getByText('Invalid file type. Please upload a PDF, Word document, or text file.').first()
    ).toBeVisible();
    expect(extractionCalled).toBe(false);
  });

  test('surfaces extraction failures from the current endpoint without stale preview UI', async ({
    page,
  }) => {
    await mockLeaseAnalysis(page);

    let extractionCalls = 0;
    await page.route('**/v1/api/extract/lease-direct', async (route) => {
      extractionCalls += 1;
      await route.fulfill({
        status: 500,
        headers: { 'content-type': 'text/plain' },
        body: 'Extraction service unavailable',
      });
    });

    await openLeaseAnalysis(page);

    await page.getByLabel('Upload lease document').setInputFiles({
      name: 'failed-lease.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('mock pdf content'),
    });

    await expect.poll(() => extractionCalls).toBe(1);
    await expect(page.getByText('AI Extraction Preview')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Choose File' })).toBeVisible();
    await expect(page.getByText('Document processed successfully!')).not.toBeVisible();
  });
});
