import { test, expect } from '@playwright/test';

test.describe('Navbar Layout and Spacing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="nav-root"]', { timeout: 10000 });
  });

  test('brand logo should be positioned on the left', async ({ page }) => {
    const brand = page.locator('[aria-label="Home"]');
    await expect(brand).toBeVisible();

    const brandBox = await brand.boundingBox();
    const navbar = page.locator('[data-testid="nav-root"]');
    const navbarBox = await navbar.boundingBox();

    expect(brandBox).toBeTruthy();
    expect(navbarBox).toBeTruthy();

    if (brandBox && navbarBox) {
      // Brand should be within 100px of the left edge (accounting for padding)
      expect(brandBox.x - navbarBox.x).toBeLessThan(100);
    }
  });

  test('desktop navigation should be horizontally centered', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });

    const desktopNav = page.locator('[data-testid="nav-desktop"]');
    await expect(desktopNav).toBeVisible();

    const navBox = await desktopNav.boundingBox();
    const navbar = page.locator('[data-testid="nav-root"]');
    const navbarBox = await navbar.boundingBox();

    expect(navBox).toBeTruthy();
    expect(navbarBox).toBeTruthy();

    if (navBox && navbarBox) {
      // Calculate center positions
      const navCenter = navBox.x + navBox.width / 2;
      const navbarCenter = navbarBox.x + navbarBox.width / 2;

      // Desktop nav should be centered within 20px tolerance
      expect(Math.abs(navCenter - navbarCenter)).toBeLessThan(20);
    }
  });

  test('right-side buttons should be positioned on the right', async ({ page }) => {
    const themeToggle = page.locator('[data-testid="nav-theme-toggle"]');
    const searchToggle = page.locator('[data-testid="nav-search-toggle"]');

    await expect(themeToggle).toBeVisible();
    await expect(searchToggle).toBeVisible();

    const navbar = page.locator('[data-testid="nav-root"]');
    const navbarBox = await navbar.boundingBox();
    const themeBox = await themeToggle.boundingBox();
    const searchBox = await searchToggle.boundingBox();

    expect(navbarBox).toBeTruthy();
    expect(themeBox).toBeTruthy();
    expect(searchBox).toBeTruthy();

    if (navbarBox && themeBox && searchBox) {
      // Buttons should be positioned on the right side
      const navbarRight = navbarBox.x + navbarBox.width;
      expect(navbarRight - (themeBox.x + themeBox.width)).toBeLessThan(150);
      expect(navbarRight - (searchBox.x + searchBox.width)).toBeLessThan(150);
    }
  });

  test('navbar should use full width with proper justify-between layout', async ({ page }) => {
    const navbar = page.locator('[data-testid="nav-root"] .nav-inner');
    await expect(navbar).toBeVisible();

    // Check that the navbar inner container has justify-between class
    await expect(navbar).toHaveClass(/justify-between/);

    const navbarBox = await navbar.boundingBox();
    expect(navbarBox).toBeTruthy();

    if (navbarBox) {
      // Navbar should be close to full viewport width (accounting for padding)
      expect(navbarBox.width).toBeGreaterThan(800); // For 1024px viewport
    }
  });

  test('desktop nav links should be properly spaced', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });

    const navLinks = page.locator('[data-testid="nav-desktop-link"]');
    const linkCount = await navLinks.count();

    if (linkCount > 1) {
      // Get positions of first and second links
      const firstLink = navLinks.nth(0);
      const secondLink = navLinks.nth(1);

      const firstBox = await firstLink.boundingBox();
      const secondBox = await secondLink.boundingBox();

      expect(firstBox).toBeTruthy();
      expect(secondBox).toBeTruthy();

      if (firstBox && secondBox) {
        // Links should have reasonable spacing (not crammed together)
        const spacing = secondBox.x - (firstBox.x + firstBox.width);
        expect(spacing).toBeGreaterThan(0); // Should have some gap
        expect(spacing).toBeLessThan(50); // But not too much gap
      }
    }
  });

  test('mobile navigation button positioning on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const mobileToggle = page.locator('[data-testid="nav-mobile-toggle"]');
    await expect(mobileToggle).toBeVisible();

    const navbar = page.locator('[data-testid="nav-root"]');
    const navbarBox = await navbar.boundingBox();
    const toggleBox = await mobileToggle.boundingBox();

    expect(navbarBox).toBeTruthy();
    expect(toggleBox).toBeTruthy();

    if (navbarBox && toggleBox) {
      // Mobile toggle should be on the right side
      const navbarRight = navbarBox.x + navbarBox.width;
      expect(navbarRight - (toggleBox.x + toggleBox.width)).toBeLessThan(30);
    }
  });

  test('navbar height consistency across viewport sizes', async ({ page }) => {
    const sizes = [
      { width: 375, height: 667 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1024, height: 768 }, // Desktop
      { width: 1440, height: 900 }, // Large desktop
    ];

    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.waitForTimeout(100); // Allow layout to settle

      const navbar = page.locator('[data-testid="nav-root"]');
      const navbarBox = await navbar.boundingBox();

      expect(navbarBox).toBeTruthy();
      if (navbarBox) {
        // Navbar should maintain consistent height (64px = h-16, allow 1px variance)
        expect(navbarBox.height).toBeGreaterThanOrEqual(64);
        expect(navbarBox.height).toBeLessThanOrEqual(66);
      }
    }
  });

  test('no overlapping elements in navbar', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });

    const brand = page.locator('[aria-label="Home"]');
    const desktopNav = page.locator('[data-testid="nav-desktop"]');
    const themeToggle = page.locator('[data-testid="nav-theme-toggle"]');

    const brandBox = await brand.boundingBox();
    const navBox = await desktopNav.boundingBox();
    const themeBox = await themeToggle.boundingBox();

    expect(brandBox).toBeTruthy();
    expect(navBox).toBeTruthy();
    expect(themeBox).toBeTruthy();

    if (brandBox && navBox && themeBox) {
      // Brand and desktop nav should not overlap
      expect(brandBox.x + brandBox.width).toBeLessThan(navBox.x + 10); // Small tolerance

      // Desktop nav and theme toggle should not overlap
      expect(navBox.x + navBox.width).toBeLessThan(themeBox.x + 10); // Small tolerance
    }
  });

  test('responsive navigation visibility', async ({ page }) => {
    // Desktop: desktop nav visible, mobile nav hidden
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(100);

    const desktopNav = page.locator('[data-testid="nav-desktop"]');
    const mobileToggle = page.locator('[data-testid="nav-mobile-toggle"]');

    await expect(desktopNav).toBeVisible();
    await expect(mobileToggle).toBeHidden();

    // Mobile: desktop nav hidden, mobile nav visible
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(100);

    await expect(desktopNav).toBeHidden();
    await expect(mobileToggle).toBeVisible();
  });

  test('navbar flexbox layout integrity', async ({ page }) => {
    const navInner = page.locator('[data-testid="nav-root"] .nav-inner');

    // Verify flexbox classes are present
    await expect(navInner).toHaveClass(/flex/);
    await expect(navInner).toHaveClass(/items-center/);
    await expect(navInner).toHaveClass(/justify-between/);

    // Verify max-width constraint
    await expect(navInner).toHaveClass(/max-w-6xl/);
    await expect(navInner).toHaveClass(/mx-auto/);
  });

  test('desktop nav absolute positioning does not break layout', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });

    const desktopNav = page.locator('[data-testid="nav-desktop"]');
    await expect(desktopNav).toBeVisible();

    // Check computed styles
    const styles = await desktopNav.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        position: computed.position,
        display: computed.display,
        left: computed.left,
        transform: computed.transform,
      };
    });

    expect(styles.position).toBe('absolute');
    expect(styles.display).toBe('flex');
    // Desktop nav should be properly positioned and visible
    console.log('Desktop nav styles:', styles);
  });
});
