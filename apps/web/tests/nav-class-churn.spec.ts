import { test, expect } from '@playwright/test';

declare global { interface Window { __navClassLog?: Array<{ t:number; cls:string }>; } }

// Monitor class attribute of nav for excessive churn or loss of key tokens.

test.describe('Navbar class churn', () => {
  test('modern-nav class persists and churn limited', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('#site-nav');
    await expect(nav).toBeVisible();

    await page.evaluate(() => {
      const nav = document.getElementById('site-nav');
      if(!nav) return;
      window.__navClassLog = [{ t: performance.now(), cls: nav.className }];
      const obs = new MutationObserver(muts => {
        for(const m of muts){
          if(m.type==='attributes' && m.attributeName==='class'){
            if(window.__navClassLog){ window.__navClassLog.push({ t: performance.now(), cls: nav.className }); }
          }
        }
      });
      obs.observe(nav, { attributes:true, attributeFilter:['class'] });
    });

    await page.waitForTimeout(4000);
  const log = await page.evaluate(() => window.__navClassLog || []);

    // Ensure modern-nav always present
    for(const entry of log){
      if(!entry.cls.includes('modern-nav')){
        throw new Error('modern-nav class removed temporarily');
      }
    }

    // Count distinct class strings
    const distinct = new Set(log.map(l=>l.cls));
    // Allow up to 4 variants (base, scrolled, maybe dark mode toggle)
    expect(distinct.size <= 4, `Too many class variants: ${distinct.size}`).toBeTruthy();
  });
});
