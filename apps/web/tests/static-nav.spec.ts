import { test, expect } from '@playwright/test';

// Basic smoke test to ensure the static (non-scripted) nav renders expected links.
// This helps differentiate Tailwind build or purge issues from runtime script issues.

test.describe('Static Nav Debug Page', () => {
  test('renders static nav with all links', async ({ page }) => {
    await page.goto('/debug-static-nav');
    const nav = page.locator('#static-test-nav');
    await expect(nav).toBeVisible();

    const links = nav.locator('a');
    await expect(links).toHaveCount(3); // brand + 2 links

    const texts = await links.allInnerTexts();
    expect(texts).toContain('Financial Analysis');
    expect(texts.some(t => /Models/i.test(t))).toBeTruthy();
    expect(texts.some(t => /Analysis/i.test(t))).toBeTruthy();
  });
});
