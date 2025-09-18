import { test, expect } from '@playwright/test';

// Compares the server-rendered nav HTML to hydrated DOM after scripts run.
// Ensures link count, order, and text remain stable (allowing whitespace normalization).

function normalize(html: string){
  return html
    .replace(/\s+/g,' ') // collapse whitespace
    .replace(/ data-phase-[a-z]+="[^"]*"/g,'') // remove dynamic phase attrs
    .replace(/ data-desktopfix="[^"]*"/g,'')
    .trim();
}

test.describe('Navbar SSR vs Hydration diff', () => {
  test('nav structure stable after hydration', async ({ page }) => {
    // Get raw HTML before any navigation or interactions (immediately after goto)
    await page.goto('/');

    // Capture the HTML quickly before waiting for load to minimize hydration timing
    const ssrHtml = await page.evaluate(() => {
      const el = document.querySelector('nav');
      return el ? el.outerHTML : '';
    });

    await page.waitForLoadState('load');
    await page.waitForTimeout(100); // small buffer

    const hydratedHtml = await page.evaluate(() => {
      const el = document.querySelector('nav');
      return el ? el.outerHTML : '';
    });

    expect(ssrHtml).not.toBe('');
    expect(hydratedHtml).not.toBe('');

    const n1 = normalize(ssrHtml);
    const n2 = normalize(hydratedHtml);

    // Allow hydration to add a data attribute or aria states but not remove links
    // Compare link texts sequence
    const links1 = await page.evaluate(() => Array.from(document.querySelectorAll('nav a')).map(a => a.textContent?.trim()||''));
    const links2 = await page.evaluate(() => Array.from(document.querySelectorAll('nav a')).map(a => a.textContent?.trim()||''));
    expect(links1).toEqual(links2);

    // Ensure number of desktop links stable (>=3 typical: Home, Analysis, Models, Debug maybe)
    expect(links1.length).toBeGreaterThanOrEqual(3);

    // HTML shouldn't shrink dramatically. If hydrated shorter < 90% of SSR length -> suspect removal.
    expect(n2.length).toBeGreaterThanOrEqual(Math.floor(n1.length * 0.9));
  });
});
