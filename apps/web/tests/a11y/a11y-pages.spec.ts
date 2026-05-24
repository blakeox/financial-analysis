import { test } from '@playwright/test';
import {
  A11Y_JOURNEY_PATHS,
  A11Y_JOURNEY_STEP_PATHS,
  A11Y_LEGAL_AND_MISC_PATHS,
  A11Y_STATIC_TOOL_PATHS,
  buildA11ySmokePaths,
} from './smoke-routes';
import { expectNoA11yViolations } from './a11y-helpers';

const smokePaths = buildA11ySmokePaths();

test.describe('Accessibility smoke (PR routes)', () => {
  for (const path of smokePaths) {
    test(`no violations on ${path}`, async ({ page }) => {
      await expectNoA11yViolations(page, path);
    });
  }
});

test.describe('Accessibility — static tool & content pages', () => {
  for (const path of A11Y_STATIC_TOOL_PATHS) {
    test(`no violations on ${path}`, async ({ page }) => {
      await expectNoA11yViolations(page, path);
    });
  }
});

test.describe('Accessibility — legal & misc pages', () => {
  for (const path of A11Y_LEGAL_AND_MISC_PATHS) {
    test(`no violations on ${path}`, async ({ page }) => {
      await expectNoA11yViolations(page, path);
    });
  }
});

test.describe('Accessibility — journey entry pages', () => {
  for (const path of A11Y_JOURNEY_PATHS) {
    test(`no violations on ${path}`, async ({ page }) => {
      await expectNoA11yViolations(page, path);
    });
  }
});

test.describe('Accessibility — journey step pages', () => {
  for (const path of A11Y_JOURNEY_STEP_PATHS) {
    test(`no violations on ${path}`, async ({ page }) => {
      await expectNoA11yViolations(page, path);
    });
  }
});
