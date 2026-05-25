import { expect, test } from '@playwright/test';

// Guards that Tailwind v4 global styles apply expected gradients and blur to the navbar.

test.describe('Navbar styling regression', () => {
  test('nav background and brand mark gradients render on first paint', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const navStyles = await page.evaluate(() => {
      const nav = document.querySelector('#site-nav.modern-nav');
      if (!nav) {
        return null;
      }
      const computed = getComputedStyle(nav as HTMLElement);
      return {
        backgroundImage: computed.backgroundImage,
        backdropFilter: computed.backdropFilter,
        webkitBackdropFilter: computed.getPropertyValue('-webkit-backdrop-filter'),
        borderBottomColor: computed.borderBottomColor,
      };
    });

    expect(navStyles).not.toBeNull();
    expect(navStyles?.backgroundImage ?? '').toContain('linear-gradient');

    const blurApplied = Boolean(
      navStyles?.backdropFilter?.includes('blur(14px)') ||
      navStyles?.webkitBackdropFilter?.includes('blur(14px)')
    );
    expect(blurApplied).toBeTruthy();
    const expectedBorders = ['rgba(0, 0, 0, 0.06)', 'rgba(255, 255, 255, 0.06)'];
    expect(expectedBorders).toContain(navStyles?.borderBottomColor ?? '');

    const brandStyles = await page.evaluate(() => {
      const mark = document.querySelector('#site-nav .fa-shell-brand-mark');
      if (!mark) {
        return null;
      }
      const computed = getComputedStyle(mark as HTMLElement);
      return {
        backgroundImage: computed.backgroundImage,
        color: computed.color,
      };
    });

    expect(brandStyles).not.toBeNull();
    expect(brandStyles?.backgroundImage ?? '').toContain('linear-gradient');
    expect(brandStyles?.color).toBe('rgb(255, 255, 255)');
  });

  test('no inline <style> tags remain inside navbar shell', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const inlineStyleCount = await page.evaluate(() => {
      const nav = document.getElementById('site-nav');
      if (!nav) {
        return -1;
      }
      return nav.querySelectorAll('style, [style]').length;
    });

    expect(inlineStyleCount).toBe(0);
  });
});
