
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_URL || 'http://localhost:8788';

test.describe('Generated Model Tests', () => {

  test('should run amortization calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/amortization/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#principal', '1000');
    await page.fill('#annualRate', '5');
    await page.fill('#termMonths', '30');
    await page.fill('#extraPayment', '1000');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run auto-loan calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/auto-loan/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#vehiclePrice', '300000');
    await page.fill('#downPayment', '50000');
    await page.fill('#interestRate', '5');
    await page.selectOption('#loanTerm', '12');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run retirement calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/retirement/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#currentAge', '30');
    await page.fill('#retirementAge', '30');
    await page.fill('#annualIncome', '1000');
    await page.fill('#returnRate', '5');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run savings-goal calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/savings-goal/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#goalAmount', '300000');
    await page.fill('#currentSavings', '2000');
    await page.fill('#targetDate', '1000');
    await page.fill('#interestRate', '5');
    await page.fill('#inflationRate', '5');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run debt-payoff calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/debt-payoff/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#debts', 'Test Value');
    await page.fill('#extraPayment', '1000');
    await page.selectOption('#strategy', 'avalanche');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run student-loans calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/student-loans/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#loanBalance', '300000');
    await page.fill('#interestRate', '5');
    await page.fill('#annualIncome', '1000');
    await page.fill('#familySize', '1000');
    await page.selectOption('#repaymentPlan', 'standard');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run budget calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/budget/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#monthlyIncome', '1000');
    await page.fill('#housing', '1000');
    await page.fill('#utilities', '1000');
    await page.fill('#food', '1000');
    await page.fill('#transportation', '1000');
    await page.fill('#savingsGoal', '1000');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run dcf-valuation calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/dcf-valuation/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#revenue', '1000');
    await page.fill('#revenueGrowth', '1000');
    await page.fill('#ebitdaMargin', '1000');
    await page.fill('#taxRate', '5');
    await page.fill('#capex', '1000');
    await page.fill('#workingCapitalChange', '1000');
    await page.fill('#terminalGrowthRate', '5');
    await page.fill('#discountRate', '5');
    await page.fill('#projectionYears', '30');
    await page.fill('#sharesOutstanding', '1000');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run ma-analysis calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/ma-analysis/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#acquirerRevenue', '1000');
    await page.fill('#acquirerEBITDA', '1000');
    await page.fill('#acquirerShares', '1000');
    await page.fill('#acquirerSharePrice', '300000');
    await page.fill('#targetRevenue', '1000');
    await page.fill('#targetEBITDA', '1000');
    await page.fill('#targetShares', '1000');
    await page.fill('#targetSharePrice', '300000');
    await page.fill('#offerPrice', '300000');
    await page.fill('#cashPercentage', '5');
    await page.fill('#revenueSynergies', '1000');
    await page.fill('#costSynergies', '300000');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run risk-management calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/risk-management/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#portfolioValue', '300000');
    await page.fill('#expectedReturn', '1000');
    await page.fill('#volatility', '1000');
    await page.fill('#confidenceLevel', '1000');
    await page.fill('#timeHorizon', '1000');
    await page.fill('#recessionScenario', '1000');
    await page.fill('#inflationScenario', '1000');
    await page.fill('#marketCrashScenario', '1000');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run equipment-lease calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/equipment-lease/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#equipmentCost', '300000');
    await page.fill('#downPayment', '50000');
    await page.fill('#leaseTerm', '30');
    await page.fill('#interestRate', '5');
    await page.fill('#residualValue', '300000');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run invest-vs-payoff-debt calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/invest-vs-payoff-debt/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#extraMoney', '1000');
    await page.fill('#debtBalance', '300000');
    await page.fill('#debtInterestRate', '5');
    await page.fill('#debtMinimumPayment', '1000');
    await page.selectOption('#debtType', 'credit-card');
    await page.fill('#expectedInvestmentReturn', '1000');
    await page.fill('#employerMatch', '1000');
    await page.selectOption('#timeHorizonYears', '5');
    await page.selectOption('#hasEmergencyFund', 'yes');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run rent-vs-buy calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/rent-vs-buy/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = true;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#homePrice', '300000');
    await page.fill('#downPayment', '50000');
    await page.fill('#interestRate', '5');
    await page.selectOption('#loanTermYears', '10');
    await page.fill('#propertyTaxRate', '5');
    await page.fill('#propertyTaxIncreaseRate', '5');
    await page.fill('#homeInsurance', '100');
    await page.fill('#hoaFees', '100');
    await page.fill('#maintenanceRate', '5');
    await page.fill('#monthlyRent', '2000');
    await page.fill('#rentIncreaseRate', '5');
    await page.fill('#rentersInsurance', '100');
    await page.selectOption('#securityDepositMonths', '0');
    await page.selectOption('#yearsToAnalyze', '3');
    await page.fill('#appreciationRate', '5');
    await page.fill('#investmentReturnRate', '5');
    await page.fill('#inflationRate', '5');
    await page.fill('#marginalTaxRate', '5');
    await page.selectOption('#filingStatus', 'single');
    await page.fill('#otherItemizedDeductions', '1000');
    await page.fill('#closingCostRate', '5');
    await page.fill('#sellingCostRate', '5');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run mortgage-scenario-planning calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/mortgage-scenario-planning/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#homePrice', '300000');
    await page.selectOption('#loanTerm', '15');
    await page.fill('#scenario1Down', '50000');
    await page.fill('#scenario1Rate', '5');
    await page.fill('#scenario1Extra', '1000');
    await page.fill('#scenario2Down', '50000');
    await page.fill('#scenario2Rate', '5');
    await page.fill('#scenario2Extra', '1000');
    await page.fill('#refinanceRate', '5');
    await page.fill('#grossMonthlyIncome', '1000');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run side-hustle-income calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/side-hustle-income/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#monthlyRevenue', '1000');
    await page.fill('#hoursPerWeek', '40');
    await page.fill('#businessExpenses', '1000');
    await page.selectOption('#filingStatus', 'single');
    await page.fill('#otherIncome', '1000');
    await page.fill('#stateTaxRate', '5');
    await page.selectOption('#selfEmploymentTaxDeduction', 'yes');
    await page.selectOption('#qbiDeduction', 'yes');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run credit-card-payoff calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/credit-card-payoff/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#balance', '300000');
    await page.fill('#interestRate', '5');
    await page.fill('#creditLimit', '1000');
    await page.fill('#minimumPaymentPercent', '5');
    await page.fill('#monthlyPayment', '1000');
    await page.selectOption('#balanceTransferOffer', 'yes');
    await page.fill('#transferAPR', '5');
    await page.fill('#transferFee', '100');
    await page.selectOption('#transferPromoPeriod', '6');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run break-even calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/break-even/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#fixedCosts', '300000');
    await page.fill('#variableCostPerUnit', '300000');
    await page.fill('#sellingPricePerUnit', '300000');
    await page.fill('#currentSalesUnits', '2000');
    await page.fill('#targetProfit', '1000');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run cash-flow-forecast calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/cash-flow-forecast/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#startingCash', '1000');
    await page.fill('#monthlyRevenue', '1000');
    await page.fill('#revenueGrowthRate', '5');
    await page.fill('#averageCollectionDays', '30');
    await page.fill('#monthlyExpenses', '1000');
    await page.fill('#expenseGrowthRate', '5');
    await page.fill('#averagePaymentDays', '30');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run business-loan-qualifier calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/business-loan-qualifier/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#loanAmount', '300000');
    await page.fill('#businessRevenue', '1000');
    await page.fill('#netIncome', '1000');
    await page.fill('#existingDebtPayments', '1000');
    await page.fill('#businessAge', '30');
    await page.fill('#creditScore', '1000');
    await page.fill('#collateralValue', '300000');
    await page.selectOption('#loanPurpose', 'working-capital');
    await page.selectOption('#personalGuaranteeAvailable', 'yes');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run pricing-strategy calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/pricing-strategy/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#costPerUnit', '300000');
    await page.fill('#targetMargin', '1000');
    await page.fill('#marketPrice', '300000');
    await page.fill('#valueToCustomer', '300000');
    await page.fill('#unitsSoldMonthly', '1000');
    await page.fill('#priceElasticity', '300000');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run saas-metrics calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/saas-metrics/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#activeCustomers', '1000');
    await page.fill('#averageMonthlyRevenue', '30');
    await page.fill('#newCustomersLastMonth', '1000');
    await page.fill('#churnedCustomersLastMonth', '1000');
    await page.fill('#salesMarketingSpend', '1000');
    await page.fill('#averageCustomerLifetimeMonths', '30');
    await page.fill('#grossMargin', '1000');
    await page.fill('#revenueGrowthRate', '5');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run business-financial-health calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/business-financial-health/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#yearsInBusiness', '30');
    await page.fill('#annualRevenue', '1000');
    await page.fill('#annualEBITDA', '1000');
    await page.fill('#currentDebt', '2000');
    await page.fill('#monthlyDebtPayments', '1000');
    await page.fill('#cashOnHand', '1000');
    await page.fill('#accountsReceivable', '0.0');
    await page.fill('#accountsPayable', '0.0');
    await page.fill('#creditScore', '1000');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run debt-capacity calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/debt-capacity/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#annualEBITDA', '1000');
    await page.fill('#monthlyDebtPayments', '1000');
    await page.fill('#expectedEBITDAIncrease', '0.0');
    await page.fill('#preferredTerm', '30');
    await page.fill('#preferredRate', '5');
    await page.selectOption('#loanType', 'term-loan');
    await page.fill('#requestedAmount', '300000');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run dscr calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/dscr/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#ebitda', '1000');
    await page.fill('#annualDebtService', '1000');
    await page.fill('#existingDebtService', '0.0');
    await page.fill('#newLoanPayment', '1000');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run business-loan-scenarios calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/business-loan-scenarios/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#loanAmount', '300000');
    await page.fill('#currentDebtPayments', '0.0');
    await page.fill('#scenario1Name', 'Test Value');
    await page.fill('#scenario1Term', '30');
    await page.fill('#scenario1Rate', '5');
    await page.fill('#scenario2Name', 'Test Value');
    await page.fill('#scenario2Term', '30');
    await page.fill('#scenario2Rate', '5');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run social-security calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/social-security/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#birthDate', 'Test Value');
    await page.fill('#currentAge', '30');
    await page.fill('#fullRetirementAge', '30');
    await page.fill('#lifeExpectancy', '100');
    await page.selectOption('#maritalStatus', 'single');
    await page.fill('#currentAnnualEarnings', '2000');
    await page.fill('#averageLifetimeEarnings', '30');
    await page.fill('#primaryClaimingAge', '30');
    await page.selectOption('#optimizeFor', 'maximum-lifetime');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run heloc calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/heloc/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#currentHomeValue', '300000');
    await page.fill('#currentMortgageBalance', '300000');
    await page.fill('#mortgageInterestRate', '5');
    await page.fill('#yearsRemaining', '30');
    await page.fill('#creditLimit', '1000');
    await page.fill('#interestRate', '5');
    await page.fill('#drawPeriod', '1000');
    await page.fill('#repaymentPeriod', '1000');
    await page.fill('#drawAmount', '300000');
    await page.selectOption('#purpose', 'home-improvement');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run refinancing calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/refinancing/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#principalBalance', '300000');
    await page.fill('#currentInterestRate', '5');
    await page.fill('#remainingTerm', '30');
    await page.fill('#monthlyPayment', '1000');
    await page.fill('#newInterestRate', '5');
    await page.fill('#newTerm', '30');
    await page.selectOption('#refinanceType', 'rate-and-term');
    await page.fill('#closingCosts', '300000');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run fire-calculator calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/fire-calculator/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#age', '30');
    await page.fill('#currentSavings', '2000');
    await page.fill('#annualIncome', '1000');
    await page.fill('#annualExpenses', '1000');
    await page.fill('#monthlySavings', '1000');
    await page.fill('#targetAge', '30');
    await page.fill('#annualExpensesInRetirement', '1000');
    await page.fill('#safeWithdrawalRate', '5');
    await page.fill('#expectedReturn', '1000');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run estate-planning calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/estate-planning/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#age', '30');
    await page.selectOption('#maritalStatus', 'single');
    await page.fill('#totalAssets', '1000');
    await page.fill('#realEstate', '1000');
    await page.fill('#investments', '1000');
    await page.fill('#retirementAccounts', '1000');
    await page.uncheck('#hasWill');
    await page.uncheck('#hasTrust');
    await page.fill('#beneficiaries', '1000');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run emergency-fund calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/emergency-fund/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#monthlyExpenses', '1000');
    await page.fill('#monthlyIncome', '1000');
    await page.fill('#currentEmergencyFund', '2000');
    await page.fill('#dependents', '1000');
    await page.selectOption('#employmentStatus', 'employed');
    await page.fill('#targetMonths', '1000');
    await page.fill('#monthlySavings', '1000');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run net-worth calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/net-worth/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#cash', '1000');
    await page.fill('#investments', '1000');
    await page.fill('#realEstate', '1000');
    await page.fill('#retirementAccounts', '1000');
    await page.fill('#mortgages', '30');
    await page.fill('#creditCardDebt', '1000');
    await page.fill('#studentLoans', '1000');
    await page.fill('#autoLoans', '1000');
    await page.fill('#assetGrowthRate', '5');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run 401k-match calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/401k-match/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#employerMatch', '1000');
    await page.fill('#matchLimit', '1000');
    await page.selectOption('#vestingSchedule', 'immediate');
    await page.fill('#annualSalary', '1000');
    await page.fill('#currentContribution', '2000');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run capital-structure calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/capital-structure/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#marketCap', '1000');
    await page.fill('#currentDebt', '2000');
    await page.fill('#annualEBITDA', '1000');
    await page.fill('#taxRate', '5');
    await page.fill('#riskFreeRate', '5');
    await page.fill('#beta', '1000');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run project-finance calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/project-finance/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#projectName', 'Test Value');
    await page.selectOption('#projectType', 'infrastructure');
    await page.fill('#initialInvestment', '1000');
    await page.fill('#cashFlowYears', '30');
    await page.fill('#equityPercentage', '5');
    await page.fill('#costOfEquity', '300000');
    await page.fill('#costOfDebt', '300000');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run real-estate-investment calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/real-estate-investment/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#purchasePrice', '300000');
    await page.selectOption('#propertyType', 'residential');
    await page.fill('#downPayment', '50000');
    await page.fill('#loanAmount', '300000');
    await page.fill('#interestRate', '5');
    await page.fill('#monthlyRent', '2000');
    await page.fill('#propertyTaxes', '5');
    await page.fill('#insurance', '100');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run lbo calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/lbo/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#ebitda', '1000');
    await page.fill('#revenue', '1000');
    await page.fill('#purchasePrice', '300000');
    await page.fill('#equityContribution', '1000');
    await page.fill('#debtAmount', '300000');
    await page.fill('#seniorDebtAmount', '300000');
    await page.fill('#seniorDebtRate', '5');
    await page.fill('#exitMultiple', '1000');
    await page.fill('#holdingPeriod', '1000');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run credit-risk calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/credit-risk/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#annualRevenue', '1000');
    await page.fill('#ebitda', '1000');
    await page.fill('#netIncome', '1000');
    await page.fill('#totalDebt', '1000');
    await page.fill('#totalAssets', '1000');
    await page.fill('#exposureAtDefault', '1000');
    await page.fill('#recoveryRate', '5');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run working-capital calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/working-capital/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#annualRevenue', '1000');
    await page.fill('#cash', '1000');
    await page.fill('#accountsReceivable', '1000');
    await page.fill('#inventory', '1000');
    await page.fill('#accountsPayable', '1000');
    await page.fill('#shortTermDebt', '30');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run var calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/var/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#positionCount', '1000');
    await page.fill('#confidenceLevel', '1000');
    await page.fill('#timeHorizon', '1000');
    await page.selectOption('#method', 'historical');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });

  test('should run portfolio-optimization calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/portfolio-optimization/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = false;
    if (hasAdvancedFields) {
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }
    }

    // Fill fields
    await page.fill('#holdingCount', '1000');
    await page.selectOption('#riskTolerance', 'conservative');
    await page.fill('#minAllocation', '1000');
    await page.fill('#maxAllocation', '1000');

    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });
});
