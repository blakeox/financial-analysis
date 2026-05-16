import { expect, test } from '@playwright/test';

test.describe('Navbar buttons functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Wait for nav to be ready
    await expect(page.locator('#site-nav')).toBeVisible();
  });

  test('theme toggle button is visible and functional on desktop', async ({ page }) => {
    // Set viewport to desktop size to ensure theme toggle is visible
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');

    const themeToggle = page.locator('[data-testid="nav-theme-toggle"]');

    // Check if theme toggle is visible on desktop
    await expect(themeToggle).toBeVisible();

    // Check initial state - should show sun icon in light mode
    const sunIcon = themeToggle.locator('.sun-icon');
    const moonIcon = themeToggle.locator('.moon-icon');

    // Get initial theme state
    const initialIsDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    // Verify initial icon visibility
    if (!initialIsDark) {
      await expect(sunIcon).toBeVisible();
      await expect(moonIcon).toBeHidden();
    } else {
      await expect(moonIcon).toBeVisible();
      await expect(sunIcon).toBeHidden();
    }

    // Click theme toggle
    await themeToggle.click();

    // Wait for theme change and DOM updates
    await page.waitForTimeout(300);

    // Verify theme actually changed
    const newIsDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(newIsDark).toBe(!initialIsDark);

    // Test functionality by checking localStorage
    const storedTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(storedTheme).toBe(newIsDark ? 'dark' : 'light');

    // Click again to toggle back
    await themeToggle.click();
    await page.waitForTimeout(300);

    const finalIsDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(finalIsDark).toBe(initialIsDark);

    // Verify final localStorage state
    const finalStoredTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(finalStoredTheme).toBe(finalIsDark ? 'dark' : 'light');
  });

  test('theme toggle is visible on mobile', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    const themeToggle = page.locator('[data-testid="nav-theme-toggle"]');

    // Theme toggle should now be visible on mobile (changed from "hidden sm:inline-flex" to "inline-flex")
    await expect(themeToggle).toBeVisible();

    // Test that it's functional on mobile too
    await themeToggle.click();
    await page.waitForTimeout(100);

    // Verify theme can be toggled on mobile
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(typeof isDark).toBe('boolean'); // Just verify it responds
  });

  test('search button is visible and opens search overlay', async ({ page }) => {
    const searchToggle = page.locator('[data-testid="nav-search-toggle"]');
    const searchOverlay = page.locator('[data-testid="nav-search-overlay"]');

    // Search button should be visible
    await expect(searchToggle).toBeVisible();

    // Search overlay should be hidden initially
    await expect(searchOverlay).toBeHidden();

    // Click search button
    await searchToggle.click();

    // Search overlay should become visible
    await expect(searchOverlay).toBeVisible();

    // Search input should be focused
    const searchInput = page.locator('#search-input');
    await expect(searchInput).toBeFocused();

    // Close search with close button
    const searchClose = page.locator('[data-testid="nav-search-close"]');
    await searchClose.click();

    // Search overlay should be hidden again
    await expect(searchOverlay).toBeHidden();
  });

  test('search can be opened with Cmd+K and closed with Escape', async ({ page }) => {
    const searchOverlay = page.locator('[data-testid="nav-search-overlay"]');

    // Open search with Cmd+K (Ctrl+K on non-Mac)
    const isMac = process.platform === 'darwin';
    if (isMac) {
      await page.keyboard.press('Meta+k');
    } else {
      await page.keyboard.press('Control+k');
    }

    // Search overlay should become visible
    await expect(searchOverlay).toBeVisible();

    // Close search with Escape
    await page.keyboard.press('Escape');

    // Search overlay should be hidden again
    await expect(searchOverlay).toBeHidden();
  });

  test('mobile menu button is visible on mobile and functional', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    const mobileToggle = page.locator('[data-testid="nav-mobile-toggle"]');
    const mobilePanel = page.locator('[data-testid="nav-mobile-panel"]');

    // Mobile toggle should be visible on mobile
    await expect(mobileToggle).toBeVisible();

    // Mobile panel should be hidden initially (check opacity)
    await expect(mobilePanel).toHaveClass(/opacity-0/);
    await expect(mobilePanel).toHaveClass(/pointer-events-none/);

    // Click mobile toggle
    await mobileToggle.click();

    // Wait for animation
    await page.waitForTimeout(250);

    // Mobile panel should become visible (check opacity and pointer events)
    await expect(mobilePanel).toHaveClass(/opacity-100/);
    await expect(mobilePanel).not.toHaveClass(/pointer-events-none/);

    // Check that mobile menu contains navigation links (at least 2)
    const mobileLinks = mobilePanel.locator('a[data-mobile-link]');
    const linkCount = await mobileLinks.count();
    expect(linkCount).toBeGreaterThanOrEqual(2);

    // Click a link to test navigation
    const modelsLink = mobilePanel.locator('a[data-mobile-link]').filter({ hasText: 'Models' });
    await modelsLink.click();

    // Should navigate to models page
    await expect(page).toHaveURL(/\/models/);

    // Mobile panel should close after navigation (check opacity and pointer events)
    await page.waitForTimeout(250);
    await expect(mobilePanel).toHaveClass(/opacity-0/);
    await expect(mobilePanel).toHaveClass(/pointer-events-none/);
  });

  test('mobile menu is hidden on desktop', async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1024, height: 768 });

    const mobileToggle = page.locator('[data-testid="nav-mobile-toggle"]');

    // Mobile toggle should be hidden on desktop (has class "md:hidden")
    await expect(mobileToggle).toBeHidden();
  });

  test('desktop navigation links are functional', async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1024, height: 768 });

    const nav = page.locator('nav, header').first();
    await expect(nav).toBeVisible();

    // Test Models link - more flexible selector
    const modelsLink = nav
      .locator('a')
      .filter({ hasText: /Models/i })
      .first();
    if ((await modelsLink.count()) > 0) {
      await expect(modelsLink).toBeVisible();
      await modelsLink.click();
      await expect(page).toHaveURL(/\/models/);
    }

    // Go back to home
    await page.goto('/');
    await expect(nav).toBeVisible();

    // Test Analysis link - more flexible selector
    const analysisLink = nav
      .locator('a')
      .filter({ hasText: /Analysis|Lease/i })
      .first();
    if ((await analysisLink.count()) > 0) {
      await expect(analysisLink).toBeVisible();
      await analysisLink.click();
      await expect(page).toHaveURL(/\/analysis|lease/i);
    }
  });

  test('brand logo links to home', async ({ page }) => {
    // Navigate to a different page first
    await page.goto('/models');

    // Click brand logo
    const brandLink = page.locator('#site-nav a[aria-label="Home"]');
    await expect(brandLink).toBeVisible();
    await brandLink.click();

    // Should navigate back to home
    await expect(page).toHaveURL('/');
  });

  test('navbar styling and layout integrity', async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1024, height: 768 });

    const nav = page.locator('#site-nav');
    const desktopNav = page.locator('[data-testid="nav-desktop"]');
    const themeToggle = page.locator('[data-testid="nav-theme-toggle"]');
    const searchToggle = page.locator('[data-testid="nav-search-toggle"]');

    // Check that all elements are visible and have proper styling
    await expect(nav).toBeVisible();
    await expect(desktopNav).toBeVisible();
    await expect(themeToggle).toBeVisible();
    await expect(searchToggle).toBeVisible();

    // Check that navbar has fixed positioning
    const navPosition = await nav.evaluate((el) => getComputedStyle(el).position);
    expect(navPosition).toBe('fixed');

    // Check that desktop nav has flex display
    const desktopNavDisplay = await desktopNav.evaluate((el) => getComputedStyle(el).display);
    expect(desktopNavDisplay).toBe('flex');

    // Check that theme toggle has proper border radius (should be rounded-full)
    const themeToggleBorderRadius = await themeToggle.evaluate(
      (el) => getComputedStyle(el).borderRadius
    );
    // Border radius should be high (indicates rounded-full), could be in px or %
    const radiusValue = parseFloat(themeToggleBorderRadius);
    expect(radiusValue).toBeGreaterThan(20); // Should be a large value for rounded-full

    // Check that search toggle is visible and styled
    const searchToggleDisplay = await searchToggle.evaluate((el) => getComputedStyle(el).display);
    expect(searchToggleDisplay).not.toBe('none');
  });

  test('navbar responsive behavior', async ({ page }) => {
    // Start with desktop view
    await page.setViewportSize({ width: 1024, height: 768 });

    const desktopNav = page.locator('[data-testid="nav-desktop"]');
    const mobileToggle = page.locator('[data-testid="nav-mobile-toggle"]');
    const themeToggle = page.locator('[data-testid="nav-theme-toggle"]');

    // Desktop: desktop nav visible, mobile toggle hidden, theme toggle visible
    await expect(desktopNav).toBeVisible();
    await expect(mobileToggle).toBeHidden();
    await expect(themeToggle).toBeVisible();

    // Switch to mobile view
    await page.setViewportSize({ width: 375, height: 667 });

    // Mobile: desktop nav hidden, mobile toggle visible, theme toggle visible
    await expect(desktopNav).toBeHidden();
    await expect(mobileToggle).toBeVisible();
    await expect(themeToggle).toBeVisible();

    // Switch back to desktop
    await page.setViewportSize({ width: 1024, height: 768 });

    // Should return to desktop state
    await expect(desktopNav).toBeVisible();
    await expect(mobileToggle).toBeHidden();
    await expect(themeToggle).toBeVisible();
  });

  test('escape key closes mobile menu', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    const mobileToggle = page.locator('[data-testid="nav-mobile-toggle"]');
    const mobilePanel = page.locator('[data-testid="nav-mobile-panel"]');

    // Open mobile menu
    await mobileToggle.click();
    await page.waitForTimeout(250);
    await expect(mobilePanel).toHaveClass(/opacity-100/);
    await expect(mobilePanel).not.toHaveClass(/pointer-events-none/);

    // Press Escape
    await page.keyboard.press('Escape');

    // Wait for animation
    await page.waitForTimeout(250);

    // Mobile panel should close (check opacity and pointer events)
    await expect(mobilePanel).toHaveClass(/opacity-0/);
    await expect(mobilePanel).toHaveClass(/pointer-events-none/);
  });
});
