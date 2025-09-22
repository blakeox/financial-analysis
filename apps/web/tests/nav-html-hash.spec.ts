import { test, expect } from '@playwright/test';
import crypto from 'crypto';

// Hash sanitized nav innerHTML (strip dynamic phase data attributes) over 10s; allow <=2 unique hashes.

test.describe('Navbar HTML hash stability', () => {
  test('no excessive HTML variant churn', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('#site-nav');
    await expect(nav).toBeVisible();

    const hashes: string[] = [];
    const take = async () => {
      const html = await nav.evaluate(el => {
        const clone = el.cloneNode(true) as HTMLElement;
        // Remove phase data attributes for stable hashing
  Array.from(clone.attributes).forEach(a => { if(a.name.startsWith('data-phase-')) clone.removeAttribute(a.name); });
        return clone.innerHTML.replace(/\s+/g,' ');
      });
      const h = crypto.createHash('sha256').update(html).digest('hex');
      hashes.push(h);
    };

    for(let i=0;i<21;i++){ // ~10s sampling every 500ms
      await take();
      await page.waitForTimeout(500);
    }

    const distinct = new Set(hashes);
    expect(distinct.size <= 2, `Too many distinct nav HTML hashes: ${distinct.size}`).toBeTruthy();
  });
});
