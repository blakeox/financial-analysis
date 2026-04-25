import { expect, test } from '@playwright/test';
import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Helper to sample a function repeatedly
async function sample<T>(fn: () => Promise<T> | T, ms: number, duration: number): Promise<T[]> {
  const samples: T[] = [];
  const start = Date.now();
  while (Date.now() - start < duration) {
    samples.push(await fn());
    await new Promise((r) => setTimeout(r, ms));
  }
  return samples;
}

// This test requires the dev server with HMR. Skip in preview/CI runs.
const DEV = process.env.PLAYWRIGHT_DEV === '1' || process.env.HMR === '1';

test.describe('Navbar dev HMR stability', () => {
  test.skip(
    !DEV,
    'HMR test requires dev server. Run: PLAYWRIGHT_DEV=1 pnpm --filter @financial-analysis/web test:e2e:dev'
  );
  test('no flicker during HMR CSS change', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#site-nav')).toBeVisible();

    // Sample baseline display/visibility before HMR
    const before = await sample(
      async () => {
        return page.evaluate(() => ({
          display: getComputedStyle(document.querySelector('#site-nav .desktop-nav') as HTMLElement)
            .display,
          visibility: getComputedStyle(document.querySelector('#site-nav') as HTMLElement)
            .visibility,
        }));
      },
      25,
      500
    );

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    // tests/nav -> apps/web
    const webRoot = dirname(dirname(__dirname));
    const globalCss = join(webRoot, 'src', 'styles', 'global.css');

    // Append a harmless comment to trigger HMR
    const token = `hmr-ping-${Date.now()}`;
    const stamp = `:root { --hmr-ping: ${token}; }\n`;
    const original = await fs.readFile(globalCss, 'utf8');
    try {
      await fs.appendFile(globalCss, `\n${stamp}`);

      await expect
        .poll(async () => {
          try {
            return await page.evaluate(() =>
              getComputedStyle(document.documentElement).getPropertyValue('--hmr-ping').trim()
            );
          } catch {
            return '';
          }
        })
        .toBe(token);

      const after = await sample(
        async () => {
          return page.evaluate(() => ({
            display: getComputedStyle(document.querySelector('#site-nav .desktop-nav') as HTMLElement)
              .display,
            visibility: getComputedStyle(document.querySelector('#site-nav') as HTMLElement)
              .visibility,
          }));
        },
        25,
        1000
      );

      const displays = new Set([...before, ...after].map((s) => s.display));
      const vis = new Set([...before, ...after].map((s) => s.visibility));
      expect(displays).toEqual(new Set(['flex']));
      expect(vis).toEqual(new Set(['visible']));
    } finally {
      await fs.writeFile(globalCss, original);
    }
  });
});
