import { test, expect } from '@playwright/test';
import { gotoPath, setViewportDesktop, waitForNavReady } from './utils/nav';

test.describe('Navbar theme persistence', () => {
  test('toggle theme persists across reload', async ({ page }) => {
    await setViewportDesktop(page);
    await gotoPath(page, '/');
    await waitForNavReady(page);

    const getDark = () => page.evaluate(() => document.documentElement.classList.contains('dark'));
    const before = await getDark();

    await page.getByRole('button', { name: 'Toggle color theme' }).click();
    await page.waitForTimeout(150);
    const afterClick = await getDark();
    expect(afterClick).toBe(!before);

    // Verify localStorage set
    const themeValue = await page.evaluate(() => localStorage.getItem('theme'));
    expect(themeValue === 'dark' || themeValue === 'light').toBeTruthy();

    // Reload preserves
    await page.reload();
    await waitForNavReady(page);
    const afterReload = await getDark();
    expect(afterReload).toBe(afterClick);
  });
});
