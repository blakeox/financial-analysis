import { expect, test } from '@playwright/test';

// Utilities to sample frequently for a short window and detect instability.
async function sample<T>(fn: () => Promise<T> | T, ms: number, duration: number): Promise<T[]> {
  const samples: T[] = [];
  const start = Date.now();
  while (Date.now() - start < duration) {
    try {
      // tolerate occasional navigation/context-destroyed errors
      const v = await fn();
      samples.push(v);
    } catch {
      // swallow and continue sampling
    }
    await new Promise((r) => setTimeout(r, ms));
  }
  return samples;
}

test.describe('Navbar flicker detection', () => {
  test('no display/visibility flicker on first paint and idle', async ({ page }) => {
    await page.goto('/');

    const nav = page.locator('#site-nav');
    await expect(nav).toBeVisible();

    // Sample computed styles for a short period after load
    const displays = await sample(async () => {
      return page.evaluate(() => getComputedStyle(document.querySelector('#site-nav .desktop-nav') as HTMLElement)?.display);
    }, 25, 1500);

    const visibilities = await sample(async () => {
      return page.evaluate(() => getComputedStyle(document.querySelector('#site-nav') as HTMLElement)?.visibility);
    }, 25, 1500);

    // Ensure desktop nav is consistently flex and nav is visible
    expect(new Set(displays)).toEqual(new Set(['flex']));
    expect(new Set(visibilities)).toEqual(new Set(['visible']));
  });

  test('no class churn on nav root and desktop nav', async ({ page }) => {
    await page.goto('/');

    // Poll className instead of MutationObserver to avoid context-destroyed on nav
    const rootSamples = await sample(async () => {
      return page.evaluate(() => (document.getElementById('site-nav') as HTMLElement | null)?.className || '');
    }, 50, 2000);
    const desktopSamples = await sample(async () => {
      return page.evaluate(() => (document.querySelector('#site-nav .desktop-nav') as HTMLElement | null)?.className || '');
    }, 50, 2000);

    const rootUnique = Array.from(new Set(rootSamples)).filter(Boolean);
    const desktopUnique = Array.from(new Set(desktopSamples)).filter(Boolean);

    // Allow limited churn: initial + at most 2 transitions (elevation/sticky, data-ready)
    expect(rootUnique.length).toBeLessThanOrEqual(3);
    expect(desktopUnique.length).toBeLessThanOrEqual(2);
  });

  test('no style injection regression (stylesheet inventory)', async ({ page }) => {
    await page.goto('/');

    // Ensure at least one inline stylesheet exists and contains .desktop-nav rules
    const inventory = await page.evaluate(() => {
      const result: { inlineSheets: number; desktopNavRuleSheets: number; totalHits: number } = {
        inlineSheets: 0,
        desktopNavRuleSheets: 0,
        totalHits: 0,
      };
      const sheets = Array.from(document.styleSheets);
      for (const ss of sheets) {
        if (!ss.href) result.inlineSheets += 1;
        try {
          const rules = Array.from((ss as CSSStyleSheet).cssRules || []);
          const hits = rules.filter((r) => (r as CSSStyleRule).selectorText?.includes('.desktop-nav')) as CSSStyleRule[];
          if (hits.length > 0) result.desktopNavRuleSheets += 1;
          result.totalHits += hits.length;
        } catch {
          // ignore cross-origin
        }
      }
      return result;
    });

    expect(inventory.inlineSheets).toBeGreaterThan(0);
    expect(inventory.desktopNavRuleSheets).toBeGreaterThan(0);
    expect(inventory.totalHits).toBeGreaterThan(0);
  });

  test('no flicker during navigation and font-settle', async ({ page }) => {
    await page.goto('/');

    // Track layout rect of the nav wrapper while navigating between pages
    const rectsHome = await sample(async () => {
      return page.evaluate(() => (document.querySelector('#site-nav') as HTMLElement).getBoundingClientRect().toJSON());
    }, 20, 500);

    // Navigate to models, then back
    await page.click('#site-nav .desktop-nav a:has-text("Models")');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');

    const rectsModels = await sample(async () => {
      return page.evaluate(() => (document.querySelector('#site-nav') as HTMLElement).getBoundingClientRect().toJSON());
    }, 20, 500);

    await page.goBack();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');

    const rectsBack = await sample(async () => {
      return page.evaluate(() => (document.querySelector('#site-nav') as HTMLElement).getBoundingClientRect().toJSON());
    }, 20, 500);

    // The height should remain constant across samples (no collapse/expand flicker)
    type Rect = { x: number; y: number; width: number; height: number; top: number; right: number; bottom: number; left: number };
    const heights = [...(rectsHome as Rect[]), ...(rectsModels as Rect[]), ...(rectsBack as Rect[])]
      .map((r) => Math.round(r.height));
    const uniqueHeights = Array.from(new Set(heights));
    expect(uniqueHeights.length).toBe(1);
  });
});
