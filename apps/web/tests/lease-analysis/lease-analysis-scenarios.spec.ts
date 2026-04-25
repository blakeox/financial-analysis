import { expect, test } from '@playwright/test';
import { buildAnalysisResult, mockLeaseAnalysis, openLeaseAnalysis } from './helpers';

test.describe('Lease analysis scenario browser contracts', () => {
  test('runs three scenario requests against the current endpoint and renders deterministic comparison cards', async ({
    page,
  }) => {
    const requests = await mockLeaseAnalysis(page, async (route, payload, callIndex) => {
      const rate =
        typeof payload.escalation === 'object' &&
        payload.escalation !== null &&
        typeof (payload.escalation as Record<string, unknown>).rate === 'number'
          ? ((payload.escalation as Record<string, unknown>).rate as number)
          : 0.03;

      const scenarioMap = new Map<number, { totalCost: number; monthly: number; presentValue: number }>([
        [0.021, { totalCost: 390000, monthly: 6500, presentValue: 360000 }],
        [0.033, { totalCost: 432000, monthly: 7200, presentValue: 400000 }],
        [0.045, { totalCost: 450000, monthly: 7500, presentValue: 417000 }],
      ]);

      const roundedRate = Number(rate.toFixed(3));
      const scenarioResult = scenarioMap.get(roundedRate) ?? {
        totalCost: 420000,
        monthly: 7000,
        presentValue: 390000,
      };

      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        json: buildAnalysisResult({
          metrics: {
            totalCost: scenarioResult.totalCost,
            averageMonthlyPayment: scenarioResult.monthly,
            presentValue: scenarioResult.presentValue,
            costPerMonth: scenarioResult.monthly,
            costPerYear: scenarioResult.monthly * 12,
          },
          insights: {
            effectiveRent: scenarioResult.monthly,
            occupancyCost: scenarioResult.monthly + 600,
            totalCommitment: scenarioResult.totalCost,
          },
          riskAnalysis: {
            earlyTerminationCost: 15000 + callIndex * 1000,
          },
        }),
      });
    });

    await openLeaseAnalysis(page);
    await expect(page.getByText('Financial Summary')).toBeVisible();

    const requestCountBeforeScenarioRun = requests.length;
    await page.getByRole('button', { name: 'Run Scenarios' }).click();

    await expect.poll(() => requests.length - requestCountBeforeScenarioRun).toBe(3);

    const scenarioRequests = requests.slice(requestCountBeforeScenarioRun);
    expect(scenarioRequests).toHaveLength(3);
    expect(scenarioRequests.map((request) => request.leaseType)).toEqual([
      'warehouse-nnn',
      'warehouse-nnn',
      'warehouse-nnn',
    ]);
    expect(
      scenarioRequests.map((request) =>
        Number(
          (
            ((request.escalation as Record<string, unknown> | undefined)?.rate as number | undefined) ?? 0
          ).toFixed(3)
        )
      )
    ).toEqual([0.021, 0.033, 0.045]);

    await expect(page.getByText('Scenario Comparison')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Optimistic' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Conservative' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pessimistic' })).toBeVisible();

    const optimisticCard = page
      .locator('div')
      .filter({ has: page.getByRole('heading', { name: 'Optimistic' }) })
      .first();
    const conservativeCard = page
      .locator('div')
      .filter({ has: page.getByRole('heading', { name: 'Conservative' }) })
      .first();
    const pessimisticCard = page
      .locator('div')
      .filter({ has: page.getByRole('heading', { name: 'Pessimistic' }) })
      .first();

    await expect(optimisticCard.locator('span').filter({ hasText: '$390,000' }).first()).toBeVisible();
    await expect(conservativeCard.locator('span').filter({ hasText: '$432,000' }).first()).toBeVisible();
    await expect(pessimisticCard.locator('span').filter({ hasText: '$450,000' }).first()).toBeVisible();
    await expect(optimisticCard.locator('span').filter({ hasText: '-7.1%' }).first()).toBeVisible();
    await expect(conservativeCard.locator('span').filter({ hasText: '2.9%' }).first()).toBeVisible();
    await expect(pessimisticCard.locator('span').filter({ hasText: '7.1%' }).first()).toBeVisible();
    await expect(page.getByText('Risk Range:')).toBeVisible();
    await expect(page.getByText('$60,000 difference')).toBeVisible();
    await expect(page.getByText('Best Case Savings:')).toBeVisible();
    await expect(page.getByText('$30,000', { exact: true })).toBeVisible();
    await expect(page.getByText('Worst Case Impact:')).toBeVisible();
    await expect(page.getByText('+$30,000')).toBeVisible();

    await page.getByRole('button', { name: 'Close Analysis' }).click();
    await expect(page.getByText('Scenario Comparison')).not.toBeVisible();
    await expect(page.getByText('Scenario Analysis')).toBeVisible();
  });
});
