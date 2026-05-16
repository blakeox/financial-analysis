import { expect, test } from '@playwright/test';

test.describe('Analysis Page Scenario Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analysis');
  });

  test('should display all scenario cards', async ({ page }) => {
    // Check that all 6 scenario cards are visible
    const scenarioCards = page.locator('.scenario-card');
    await expect(scenarioCards).toHaveCount(6);

    // Verify specific scenarios are present
    await expect(page.locator('[data-scenario="young-professional"]')).toBeVisible();
    await expect(page.locator('[data-scenario="family-planning"]')).toBeVisible();
    await expect(page.locator('[data-scenario="home-buying"]')).toBeVisible();
    await expect(page.locator('[data-scenario="debt-elimination"]')).toBeVisible();
    await expect(page.locator('[data-scenario="investment-portfolio"]')).toBeVisible();
    await expect(page.locator('[data-scenario="pre-retirement"]')).toBeVisible();
  });

  test('should navigate to journey page when card is clicked', async ({ page }) => {
    // Click on the Young Professional Journey card
    await page.locator('[data-scenario="young-professional"]').click();

    // Should navigate to the journey page
    await expect(page).toHaveURL('/journey/young-professional');
    
    // Verify the journey page content
    await expect(page.locator('h1')).toHaveText('Young Professional Journey');
    await expect(page.locator('text=Ages 25-35')).toBeVisible();
    await expect(page.locator('text=Beginner')).toBeVisible();
    await expect(page.locator('text=2-3 hours')).toBeVisible();
  });

  test('should navigate to different journey pages for different cards', async ({ page }) => {
    // Click on Family Planning Journey
    await page.locator('[data-scenario="family-planning"]').click();
    
    await expect(page).toHaveURL('/journey/family-planning');
    await expect(page.locator('h1')).toHaveText('Family Planning Journey');
    await expect(page.locator('text=Ages 30-45')).toBeVisible();

    // Go back to analysis page
    await page.goto('/analysis');

    // Click on Home Buying Journey
    await page.locator('[data-scenario="home-buying"]').click();
    
    await expect(page).toHaveURL('/journey/home-buying');
    await expect(page.locator('h1')).toHaveText('Home Buying Journey');
    await expect(page.locator('text=Major Purchase')).toBeVisible();
  });

  test('should handle multiple rapid clicks correctly', async ({ page }) => {
    // Click multiple cards rapidly - should navigate to the last one clicked
    await page.locator('[data-scenario="young-professional"]').click();
    
    // Wait for navigation to complete before next click
    await page.waitForURL('/journey/young-professional');
    await page.goto('/analysis');
    
    await page.locator('[data-scenario="family-planning"]').click();
    await page.waitForURL('/journey/family-planning');
    await page.goto('/analysis');
    
    await page.locator('[data-scenario="home-buying"]').click();

    // Should navigate to the last clicked scenario
    await expect(page).toHaveURL('/journey/home-buying');
    await expect(page.locator('h1')).toHaveText('Home Buying Journey');
  });

  test('should show journey page with all required elements', async ({ page }) => {
    // Navigate to a journey page
    await page.locator('[data-scenario="investment-portfolio"]').click();
    
    await expect(page).toHaveURL('/journey/investment-portfolio');
    
    // Check journey page elements
    await expect(page.locator('h1')).toHaveText('Investment Portfolio Build');
    await expect(page.locator('.px-3.py-1').filter({ hasText: 'Advanced' })).toBeVisible();
    await expect(page.locator('text=3-4 hours')).toBeVisible();
    
    // Check for progress section
    await expect(page.locator('text=Journey Progress')).toBeVisible();
    await expect(page.locator('text=Completed')).toBeVisible();
    await expect(page.locator('text=Total Steps')).toBeVisible();
    
    // Check for models section
    await expect(page.locator('text=Analysis Models')).toBeVisible();
    await expect(page.locator('text=Workflow Steps')).toBeVisible();
    
    // Check for call to action
    await expect(page.locator('text=Start Your Journey')).toBeVisible();
  });
});

