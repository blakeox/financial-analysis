import { expect, test } from '@playwright/test';

const calculatorRouteContracts = [
  {
    id: 'auto-loan',
    title: 'Auto Loan Calculator',
    backLabel: 'Personal Models',
    backHref: '/models/personal',
  },
  {
    id: 'debt-payoff',
    title: 'Debt Payoff Optimizer',
    backLabel: 'Personal Models',
    backHref: '/models/personal',
  },
  {
    id: 'student-loans',
    title: 'Student Loan Analyzer',
    backLabel: 'Personal Models',
    backHref: '/models/personal',
  },
  {
    id: 'ma-analysis',
    title: 'M&A Analysis Calculator',
    backLabel: 'Business Models',
    backHref: '/models/business',
  },
] as const;

test.describe('Calculator route contracts', () => {
  for (const contract of calculatorRouteContracts) {
    test(`${contract.id} renders the shared calculator shell on the current route`, async ({
      page,
    }) => {
      const response = await page.goto(`/calculator/${contract.id}`);

      expect(response?.ok()).toBeTruthy();
      await expect(page).toHaveURL(new RegExp(`/calculator/${contract.id}/?$`));
      await expect(page).toHaveTitle(new RegExp(contract.title, 'i'));
      await expect(page.getByRole('heading', { level: 1, name: contract.title })).toBeVisible();
      await expect(page.getByRole('link', { name: contract.backLabel })).toHaveAttribute(
        'href',
        contract.backHref
      );
      await expect(page.locator('#calculator-form')).toBeVisible();
      await expect(page.locator('#calculate-btn')).toBeVisible();
      await expect(page.locator('#reset-btn')).toBeVisible();
      await expect(page.locator('#results-section')).toHaveClass(/hidden/);
    });
  }
});
