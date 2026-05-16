/**
 * Journey Navigation Tests
 * Tests that all journey step pages have correct navigation links
 */

import { expect, test } from '@playwright/test';
import { getJourneyData } from '../../src/utils/journeyData';

const journeyData = getJourneyData();

test.describe('Journey Navigation Tests', () => {
  // Test each journey
  Object.entries(journeyData).forEach(([journeyId, journey]) => {
    test.describe(`${journey.name}`, () => {
      // Test each step page
      journey.models.forEach((step, index) => {
        test(`Step ${step.order}: ${step.name} has correct navigation`, async ({ page }) => {
          // Navigate to the step page
          await page.goto(`/journey/${journeyId}/step/${step.id}`);
          await page.waitForLoadState('networkidle');

          // Verify page loaded
          const h1 = page.locator('h1').first();
          await expect(h1).toBeVisible();
          
          const h1Text = await h1.textContent();
          expect(h1Text).toContain(step.name);

          // Check for navigation buttons
          const prevButton = page.locator('a:has-text("Previous:")');
          const nextButton = page.locator('a:has-text("Next:")');
          const completeButton = page.locator('a:has-text("Complete Journey")');

          // First step should not have previous button
          if (index === 0) {
            expect(await prevButton.count()).toBe(0);
            // Should have either next or complete button
            const hasNextOrComplete = (await nextButton.count()) > 0 || (await completeButton.count()) > 0;
            expect(hasNextOrComplete).toBe(true);
          } 
          // Last step should have previous button and complete button
          else if (index === journey.models.length - 1) {
            expect(await prevButton.count()).toBeGreaterThan(0);
            expect(await completeButton.count()).toBeGreaterThan(0);
            expect(await nextButton.count()).toBe(0);
          }
          // Middle steps should have both previous and next
          else {
            expect(await prevButton.count()).toBeGreaterThan(0);
            expect(await nextButton.count()).toBeGreaterThan(0);
          }

          // Verify next button links to correct step
          if (index < journey.models.length - 1) {
            const nextStep = journey.models[index + 1];
            const nextLink = page.locator(`a[href="/journey/${journeyId}/step/${nextStep.id}"]`);
            expect(await nextLink.count()).toBeGreaterThan(0);
          }

          // Verify previous button links to correct step
          if (index > 0) {
            const prevStep = journey.models[index - 1];
            const prevLink = page.locator(`a[href="/journey/${journeyId}/step/${prevStep.id}"]`);
            expect(await prevLink.count()).toBeGreaterThan(0);
          }
        });
      });

      test(`Complete journey navigation flow`, async ({ page }) => {
        // Start at first step
        const firstStep = journey.models[0];
        await page.goto(`/journey/${journeyId}/step/${firstStep.id}`);
        await page.waitForLoadState('networkidle');

        // Navigate through all steps using next buttons
        for (let i = 0; i < journey.models.length - 1; i++) {
          const currentStep = journey.models[i];
          const nextStep = journey.models[i + 1];

          // Verify we're on the correct step
          const currentUrl = page.url();
          expect(currentUrl).toContain(currentStep.id);

          // Click next button
          const nextButton = page.locator(`a[href="/journey/${journeyId}/step/${nextStep.id}"]`).first();
          if (await nextButton.count() > 0) {
            await nextButton.click();
            await page.waitForLoadState('networkidle');
            
            // Verify we navigated to next step
            const newUrl = page.url();
            expect(newUrl).toContain(nextStep.id);
          }
        }

        // Last step should have complete journey button
        const completeButton = page.locator('a[href*="journey-analysis"]');
        expect(await completeButton.count()).toBeGreaterThan(0);
      });

      test(`Back navigation works correctly`, async ({ page }) => {
        // Start at last step
        const lastStep = journey.models[journey.models.length - 1];
        await page.goto(`/journey/${journeyId}/step/${lastStep.id}`);
        await page.waitForLoadState('networkidle');

        // Navigate backwards through steps
        for (let i = journey.models.length - 1; i > 0; i--) {
          const currentStep = journey.models[i];
          const prevStep = journey.models[i - 1];

          // Verify we're on the correct step
          const currentUrl = page.url();
          expect(currentUrl).toContain(currentStep.id);

          // Click previous button
          const prevButton = page.locator(`a[href="/journey/${journeyId}/step/${prevStep.id}"]`).first();
          if (await prevButton.count() > 0) {
            await prevButton.click();
            await page.waitForLoadState('networkidle');
            
            // Verify we navigated to previous step
            const newUrl = page.url();
            expect(newUrl).toContain(prevStep.id);
          }
        }
      });
    });
  });
});

