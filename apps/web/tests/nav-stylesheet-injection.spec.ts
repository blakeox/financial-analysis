import { test, expect } from '@playwright/test';

// Detect unexpected late stylesheet injections that could override nav styling.

test.describe('Navbar late stylesheet injections', () => {
  test('no new stylesheets after 3s beyond small tolerance', async ({ page }) => {
    await page.goto('/');

    // Collect stylesheet href/inline signatures at ~load time
    await page.waitForLoadState('load');
    const initial = await page.evaluate(() => Array.from(document.styleSheets).map(ss => ss.href || 'inline-'+Array.from((ss as CSSStyleSheet).cssRules||[]).length));

    // Wait 3s and collect again
    await page.waitForTimeout(3000);
    const later = await page.evaluate(() => Array.from(document.styleSheets).map(ss => ss.href || 'inline-'+Array.from((ss as CSSStyleSheet).cssRules||[]).length));

    // Compare sets
    const initialSet = new Set(initial);
    const newOnes = later.filter(l => !initialSet.has(l));

    // Allow 1 (some dev tools inject) but fail on 2+ new stylesheets
    expect(newOnes.length, `Unexpected late stylesheet injections: ${JSON.stringify(newOnes)}`).toBeLessThanOrEqual(1);
  });
});
