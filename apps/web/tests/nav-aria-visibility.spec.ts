import { test, expect } from '@playwright/test';

test.describe('Navbar accessibility styling', () => {
  test('sr-only helpers stay visually hidden', async ({ page }) => {
    await page.goto('/');

    const srOnlySnapshots = await page.evaluate(() => {
      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>('#site-nav .sr-only'),
      );

      return nodes.map(node => {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        return {
          clip: style.clip,
          clipPath: style.clipPath,
          position: style.position,
          overflow: style.overflow,
          width: rect.width,
          height: rect.height,
        };
      });
    });

    expect(srOnlySnapshots.length).toBeGreaterThan(0);
    for (const snap of srOnlySnapshots) {
      expect(snap.position).toBe('absolute');
      expect(snap.overflow).toBe('hidden');
      expect(snap.width).toBeLessThanOrEqual(1);
      expect(snap.height).toBeLessThanOrEqual(1);
      expect(
        snap.clipPath === 'inset(50%)' ||
          snap.clip === 'rect(0px, 0px, 0px, 0px)',
      ).toBeTruthy();
    }
  });

  test('nav guard never forces a desktop re-style', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3200);

    const guardFixes = await page.evaluate(() => {
      const logs = (window as typeof window & { ___navLogs?: Array<{ type?: string }> })
        .___navLogs || [];
      return logs.filter(entry => entry?.type === 'guard-fix');
    });

    expect.soft(guardFixes).toHaveLength(0);
  });
});
