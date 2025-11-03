/**
 * Journey Accessibility Tests
 * Tests that all journeys are accessible and properly built
 */

import { expect, test } from '@playwright/test';

const JOURNEYS = [
  {
    id: 'young-professional',
    name: 'Young Professional Journey',
    steps: [
      { id: 'financial-snapshot', name: 'Financial Snapshot' },
      { id: 'debt-strategy', name: 'Debt Strategy' },
      { id: 'emergency-fund', name: 'Emergency Fund' },
      { id: 'retirement-start', name: 'Retirement Start' },
      { id: 'goal-planning', name: 'Goal Planning' },
    ],
  },
  {
    id: 'family-planning',
    name: 'Family Planning Journey',
    steps: [
      { id: 'debt-strategy', name: 'Debt Strategy' },
      { id: 'emergency-fund', name: 'Emergency Fund' },
      { id: 'financial-snapshot', name: 'Financial Snapshot' },
      { id: 'goal-planning', name: 'Goal Planning' },
      { id: 'retirement-start', name: 'Retirement Start' },
    ],
  },
  {
    id: 'home-buying',
    name: 'Home Buying Journey',
    steps: [
      { id: 'financial-snapshot', name: 'Financial Snapshot' },
      { id: 'debt-strategy', name: 'Debt Strategy' },
      { id: 'emergency-fund', name: 'Emergency Fund' },
      { id: 'retirement-start', name: 'Down Payment Planning' },
      { id: 'goal-planning', name: 'Mortgage Planning' },
    ],
  },
  {
    id: 'startup-planning',
    name: 'Startup Financial Planning',
    steps: [
      { id: 'initial-capital-investment', name: 'Initial Capital Investment' },
      { id: 'startup-budget', name: 'Startup Budget Planning' },
      { id: 'funding-strategy', name: 'Funding Strategy' },
      { id: 'growth-planning', name: 'Growth Planning' },
    ],
  },
  {
    id: 'ma-analysis-journey',
    name: 'M&A Analysis Journey',
    steps: [
      { id: 'debt-strategy', name: 'Debt Strategy' },
      { id: 'emergency-fund', name: 'Emergency Fund' },
      { id: 'financial-snapshot', name: 'Financial Snapshot' },
      { id: 'goal-planning', name: 'Goal Planning' },
      { id: 'retirement-start', name: 'Retirement Start' },
    ],
  },
];

