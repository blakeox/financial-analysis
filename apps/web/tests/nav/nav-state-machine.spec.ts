import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { gotoPath, setViewportDesktop, setViewportMobile, waitForNavReady } from '../_shared/nav';

const OVERLAY = '[data-testid="nav-search-overlay"]';
const SEARCH_TOGGLE = '[data-testid="nav-search-toggle"]';
const MOBILE_TOGGLE = '[data-testid="nav-mobile-toggle"]';
const MOBILE_PANEL = '[data-testid="nav-mobile-panel"]';

async function pollBodyOverflow(page: Page) {
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
});
