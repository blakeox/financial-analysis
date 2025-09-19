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

    const startUrl = page.url();

    for (let i=0;i<20;i++) { // 20 * 500ms = 10s
      // Guard against dev-server navigations or context reloads
      const currentUrl = page.url();
      expect(currentUrl).toBe(startUrl);
      if (await page.isClosed()) {
        throw new Error(`Page closed unexpectedly at iteration ${i}`);
      }
      const snapshot = await page.evaluate(() => {
        const navEl = document.getElementById('site-nav');
        if (!navEl) {
          return { count: -1, display: 'none', visibility: 'hidden', opacity: 0, box: null as DOMRect | null, dataset: null };
        }
        const links = navEl.querySelectorAll('.desktop-nav a');
        const cs = getComputedStyle(navEl);
        const box = navEl.getBoundingClientRect();
        return {
          count: links.length,
          display: cs.display,
          visibility: cs.visibility,
          opacity: parseFloat(cs.opacity || '1'),
          box: { width: box.width, height: box.height },
          dataset: { ...navEl.dataset },
        };
      });

      expect(snapshot.count, `Iteration ${i}: link count drifted ${JSON.stringify(snapshot.dataset)}`).toBe(initialCount);

      const box = snapshot.box;
      expect(box).toBeTruthy();
      if(box){
        expect(box.height).toBeGreaterThan(40);
        if(prevWidth !== undefined){
          expect(Math.abs(box.width - prevWidth)).toBeLessThan(40);
        }
        prevWidth = box.width;
        if(prevHeight !== undefined){
          expect(Math.abs(box.height - prevHeight)).toBeLessThan(30);
        }
        prevHeight = box.height;
      }

      expect(snapshot.display !== 'none' && snapshot.visibility !== 'hidden' && snapshot.opacity > 0.1, `Iteration ${i}: style hidden`).toBeTruthy();

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

      try {
        await sleep(500);
      } catch {
        // ignore sleep interruption
      }
    }
  });
});
