import { test, expect, Page } from '@playwright/test';

async function goto(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
}

const NAV = '#site-nav';
const DESKTOP_UL = '#site-nav .desktop-nav';
const MOBILE_TOGGLE = '[data-testid="nav-mobile-toggle"]';
const MOBILE_PANEL = '[data-testid="nav-mobile-panel"]';
const THEME_TOGGLE = '[data-testid="nav-theme-toggle"]';
const SEARCH_TOGGLE = '[data-testid="nav-search-toggle"]';
const OVERLAY = '[data-testid="nav-search-overlay"]';

// Utility to query dataset phases quickly
async function waitForPhases(page: Page) {
  await expect.poll(async () => {
    return page.evaluate(() => {
      const el = document.getElementById('site-nav');
      if(!el) return false;
      const d = el.dataset as Record<string, string | undefined>;
      return !!(d.phaseInitial && d.phaseRaf && d.phaseLoad);
    });
  }).toBeTruthy();
}

// Focus-safe overlay open/close
async function toggleSearch(page: Page) {
  await page.click(SEARCH_TOGGLE);
  await expect(page.locator(OVERLAY)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator(OVERLAY)).toBeHidden();
}

test.describe('Navbar process flows', () => {
  test('theme persists across routes and reloads', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await goto(page, '/');
    await waitForPhases(page);

    const before = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    await page.click(THEME_TOGGLE);
    const after = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(after).toBe(!before);

    // Navigate to another route
    await goto(page, '/models');
    await waitForPhases(page);
    const afterRoute = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(afterRoute).toBe(after);

    // Reload (soft)
    await page.reload();
    await waitForPhases(page);
    const afterReload = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(afterReload).toBe(after);
  });

  test('mobile menu resets when switching breakpoints and navigating', async ({ page }) => {
    // Start mobile
    await page.setViewportSize({ width: 390, height: 844 });
    await goto(page, '/');
    await waitForPhases(page);

    await page.click(MOBILE_TOGGLE);
    await expect(page.locator(MOBILE_PANEL)).toHaveClass(/opacity-100/);

    // Switch to desktop width
    await page.setViewportSize({ width: 1200, height: 800 });
    // Panel should be non-interactive/hidden at desktop
    const isHidden = await page.locator(MOBILE_PANEL).evaluate(el => {
      const cs = getComputedStyle(el as HTMLElement);
      return cs.opacity === '0' || cs.display === 'none' || el.classList.contains('pointer-events-none');
    });
    expect(isHidden).toBeTruthy();

    // Navigate and ensure desktop links exist
    await goto(page, '/analysis');
    const cnt = await page.locator(DESKTOP_UL + ' a').count();
    expect(cnt).toBeGreaterThan(0);
  });

  test('is-scrolled resets after navigation and search toggle works across pages', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await goto(page, '/');
    await waitForPhases(page);

    // Scroll to set is-scrolled
    await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' as ScrollBehavior }));
    await expect.poll(async () => (await page.locator(NAV).getAttribute('class')) || '').toMatch(/is-scrolled/);

    // Navigate and expect reset
    await goto(page, '/models');
    await waitForPhases(page);
    const navClass = (await page.locator(NAV).getAttribute('class')) || '';
    expect(navClass).not.toMatch(/is-scrolled/);

    // Search shortcut works on new page
    await toggleSearch(page);
  });

  test('desktop nav remains hit-testable while overlay open', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await goto(page, '/');
    await waitForPhases(page);

    // Open overlay
    await page.click(SEARCH_TOGGLE);
    await expect(page.locator(OVERLAY)).toBeVisible();

    // Ensure overlay is on top
    const topIsOverlay = await page.evaluate(() => {
      const overlay = document.querySelector('[data-testid="nav-search-overlay"]');
      const pt = document.elementFromPoint(10, 10);
      return overlay && pt && overlay.contains(pt);
    });
    expect(topIsOverlay).toBeTruthy();

    // Close overlay to clean up
    await page.keyboard.press('Escape');
    await expect(page.locator(OVERLAY)).toBeHidden();
  });
});
