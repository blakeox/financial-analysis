import { test, expect } from '@playwright/test';

// Uses data-phase* attributes set by instrumentation in the navbar to ensure stability.

function parsePhase(v?: string){
  if(!v) return { desktop:0, mobile:0, html:0 };
  const [d,m,h] = v.split('|').map(n=>parseInt(n,10)||0);
  return { desktop:d, mobile:m, html:h };
}

test.describe('Navbar structural snapshots', () => {
  test('phases are recorded and stable', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('#site-nav');
    await expect(nav).toBeVisible();

    // Wait enough time for T2000 phase to be recorded
    await page.waitForTimeout(2300);

    const data = await nav.evaluate(el => ({
      Initial: el.getAttribute('data-phase-initial'),
      Raf: el.getAttribute('data-phase-raf'),
      Load: el.getAttribute('data-phase-load'),
      T2000: el.getAttribute('data-phase-t2000')
    } as Record<string, string | null>));

    // Ensure all phases exist
    for(const k of Object.keys(data)){
      expect(data[k], `Missing snapshot phase ${k}`).toBeTruthy();
    }
    const phases = Object.fromEntries(Object.entries(data).map(([k,v])=>[k, parsePhase(v||undefined)]));

    // Desktop links should be non-zero for all phases (if viewport >= md) or zero consistently
    const desktopCounts = Object.values(phases).map(p=>p.desktop);
    const anyDesktop = desktopCounts.some(c=>c>0);
    if(anyDesktop){
      desktopCounts.forEach((c,i)=> expect(c, `Phase ${Object.keys(phases)[i]} lost desktop links`).toBeGreaterThan(0));
    }

    // Mobile counts should be stable (allowing they might be 0 if no links configured)
    const mobileCounts = Object.values(phases).map(p=>p.mobile);
    const uniqueMobile = new Set(mobileCounts);
    expect(uniqueMobile.size <= 2).toBeTruthy(); // tolerate one change but not oscillation

    // HTML length should not collapse to near-zero after initial phases
    const htmlLengths = Object.values(phases).map(p=>p.html);
    const minHtml = Math.min(...htmlLengths);
    const maxHtml = Math.max(...htmlLengths);
    expect(minHtml).toBeGreaterThan(200); // arbitrary floor for structural content
    expect(maxHtml - minHtml).toBeLessThan(8000); // guard against total replacement/injection explosion
  });
});
