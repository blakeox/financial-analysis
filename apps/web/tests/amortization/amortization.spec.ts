import { expect, test, type Page } from '@playwright/test';

const mockSchedule = Array.from({ length: 12 }, (_, index) => {
  const month = index + 1;
  const payment = 1_000;
  const principal = 700 + index * 10;
  const interest = payment - principal;
  const balance = Math.max(0, 12_000 - month * payment);

  return {
    month,
    payment,
    principal,
    interest,
    balance,
    cumulativeInterest: month * 255,
  };
});

const mockResponse = {
  monthlyPayment: 1_000,
  totalInterest: 3_060,
  totalAmount: 15_060,
  schedule: mockSchedule,
};

const fillRequiredInputs = async (page: Page) => {
  await page.fill('#principal', '250000');
  await page.fill('#annualRate', '5');
  await page.fill('#termMonths', '360');
};

test.describe('Amortization calculator browser contract', () => {
  test('renders the amortization entrypoint on the current calculator route with deterministic results', async ({
    page,
  }) => {
    let requestBody: Record<string, unknown> | null = null;

    await page.route('**/v1/api/analysis/amortization', async (route) => {
      requestBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        json: mockResponse,
      });
    });

    await page.goto('/amortization');

    await expect(page).toHaveURL(/\/calculator\/amortization\/?$/);
    await expect(page).toHaveTitle(/Amortization Calculator/i);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Amortization Calculator' })
    ).toBeVisible();
    await expect(page.locator('#calculator-form')).toBeVisible();
    await expect(page.locator('#calculate-btn')).toBeVisible();
    await expect(page.locator('#reset-btn')).toBeVisible();

    await fillRequiredInputs(page);
    await page.click('#calculate-btn');

    await expect(page.locator('#results-section')).toBeVisible();
    await expect(page.locator('#results-section')).toHaveAttribute('data-rendered', 'true');
    await expect(page.locator('#summary-cards')).toContainText('Monthly Payment');
    await expect(page.locator('#summary-cards')).toContainText('Total Interest');
    await expect(page.locator('#summary-cards')).toContainText('Total Paid');
    await expect(page.locator('#summary-cards')).toContainText(/\$1,000(?:\.00)?/);
    await expect(page.locator('#summary-cards')).toContainText(/\$3,060(?:\.00)?/);
    await expect(page.locator('#summary-cards')).toContainText(/\$15,060(?:\.00)?/);

    await expect(page.locator('#amortization-chart-container')).toBeVisible();
    await expect(page.locator('#amortization-chart')).toContainText(
      'Amortization Schedule Visualization'
    );
    await expect(page.locator('#amortization-table-container')).toBeVisible();
    await expect(page.locator('#table-body tr')).toHaveCount(12);
    await expect(page.locator('#table-body tr').first()).toContainText('1');
    await expect(page.locator('#table-body tr').first()).toContainText(/\$700(?:\.00)?/);

    expect(requestBody).toMatchObject({
      principal: 250000,
      annualRate: 0.05,
      termMonths: 360,
      extraMonthlyPayment: 0,
      paymentFrequency: 'monthly',
    });
  });

  test('reset clears the rendered amortization results', async ({ page }) => {
    await page.route('**/v1/api/analysis/amortization', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        json: mockResponse,
      });
    });

    await page.goto('/amortization');

    await fillRequiredInputs(page);
    await page.click('#calculate-btn');

    await expect(page.locator('#results-section')).toBeVisible();
    await expect(page.locator('#amortization-chart-container')).toBeVisible();
    await expect(page.locator('#amortization-table-container')).toBeVisible();

    await page.click('#reset-btn');

    await expect(page.locator('#principal')).toHaveValue('');
    await expect(page.locator('#annualRate')).toHaveValue('');
    await expect(page.locator('#termMonths')).toHaveValue('');
    await expect(page.locator('#results-section')).toBeHidden();
    await expect(page.locator('#results-container')).toBeHidden();
    await expect(page.locator('#amortization-chart-container')).toBeHidden();
    await expect(page.locator('#amortization-table-container')).toBeHidden();
  });
});
