import { expect, test, type Page } from '@playwright/test';

const fillValidInputs = async (page: Page) => {
  await page.fill('#loanBalance', '50000');
  await page.fill('#interestRate', '6.8');
  await page.fill('#annualIncome', '60000');
  await page.fill('#familySize', '2');
  await page.selectOption('#repaymentPlan', 'standard');
};

test.describe('Student loan calculator browser contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calculator/student-loans');
  });

  test('renders the current student loan form contract', async ({ page }) => {
    await expect(page).toHaveTitle(/Student Loan Analyzer/i);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Student Loan Analyzer' })
    ).toBeVisible();

    await expect(page.locator('#calculator-form')).toBeVisible();
    await expect(page.locator('#loanBalance')).toBeVisible();
    await expect(page.locator('#interestRate')).toBeVisible();
    await expect(page.locator('#annualIncome')).toBeVisible();
    await expect(page.locator('#familySize')).toBeVisible();
    await expect(page.locator('#repaymentPlan')).toBeVisible();
    await expect(page.locator('#calculate-btn')).toBeVisible();
    await expect(page.locator('#reset-btn')).toBeVisible();

    await expect(page.locator('#repaymentPlan')).toContainText('Standard (10 years)');
    await expect(page.locator('#repaymentPlan')).toContainText('Extended (25 years)');
    await expect(page.locator('#repaymentPlan')).toContainText('Income-Driven Repayment');
    await expect(page.locator('#repaymentPlan')).toContainText('Refinance Analysis');
  });

  test('submits a standard plan and renders the current results rail deterministically', async ({
    page,
  }) => {
    await fillValidInputs(page);
    await page.click('#calculate-btn');

    await expect(page.locator('#results')).toBeVisible();
    await expect(page.locator('#results-section')).toBeVisible();
    await expect(page.locator('#summary-cards')).toContainText('Total Balance');
    await expect(page.locator('#summary-cards')).toContainText('Monthly Payment');
    await expect(page.locator('#summary-cards')).toContainText('Total Interest');
    await expect(page.locator('#summary-cards')).toContainText('Payoff Time');
    await expect(page.locator('#summary-cards')).toContainText(/\$50,000(?:\.00)?/);
    await expect(page.locator('#summary-cards')).toContainText(/\$575\.40/);
    await expect(page.locator('#summary-cards')).toContainText(/\$19,048\.20/);
    await expect(page.locator('#summary-cards')).toContainText('121 months');

    await expect(page.locator('#results-container')).toBeVisible();
    await expect(page.locator('#results-container')).toContainText('Repayment Summary');
    await expect(page.locator('#results-container')).toContainText('Loan Details');
    await expect(page.locator('#results-container')).toContainText('Recommendations');
    await expect(page.locator('#results-container')).toContainText('Forgiveness Programs');
    await expect(page.locator('#results-container')).toContainText('Refinance Analysis');
  });

  test('shows the current validation error and reset contract', async ({ page }) => {
    await page.click('#calculate-btn');

    await expect(page.locator('#error')).toBeVisible();
    await expect(page.locator('#error-message')).toHaveText('Please enter a valid loan balance');
    await expect(page.locator('#results-section')).toBeHidden();

    await fillValidInputs(page);
    await page.click('#calculate-btn');
    await expect(page.locator('#results-section')).toBeVisible();

    await page.click('#reset-btn');

    await expect(page.locator('#loanBalance')).toHaveValue('');
    await expect(page.locator('#interestRate')).toHaveValue('');
    await expect(page.locator('#annualIncome')).toHaveValue('');
    await expect(page.locator('#familySize')).toHaveValue('');
    await expect(page.locator('#results-section')).toBeHidden();
    await expect(page.locator('#results-container')).toBeHidden();
    await expect(page.locator('#summary-cards')).toBeHidden();
  });
});
