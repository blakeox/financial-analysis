import { test, expect } from '@playwright/test';
import { gotoPath, setViewportDesktop, waitForNavReady } from './utils/nav';

const NAV_ROOT = '#site-nav';

async function sampleNavComputed(page: Parameters<typeof test>[0]['page']) {
  return page.evaluate((selector) => {
    const nav = document.querySelector(selector) as HTMLElement | null;
    if (!nav) return null;
    const style = getComputedStyle(nav);
    return {
      backgroundImage: style.backgroundImage,
      backdropFilter: style.backdropFilter,
      webkitBackdropFilter: (style as any).webkitBackdropFilter,
      borderBottomColor: style.borderBottomColor,
      boxShadow: style.boxShadow,
    };
  }, NAV_ROOT);
}

test.describe('Navbar advanced appearance', () => {
  test('gradient/backdrop respond to theme changes', async ({ page }) => {
    await setViewportDesktop(page);
    await gotoPath(page, '/');
    await waitForNavReady(page);

    const wasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    const initialStyle = await sampleNavComputed(page);
    expect(initialStyle?.backgroundImage).toContain('linear-gradient');

    await page.click('[data-testid="nav-theme-toggle"]');
    await waitForNavReady(page);

    const isNowDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isNowDark).toBe(!wasDark);

    const toggledStyle = await sampleNavComputed(page);
    expect(toggledStyle?.backgroundImage).toContain('linear-gradient');
    expect(toggledStyle?.backgroundImage).not.toBe(initialStyle?.backgroundImage);

    const blurSource = toggledStyle?.backdropFilter || toggledStyle?.webkitBackdropFilter;
    expect(blurSource).toMatch(/blur\(/);
    expect(blurSource).toMatch(/saturate\(/);
  });

  test('scroll elevation applies box shadow and height change', async ({ page }) => {
    await setViewportDesktop(page);
    await gotoPath(page, '/');
    await waitForNavReady(page);

    const before = await sampleNavComputed(page);
    expect(before?.boxShadow === '' || before?.boxShadow === 'none').toBeTruthy();

    const beforeHeight = await page.evaluate(() => {
      const nav = document.querySelector('#site-nav .nav-inner') as HTMLElement | null;
      return nav ? nav.getBoundingClientRect().height : 0;
    });

    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(250);

    const after = await sampleNavComputed(page);
    expect(after?.boxShadow).toMatch(/rgba\(/);

    const afterHeight = await page.evaluate(() => {
      const nav = document.querySelector('#site-nav .nav-inner') as HTMLElement | null;
      return nav ? nav.getBoundingClientRect().height : 0;
    });

    expect(Math.round(afterHeight)).toBeLessThan(Math.round(beforeHeight));

    await page.evaluate(() => window.scrollTo(0, 0));
  });

  test('active link underline and hover states render gradients', async ({ page }) => {
    await setViewportDesktop(page);
    await gotoPath(page, '/');
    await waitForNavReady(page);

    const activeAfter = await page.evaluate(() => {
      const active = document.querySelector('#site-nav .desktop-nav a.active') as HTMLElement | null;
      if (!active) return null;
      const underline = getComputedStyle(active, '::after');
      return {
        backgroundImage: underline.backgroundImage,
        height: underline.height,
        opacity: underline.opacity,
      };
    });
    expect(activeAfter?.backgroundImage).toContain('linear-gradient');
    expect(activeAfter?.height).toBe('2px');
    expect(activeAfter?.opacity).toBe('1');

    const inactiveLink = page.locator('#site-nav .desktop-nav li:nth-of-type(2) a');
    await inactiveLink.hover();
    await page.waitForTimeout(150);
    const hoverAfter = await page.evaluate(() => {
      const target = document.querySelector('#site-nav .desktop-nav li:nth-of-type(2) a') as HTMLElement | null;
      if (!target) return null;
      const underline = getComputedStyle(target, '::after');
      return { opacity: underline.opacity, backgroundImage: underline.backgroundImage };
    });
    expect(hoverAfter).not.toBeNull();
    expect(Number(hoverAfter?.opacity)).toBeGreaterThan(0);
    expect(hoverAfter?.backgroundImage).toContain('linear-gradient');
  });

  test('appearance persists after route navigation', async ({ page }) => {
    await setViewportDesktop(page);
    await gotoPath(page, '/');
    await waitForNavReady(page);

    const preNavigation = await sampleNavComputed(page);
    expect(preNavigation?.backgroundImage).toContain('linear-gradient');

    await page.click('#site-nav .desktop-nav a:has-text("Models")');
    await page.waitForLoadState('networkidle');
    await waitForNavReady(page);

    const postNavigation = await sampleNavComputed(page);
    expect(postNavigation?.backgroundImage).toContain('linear-gradient');
    expect(postNavigation?.backgroundImage).toMatch(/(17, ?24, ?39)|(255, ?255, ?255)/);

    const guardFixes = await page.evaluate(() => {
      const logs = (window as typeof window & { ___navLogs?: Array<{ type?: string }> }).___navLogs || [];
      return logs.filter((entry) => entry?.type === 'guard-fix');
    });
    expect(guardFixes).toHaveLength(0);

    const navClassPersisted = await page.evaluate(() => {
      const nav = document.getElementById('site-nav');
      return nav?.className || '';
    });
    expect(navClassPersisted).toContain('modern-nav');
  });
});
