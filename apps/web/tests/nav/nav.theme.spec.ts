import { test, expect } from '@playwright/test';
import { gotoPath, setViewportDesktop, waitForNavReady } from '../_shared/nav';

test.describe('Navbar theme persistence', () => {
  test('toggle theme persists across reload', async ({ page }) => {
    await setViewportDesktop(page);
    await gotoPath(page, '/');
    await waitForNavReady(page);

    const getDark = () => page.evaluate(() => document.documentElement.classList.contains('dark'));
    const before = await getDark();
    const expectedTheme = before ? 'light' : 'dark';

    await page.getByRole('button', { name: 'Toggle color theme' }).click();
    await expect.poll(getDark).toBe(!before);

    // Verify localStorage set
    await expect.poll(() => page.evaluate(() => localStorage.getItem('theme'))).toBe(expectedTheme);
    const afterClick = await getDark();

    // Reload preserves
    await page.reload();
    await waitForNavReady(page);
    const afterReload = await getDark();
    expect(afterReload).toBe(afterClick);
  });
});
