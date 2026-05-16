import { expect, test } from '@playwright/test';

type DirectExtractionRequest = {
  fileData: string;
  fileName: string;
  fileType: string;
  documentType: string;
};

type TextExtractionRequest = {
  text: string;
};

const basePdfBuffer = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n'
);

const pdfUpload = {
  name: 'industrial_complex_lease.pdf',
  mimeType: 'application/pdf',
  buffer: Buffer.concat([basePdfBuffer, Buffer.from('industrial-lease-fixture')]),
};

const txtUpload = {
  name: 'industrial_complex_lease.txt',
  mimeType: 'text/plain',
  buffer: Buffer.from(
    'Industrial warehouse lease. Base rent 45000 per month. Term 60 months. Triple net warehouse lease.'
  ),
};

const extractionResult = {
  success: true,
  extractedData: {
    confidence: {
      overall: 0.85,
      financial: 0.92,
      property: 0.78,
    },
    leaseType: 'warehouse-nnn',
    leaseTerm: 60,
    baseRent: 45000,
    escalationType: 'percentage',
    escalationRate: 0.03,
    securityDeposit: 90000,
    squareFootage: 50000,
    cam: 5000,
    taxes: 3000,
    insurance: 1500,
    utilities: 2000,
  },
};

test.describe('Commercial real estate lease contracts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/commercial-real-estate-lease');
    await page.waitForLoadState('networkidle');
  });

  test('renders the upload shell and applies quick-start templates', async ({ page }) => {
    await expect(page.getByText('AI-Powered Document Analysis')).toBeVisible();
    await expect(page.getByText('Supports PDF, DOC, DOCX, TXT files up to 50MB')).toBeVisible();
    await expect(page.getByText('Quick Start Templates')).toBeVisible();

    await page.getByText('Industrial Warehouse NNN').click();

    await expect(page.getByLabel('Monthly Base Rent')).toHaveValue('45000');
    await expect(page.getByLabel('Lease Term (Months)')).toHaveValue('60');
  });

  test('uploads a PDF to the direct extraction endpoint and auto-populates the form', async ({
    page,
  }) => {
    let requestBody: DirectExtractionRequest | null = null;
    let releaseResponse!: () => void;
    const responseGate = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });

    await page.route('**/v1/api/extract/lease-direct', async (route) => {
      requestBody = JSON.parse(route.request().postData() ?? '{}') as DirectExtractionRequest;
      await responseGate;
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        json: extractionResult,
      });
    });

    await page.locator('input[type="file"]').setInputFiles(pdfUpload);

    await expect(
      page.getByText(/Uploading document|Analyzing content|Extracting lease data/)
    ).toBeVisible();
    await expect(page.locator('.absolute.top-0.left-0.w-full.h-1')).toBeVisible();

    releaseResponse();

    await expect(page.getByText('Document processed successfully!')).toBeVisible();
    await expect(page.getByText(pdfUpload.name)).toBeVisible();
    await expect(page.getByText('Form populated with extracted data')).toBeVisible();
    await expect(page.getByLabel('Monthly Base Rent')).toHaveValue('45000');
    await expect(page.getByLabel('Lease Term (Months)')).toHaveValue('60');

    expect(requestBody).not.toBeNull();
    expect(requestBody!.fileName).toBe(pdfUpload.name);
    expect(requestBody!.fileType).toBe('application/pdf');
    expect(requestBody!.documentType).toBe('pdf');
    expect(typeof requestBody!.fileData).toBe('string');
  });

  test('uploads a text lease to the text extraction endpoint', async ({ page }) => {
    let requestBody: TextExtractionRequest | null = null;

    await page.route('**/v1/api/extract/lease-text', async (route) => {
      requestBody = JSON.parse(route.request().postData() ?? '{}') as TextExtractionRequest;
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        json: extractionResult,
      });
    });

    await page.locator('input[type="file"]').setInputFiles(txtUpload);

    await expect(page.getByText('Document processed successfully!')).toBeVisible();
    await expect(page.getByText(txtUpload.name)).toBeVisible();
    await expect(page.getByLabel('Monthly Base Rent')).toHaveValue('45000');
    await expect(page.getByLabel('Lease Term (Months)')).toHaveValue('60');

    expect(requestBody).not.toBeNull();
    expect(requestBody!.text).toContain('Industrial warehouse lease');
  });

  test('rejects unsupported file types before any extraction request is sent', async ({ page }) => {
    let extractionCalled = false;

    await page.route('**/v1/api/extract/lease-direct', async (route) => {
      extractionCalled = true;
      await route.abort();
    });

    await page.locator('input[type="file"]').setInputFiles({
      name: 'not-a-lease.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image'),
    });

    await expect(page.getByText('Upload Failed')).toBeVisible();
    await expect(
      page.getByText('Invalid file type. Please upload a PDF, Word document, or text file.')
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Choose File' })).toBeVisible();
    expect(extractionCalled).toBe(false);
  });

  test('surfaces extraction failures and resets the upload shell', async ({ page }) => {
    await page.route('**/v1/api/extract/lease-direct', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'text/plain',
        body: 'backend exploded',
      });
    });

    await page.locator('input[type="file"]').setInputFiles(pdfUpload);

    await expect(page.getByText('Upload Failed')).toBeVisible();
    await expect(page.getByText(/Failed to extract lease data: backend exploded/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Choose File' })).toBeVisible();
    await expect(page.getByText('Document processed successfully!')).toHaveCount(0);
  });
});