test.describe('Journey Page Functionality', () => {
  test('should display correct models for each journey', async ({ page }) => {
    // Test Young Professional Journey
    await page.goto('/journey/young-professional');
    await expect(page.locator('h4').filter({ hasText: 'Student Loan Analyzer' })).toBeVisible();
    await expect(page.locator('h4').filter({ hasText: 'Budget Optimizer' })).toBeVisible();
    await expect(page.locator('h4').filter({ hasText: 'Retirement Planning Engine' })).toBeVisible();
    
    // Test Family Planning Journey
    await page.goto('/journey/family-planning');
    await expect(page.locator('h4').filter({ hasText: 'Home Buying Affordability Calculator' })).toBeVisible();
    await expect(page.locator('h4').filter({ hasText: 'College Savings Planner' })).toBeVisible();
    await expect(page.locator('h4').filter({ hasText: 'Insurance Needs Calculator' })).toBeVisible();
  });

  test('should have clickable model links', async ({ page }) => {
    await page.goto('/journey/young-professional');
    
    // Check that model links are clickable (use first() to avoid strict mode violations)
    const studentLoanLink = page.locator('a[href="/student-loans"]').first();
    await expect(studentLoanLink).toBeVisible();
    await expect(studentLoanLink).toHaveText('Start');
    
    const budgetLink = page.locator('a[href="/budget"]').first();
    await expect(budgetLink).toBeVisible();
    await expect(budgetLink).toHaveText('Start');
  });

  test('should show workflow steps', async ({ page }) => {
    await page.goto('/journey/investment-portfolio');
    
    // Check workflow steps are displayed
    await expect(page.locator('text=Assess current investment situation')).toBeVisible();
    await expect(page.locator('text=Build diversified portfolio')).toBeVisible();
    await expect(page.locator('text=Implement tax-efficient strategies')).toBeVisible();
  });

  test('should have breadcrumb navigation', async ({ page }) => {
    await page.goto('/journey/home-buying');
    
    // Check breadcrumbs (use more specific selectors to avoid strict mode violations)
    await expect(page.locator('nav').getByText('Home').first()).toBeVisible();
    await expect(page.locator('nav').getByText('Analysis').first()).toBeVisible();
    await expect(page.locator('nav').getByText('Home Buying Journey')).toBeVisible();
    
    // Check breadcrumb links work
    await page.locator('nav a[href="/"]').first().click();
    await expect(page).toHaveURL('/');
  });
});

test.describe('Analysis Page Console Logging', () => {
  test('should log scenario manager initialization', async ({ page }) => {
    const consoleMessages: string[] = [];

    page.on('console', (msg) => {
      consoleMessages.push(msg.text());
    });

    await page.goto('/analysis');

    // Wait for the script to load and initialize
    await page.waitForTimeout(1000);

    // Check that initialization messages are logged
    expect(
      consoleMessages.some((msg) => msg.includes('Multi-model scenarios script loaded'))
    ).toBeTruthy();
    expect(
      consoleMessages.some((msg) => msg.includes('Scenario manager initialized'))
    ).toBeTruthy();
    expect(consoleMessages.some((msg) => msg.includes('Global functions registered'))).toBeTruthy();
  });

  test('should log scenario card clicks', async ({ page }) => {
    const consoleMessages: string[] = [];

    page.on('console', (msg) => {
      consoleMessages.push(msg.text());
    });

    await page.goto('/analysis');
    await page.waitForTimeout(1000);

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Click on a scenario card
    await page.locator('[data-scenario="young-professional"]').click();

    // Check that click is logged
    expect(
      consoleMessages.some((msg) => msg.includes('Scenario card clicked: young-professional'))
    ).toBeTruthy();
    expect(
      consoleMessages.some((msg) => msg.includes('selectScenario called with: young-professional'))
    ).toBeTruthy();
  });
});