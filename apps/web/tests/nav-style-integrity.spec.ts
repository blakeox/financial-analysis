import { test, expect } from '@playwright/test';

// Ensure key visual styles (background gradient/backdrop blur) persist and do not vanish post load.

interface StyleSample { t:number; background:string; backdrop:string; shadow:string; }

test.describe('Navbar style integrity', () => {
  test('visual styling persists for 5s', async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 820 });
    await page.goto('/');
    const nav = page.locator('#site-nav');
    await expect(nav).toBeVisible();

    const samples: StyleSample[] = [];
    for(let i=0;i<21;i++){ // ~5s (250ms * 20)
      const s = await nav.evaluate(el => {
        const cs = getComputedStyle(el as HTMLElement);
        return { background: cs.background || cs.backgroundImage || '', backdrop: (cs as any).backdropFilter || '', shadow: cs.boxShadow || '' };
      });
      samples.push({ t: i*250, background: s.background, backdrop: s.backdrop, shadow: s.shadow });
      await page.waitForTimeout(250);
    }

    // At least one sample should show our gradient (linear-gradient) or rgba with blur present
    const anyGradient = samples.some(s => /linear-gradient/i.test(s.background));
    expect(anyGradient, 'No gradient background detected').toBeTruthy();

    // Backdrop blur should appear in at least 50% of samples (if browser supports it)
    const blurCount = samples.filter(s => /blur\(/i.test(s.backdrop)).length;
    expect(blurCount >= Math.floor(samples.length/2)).toBeTruthy();

    // The background should not degrade to fully transparent with no gradient for > 1 consecutive second
    let transparentRun = 0; let maxTransparentRun = 0;
    for(const s of samples){
      const bare = !/linear-gradient/i.test(s.background) && /rgba\(0, 0, 0, 0\)/.test(s.background);
      if(bare) { transparentRun += 1; } else { if(transparentRun > maxTransparentRun) maxTransparentRun = transparentRun; transparentRun = 0; }
    }
    if(transparentRun > maxTransparentRun) maxTransparentRun = transparentRun;
    // Each increment ~250ms, so >4 implies >1s
    expect(maxTransparentRun <= 4, `Background lost for ${(maxTransparentRun*250)}ms window`).toBeTruthy();
  });
});
