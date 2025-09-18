import { test, expect } from '@playwright/test';

// Long-run poll (~10s) to detect delayed disappearance or layout mutation.
// Captures link count, nav height, bounding box, display style each interval.

async function sleep(ms:number){ return new Promise(r=>setTimeout(r, ms)); }

test.describe('Navbar long-run stability', () => {
  test('desktop links + structure stable over 10s', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    const nav = page.locator('#site-nav');
    await expect(nav).toBeVisible();

    const initialCount = await nav.locator('.desktop-nav a').count();
    // If initial desktop is zero (small config) skip with soft assertion.
    if(initialCount === 0){ test.skip(); }

    let prevHeight:number|undefined;
    let prevWidth:number|undefined;

    for (let i=0;i<20;i++) { // 20 * 500ms = 10s
      const count = await nav.locator('.desktop-nav a').count();
      expect(count, `Iteration ${i}: link count drifted`).toBe(initialCount);

      const box = await nav.boundingBox();
      expect(box).toBeTruthy();
      if(box){
        // Height should not collapse below 40px (approx nav inner collapse)
        expect(box.height).toBeGreaterThan(40);
        // Width should stay near viewport width (allow some scroll bar variation)
        if(prevWidth !== undefined){
          expect(Math.abs(box.width - prevWidth)).toBeLessThan(40); // tolerance
        }
        prevWidth = box.width;
        if(prevHeight !== undefined){
          expect(Math.abs(box.height - prevHeight)).toBeLessThan(30); // avoid sudden shrink
        }
        prevHeight = box.height;
      }

      // Style checks executed in the page context
      const styleOk = await nav.evaluate(el => {
        const cs = getComputedStyle(el);
        return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity || '1') > 0.1;
      });
      expect(styleOk, `Iteration ${i}: style hidden`).toBeTruthy();

      // Hit-test: ensure a point near center top gives nav or descendant
      const hitOk = await page.evaluate(() => {
        const el = document.getElementById('site-nav');
        if(!el) return false;
        const r = el.getBoundingClientRect();
        const testX = Math.min(r.left + 20, window.innerWidth - 5);
        const testY = Math.min(r.top + r.height/2, window.innerHeight - 5);
        const target = document.elementFromPoint(testX, testY);
        return !!target && el.contains(target);
      });
      expect(hitOk, `Iteration ${i}: hit test failed`).toBeTruthy();

      await sleep(500);
    }
  });
});
