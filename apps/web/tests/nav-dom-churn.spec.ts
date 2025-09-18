import { test, expect } from '@playwright/test';

// Detect rapid structural churn suggesting two competing renders replacing the nav content.
// Measures innerHTML length over a sampling window and counts large deltas.

test.describe('Navbar DOM churn', () => {
  test('no excessive large innerHTML oscillations', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('#site-nav');
    await expect(nav).toBeVisible();

    // Sample every 150ms for 2.5s
    const samples: Array<{t:number,len:number}> = [];
    for(let i=0;i<17;i++) { // ~2.55s
      const len = await nav.evaluate(el => (el as HTMLElement).innerHTML.length);
      samples.push({ t: performance.now(), len });
      await page.waitForTimeout(150);
    }

    // Compute large swings (delta > 2500 chars) which indicate almost full subtree replacement
    let largeSwings = 0;
    for(let i=1;i<samples.length;i++){
      if(Math.abs(samples[i].len - samples[i-1].len) > 2500) largeSwings++;
    }

    // Allow at most 1 big swing (e.g., initial hydration), more implies dueling renders.
    expect(largeSwings, `Excessive nav DOM replacement swings detected: ${largeSwings}`).toBeLessThanOrEqual(1);
  });
});
