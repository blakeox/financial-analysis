/**
 * Individual Calculator Tests
 * Tests each calculator's functionality, validation, and error handling
 */

import { expect, test } from '@playwright/test';

test.describe('Individual Calculator Tests', () => {
  test.describe('Amortization Calculator', () => {
    test('should calculate mortgage payment correctly', async ({ page }) => {
      await page.goto('/calculator/amortization');

      // Fill form with valid data
      await page.fill('input[name="principal"]', '300000');
      await page.fill('input[name="rate"]', '6.0');
      await page.fill('input[name="term"]', '30');
      await page.click('button[type="submit"]');

      // Verify results
      await expect(page.locator('#results-content')).toBeVisible();
      await expect(page.locator('#monthly-payment')).toContainText('$1,798.65');
      await expect(page.locator('#total-interest')).toContainText('$347,514.57');
    });

    test('should generate amortization schedule', async ({ page }) => {
      await page.goto('/calculator/amortization');

      await page.fill('input[name="principal"]', '100000');
      await page.fill('input[name="rate"]', '5.0');
      await page.fill('input[name="term"]', '5');
      await page.click('button[type="submit"]');

      // Check schedule table
      await expect(page.locator('#amortization-schedule')).toBeVisible();
      await expect(page.locator('#schedule-table tbody tr')).toHaveCount(60);
    });

    test('should handle zero interest rate', async ({ page }) => {
      await page.goto('/calculator/amortization');

      await page.fill('input[name="principal"]', '100000');
      await page.fill('input[name="rate"]', '0');
      await page.fill('input[name="term"]', '10');
      await page.click('button[type="submit"]');

      // Should calculate simple division
      await expect(page.locator('#monthly-payment')).toContainText('$833.33');
    });

    test('should validate input fields', async ({ page }) => {
      await page.goto('/calculator/amortization');

      // Test negative principal
      await page.fill('input[name="principal"]', '-100000');
      await page.click('button[type="submit"]');
      await expect(page.locator('.error-message')).toContainText('Principal must be positive');

      // Test invalid rate
      await page.fill('input[name="principal"]', '100000');
      await page.fill('input[name="rate"]', '150');
      await page.click('button[type="submit"]');
      await expect(page.locator('.error-message')).toContainText('Rate must be between 0 and 50%');
    });
  });

  test.describe('Auto Loan Calculator', () => {
    test('should calculate auto loan payment', async ({ page }) => {
      await page.goto('/calculator/auto-loan');

      await page.fill('input[name="vehiclePrice"]', '25000');
      await page.fill('input[name="downPayment"]', '5000');
      await page.fill('input[name="tradeInValue"]', '2000');
      await page.fill('input[name="rate"]', '4.5');
      await page.fill('input[name="term"]', '60');
      await page.click('button[type="submit"]');

      await expect(page.locator('#results-content')).toBeVisible();
      await expect(page.locator('#monthly-payment')).toContainText('$333.58');
    });

    test('should calculate total cost of ownership', async ({ page }) => {
      await page.goto('/calculator/auto-loan');

      await page.fill('input[name="vehiclePrice"]', '30000');
      await page.fill('input[name="downPayment"]', '6000');
      await page.fill('input[name="tradeInValue"]', '3000');
      await page.fill('input[name="rate"]', '5.0');
      await page.fill('input[name="term"]', '72');
      await page.fill('input[name="annualInsurance"]', '1200');
      await page.fill('input[name="annualMaintenance"]', '800');
      await page.fill('input[name="annualFuel"]', '1500');
      await page.click('button[type="submit"]');

      await expect(page.locator('#total-cost')).toBeVisible();
      await expect(page.locator('#cost-breakdown')).toBeVisible();
    });
  });

  test.describe('Retirement Planning Calculator', () => {
    test('should calculate retirement savings needed', async ({ page }) => {
      await page.goto('/calculator/retirement');

      await page.fill('input[name="currentAge"]', '30');
      await page.fill('input[name="retirementAge"]', '65');
      await page.fill('input[name="currentSavings"]', '50000');
      await page.fill('input[name="monthlyContribution"]', '1000');
      await page.fill('input[name="annualReturn"]', '7.0');
      await page.fill('input[name="inflationRate"]', '3.0');
      await page.fill('input[name="annualExpenses"]', '60000');
      await page.click('button[type="submit"]');

      await expect(page.locator('#results-content')).toBeVisible();
      await expect(page.locator('#retirement-savings')).toBeVisible();
      await expect(page.locator('#retirement-readiness')).toBeVisible();
    });

    test('should calculate required contribution', async ({ page }) => {
      await page.goto('/calculator/retirement');

      await page.fill('input[name="currentAge"]', '35');
      await page.fill('input[name="retirementAge"]', '65');
      await page.fill('input[name="currentSavings"]', '100000');
      await page.fill('input[name="targetRetirementSavings"]', '2000000');
      await page.fill('input[name="annualReturn"]', '8.0');
      await page.click('button[type="submit"]');

      await expect(page.locator('#required-contribution')).toBeVisible();
    });
  });

  test.describe('Savings Goal Calculator', () => {
    test('should calculate monthly savings needed', async ({ page }) => {
      await page.goto('/calculator/savings-goal');

      await page.fill('input[name="goalAmount"]', '50000');
      await page.fill('input[name="currentSavings"]', '10000');
      await page.fill('input[name="yearsToGoal"]', '5');
      await page.fill('input[name="annualReturn"]', '6.0');
      await page.click('button[type="submit"]');

      await expect(page.locator('#results-content')).toBeVisible();
      await expect(page.locator('#monthly-contribution')).toBeVisible();
    });

    test('should calculate time to reach goal', async ({ page }) => {
      await page.goto('/calculator/savings-goal');

      await page.fill('input[name="goalAmount"]', '100000');
      await page.fill('input[name="currentSavings"]', '20000');
      await page.fill('input[name="monthlyContribution"]', '1000');
      await page.fill('input[name="annualReturn"]', '7.0');
      await page.click('button[type="submit"]');

      await expect(page.locator('#time-to-goal')).toBeVisible();
    });
  });

  test.describe('Debt Payoff Calculator', () => {
    test('should calculate avalanche payoff strategy', async ({ page }) => {
      await page.goto('/calculator/debt-payoff');

      // Add multiple debts
      await page.click('#add-debt-btn');
      await page.fill('input[name="debt-0-balance"]', '5000');
      await page.fill('input[name="debt-0-rate"]', '18.0');
      await page.fill('input[name="debt-0-minPayment"]', '100');

      await page.click('#add-debt-btn');
      await page.fill('input[name="debt-1-balance"]', '10000');
      await page.fill('input[name="debt-1-rate"]', '12.0');
      await page.fill('input[name="debt-1-minPayment"]', '200');

      await page.fill('input[name="extraPayment"]', '200');
      await page.selectOption('select[name="strategy"]', 'avalanche');
      await page.click('button[type="submit"]');

      await expect(page.locator('#results-content')).toBeVisible();
      await expect(page.locator('#payoff-strategy')).toContainText('Avalanche');
    });

    test('should calculate snowball payoff strategy', async ({ page }) => {
      await page.goto('/calculator/debt-payoff');

      // Add debts
      await page.click('#add-debt-btn');
      await page.fill('input[name="debt-0-balance"]', '5000');
      await page.fill('input[name="debt-0-rate"]', '18.0');
      await page.fill('input[name="debt-0-minPayment"]', '100');

      await page.click('#add-debt-btn');
      await page.fill('input[name="debt-1-balance"]', '3000');
      await page.fill('input[name="debt-1-rate"]', '22.0');
      await page.fill('input[name="debt-1-minPayment"]', '75');

      await page.fill('input[name="extraPayment"]', '200');
      await page.selectOption('select[name="strategy"]', 'snowball');
      await page.click('button[type="submit"]');

      await expect(page.locator('#payoff-strategy')).toContainText('Snowball');
    });
  });

  test.describe('Student Loan Calculator', () => {
    test('should calculate standard repayment', async ({ page }) => {
      await page.goto('/calculator/student-loans');

      await page.fill('input[name="principal"]', '50000');
      await page.fill('input[name="rate"]', '4.5');
      await page.fill('input[name="term"]', '10');
      await page.selectOption('select[name="repaymentPlan"]', 'standard');
      await page.click('button[type="submit"]');

      await expect(page.locator('#results-content')).toBeVisible();
      await expect(page.locator('#monthly-payment')).toContainText('$518.15');
    });

    test('should calculate income-driven repayment', async ({ page }) => {
      await page.goto('/calculator/student-loans');

      await page.fill('input[name="principal"]', '50000');
      await page.fill('input[name="rate"]', '4.5');
      await page.fill('input[name="discretionaryIncome"]', '30000');
      await page.fill('input[name="familySize"]', '1');
      await page.selectOption('select[name="repaymentPlan"]', 'repaye');
      await page.click('button[type="submit"]');

      await expect(page.locator('#monthly-payment')).toBeVisible();
    });
  });

  test.describe('Budget Calculator', () => {
    test('should calculate 50/30/20 budget', async ({ page }) => {
      await page.goto('/calculator/budget');

      await page.fill('input[name="monthlyIncome"]', '5000');
      await page.click('button[type="submit"]');

      await expect(page.locator('#results-content')).toBeVisible();
      await expect(page.locator('#needs-allocation')).toContainText('$2,500');
      await expect(page.locator('#wants-allocation')).toContainText('$1,500');
      await expect(page.locator('#savings-allocation')).toContainText('$1,000');
    });

    test('should calculate debt-to-income ratio', async ({ page }) => {
      await page.goto('/calculator/budget');

      await page.fill('input[name="monthlyIncome"]', '6000');
      await page.fill('input[name="monthlyDebtPayments"]', '1200');
      await page.click('button[type="submit"]');

      await expect(page.locator('#debt-to-income')).toContainText('20%');
    });
  });

  test.describe('DCF Valuation Calculator', () => {
    test('should calculate DCF valuation', async ({ page }) => {
      await page.goto('/calculator/dcf-valuation');

      await page.fill('input[name="revenue"]', '10000000');
      await page.fill('input[name="growthRate"]', '5.0');
      await page.fill('input[name="discountRate"]', '10.0');
      await page.fill('input[name="terminalGrowthRate"]', '3.0');
      await page.fill('input[name="sharesOutstanding"]', '1000000');
      await page.click('button[type="submit"]');

      await expect(page.locator('#results-content')).toBeVisible();
      await expect(page.locator('#enterprise-value')).toBeVisible();
      await expect(page.locator('#equity-value')).toBeVisible();
      await expect(page.locator('#price-per-share')).toBeVisible();
    });

    test('should perform sensitivity analysis', async ({ page }) => {
      await page.goto('/calculator/dcf-valuation');

      await page.fill('input[name="revenue"]', '10000000');
      await page.fill('input[name="growthRate"]', '5.0');
      await page.fill('input[name="discountRate"]', '10.0');
      await page.fill('input[name="terminalGrowthRate"]', '3.0');
      await page.fill('input[name="sharesOutstanding"]', '1000000');
      await page.click('button[type="submit"]');

      await expect(page.locator('#sensitivity-analysis')).toBeVisible();
      await expect(page.locator('#sensitivity-table')).toBeVisible();
    });
  });

  test.describe('M&A Analysis Calculator', () => {
    test('should calculate accretion/dilution', async ({ page }) => {
      await page.goto('/calculator/ma-analysis');

      await page.fill('input[name="acquirerRevenue"]', '100000000');
      await page.fill('input[name="targetRevenue"]', '50000000');
      await page.fill('input[name="acquirerEPS"]', '2.50');
      await page.fill('input[name="targetEPS"]', '1.80');
      await page.fill('input[name="exchangeRatio"]', '0.8');
      await page.click('button[type="submit"]');

      await expect(page.locator('#results-content')).toBeVisible();
      await expect(page.locator('#accretion-dilution')).toBeVisible();
      await expect(page.locator('#pro-forma-eps')).toBeVisible();
    });

    test('should calculate synergy value', async ({ page }) => {
      await page.goto('/calculator/ma-analysis');

      await page.fill('input[name="revenueSynergies"]', '5000000');
      await page.fill('input[name="costSynergies"]', '2000000');
      await page.fill('input[name="synergyMultiple"]', '8');
      await page.click('button[type="submit"]');

      await expect(page.locator('#synergy-value')).toBeVisible();
    });
  });

  test.describe('Risk Management Calculator', () => {
    test('should calculate Value at Risk', async ({ page }) => {
      await page.goto('/calculator/risk-management');

      await page.fill('input[name="portfolioValue"]', '1000000');
      await page.fill('input[name="volatility"]', '20.0');
      await page.fill('input[name="confidenceLevel"]', '95');
      await page.fill('input[name="timeHorizon"]', '1');
      await page.click('button[type="submit"]');

      await expect(page.locator('#results-content')).toBeVisible();
      await expect(page.locator('#var-amount')).toBeVisible();
    });

    test('should calculate portfolio beta', async ({ page }) => {
      await page.goto('/calculator/risk-management');

      // Add stocks
      await page.click('#add-stock-btn');
      await page.fill('input[name="stock-0-weight"]', '40');
      await page.fill('input[name="stock-0-beta"]', '1.2');

      await page.click('#add-stock-btn');
      await page.fill('input[name="stock-1-weight"]', '30');
      await page.fill('input[name="stock-1-beta"]', '0.8');

      await page.click('#add-stock-btn');
      await page.fill('input[name="stock-2-weight"]', '30');
      await page.fill('input[name="stock-2-beta"]', '1.5');

      await page.click('button[type="submit"]');

      await expect(page.locator('#portfolio-beta')).toBeVisible();
    });
  });

  test.describe('Calculator Error Handling', () => {
    test('should handle invalid inputs gracefully', async ({ page }) => {
      await page.goto('/calculator/amortization');

      // Test various invalid inputs
      await page.fill('input[name="principal"]', 'abc');
      await page.fill('input[name="rate"]', '');
      await page.fill('input[name="term"]', '-5');
      await page.click('button[type="submit"]');

      await expect(page.locator('.error-message')).toBeVisible();
    });

    test('should handle extreme values', async ({ page }) => {
      await page.goto('/calculator/amortization');

      // Test very large numbers
      await page.fill('input[name="principal"]', '999999999999');
      await page.fill('input[name="rate"]', '50');
      await page.fill('input[name="term"]', '1');
      await page.click('button[type="submit"]');

      // Should handle gracefully without crashing
      await expect(page.locator('#results-content')).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/calculator/amortization');

      // Submit empty form
      await page.click('button[type="submit"]');

      await expect(page.locator('.error-message')).toContainText('Principal is required');
    });
  });

  test.describe('Calculator Responsiveness', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/calculator/amortization');

      await page.fill('input[name="principal"]', '300000');
      await page.fill('input[name="rate"]', '6.0');
      await page.fill('input[name="term"]', '30');
      await page.click('button[type="submit"]');

      await expect(page.locator('#results-content')).toBeVisible();
    });

    test('should work on tablet devices', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/calculator/amortization');

      await page.fill('input[name="principal"]', '300000');
      await page.fill('input[name="rate"]', '6.0');
      await page.fill('input[name="term"]', '30');
      await page.click('button[type="submit"]');

      await expect(page.locator('#results-content')).toBeVisible();
    });
  });
});





