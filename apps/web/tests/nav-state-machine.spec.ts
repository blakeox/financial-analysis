import { test, expect } from '@playwright/test';
import {
  gotoPath,
  setViewportDesktop,
  setViewportMobile,
  waitForNavReady,
} from './utils/nav';

const OVERLAY = '[data-testid="nav-search-overlay"]';
const SEARCH_TOGGLE = '[data-testid="nav-search-toggle"]';
const MOBILE_TOGGLE = '[data-testid="nav-mobile-toggle"]';
const MOBILE_PANEL = '[data-testid="nav-mobile-panel"]';
const THEME_TOGGLE = '[data-testid="nav-theme-toggle"]';

async function pollBodyOverflow(page: Parameters<typeof test>[0]['page']) {
  return page.evaluate(() => document.body.style.overflow || '');
}

test.describe('Navbar state machine', () => {
  test('search overlay locks and unlocks body scroll', async ({ page }) => {
    await setViewportDesktop(page);
    await gotoPath(page, '/');
    await waitForNavReady(page);

    await expect(await pollBodyOverflow(page)).toBe('');

    await page.click(SEARCH_TOGGLE);
    await expect(page.locator(OVERLAY)).toBeVisible();
    await expect.poll(() => pollBodyOverflow(page)).toBe('hidden');

    await page.keyboard.press('Escape');
    await expect(page.locator(OVERLAY)).toBeHidden();
    await expect.poll(() => pollBodyOverflow(page)).toBe('');
  });

  test('closing search overlay restores previous focus target', async ({ page }) => {
    await setViewportDesktop(page);
    await gotoPath(page, '/');
    await waitForNavReady(page);

    const searchToggle = page.locator(SEARCH_TOGGLE);
    await searchToggle.focus();
    await expect(searchToggle).toBeFocused();

    await page.click(SEARCH_TOGGLE);
    await expect(page.locator('#search-input')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(page.locator(OVERLAY)).toBeHidden();
    await expect(searchToggle).toBeFocused();
  });

  test('mobile menu scroll lock and cleanup', async ({ page }) => {
    await setViewportMobile(page);
    await gotoPath(page, '/');
    await waitForNavReady(page);

    await expect(await pollBodyOverflow(page)).toBe('');
    const toggle = page.locator(MOBILE_TOGGLE);
    const panel = page.locator(MOBILE_PANEL);

    await toggle.click();
    await expect(panel).toHaveAttribute('class', /opacity-100/);
    await expect.poll(() => pollBodyOverflow(page)).toBe('hidden');

    await toggle.click();
    await expect(panel).toHaveAttribute('class', /opacity-0/);
    await expect.poll(() => pollBodyOverflow(page)).toBe('');
  });

  test('instrumentation phases stay stable and no guard fixes fire', async ({ page }) => {
    await setViewportDesktop(page);
    await gotoPath(page, '/');
    await waitForNavReady(page);

    const datasetInitial = await page.evaluate(() => {
      const nav = document.getElementById('site-nav');
      if (!nav) return null;
      return { ...nav.dataset };
    });

    expect(datasetInitial).not.toBeNull();
    expect(datasetInitial?.phaseInitial).toMatch(/^\d+\|\d+\|\d+\|/);
    expect(datasetInitial?.phaseRaf).toMatch(/^\d+\|\d+\|\d+\|/);
    expect(datasetInitial?.phaseLoad).toMatch(/^\d+\|\d+\|\d+\|/);
    expect(datasetInitial?.desktopFix).toBeUndefined();

    // Wait for T2000 capture to run and ensure value matches load snapshot
    await page.waitForTimeout(2200);
    const datasetLater = await page.evaluate(() => {
      const nav = document.getElementById('site-nav');
      if (!nav) return null;
      return { ...nav.dataset };
    });

    expect(datasetLater?.phaseT2000).toMatch(/^\d+\|\d+\|\d+\|/);
    expect(datasetLater?.desktopFix).toBeUndefined();

    const guardFixes = await page.evaluate(() => {
      const logs = (window as typeof window & { ___navLogs?: Array<{ type?: string }> }).___navLogs || [];
      return logs.filter((entry) => entry?.type === 'guard-fix');
    });
    expect(guardFixes).toHaveLength(0);
  });
});
