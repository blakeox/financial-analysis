import { test, expect } from '@playwright/test';

test.describe('Navbar hit-test & overlay guard', () => {
  test('nav remains topmost interactable element', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    const nav = page.locator('#site-nav');
    await expect(nav).toBeVisible();

    const isTop = await page.evaluate(() => {
      const nav = document.getElementById('site-nav');
      if(!nav) return false;
      const r = nav.getBoundingClientRect();
      const y = r.top + (r.height/2);
      const target = document.elementFromPoint(r.left + 10, y);
      return !!target && nav.contains(target);
    });
    expect(isTop).toBeTruthy();
  });
});
