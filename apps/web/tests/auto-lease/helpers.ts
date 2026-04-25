import { expect, type Page } from '@playwright/test';

export const STORAGE_KEY = 'fanalyx-journey-state-auto-lease-decision';
export const JOURNEY_URL = '/journey/auto-lease-decision';
export const STEP_PATHS = {
  leaseProfile: `${JOURNEY_URL}/step/lease-profile`,
  leaseVsBuyout: `${JOURNEY_URL}/step/lease-vs-buyout`,
  replacementOptions: `${JOURNEY_URL}/step/replacement-options`,
  review: `${JOURNEY_URL}/step/decision-review`,
} as const;

type StepData = Record<string, string>;

export type AutoLeaseJourneyState = {
  currentStepOrder?: number;
  collectedData?: Record<string, StepData>;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const pathPattern = (path: string) => new RegExp(`${escapeRegExp(path)}/?$`);

export async function clearAutoLeaseState(page: Page) {
  await page.goto('/');
  await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
}

export async function seedAutoLeaseState(page: Page, state: AutoLeaseJourneyState | string) {
  await page.goto('/');
  await page.evaluate(
    ([key, value]) =>
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)),
    [STORAGE_KEY, state] as [string, AutoLeaseJourneyState | string]
  );
}

export async function readAutoLeaseState(page: Page): Promise<AutoLeaseJourneyState | null> {
  const raw = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AutoLeaseJourneyState;
  } catch {
    return null;
  }
}

export async function gotoAutoLeasePage(page: Page, path: string, heading: string | RegExp) {
  await page.goto(path);
  await expect(page).toHaveURL(pathPattern(path));
  await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
}

export async function goToNextStep(page: Page, expectedPath: string) {
  await Promise.all([
    page.waitForURL(pathPattern(expectedPath)),
    page.getByRole('link', { name: /^Next:/ }).click(),
  ]);
}

export async function expectStoredStepFields(
  page: Page,
  stepId: string,
  expectedFields: Record<string, string>
) {
  await expect
    .poll(async () => {
      const state = await readAutoLeaseState(page);
      const stepData = state?.collectedData?.[stepId] ?? {};

      return Object.fromEntries(
        Object.keys(expectedFields).map((field) => [field, stepData[field] ?? null])
      );
    })
    .toEqual(expectedFields);
}
