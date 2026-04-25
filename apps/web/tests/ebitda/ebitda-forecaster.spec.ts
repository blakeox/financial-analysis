import { expect, test, type Page } from '@playwright/test';

const EBITDA_PATH = '/ebitda-forecasting';
const EBITDA_URL_PATTERN = /\/ebitda-forecasting\/?$/;

const mockForecastResult = {
  forecast: [
    {
      month: 1,
      year: 2025,
      revenue: 100000,
      totalExpenses: 70000,
      operatingExpenses: 25000,
      costOfGoodsSold: 15000,
      grossProfit: 85000,
      ebitda: 30000,
      ebitdaMargin: 0.3,
      employeeCount: 3,
      employeeCosts: 30000,
      billableHours: 480,
      depreciation: 0,
      amortization: 0,
      interestExpense: 0,
      taxes: 0,
      netIncome: 30000,
    },
    {
      month: 2,
      year: 2025,
      revenue: 105000,
      totalExpenses: 72000,
      operatingExpenses: 26000,
      costOfGoodsSold: 15000,
      grossProfit: 90000,
      ebitda: 33000,
      ebitdaMargin: 0.314,
      employeeCount: 3,
      employeeCosts: 31000,
      billableHours: 490,
      depreciation: 0,
      amortization: 0,
      interestExpense: 0,
      taxes: 0,
      netIncome: 33000,
    },
  ],
  summary: {
    totalRevenue: 205000,
    totalEbitda: 63000,
    averageEbitdaMargin: 0.307,
    revenueGrowth: 0.05,
    finalEmployeeCount: 3,
    breakEvenMonth: 1,
    totalOperatingExpenses: 51000,
    totalEmployeeCosts: 61000,
    ebitdaGrowth: 0.1,
  },
  scenario: {
    name: 'Baseline Plan',
    description: 'Mocked forecast for Playwright',
    forecastPeriodMonths: 12,
    economicFactors: {
      marketGrowth: 0,
      competitionFactor: 1,
    },
  },
  keyMetrics: {
    revenuePerEmployee: 68333,
    ebitdaPerEmployee: 21000,
    averageBillableHours: 485,
    revenuePerBillableHour: 211,
  },
};

async function addMonthlyRevenueSection(page: Page) {
  await page.getByRole('button', { name: /Monthly Revenue/i }).click();
  await expect(page.getByText('Current Year Monthly Revenue')).toBeVisible();
}

async function fillRequiredRevenue(page: Page) {
  await addMonthlyRevenueSection(page);
  await page.getByLabel('January').fill('100000');
}

test.describe('EBITDA Forecasting', () => {
  test('navigates from the models card and preserves browser history', async ({ page }) => {
    await page.goto('/models');

    const ebitdaCard = page.locator('[data-model="EBITDA Forecasting"]');
    await expect(ebitdaCard).toContainText('Service industry financial projections with deterministic controls');

    await page.getByRole('link', { name: /Open Forecaster/i }).click();

    await expect(page).toHaveURL(EBITDA_URL_PATTERN);
    await expect(page).toHaveTitle(/EBITDA Forecasting Calculator/i);
    await expect(page.getByRole('heading', { level: 1, name: 'EBITDA Forecasting' })).toBeVisible();
    await expect(page.getByText('EBITDA Forecasting Dashboard')).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/models\/?$/);
    await expect(ebitdaCard).toBeVisible();

    await page.goForward();
    await expect(page).toHaveURL(EBITDA_URL_PATTERN);
    await expect(page.getByText('EBITDA Forecasting Dashboard')).toBeVisible();
  });

  test('shows the initial EBITDA page contract before any inputs are added', async ({ page }) => {
    await page.goto(EBITDA_PATH);

    await expect(page.getByRole('heading', { level: 1, name: 'EBITDA Forecasting' })).toBeVisible();
    await expect(page.getByText('EBITDA Forecasting Dashboard')).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Add Input Sections' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Setup Progress' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Generate Forecast/i })).toBeDisabled();
    await expect(page.getByRole('heading', { level: 3, name: 'Welcome to EBITDA Forecasting' })).toBeVisible();
    await expect(page.getByText("Let's create your financial forecast in a few simple steps")).toBeVisible();
  });

  test('enables forecast generation once monthly revenue is entered', async ({ page }) => {
    await page.goto(EBITDA_PATH);

    await fillRequiredRevenue(page);

    await expect(page.getByLabel('January')).toHaveValue('100000');
    await expect(page.getByText(/Total Revenue:\s*\$100,000/)).toBeVisible();
    await expect(page.getByText(/Average Monthly:\s*\$100,000/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Generate Forecast/i })).toBeEnabled();
  });

  test('submits the forecast request and renders deterministic results', async ({ page }) => {
    let requestBody:
      | {
          name: string;
          forecastPeriodMonths: number;
          currentMonthlyFinancials: Array<{ month: number; year: number; revenue: number }>;
          revenueGrowthRate: number;
        }
      | undefined;

    await page.route('**/v1/api/analysis/ebitda-forecast', async (route) => {
      requestBody = route.request().postDataJSON() as typeof requestBody;
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        json: mockForecastResult,
      });
    });

    await page.goto(EBITDA_PATH);
    await fillRequiredRevenue(page);

    await page.getByRole('button', { name: /Generate Forecast/i }).click();

    expect(requestBody).toMatchObject({
      name: 'Baseline Plan',
      forecastPeriodMonths: 12,
      revenueGrowthRate: 0.05,
      currentMonthlyFinancials: [
        {
          month: 1,
          year: new Date().getFullYear(),
          revenue: 100000,
        },
      ],
    });

    await expect(page.getByText('Forecast generated for 2 months')).toBeVisible();
    await expect(page.getByText('Total Revenue')).toBeVisible();
    await expect(page.getByText('Total EBITDA')).toBeVisible();
    await expect(page.getByText('Avg EBITDA Margin')).toBeVisible();
    await expect(page.getByRole('button', { name: 'New Forecast' })).toBeVisible();

    await page.getByRole('button', { name: 'New Forecast' }).click();
    await expect(page.getByRole('heading', { level: 3, name: 'Add Input Sections' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Generate Forecast/i })).toBeEnabled();
  });

  test('renders the API error message when forecast generation fails', async ({ page }) => {
    await page.route('**/v1/api/analysis/ebitda-forecast', async (route) => {
      await route.fulfill({
        status: 500,
        headers: { 'content-type': 'application/json' },
        json: {
          error: {
            message: 'Unable to generate EBITDA forecast right now.',
          },
        },
      });
    });

    await page.goto(EBITDA_PATH);
    await fillRequiredRevenue(page);

    await page.getByRole('button', { name: /Generate Forecast/i }).click();

    await expect(page.getByRole('heading', { level: 3, name: 'Forecast Generation Error' })).toBeVisible();
    await expect(page.getByText('Unable to generate EBITDA forecast right now.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dismiss' })).toBeVisible();
  });
});
