import { test, expect } from '@playwright/test';
import { gotoPath, setViewportDesktop, waitForNavReady } from './utils/nav';

test.describe('Navbar keyboard navigation', () => {
  test('Keyboard traversal reaches brand, then theme and search', async ({ page }) => {
    await setViewportDesktop(page);
    await gotoPath(page, '/');
  await waitForNavReady(page);

    // Start at brand anchor explicitly
    const brand = page.locator('#site-nav a[aria-label="Home"]');
    await brand.focus();

    // Traverse desktop links
    // Tab until theme toggle gets focus (within reasonable steps)
    const theme = page.locator('#theme-toggle');
    let themeFocused = false;
    for (let i = 0; i < 20; i++) {
      if (await theme.evaluate(el => document.activeElement === el)) { themeFocused = true; break; }
      await page.keyboard.press('Tab');
    }
    expect(themeFocused).toBeTruthy();

    // Next, tab until search toggle gets focus
    const search = page.locator('#search-toggle');
    let searchFocused = false;
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      if (await search.evaluate(el => document.activeElement === el)) { searchFocused = true; break; }
    }
    expect(searchFocused).toBeTruthy();
  });
});
