import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

async function waitForPageAnimations(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await page.evaluate(async () => {
        const animations = document.getAnimations().filter((animation) => {
          const timing = animation.effect?.getComputedTiming();
          return timing?.iterations !== Infinity;
        });

        await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
      });
      return;
    } catch (error) {
      const message = String(error);
      const contextWasDestroyed = message.includes('Execution context was destroyed');
      if (!contextWasDestroyed || attempt === 1) {
        throw error;
      }

      // A client-side redirect can begin immediately after `load`. Let the
      // replacement document settle before retrying the DOM-backed check.
      await page.waitForLoadState('load');
    }
  }
}

export function formatViolations(
  violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']
): string {
  return violations
    .map((violation) => {
      const nodes = violation.nodes
        .slice(0, 3)
        .map((node) => node.target.join(', '))
        .join('; ');
      return `${violation.id} (${violation.impact}): ${violation.help} — ${nodes}`;
    })
    .join('\n');
}

export async function expectNoA11yViolations(page: Page, path: string): Promise<void> {
  const response = await page.goto(path);
  expect(response?.ok(), `expected ${path} to return 2xx`).toBeTruthy();
  // `networkidle` is not a stable readiness signal for pages with analytics,
  // polling, or browser-specific resource behavior. `goto` already waits for
  // the load event, which is sufficient before scanning the rendered DOM.
  await page.waitForLoadState('load');
  await waitForPageAnimations(page);

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
    .analyze();

  expect(
    accessibilityScanResults.violations,
    formatViolations(accessibilityScanResults.violations)
  ).toEqual([]);
}

export async function expectNoColorContrastViolations(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState('load');
  await waitForPageAnimations(page);

  const contrastResults = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();

  expect(contrastResults.violations, formatViolations(contrastResults.violations)).toEqual([]);
}
