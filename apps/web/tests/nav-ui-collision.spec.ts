import { test, expect } from '@playwright/test';

// Guard against unintended rendering of the UI package Navbar component in the web app.
// The UI Navbar uses an id pattern `primary-navigation-<reactId>` for the mobile region.

test.describe('UI Navbar collision guard', () => {
  test('no UI Navbar id pattern present', async ({ page }) => {
    await page.goto('/');
    // Search for any element whose id starts with "primary-navigation-"
    const hasUiNavbar = await page.evaluate(() => !!document.querySelector('[id^="primary-navigation-"]'));
    expect(hasUiNavbar).toBeFalsy();
  });
});
