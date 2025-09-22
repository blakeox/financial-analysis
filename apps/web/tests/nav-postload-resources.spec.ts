import { test } from '@playwright/test';

// Track new link[rel=stylesheet] or style elements added after load that could affect nav.

test.describe('Navbar post-load resource additions', () => {
  test('limited new style resources after 4s', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    const initial = await page.evaluate(() => ({
      links: Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l=>l.getAttribute('href')||'inline'),
      inlineCount: document.querySelectorAll('style').length
    }));

    await page.waitForTimeout(4000);
    const later = await page.evaluate(() => ({
      links: Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l=>l.getAttribute('href')||'inline'),
      inlineCount: document.querySelectorAll('style').length
    }));

    const newLinks = later.links.filter(l => !initial.links.includes(l));
    const inlineDelta = later.inlineCount - initial.inlineCount;

    // Allow up to 1 new link and 1 inline style (dev tools or HMR). More indicates external injection.
    const ok = newLinks.length <= 1 && inlineDelta <= 1;
    if(!ok){
      throw new Error(`Excessive style resource injection: newLinks=${JSON.stringify(newLinks)} inlineDelta=${inlineDelta}`);
    }
  });
});