test.describe('Journey Accessibility Tests', () => {
  // Test each journey main page
  JOURNEYS.forEach((journey) => {
    test(`Journey "${journey.name}" main page is accessible`, async ({ page }) => {
      await page.goto(`/journey/${journey.id}`);
      await page.waitForLoadState('networkidle');

      // Check page title contains journey name
      const title = await page.locator('h1').textContent();
      expect(title).toContain(journey.name);

      // Check journey description is present
      const description = page.locator('[class*="description"], p.text-gray-600, p.text-gray-700');
      await expect(description.first()).toBeVisible();

      // Check journey steps are listed
      const stepsSection = page.locator('text=Analysis Models');
      await expect(stepsSection).toBeVisible();

      // Verify all journey steps are accessible
      for (const step of journey.steps) {
        const stepLink = page.locator(`a[href*="${step.id}"]`);
        await expect(stepLink.first()).toBeVisible();
      }
    });
  });

  // Test each journey step page
  JOURNEYS.forEach((journey) => {
    journey.steps.forEach((step) => {
      test(`Journey "${journey.name}" step "${step.name}" is accessible`, async ({ page }) => {
        const stepUrl = `/journey/${journey.id}/step/${step.id}`;
        
        try {
          await page.goto(stepUrl);
          await page.waitForLoadState('networkidle');

          // Check page loaded successfully (not 404)
          const statusCode = page.url();
          expect(statusCode).toContain(stepUrl);

          // Check for calculator form or content
          const hasForm = await page.locator('form, #calculator-form, form[id*="form"]').count() > 0;
          const hasContent = await page.locator('main, .container, .content').count() > 0;

          expect(hasForm || hasContent).toBeTruthy();

          // Check page title or heading exists
          const hasTitle = await page.locator('h1, h2, title').count() > 0;
          expect(hasTitle).toBeTruthy();
        } catch (error) {
          // If step page doesn't exist, that's a critical issue
          throw new Error(`Step page "${stepUrl}" is not accessible: ${error}`);
        }
      });
    });
  });

  // Test journey analysis pages
  JOURNEYS.forEach((journey) => {
    test(`Journey "${journey.name}" analysis page is accessible`, async ({ page }) => {
      try {
        await page.goto(`/journey-analysis/${journey.id}`);
        await page.waitForLoadState('networkidle');

        // Check page loaded successfully
        const url = page.url();
        expect(url).toContain('journey-analysis');

        // Check for analysis content
        const hasContent = await page.locator('main, .container, #analysis-content').count() > 0;
        expect(hasContent).toBeTruthy();
      } catch (error) {
        throw new Error(`Analysis page for "${journey.name}" is not accessible: ${error}`);
      }
    });
  });

  // Test journey listing page exists and shows all journeys
  test('Journey listing page exists and shows all journeys', async ({ page }) => {
    // Navigate to journey listing page
    await page.goto('/journey');
    await page.waitForLoadState('networkidle');
    
    // Check if this is a listing page by looking for multiple journey cards
    const journeyCards = await page.locator('[data-scenario]').count();
    expect(journeyCards).toBeGreaterThan(0);
    
    // Verify all configured journeys are present on the listing page
    for (const journey of JOURNEYS) {
      const journeyElement = page.locator(`[data-scenario="${journey.id}"]`);
      await expect(journeyElement).toBeVisible();
      
      // Check that journey card has title
      const journeyCard = journeyElement.locator('..');
      await expect(journeyCard.locator('h3')).toContainText(journey.name);
    }
  });

  // Test clicking on journey cards navigates correctly
  test('Clicking on journey cards navigates to correct journey page', async ({ page }) => {
    await page.goto('/journey');
    await page.waitForLoadState('networkidle');
    
    // Test clicking on each journey card
    for (const journey of JOURNEYS) {
      const journeyCard = page.locator(`[data-scenario="${journey.id}"]`);
      
      // Click on the journey card
      await journeyCard.click();
      await page.waitForLoadState('networkidle');
      
      // Verify we navigated to the correct journey page
      const currentUrl = page.url();
      expect(currentUrl).toContain(`/journey/${journey.id}`);
      
      // Verify the journey name is in the page
      const heading = page.locator('h1');
      await expect(heading).toContainText(journey.name);
      
      // Go back to listing page
      await page.goto('/journey');
      await page.waitForLoadState('networkidle');
    }
  });

  // Test breadcrumb navigation
  JOURNEYS.forEach((journey) => {
    test(`Journey "${journey.name}" has working breadcrumb navigation`, async ({ page }) => {
      await page.goto(`/journey/${journey.id}`);
      await page.waitForLoadState('networkidle');

      // Check for breadcrumb
      const breadcrumb = page.locator('nav[aria-label="Breadcrumb"], [class*="breadcrumb"]');
      if (await breadcrumb.count() > 0) {
        // Breadcrumb should have link to home
        const homeLink = page.locator('a[href="/"]');
        await expect(homeLink).toBeVisible();
      }
    });
  });

  // Test journey step navigation
  test('Journey steps can be navigated', async ({ page }) => {
    const journey = JOURNEYS[0]; // Use first journey for navigation test
    await page.goto(`/journey/${journey.id}`);
    await page.waitForLoadState('networkidle');

    // Click on first step
    const firstStep = journey.steps[0];
    const firstStepLink = page.locator(`a[href*="${firstStep.id}"]`).first();
    
    if (await firstStepLink.count() > 0) {
      await firstStepLink.click();
      await page.waitForLoadState('networkidle');

      // Verify we navigated to step page
      const currentUrl = page.url();
      expect(currentUrl).toContain(firstStep.id);
    }
  });

  // Test that all journeys have proper metadata
  test('All journeys have proper metadata', async ({ page }) => {
    for (const journey of JOURNEYS) {
      await page.goto(`/journey/${journey.id}`);
      await page.waitForLoadState('networkidle');

      // Check for meta tags
      const title = await page.locator('title').textContent();
      expect(title).toBeTruthy();
      expect(title).toContain(journey.name);

      // Check for description meta tag
      const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
      if (metaDescription) {
        expect(metaDescription.length).toBeGreaterThan(50); // Should have meaningful description
      }
    }
  });

  // Test journey state persistence (localStorage/sessionStorage)
  test('Journey state can be persisted', async ({ page, context }) => {
    const journey = JOURNEYS[0];
    await page.goto(`/journey/${journey.id}`);
    await page.waitForLoadState('networkidle');

    // Inject a test journey state
    await page.evaluate(() => {
      localStorage.setItem('journey-state', JSON.stringify({
        scenarioId: 'young-professional',
        currentStep: 1,
        completedSteps: ['financial-snapshot'],
      }));
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Journey state should still be accessible
    const journeyState = await page.evaluate(() => {
      return localStorage.getItem('journey-state');
    });

    expect(journeyState).toBeTruthy();
  });
});

test.describe('Journey Integration Tests', () => {
  // Test complete workflow for each journey
  JOURNEYS.forEach((journey) => {
    test(`Complete journey workflow - ${journey.name}`, async ({ page }) => {
      // Navigate to journey
      await page.goto(`/journey/${journey.id}`);
      await page.waitForLoadState('networkidle');

      // Verify journey page loads
      await expect(page.locator('h1')).toContainText(journey.name);

      // Navigate through first 2 steps
      for (const step of journey.steps.slice(0, 2)) {
        const stepLink = page.locator(`a[href*="${step.id}"]`).first();
        
        if (await stepLink.count() > 0) {
          await stepLink.click();
          await page.waitForLoadState('networkidle');

          // Verify step page loaded
          const url = page.url();
          expect(url).toContain(step.id);

          // Go back to journey main page
          await page.goBack();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test(`Journey analysis page works - ${journey.name}`, async ({ page }) => {
      await page.goto(`/journey-analysis/${journey.id}`);
      await page.waitForLoadState('networkidle');

      // Check if analysis page has content
      const hasContent = await page.locator('main, .container, h1, h2').count() > 0;
      expect(hasContent).toBeTruthy();

      // Should have journey name in title
      const title = await page.locator('h1').first().textContent();
      expect(title).toContain(journey.name);
    });
  });

  test('Journey navigation from listing page works for all journeys', async ({ page }) => {
    // Start at journey listing page
    await page.goto('/journey');
    await page.waitForLoadState('networkidle');

    // Click on each journey and verify navigation
    for (const journey of JOURNEYS) {
      // Find and click the journey card
      const journeyCard = page.locator(`[data-scenario="${journey.id}"]`);
      await expect(journeyCard).toBeVisible();
      
      await journeyCard.click();
      await page.waitForLoadState('networkidle');

      // Verify we're on the journey page
      expect(page.url()).toContain(`/journey/${journey.id}`);
      
      // Verify journey name is displayed
      await expect(page.locator('h1')).toContainText(journey.name);

      // Go back to listing page
      await page.goto('/journey');
      await page.waitForLoadState('networkidle');
    }
  });
});

