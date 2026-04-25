import {
  devices,
  expect,
  test,
  type Browser,
  type BrowserContextOptions,
  type Locator,
  type Page,
} from '@playwright/test';

const successResponse = {
  leaseType: 'equipment',
  termMonths: 48,
  startDate: '2024-01-01',
  endDate: '2027-12-31',
  metrics: {
    totalCost: 120000,
    averageMonthlyPayment: 2500,
    presentValue: 110000,
    effectiveAnnualRate: 0.065,
  },
  schedule: [],
  renewalOptions: [],
  riskAnalysis: {
    flexibilityScore: 72,
    earlyTerminationCost: 12000,
    renewalRisk: 'medium',
    marketComparability: 'high',
  },
  insights: {
    effectiveRent: 2500,
    occupancyCost: 2500,
    totalCommitment: 120000,
    flexibilityRating: 'medium',
    recommendations: ['Review renewal terms before signing'],
  },
  leaseVsBuy: {
    recommendation: 'lease',
    leaseOption: {
      totalCost: 120000,
      monthlyPayment: 2500,
    },
    buyOption: {
      totalLoanCost: 138000,
      loanPayment: 2875,
    },
  },
};

async function mockLeaseAnalysis(page: Page, onRequest?: () => void) {
  await page.route('**/v1/api/analysis/enhanced-lease', async (route) => {
    onRequest?.();
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      json: successResponse,
    });
  });
}

async function openLeaseAnalysis(page: Page) {
  await page.goto('/lease-analysis');
  await expect(page.getByRole('tablist')).toBeVisible();
}

async function openDeviceLeaseAnalysis(
  browser: Browser,
  contextOptions: BrowserContextOptions
) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  return { context, page };
}

async function switchToEquipmentLease(page: Page) {
  await page.locator('select').first().selectOption('equipment');
  await expect(page.getByLabel('Equipment Cost')).toBeVisible();
}

async function runEquipmentAnalysis(page: Page) {
  await switchToEquipmentLease(page);

  await page.getByLabel('Equipment Cost').fill('100000');
  await page.getByLabel('Annual Interest Rate').fill('6.5');
  await page.getByLabel('Residual Value').fill('10000');
  await page.getByLabel('Lease Term (Months)').fill('48');

  const analysisResponse = page.waitForResponse((response) => {
    return (
      response.url().includes('/v1/api/analysis/enhanced-lease') &&
      response.request().method() === 'POST' &&
      response.status() === 200
    );
  });

  await page.getByRole('button', { name: 'Analyze Lease' }).click();
  await analysisResponse;
  await expect(page.getByText('Financial Summary')).toBeVisible();
}

async function boundingBox(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

test.describe('Lease analysis mobile responsive contracts', () => {
  test('mobile tabs wrap into two rows and still expose advanced terms controls', async ({
    browser,
  }) => {
    const { context, page } = await openDeviceLeaseAnalysis(browser, devices['iPhone 12']);

    try {
      await mockLeaseAnalysis(page);
      await openLeaseAnalysis(page);

      const basicTab = page.getByRole('tab', { name: 'Basic' });
      const termsTab = page.getByRole('tab', { name: 'Terms' });
      const tabList = page.getByRole('tablist');

      await expect(tabList).toHaveClass(/grid-cols-2/);

      const basicBox = await boundingBox(basicTab);
      const termsBox = await boundingBox(termsTab);

      expect(Math.abs(basicBox.y - termsBox.y)).toBeLessThan(8);

      await page.getByRole('button', { name: 'Show Advanced' }).click();
      await termsTab.tap();

      const escalationTypeSelect = page
        .locator('div.space-y-1')
        .filter({ has: page.locator('label', { hasText: 'Escalation Type' }) })
        .locator('select');

      await expect(escalationTypeSelect).toBeVisible();
      await expect(termsTab).toHaveAttribute('aria-selected', 'true');
    } finally {
      await context.close();
    }
  });

  test('mobile analysis keeps form and results stacked after a deterministic analyze call', async ({
    browser,
  }) => {
    const { context, page } = await openDeviceLeaseAnalysis(browser, devices['iPhone 12']);
    let requestCount = 0;

    try {
      await mockLeaseAnalysis(page, () => {
        requestCount += 1;
      });
      await openLeaseAnalysis(page);
      await runEquipmentAnalysis(page);

      await expect.poll(() => requestCount).toBeGreaterThan(1);

      const formCard = page.locator('[data-form-section="main"]');
      const summaryHeading = page.getByText('Financial Summary').first();

      const formBox = await boundingBox(formCard);
      const summaryBox = await boundingBox(summaryHeading);
      const avgMonthlyPaymentValue = page.locator('div').filter({ hasText: /^\$2,500$/ }).first();

      expect(summaryBox.y).toBeGreaterThan(formBox.y + formBox.height - 20);
      expect(Math.abs(summaryBox.x - formBox.x)).toBeLessThan(40);
      await expect(avgMonthlyPaymentValue).toBeVisible();
    } finally {
      await context.close();
    }
  });
});

test.describe('Lease analysis tablet responsive contracts', () => {
  test('tablet keeps tabs on one row and shows form/results side by side', async ({ browser }) => {
    const { context, page } = await openDeviceLeaseAnalysis(browser, {
      ...devices['iPad (gen 7)'],
      viewport: { width: 1024, height: 768 },
    });

    try {
      await mockLeaseAnalysis(page);
      await openLeaseAnalysis(page);
      await runEquipmentAnalysis(page);

      const basicTab = page.getByRole('tab', { name: 'Basic' });
      const compareTab = page.getByRole('tab', { name: 'Compare' });

      const basicBox = await boundingBox(basicTab);
      const compareBox = await boundingBox(compareTab);

      expect(Math.abs(basicBox.y - compareBox.y)).toBeLessThan(8);

      const formCard = page.locator('[data-form-section="main"]');
      const summaryHeading = page.getByText('Financial Summary').first();

      const formBox = await boundingBox(formCard);
      const summaryBox = await boundingBox(summaryHeading);

      expect(summaryBox.x).toBeGreaterThan(formBox.x + formBox.width / 2);
      expect(Math.abs(summaryBox.y - formBox.y)).toBeLessThan(120);
      await expect(page.getByText('Risk Analysis')).toBeVisible();
    } finally {
      await context.close();
    }
  });
});
