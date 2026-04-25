import { expect, test } from '@playwright/test';

test.describe('Journey route contracts', () => {
  test('journey index exposes current personal and business entry points', async ({ page }) => {
    await page.goto('/journey');

    await expect(page.getByRole('heading', { name: 'Multi-Model Financial Analysis' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Personal Finance' })).toBeVisible();
    await expect(page.locator('[data-scenario="young-professional"]')).toBeVisible();
    await expect(page.locator('[data-scenario="auto-lease-decision"]')).toBeVisible();

    await page.getByRole('button', { name: 'Business Finance' }).click();

    await expect(page.locator('[data-scenario="startup-planning"]')).toBeVisible();
    await expect(page.locator('[data-scenario="ma-analysis-journey"]')).toBeVisible();
  });

  test('current scenario cards navigate to the journey overview page', async ({ page }) => {
    await page.goto('/journey');
    await page.locator('[data-scenario="young-professional"]').click();

    await expect(page).toHaveURL(/\/journey\/young-professional\/?$/);
    await expect(
      page.getByRole('heading', { name: 'Young Professional Journey', exact: true })
    ).toBeVisible();
    await expect(page.getByText('Journey Progress')).toBeVisible();
    await expect(page.getByText('Analysis Models')).toBeVisible();
    await expect(page.getByText('Workflow Steps')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Your Journey' })).toBeVisible();
  });

  test('dedicated step pages save state and point to the current next step', async ({ page }) => {
    await page.goto('/journey/young-professional/step/financial-snapshot');

    await expect(page.getByRole('heading', { name: 'Financial Snapshot', exact: true })).toBeVisible();
    await expect(page.getByText('Step 1 of 7 - Young Professional Journey')).toBeVisible();

    await page.locator('#annual-income').fill('85000');
    await page.locator('#monthly-income').fill('5200');
    await page.locator('#student-loan-balance').fill('18000');
    await page.locator('input[name="goals"][value="retirement"]').check();
    await page.locator('#timeline').selectOption('2-3-years');
    await page.getByRole('button', { name: 'Save Financial Snapshot' }).click();

    await expect(page.getByRole('button', { name: '✓ Saved!' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Next: Credit Card Payoff/ })).toHaveAttribute(
      'href',
      '/journey/young-professional/step/credit-card-payoff'
    );

    const storedState = await page.evaluate(() => {
      const raw = window.localStorage.getItem('fanalyx-journey-state-young-professional');
      return raw ? JSON.parse(raw) : null;
    });

    expect(storedState?.collectedData?.['financial-snapshot']).toMatchObject({
      income: {
        annual: '85000',
        monthly: '5200',
      },
      debt: {
        studentLoans: '18000',
      },
      goals: ['retirement'],
      timeline: '2-3-years',
    });
  });

  test('scenario-specific step pages keep the current form and navigation contracts', async ({
    page,
  }) => {
    await page.goto('/journey/home-buying/step/goal-planning');

    await expect(page.getByRole('heading', { name: 'What Can You Afford?', exact: true })).toBeVisible();
    await expect(page.getByText('Step 2 of 5 - Home Buying Journey')).toBeVisible();
    await expect(page.locator('#mortgage-comparison-form')).toBeVisible();
    await expect(page.getByLabel(/Home Price/)).toBeVisible();
    await expect(page.locator('#scenario1-rate')).toBeVisible();
    await expect(page.getByRole('link', { name: /Previous: Financial Snapshot/ })).toHaveAttribute(
      'href',
      '/journey/home-buying/step/financial-snapshot'
    );
    await expect(
      page.getByRole('link', { name: /Next: Down Payment & Closing Costs/ })
    ).toHaveAttribute('href', '/journey/home-buying/step/retirement-start');
  });

  test('journey analysis pages render the current completion and follow-up CTAs', async ({ page }) => {
    await page.goto('/journey-analysis/young-professional');

    await expect(page.getByRole('heading', { name: '🎉 Journey Complete!' })).toBeVisible();
    await expect(page.getByText("You've successfully completed the Young Professional Journey financial journey")).toBeVisible();
    await expect(page.getByText('Journey Summary')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Explore More Journeys' })).toHaveAttribute(
      'href',
      '/journey'
    );
    await expect(
      page.getByRole('link', { name: 'Browse Individual Calculators' })
    ).toHaveAttribute('href', '/models');
  });
});


