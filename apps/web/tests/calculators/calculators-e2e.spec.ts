import { expect, test } from '@playwright/test';

const catalogContracts = [
  {
    title: 'Amortization Calculator',
    href: '/calculator/amortization',
  },
  {
    title: 'Student Loan Analyzer',
    href: '/calculator/student-loans',
  },
  {
    title: 'DCF Valuation Calculator',
    href: '/calculator/dcf-valuation',
  },
] as const;

test.describe('Calculator catalog contract', () => {
  test('/calculators lists current calculator entry points', async ({ page }) => {
    const response = await page.goto('/calculators');

    expect(response?.ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/calculators\/?$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Financial Calculators' })).toBeVisible();

    for (const contract of catalogContracts) {
      const link = page.locator(`a[href="${contract.href}"]`).first();

      await expect(link).toBeVisible();
      await expect(page.getByText(contract.title, { exact: true }).first()).toBeVisible();
    }
  });

  test('/calculators links into the current calculator router', async ({ page }) => {
    await page.goto('/calculators');

    await page.locator('a[href="/calculator/student-loans"]').first().click();

    await expect(page).toHaveURL(/\/calculator\/student-loans\/?$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Student Loan Analyzer' })).toBeVisible();
    await expect(page.locator('#calculator-form')).toBeVisible();
  });
});
