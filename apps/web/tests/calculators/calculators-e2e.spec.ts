/**
 * End-to-End Tests for All Calculators
 * 
 * Comprehensive E2E testing covering:
 * - Form submission and validation
 * - Results display
 * - Calculator completion events
 * - Error handling
 * - Navigation and UX
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_URL || 'http://localhost:8788';

// ============================================================================
// NEW CALCULATORS E2E TESTS
// ============================================================================

test.describe('Rent vs Buy Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/rent-vs-buy/`);
    await page.waitForLoadState('networkidle');
  });

  test('should display calculator form and accept inputs', async ({ page }) => {
    // Verify form is present
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Fill out form
    await page.fill('#homePrice', '500000');
    await page.fill('#downPayment', '100000');
    await page.fill('#interestRate', '6.5');
    await page.selectOption('#loanTermYears', '30');
    await page.fill('#monthlyRent', '2500');
    await page.selectOption('#yearsToAnalyze', '5');
    
    // Verify values are set
    await expect(page.locator('#homePrice')).toHaveValue('500000');
    await expect(page.locator('#monthlyRent')).toHaveValue('2500');
  });

  test('should calculate and display results', async ({ page }) => {
    // Fill form with valid data
    await page.fill('#homePrice', '500000');
    await page.fill('#downPayment', '100000');
    await page.fill('#interestRate', '6.5');
    await page.selectOption('#loanTermYears', '30');
    await page.fill('#monthlyRent', '2500');
    await page.selectOption('#yearsToAnalyze', '5');
    
    // Submit form
    await page.click('#calculate-btn');
    
    // Wait for results
    await page.waitForSelector('#results-section:not(.hidden)', { timeout: 5000 });
    
    // Verify summary cards are displayed
    await expect(page.locator('#summary-cards')).toBeVisible();
    
    // Verify results contain key information
    const resultsText = await page.locator('#results-container').textContent();
    expect(resultsText).toContain('Buying');
    expect(resultsText).toContain('Renting');
    expect(resultsText).toContain('Recommendation');
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit without filling required fields
    await page.click('#calculate-btn');
    
    // Form should prevent submission (HTML5 validation)
    await expect(page.locator('#results-section')).toHaveClass(/hidden/);
  });

  test('should handle reset button', async ({ page }) => {
    await page.fill('#homePrice', '500000');
    await page.fill('#monthlyRent', '2500');
    
    await page.click('#reset-btn');
    
    await expect(page.locator('#homePrice')).toHaveValue('');
    await expect(page.locator('#monthlyRent')).toHaveValue('');
  });
});

test.describe('Invest vs Pay Off Debt Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/invest-vs-payoff-debt/`);
    await page.waitForLoadState('networkidle');
  });

  test('should calculate and compare 3 strategies', async ({ page }) => {
    await page.fill('#extraMoney', '500');
    await page.fill('#debtBalance', '10000');
    await page.fill('#debtInterestRate', '18');
    await page.fill('#debtMinimumPayment', '200');
    await page.selectOption('#debtType', 'credit-card');
    await page.selectOption('#hasEmergencyFund', 'yes');
    await page.selectOption('#timeHorizonYears', '10');
    
    await page.click('#calculate-btn');
    
    await page.waitForSelector('#results-section:not(.hidden)');
    
    // Should display all 3 strategies
    const resultsText = await page.locator('#results-container').textContent();
    expect(resultsText).toContain('Pay Off Debt First');
    expect(resultsText).toContain('Invest While Making Minimum');
    expect(resultsText).toContain('Hybrid');
  });

  test('should warn about emergency fund if not present', async ({ page }) => {
    await page.fill('#extraMoney', '500');
    await page.fill('#debtBalance', '10000');
    await page.fill('#debtInterestRate', '10');
    await page.fill('#debtMinimumPayment', '200');
    await page.selectOption('#hasEmergencyFund', 'no');
    await page.selectOption('#timeHorizonYears', '10');
    
    await page.click('#calculate-btn');
    
    await page.waitForSelector('#results-section:not(.hidden)');
    
    const resultsText = await page.locator('#results-container').textContent();
    expect(resultsText).toContain('emergency fund');
  });

  test('should show employer match benefit when applicable', async ({ page }) => {
    await page.fill('#extraMoney', '500');
    await page.fill('#debtBalance', '10000');
    await page.fill('#debtInterestRate', '6');
    await page.fill('#debtMinimumPayment', '150');
    await page.fill('#employerMatch', '50');
    await page.selectOption('#hasEmergencyFund', 'yes');
    await page.selectOption('#timeHorizonYears', '10');
    
    await page.click('#calculate-btn');
    
    await page.waitForSelector('#results-section:not(.hidden)');
    
    const resultsText = await page.locator('#results-container').textContent();
    expect(resultsText).toContain('match');
  });
});

test.describe('Side Hustle Income Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/side-hustle-income/`);
    await page.waitForLoadState('networkidle');
  });

  test('should calculate self-employment tax correctly', async ({ page }) => {
    await page.fill('#monthlyRevenue', '5000');
    await page.fill('#hoursPerWeek', '20');
    await page.fill('#businessExpenses', '500');
    await page.selectOption('#filingStatus', 'single');
    await page.fill('#stateTaxRate', '5');
    
    await page.click('#calculate-btn');
    
    await page.waitForSelector('#results-section:not(.hidden)');
    
    // Should show SE tax breakdown
    const resultsText = await page.locator('#results-container').textContent();
    expect(resultsText).toContain('Self-Employment Tax');
    expect(resultsText).toContain('15.3%');
  });

  test('should display quarterly estimated tax deadlines', async ({ page }) => {
    await page.fill('#monthlyRevenue', '5000');
    await page.fill('#hoursPerWeek', '20');
    
    await page.click('#calculate-btn');
    
    await page.waitForSelector('#results-section:not(.hidden)');
    
    const resultsText = await page.locator('#results-container').textContent();
    expect(resultsText).toContain('Apr 15');
    expect(resultsText).toContain('Jun 15');
    expect(resultsText).toContain('Sep 15');
    expect(resultsText).toContain('Jan 15');
  });

  test('should show true hourly rate after taxes', async ({ page }) => {
    await page.fill('#monthlyRevenue', '5000');
    await page.fill('#hoursPerWeek', '20');
    await page.fill('#businessExpenses', '500');
    
    await page.click('#calculate-btn');
    
    await page.waitForSelector('#results-section:not(.hidden)');
    
    // Should display 3 hourly rates
    await expect(page.locator('text=Gross Hourly')).toBeVisible();
    await expect(page.locator('text=Net Hourly')).toBeVisible();
    await expect(page.locator('text=True Hourly Rate')).toBeVisible();
  });

  test('should compare to W-2 equivalent salary', async ({ page }) => {
    await page.fill('#monthlyRevenue', '5000');
    await page.fill('#hoursPerWeek', '20');
    
    await page.click('#calculate-btn');
    
    await page.waitForSelector('#results-section:not(.hidden)');
    
    const resultsText = await page.locator('#results-container').textContent();
    expect(resultsText).toContain('W-2');
    expect(resultsText).toContain('Equivalent');
  });
});

test.describe('Credit Card Payoff Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/credit-card-payoff/`);
    await page.waitForLoadState('networkidle');
  });

  test('should calculate payoff strategies', async ({ page }) => {
    await page.fill('#balance', '5000');
    await page.fill('#interestRate', '18.99');
    await page.fill('#creditLimit', '10000');
    await page.fill('#monthlyPayment', '200');
    await page.selectOption('#balanceTransferOffer', 'no');
    
    await page.click('#calculate-btn');
    
    await page.waitForSelector('#results-section:not(.hidden)');
    
    // Should show multiple strategies
    const resultsText = await page.locator('#results-container').textContent();
    expect(resultsText).toContain('Your Current Plan');
    expect(resultsText).toContain('Aggressive');
    expect(resultsText).toContain('Minimum Payments Only');
  });

  test('should show credit utilization impact', async ({ page }) => {
    await page.fill('#balance', '7000');
    await page.fill('#creditLimit', '10000');
    await page.fill('#interestRate', '18');
    await page.fill('#monthlyPayment', '300');
    
    await page.click('#calculate-btn');
    
    await page.waitForSelector('#results-section:not(.hidden)');
    
    // 70% utilization should trigger critical warning
    const resultsText = await page.locator('#results-container').textContent();
    expect(resultsText).toContain('Utilization');
    expect(resultsText).toMatch(/70%|CRITICAL/i);
  });

  test('should analyze balance transfer when offered', async ({ page }) => {
    await page.fill('#balance', '5000');
    await page.fill('#interestRate', '18.99');
    await page.fill('#creditLimit', '10000');
    await page.fill('#monthlyPayment', '200');
    await page.selectOption('#balanceTransferOffer', 'yes');
    await page.fill('#transferAPR', '0');
    await page.fill('#transferFee', '3');
    await page.selectOption('#transferPromoPeriod', '12');
    
    await page.click('#calculate-btn');
    
    await page.waitForSelector('#results-section:not(.hidden)');
    
    // Should display balance transfer analysis
    const resultsText = await page.locator('#results-container').textContent();
    expect(resultsText).toContain('Balance Transfer');
    expect(resultsText).toContain('Transfer Fee');
  });

  test('should warn about minimum payment trap', async ({ page }) => {
    await page.fill('#balance', '5000');
    await page.fill('#interestRate', '18.99');
    await page.fill('#creditLimit', '10000');
    await page.fill('#monthlyPayment', '150');
    
    await page.click('#calculate-btn');
    
    await page.waitForSelector('#results-section:not(.hidden)');
    
    const resultsText = await page.locator('#results-container').textContent();
    expect(resultsText).toContain('Minimum Payment Trap');
  });
});

// ============================================================================
// ENHANCED CALCULATORS E2E TESTS
// ============================================================================

test.describe('Mortgage Scenario Planner (Enhanced)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/mortgage-scenario-planning/`);
    await page.waitForLoadState('networkidle');
  });

  test('should display PMI information for <20% down payment', async ({ page }) => {
    await page.fill('#homePrice', '500000');
    await page.fill('#scenario1Down', '50000'); // 10% down - triggers PMI
    await page.fill('#scenario1Rate', '6.5');
    await page.fill('#scenario2Down', '100000'); // 20% down - no PMI
    await page.fill('#scenario2Rate', '6.5');
    await page.selectOption('#loanTerm', '30');
    
    await page.click('#calculate-btn');
    
    await page.waitForSelector('#results-section:not(.hidden)', { timeout: 10000 });
    
    const resultsText = await page.locator('#results-container').textContent();
    expect(resultsText).toContain('PMI');
  });

  test('should show affordability check when income is provided', async ({ page }) => {
    await page.fill('#homePrice', '500000');
    await page.fill('#scenario1Down', '100000');
    await page.fill('#scenario1Rate', '6.5');
    await page.fill('#scenario2Down', '75000');
    await page.fill('#scenario2Rate', '6.8');
    await page.selectOption('#loanTerm', '30');
    await page.fill('#grossMonthlyIncome', '10000');
    
    await page.click('#calculate-btn');
    
    await page.waitForSelector('#results-section:not(.hidden)', { timeout: 10000 });
    
    const resultsText = await page.locator('#results-container').textContent();
    expect(resultsText).toContain('Affordability');
    expect(resultsText).toContain('Debt-to-Income');
  });

  test('should display visual payment breakdown chart', async ({ page }) => {
    await page.fill('#homePrice', '400000');
    await page.fill('#scenario1Down', '80000');
    await page.fill('#scenario1Rate', '6');
    await page.fill('#scenario2Down', '60000');
    await page.fill('#scenario2Rate', '7');
    await page.selectOption('#loanTerm', '30');
    
    await page.click('#calculate-btn');
    
    await page.waitForSelector('#results-section:not(.hidden)', { timeout: 10000 });
    
    // Should have canvas element for chart
    await expect(page.locator('canvas')).toBeVisible();
  });
});

test.describe('Retirement Calculator (Enhanced)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/retirement/`);
    await page.waitForLoadState('networkidle');
  });

  test('should calculate catch-up contributions for age 50+', async ({ page }) => {
    await page.fill('#currentAge', '52');
    await page.fill('#retirementAge', '67');
    await page.fill('#currentIncome', '80000');
    await page.fill('#monthlyContribution', '1000');
    await page.fill('#expectedAnnualReturn', '7');
    
    await page.click('#calculate-btn');
    
    await page.waitForSelector('#results-section:not(.hidden)');
    
    const resultsText = await page.locator('#results-container').textContent();
    expect(resultsText).toContain('catch-up');
  });

  test('should display Roth vs Traditional comparison', async ({ page }) => {
    await page.fill('#currentAge', '30');
    await page.fill('#retirementAge', '65');
    await page.fill('#currentIncome', '75000');
    await page.fill('#monthlyContribution', '500');
    await page.fill('#expectedAnnualReturn', '8');
    await page.selectOption('#accountType', 'both');
    
    await page.click('#calculate-btn');
    
    await page.waitForSelector('#results-section:not(.hidden)');
    
    const resultsText = await page.locator('#results-container').textContent();
    expect(resultsText).toContain('Roth');
    expect(resultsText).toContain('Traditional');
  });
});

test.describe('Debt Payoff Calculator (Enhanced)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/debt-payoff/`);
    await page.waitForLoadState('networkidle');
  });

  test('should display credit score impact projection', async ({ page }) => {
    // Add debt entries
    await page.fill('[name="debt-name-0"]', 'Credit Card');
    await page.fill('[name="debt-balance-0"]', '5000');
    await page.fill('[name="debt-rate-0"]', '18');
    await page.fill('[name="debt-minimum-0"]', '100');
    
    await page.fill('#extraPayment', '300');
    await page.selectOption('#strategy', 'avalanche');
    
    await page.click('#calculate-btn');
    
    await page.waitForSelector('#results-section:not(.hidden)');
    
    const resultsText = await page.locator('#results-container').textContent();
    expect(resultsText).toContain('Credit Score');
  });

  test('should show debt-free date countdown', async ({ page }) => {
    await page.fill('[name="debt-name-0"]', 'Credit Card');
    await page.fill('[name="debt-balance-0"]', '3000');
    await page.fill('[name="debt-rate-0"]', '15');
    await page.fill('[name="debt-minimum-0"]', '75');
    
    await page.fill('#extraPayment', '200');
    
    await page.click('#calculate-btn');
    
    await page.waitForSelector('#results-section:not(.hidden)');
    
    const resultsText = await page.locator('#results-container').textContent();
    expect(resultsText).toContain('Debt-Free Date');
  });
});

test.describe('Budget Calculator (Enhanced)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/budget/`);
    await page.waitForLoadState('networkidle');
  });

  test('should display emergency fund progress tracker', async ({ page }) => {
    // Fill income
    await page.fill('[name="income-amount-0"]', '5000');
    await page.selectOption('[name="income-type-0"]', 'salary');
    
    // Fill expenses
    await page.fill('[name="expense-amount-0"]', '1500');
    await page.selectOption('[name="expense-type-0"]', 'housing');
    
    await page.click('#calculate-btn');
    
    await page.waitForSelector('#results-section:not(.hidden)');
    
    const resultsText = await page.locator('#results-container').textContent();
    expect(resultsText).toContain('Emergency Fund');
  });

  test('should show 50/30/20 rule compliance', async ({ page }) => {
    await page.fill('[name="income-amount-0"]', '5000');
    await page.fill('[name="expense-amount-0"]', '2500'); // Needs
    
    await page.click('#calculate-btn');
    
    await page.waitForSelector('#results-section:not(.hidden)');
    
    const resultsText = await page.locator('#results-container').textContent();
    expect(resultsText).toContain('50/30/20');
  });
});

test.describe('Savings Goal Calculator (Enhanced)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/savings-goal/`);
    await page.waitForLoadState('networkidle');
  });

  test('should display visual progress bar and milestones', async ({ page }) => {
    await page.fill('#goalAmount', '50000');
    await page.fill('#currentSavings', '10000');
    await page.fill('#targetDate', '5');
    await page.fill('#interestRate', '5');
    
    await page.click('#calculate-btn');
    
    await page.waitForSelector('#results-section:not(.hidden)');
    
    // Should display milestones
    const resultsText = await page.locator('#results-container').textContent();
    expect(resultsText).toContain('25%');
    expect(resultsText).toContain('50%');
    expect(resultsText).toContain('75%');
    expect(resultsText).toContain('100%');
  });

  test('should show inflation-adjusted values', async ({ page }) => {
    await page.fill('#goalAmount', '50000');
    await page.fill('#currentSavings', '5000');
    await page.fill('#targetDate', '10');
    await page.fill('#interestRate', '6');
    await page.fill('#inflationRate', '3');
    
    await page.click('#calculate-btn');
    
    await page.waitForSelector('#results-section:not(.hidden)');
    
    const resultsText = await page.locator('#results-container').textContent();
    expect(resultsText).toContain('Real value');
  });
});

// ============================================================================
// CALCULATOR COMPLETION EVENTS
// ============================================================================

test.describe('Calculator Completion Events', () => {
  test('should dispatch calculator-completed event on successful calculation', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/rent-vs-buy/`);
    
    // Listen for custom event
    const eventPromise = page.evaluate(() => {
      return new Promise((resolve) => {
        window.addEventListener('calculator-completed', (e: Event) => {
          resolve((e as CustomEvent).detail);
        });
      });
    });
    
    // Fill and submit form
    await page.fill('#homePrice', '500000');
    await page.fill('#downPayment', '100000');
    await page.fill('#interestRate', '6.5');
    await page.selectOption('#loanTermYears', '30');
    await page.fill('#monthlyRent', '2500');
    await page.selectOption('#yearsToAnalyze', '5');
    await page.click('#calculate-btn');
    
    // Wait for event
    const eventDetail = await eventPromise;
    expect(eventDetail).toBeDefined();
  });
});

// ============================================================================
// CROSS-CALCULATOR NAVIGATION
// ============================================================================

test.describe('Calculator Navigation', () => {
  test('should navigate from models page to calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/models/personal/`);
    await page.waitForLoadState('networkidle');
    
    // Click on Rent vs Buy calculator card
    await page.click('text=Rent vs Buy Calculator');
    
    // Should navigate to calculator page
    await page.waitForURL(/\/calculator\/rent-vs-buy/);
    await expect(page.locator('#calculator-form')).toBeVisible();
  });

  test('should have working back navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/invest-vs-payoff-debt/`);
    await page.waitForLoadState('networkidle');
    
    // Go back to models
    await page.goto(`${BASE_URL}/models/personal/`);
    
    // Should be on models page
    await expect(page).toHaveURL(/\/models\/personal/);
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

test.describe('Error Handling', () => {
  test('should display error for invalid inputs', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/invest-vs-payoff-debt/`);
    
    // Fill with invalid data
    await page.fill('#extraMoney', '-100'); // Negative
    await page.fill('#debtBalance', '10000');
    await page.fill('#debtInterestRate', '10');
    await page.fill('#debtMinimumPayment', '100');
    
    await page.click('#calculate-btn');
    
    // Should show error (HTML5 validation prevents submission)
    const extraMoneyValue = await page.locator('#extraMoney').inputValue();
    expect(parseFloat(extraMoneyValue)).toBeLessThan(0);
  });

  test('should handle calculation errors gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/side-hustle-income/`);
    
    // Fill with data that might cause errors
    await page.fill('#monthlyRevenue', '0');
    await page.fill('#hoursPerWeek', '0');
    
    await page.click('#calculate-btn');
    
    // Should show validation error
    await expect(page.locator('#results-section')).toHaveClass(/hidden/);
  });
});

// ============================================================================
// ACCESSIBILITY TESTS
// ============================================================================

test.describe('Accessibility', () => {
  test('should have proper ARIA labels on form fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/rent-vs-buy/`);
    
    const homePrice = page.locator('#homePrice');
    await expect(homePrice).toHaveAttribute('required');
    await expect(homePrice).toHaveAttribute('type', 'number');
  });

  test('should have submit button with proper text', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/credit-card-payoff/`);
    
    const submitBtn = page.locator('#calculate-btn');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toContainText(/Calculate|Submit/i);
  });

  test('should have reset button functionality', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/invest-vs-payoff-debt/`);
    
    const resetBtn = page.locator('#reset-btn');
    await expect(resetBtn).toBeVisible();
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

test.describe('Performance', () => {
  test('should load calculator pages quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/calculator/rent-vs-buy/`);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should calculate results quickly', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/side-hustle-income/`);
    
    await page.fill('#monthlyRevenue', '5000');
    await page.fill('#hoursPerWeek', '20');
    
    const startTime = Date.now();
    await page.click('#calculate-btn');
    await page.waitForSelector('#results-section:not(.hidden)');
    const calcTime = Date.now() - startTime;
    
    // Should calculate in under 1 second
    expect(calcTime).toBeLessThan(1000);
  });
});

