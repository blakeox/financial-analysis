import { test, expect } from '@playwright/test';

// Observes the parent of #site-nav for node removal/replacement of the nav element itself.

test.describe('Navbar element mutation guard', () => {
  test('nav element not removed or replaced during first 5s', async ({ page }) => {
    await page.addInitScript(() => {
      interface NavElementTrackerWindow extends Window { __navElementTracker?: { removed:boolean; replaced:boolean } }
      const w = window as unknown as NavElementTrackerWindow;
      const tracker = { removed:false, replaced:false };
      w.__navElementTracker = tracker;
      window.addEventListener('DOMContentLoaded', () => {
        const nav = document.getElementById('site-nav');
        if(!nav) return; const parent = nav.parentElement; if(!parent) return;
        const mo = new MutationObserver(muts => {
          muts.forEach(m => {
            if(Array.from(m.removedNodes).includes(nav)) tracker.removed = true;
            if(Array.from(m.addedNodes).some(n => n instanceof HTMLElement && n.id === 'site-nav' && n !== nav)) tracker.replaced = true;
          });
        });
        mo.observe(parent, { childList:true });
      });
    });
    await page.goto('/');
    await page.waitForTimeout(5200);
    const tracker = await page.evaluate(() => {
      return (window as unknown as { __navElementTracker?: { removed:boolean; replaced:boolean } }).__navElementTracker || { removed:false, replaced:false };
    });
    expect(tracker.removed, 'Nav element removed from DOM').toBeFalsy();
    expect(tracker.replaced, 'Nav element replaced by a different node').toBeFalsy();
  });
});
