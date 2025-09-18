import { Locator, Page, expect } from '@playwright/test';

export async function gotoPath(page: Page, path: string = '/') {
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
}

export function getNav(page: Page): Locator {
  return page.locator('#site-nav');
}

export async function waitForNavReady(page: Page) {
  const nav = getNav(page);
  await expect(nav).toBeVisible();
  // Ensure at least one desktop link exists (on desktop viewports)
  const vp = await page.viewportSize();
  if (vp && vp.width >= 768) {
    const cnt = await nav.locator('.desktop-nav a').count();
    expect(cnt).toBeGreaterThan(0);
  }
  await expect.poll(async () => {
    return page.evaluate(() => {
      const navEl = document.getElementById('site-nav');
      if (!navEl) return null;
      const { phaseInitial, phaseRaf, phaseLoad } = navEl.dataset as Record<string, string | undefined>;
      return phaseInitial && phaseRaf && phaseLoad ? true : false;
    });
  }).toBeTruthy();
  return nav;
}

export async function setViewportDesktop(page: Page) {
  await page.setViewportSize({ width: 1200, height: 800 });
}

export async function setViewportMobile(page: Page) {
  await page.setViewportSize({ width: 375, height: 740 });
}
