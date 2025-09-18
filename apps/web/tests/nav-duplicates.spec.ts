import { test, expect } from '@playwright/test';

// Detect if more than one nav with modern-nav class or #site-nav exists and if overlapping bounding boxes occur.

test.describe('Navbar duplication detection', () => {
  test('only a single visible modern nav exists', async ({ page }) => {
    await page.goto('/');
    // Count #site-nav elements
    const countId = await page.locator('#site-nav').count();
    expect(countId, 'Duplicate #site-nav elements found').toBe(1);

    // Count modern-nav class (should be 1)
    const modernCount = await page.locator('nav.modern-nav').count();
    expect(modernCount, 'Duplicate nav.modern-nav elements found').toBe(1);

    // Search any other navs with similar brand text and capture boxes
    const navs = page.locator('nav');
    const n = await navs.count();
    const boxes = [] as {i:number; box: {x:number;y:number;width:number;height:number}|null}[];
    for(let i=0;i<n;i++){
      boxes.push({ i, box: await navs.nth(i).boundingBox() });
    }
    // Check pairwise overlap > 50% area heuristic
    for(let a=0;a<boxes.length;a++){
      for(let b=a+1;b<boxes.length;b++){
        const A = boxes[a].box; const B = boxes[b].box; if(!A||!B) continue;
        const ix = Math.max(0, Math.min(A.x+A.width, B.x+B.width) - Math.max(A.x,B.x));
        const iy = Math.max(0, Math.min(A.y+A.height, B.y+B.height) - Math.max(A.y,B.y));
        const inter = ix * iy;
        const minArea = Math.min(A.width*A.height, B.width*B.height);
        if(minArea > 0 && inter/minArea > 0.5) {
          throw new Error(`Two nav-like regions overlap >50% (indices ${boxes[a].i}, ${boxes[b].i})`);
        }
      }
    }
  });
});
