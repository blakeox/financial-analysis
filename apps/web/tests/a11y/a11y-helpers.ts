import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

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
  await page.waitForLoadState('networkidle');

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
  await page.waitForLoadState('networkidle');

  const contrastResults = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();

  expect(contrastResults.violations, formatViolations(contrastResults.violations)).toEqual([]);
}
