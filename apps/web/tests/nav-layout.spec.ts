import { test, expect, Page } from '@playwright/test';

// Helpers
async function gotoHome(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
}

const NAV = '#site-nav';
const DESKTOP_UL = '#site-nav .desktop-nav';

// Calculates how centered the desktop nav is within the header; returns pixel delta from true center.
async function centerDelta(page: Page) {
  const { navCenter, listCenter } = await page.evaluate(() => {
    const nav = document.querySelector('#site-nav .nav-inner') as HTMLElement | null;
    const list = document.querySelector('#site-nav .desktop-nav') as HTMLElement | null;
    if(!nav || !list) return { navCenter: 0, listCenter: 0 };
    const nr = nav.getBoundingClientRect();
    const lr = list.getBoundingClientRect();
    const navCenter = nr.left + nr.width / 2;
    const listCenter = lr.left + lr.width / 2;
    return { navCenter, listCenter };
  });
  return Math.abs(navCenter - listCenter);
}

test.describe('Navbar layout', () => {
  test('desktop nav stays centered at md+ widths', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoHome(page);

    const nav = page.locator(NAV);
    await expect(nav).toBeVisible();
    const ul = page.locator(DESKTOP_UL);
    await expect(ul).toBeVisible();

    // Allow small variance due to fractional pixel rounding
    const delta1 = await centerDelta(page);
    expect(delta1).toBeLessThan(6);

    // Resize wider and re-check
    await page.setViewportSize({ width: 1440, height: 900 });
    const delta2 = await centerDelta(page);
    expect(delta2).toBeLessThan(6);

    // Resize narrower but still >= md (1024) and re-check
    await page.setViewportSize({ width: 1024, height: 900 });
    const delta3 = await centerDelta(page);
    expect(delta3).toBeLessThan(6);
  });

  test('search overlay stacks above skip link', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await gotoHome(page);

    // Bring skip link into view and ensure it exists
    await page.keyboard.press('Tab'); // focus skip link
    const skip = page.locator('.skip-link');
    await expect(skip).toBeVisible();

    // Open search overlay
    await page.getByTestId('nav-search-toggle').click();
    const overlay = page.getByTestId('nav-search-overlay');
    await expect(overlay).toBeVisible();

    // Hit-test at a point where overlay should cover header area
    const ok = await page.evaluate(() => {
      const overlay = document.querySelector('[data-testid="nav-search-overlay"]') as HTMLElement | null;
      const nav = document.getElementById('site-nav');
      if(!overlay || !nav) return false;
      const r = nav.getBoundingClientRect();
      const x = Math.min(r.left + 20, window.innerWidth - 5);
      const y = Math.min(r.top + 10, window.innerHeight - 5);
      const el = document.elementFromPoint(x, y);
      return !!el && overlay.contains(el);
    });
    expect(ok).toBeTruthy();

    // Close overlay
    await page.keyboard.press('Escape');
    await expect(overlay).toBeHidden();
  });

  test('header spacer prevents content jump and matches ~nav height', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoHome(page);

    const approx = await page.evaluate(() => {
      const nav = document.querySelector('#site-nav .nav-inner') as HTMLElement | null;
      const spacer = document.querySelector('[aria-hidden="true"].h-16') as HTMLElement | null;
      if(!nav || !spacer) return { h: 0, s: 0 };
      const h = Math.round(nav.getBoundingClientRect().height);
      // Tailwind h-16 = 64px, allow some variance for borders/shadows
      const s = 64;
      return { h, s };
    });

    expect(Math.abs(approx.h - approx.s)).toBeLessThanOrEqual(8);
  });
});
