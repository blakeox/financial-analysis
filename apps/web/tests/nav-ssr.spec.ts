import { test, expect } from '@playwright/test';

// Ensures nav links are present in the initial server-rendered HTML (no JS execution).

test.describe('Navbar SSR presence', () => {
  test('desktop links rendered server-side', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    // Direct HTML inspection (no post-hydration scripts run)
    const html = await page.content();
    expect(html).toMatch(/Home/);
    expect(html).toMatch(/Models/);
    expect(html).toMatch(/Analysis/);
    // Ensure #site-nav appears once
    const navCount = (html.match(/id="site-nav"/g) || []).length;
    expect(navCount).toBe(1);
    await context.close();
  });
});
