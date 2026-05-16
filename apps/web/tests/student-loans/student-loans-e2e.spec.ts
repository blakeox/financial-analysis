import { expect, test } from '@playwright/test';

test.describe('Student Loans Calculator E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calculator/student-loans');
    await page.waitForLoadState('networkidle');
  });

  test('should load the student loans calculator page', async ({ page }) => {
    await expect(page).toHaveTitle(/Student Loan Analyzer/);
    await expect(page.locator('h1')).toContainText('Student Loan Analyzer');

    // Check that the form is present
    await expect(page.locator('#calculator-form')).toBeVisible();

    // Check that all required fields are present
    await expect(page.locator('input[name="loanBalance"]')).toBeVisible();
    await expect(page.locator('input[name="interestRate"]')).toBeVisible();
    await expect(page.locator('input[name="annualIncome"]')).toBeVisible();
    await expect(page.locator('input[name="familySize"]')).toBeVisible();
    await expect(page.locator('input[name="repaymentPlan"]')).toBeVisible();

    // Check that buttons are present
    await expect(page.locator('#calculate-btn')).toBeVisible();
    await expect(page.locator('#reset-btn')).toBeVisible();
    await expect(page.locator('#save-scenario-btn')).toBeVisible();
  });

  test('should calculate student loan analysis with standard repayment', async ({ page }) => {
    // Fill in the form
    await page.fill('input[name="loanBalance"]', '50000');
    await page.fill('input[name="interestRate"]', '6.8');
    await page.fill('input[name="annualIncome"]', '60000');
    await page.fill('input[name="familySize"]', '2');
    await page.selectOption('select[name="repaymentPlan"]', 'standard');

    // Click calculate
    await page.click('#calculate-btn');

    // Wait for results to appear
    await page.waitForSelector('#results', { state: 'visible' });

    // Check that results are displayed
    await expect(page.locator('#total-balance')).toContainText('$50,000');
    await expect(page.locator('#total-interest')).toBeVisible();
    await expect(page.locator('#monthly-payment')).toBeVisible();
    await expect(page.locator('#payoff-time')).toBeVisible();

    // Check that the analysis results component shows data
    await expect(page.locator('.enhanced-analysis-results')).toBeVisible();
  });

  test('should calculate income-driven repayment plan', async ({ page }) => {
    // Fill in the form for income-driven repayment
    await page.fill('input[name="loanBalance"]', '75000');
    await page.fill('input[name="interestRate"]', '5.5');
    await page.fill('input[name="annualIncome"]', '45000');
    await page.fill('input[name="familySize"]', '3');
    await page.selectOption('select[name="repaymentPlan"]', 'income-driven');

    // Click calculate
    await page.click('#calculate-btn');

    // Wait for results
    await page.waitForSelector('#results', { state: 'visible' });

    // Check that results are displayed
    await expect(page.locator('#total-balance')).toContainText('$75,000');
    await expect(page.locator('#monthly-payment')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Try to calculate without filling required fields
    await page.click('#calculate-btn');

    // Check for error message
    await expect(page.locator('#error')).toBeVisible();
    await expect(page.locator('#error-message')).toContainText('Please enter a valid loan balance');
  });

  test('should validate loan balance limits', async ({ page }) => {
    // Fill in invalid loan balance
    await page.fill('input[name="loanBalance"]', '2000000'); // Over $1M limit
    await page.fill('input[name="interestRate"]', '6.8');
    await page.selectOption('select[name="repaymentPlan"]', 'standard');

    await page.click('#calculate-btn');

    await expect(page.locator('#error')).toBeVisible();
    await expect(page.locator('#error-message')).toContainText(
      'Loan balance cannot exceed $1,000,000'
    );
  });

  test('should validate interest rate limits', async ({ page }) => {
    // Fill in invalid interest rate
    await page.fill('input[name="loanBalance"]', '50000');
    await page.fill('input[name="interestRate"]', '35'); // Over 30% limit
    await page.selectOption('select[name="repaymentPlan"]', 'standard');

    await page.click('#calculate-btn');

    await expect(page.locator('#error')).toBeVisible();
    await expect(page.locator('#error-message')).toContainText('Interest rate cannot exceed 30%');
  });

  test('should validate annual income', async ({ page }) => {
    // Fill in negative annual income
    await page.fill('input[name="loanBalance"]', '50000');
    await page.fill('input[name="interestRate"]', '6.8');
    await page.fill('input[name="annualIncome"]', '-1000');
    await page.selectOption('select[name="repaymentPlan"]', 'standard');

    await page.click('#calculate-btn');

    await expect(page.locator('#error')).toBeVisible();
    await expect(page.locator('#error-message')).toContainText('Annual income cannot be negative');
  });

  test('should validate family size', async ({ page }) => {
    // Fill in invalid family size
    await page.fill('input[name="loanBalance"]', '50000');
    await page.fill('input[name="interestRate"]', '6.8');
    await page.fill('input[name="familySize"]', '25'); // Over 20 limit
    await page.selectOption('select[name="repaymentPlan"]', 'standard');

    await page.click('#calculate-btn');

    await expect(page.locator('#error')).toBeVisible();
    await expect(page.locator('#error-message')).toContainText(
      'Family size must be between 1 and 20'
    );
  });

  test('should reset form when reset button is clicked', async ({ page }) => {
    // Fill in the form
    await page.fill('input[name="loanBalance"]', '50000');
    await page.fill('input[name="interestRate"]', '6.8');
    await page.fill('input[name="annualIncome"]', '60000');

    // Click reset
    await page.click('#reset-btn');

    // Check that fields are cleared
    await expect(page.locator('input[name="loanBalance"]')).toHaveValue('');
    await expect(page.locator('input[name="interestRate"]')).toHaveValue('');
    await expect(page.locator('input[name="annualIncome"]')).toHaveValue('');
  });

  test('should show loading state during calculation', async ({ page }) => {
    // Fill in the form
    await page.fill('input[name="loanBalance"]', '50000');
    await page.fill('input[name="interestRate"]', '6.8');
    await page.selectOption('select[name="repaymentPlan"]', 'standard');

    // Click calculate and immediately check for loading state
    await page.click('#calculate-btn');

    // The loading state should be visible briefly
    await expect(page.locator('#loading')).toBeVisible();

    // Wait for results
    await page.waitForSelector('#results', { state: 'visible' });

    // Loading should be hidden
    await expect(page.locator('#loading')).toBeHidden();
  });

  test('should integrate with chatbot', async ({ page }) => {
    // Check that chat button is present
    await expect(page.locator('#student-loans-chat-button')).toBeVisible();

    // Click chat button
    await page.click('#student-loans-chat-button');

    // Check that chat panel opens
    await expect(page.locator('#chat-panel')).toBeVisible();

    // Check that context is set correctly
    await expect(page.locator('#context-indicator')).toContainText('Student Loan Analyzer');
  });

  test('should work with different repayment plans', async ({ page }) => {
    const testCases = [
      { plan: 'standard', expectedText: 'Standard (10 years)' },
      { plan: 'extended', expectedText: 'Extended (25 years)' },
      { plan: 'income-driven', expectedText: 'Income-Driven Repayment' },
      { plan: 'refinance', expectedText: 'Refinance Analysis' },
    ];

    for (const testCase of testCases) {
      // Fill in basic form data
      await page.fill('input[name="loanBalance"]', '50000');
      await page.fill('input[name="interestRate"]', '6.8');
      await page.selectOption('select[name="repaymentPlan"]', testCase.plan);

      // Click calculate
      await page.click('#calculate-btn');

      // Wait for results
      await page.waitForSelector('#results', { state: 'visible' });

      // Verify results are shown
      await expect(page.locator('#total-balance')).toBeVisible();

      // Reset for next test
      await page.click('#reset-btn');
    }
  });

  test('should handle edge cases gracefully', async ({ page }) => {
    // Test with minimum values
    await page.fill('input[name="loanBalance"]', '1');
    await page.fill('input[name="interestRate"]', '0.01');
    await page.selectOption('select[name="repaymentPlan"]', 'standard');

    await page.click('#calculate-btn');
    await page.waitForSelector('#results', { state: 'visible' });

    await expect(page.locator('#total-balance')).toContainText('$1.00');

    // Test with maximum valid values
    await page.click('#reset-btn');
    await page.fill('input[name="loanBalance"]', '1000000');
    await page.fill('input[name="interestRate"]', '30');
    await page.selectOption('select[name="repaymentPlan"]', 'standard');

    await page.click('#calculate-btn');
    await page.waitForSelector('#results', { state: 'visible' });

    await expect(page.locator('#total-balance')).toContainText('$1,000,000');
  });

  test('should display comprehensive analysis results', async ({ page }) => {
    // Fill in the form
    await page.fill('input[name="loanBalance"]', '50000');
    await page.fill('input[name="interestRate"]', '6.8');
    await page.fill('input[name="annualIncome"]', '60000');
    await page.fill('input[name="familySize"]', '2');
    await page.selectOption('select[name="repaymentPlan"]', 'standard');

    // Click calculate
    await page.click('#calculate-btn');

    // Wait for results
    await page.waitForSelector('#results', { state: 'visible' });

    // Check that enhanced analysis results are displayed
    await expect(page.locator('.enhanced-analysis-results')).toBeVisible();

    // Check that analysis tabs are present
    await expect(page.locator('button:has-text("Summary")')).toBeVisible();
    await expect(page.locator('button:has-text("Insights")')).toBeVisible();
    await expect(page.locator('button:has-text("Recommendations")')).toBeVisible();
    await expect(page.locator('button:has-text("Risk Assessment")')).toBeVisible();
    await expect(page.locator('button:has-text("Optimization")')).toBeVisible();
  });
});





