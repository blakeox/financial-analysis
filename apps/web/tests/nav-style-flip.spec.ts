import { test, expect } from '@playwright/test';

declare global {
  // Augment window for our test logging (Playwright eval context only)
  interface Window { __navDisplayLog?: Array<{ t: number; display: string }>; }
}

// Detect transient style flips where desktop nav display becomes none after being flex at desktop width.
// Captures a timeline of display values over ~3 seconds.

test.describe('Navbar style flip', () => {
  test('no flex->none regression on desktop width', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto('/');
    const nav = page.locator('#site-nav');
    await expect(nav).toBeVisible();

    // Inject observer to record display changes
    await page.addInitScript(() => {
      window.__navDisplayLog = [] as Array<{ t:number; display:string }>;
      window.addEventListener('DOMContentLoaded', () => {
        const el = document.querySelector('#site-nav .desktop-nav') as HTMLElement | null;
        if(!el) return;
  const rec = () => { if(!window.__navDisplayLog) return; window.__navDisplayLog.push({ t: performance.now(), display: getComputedStyle(el).display }); };
        rec();
        const obs = new MutationObserver(muts => {
          let relevant = false;
          for(const m of muts){
            if(m.type === 'attributes' && (m.attributeName === 'class' || m.attributeName === 'style')) relevant = true;
            if(m.type === 'childList') relevant = true;
          }
          if(relevant) rec();
        });
        obs.observe(el, { attributes:true, attributeFilter:['class','style'], subtree:false, childList:true });
        // periodic sample
        const interval = setInterval(rec, 250);
        setTimeout(()=> clearInterval(interval), 3200);
      });
    });

    await page.waitForTimeout(3400);

  const log = await page.evaluate(() => window.__navDisplayLog || []);
    expect(log.length).toBeGreaterThan(2);

    // Normalize sequence to changes only
    const changes: string[] = [];
    for(const entry of log){
      if(changes.length === 0 || changes[changes.length-1] !== entry.display){
        changes.push(entry.display);
      }
    }
    // Allow sequences like ['flex'] or ['flex','none'] only if width < 768 (not the case here)
    // Failing condition: we had flex then none while width >= 768.
    const hadFlex = changes.includes('flex');
    const hadNone = changes.includes('none');
    if(hadFlex && hadNone){
      throw new Error(`Desktop nav display flipped sequence: ${changes.join(' -> ')}`);
    }
  });
});
