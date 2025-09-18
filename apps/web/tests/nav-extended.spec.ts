import { test, expect } from '@playwright/test';
import { gotoPath, waitForNavReady } from './utils/nav';

// Extended behavioral tests to catch conditions leading to nav disappearance.

const HOME = '/';

async function wait(ms:number){ return new Promise(r=>setTimeout(r, ms)); }

test.describe('ModernNavBar extended', () => {
  test('desktop links remain present for 5s and brand visible', async ({ page }) => {
    await gotoPath(page, HOME);
    const nav = page.locator('#site-nav');
    await expect(nav).toBeVisible();
    const brand = nav.locator('text=Financial Analysis');
    await expect(brand).toBeVisible();

    // Collect link texts (desktop + maybe mobile hidden) at start
    const initialLinks = await nav.locator('.desktop-nav a').allInnerTexts();
    expect(initialLinks.length).toBeGreaterThan(0);

    // Poll every 500ms for 5s to ensure links don't disappear
    for (let i=0;i<10;i++) {
      await wait(500);
      const still = await nav.locator('.desktop-nav a').count();
      expect(still, `Desktop link count changed at iteration ${i}`).toBe(initialLinks.length);
      await expect(nav).toBeVisible();
    }
  });

  test('mobile menu toggles and closes after selecting link', async ({ page }) => {
    await page.setViewportSize({ width: 460, height: 900 });
    await gotoPath(page, HOME);
    const toggle = page.locator('#nav-toggle');
    await expect(toggle).toBeVisible();
    await toggle.click();
    const panel = page.locator('#mobile-nav-panel');
    await expect(panel).toHaveClass(/opacity-100/);
    const firstMobileLink = panel.locator('[data-mobile-link]').first();
    await firstMobileLink.click();
    await expect(panel).not.toHaveClass(/opacity-100/);
  });

  test('search overlay opens via button and Cmd/Ctrl+K then closes on Esc', async ({ page }) => {
    await gotoPath(page, HOME);
    const openBtn = page.locator('#search-toggle');
    await openBtn.click();
    const overlay = page.locator('#search-overlay');
    await expect(overlay).toHaveClass(/flex/);
    // Close with Esc
    await page.keyboard.press('Escape');
    await expect(overlay).toHaveClass(/hidden/);

    // Reopen via shortcut
    const isMac = process.platform === 'darwin';
    if (isMac) {
      await page.keyboard.press('Meta+KeyK');
    } else {
      await page.keyboard.press('Control+KeyK');
    }
    await expect(overlay).toHaveClass(/flex/);
    await page.keyboard.press('Escape');
    await expect(overlay).toHaveClass(/hidden/);
  });

  test('theme toggle persists across reload', async ({ page }) => {
    await gotoPath(page, HOME);
    const btn = page.locator('#theme-toggle');
    await expect(btn).toBeVisible();
    const html = page.locator('html');
    const hadDarkInitially = await html.evaluate((el) => el.classList.contains('dark'));

    await btn.click();
    await page.waitForTimeout(150);
    const afterClick = await html.evaluate((el) => el.classList.contains('dark'));
    expect(afterClick).not.toBe(hadDarkInitially);

    // reload
    await page.reload();
    await page.waitForTimeout(50);
    await waitForNavReady(page);
    const afterReload = await html.evaluate((el) => el.classList.contains('dark'));
    expect(afterReload).toBe(afterClick);
  });

  test('no unexpected removal of nav subtree (MutationObserver simulation)', async ({ page }) => {
    await gotoPath(page, HOME);
    // Inject a small script to record element removal counts for nav with typed window augmentation
    await page.addInitScript(() => {
      interface NavDebugWindow extends Window { __navRemovals?: number; __navMO?: MutationObserver }
      const w = window as unknown as NavDebugWindow;
      const nav = document.getElementById('site-nav');
      if(!nav) return;
      w.__navRemovals = 0;
      const mo = new MutationObserver(muts => {
        muts.forEach(m => {
          m.removedNodes.forEach(n => { if(n instanceof HTMLElement && nav.contains(n)) { if(typeof w.__navRemovals === 'number') w.__navRemovals++; } });
        });
      });
      mo.observe(nav, { subtree:true, childList:true });
      w.__navMO = mo;
    });
    // Wait some time letting site load fully
    await page.waitForTimeout(4000);
    const removals = await page.evaluate(() => {
      return (window as { __navRemovals?: number }).__navRemovals ?? 0;
    });
    expect(removals).toBe(0);
  });
});
