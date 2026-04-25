import { expect, test } from '@playwright/test';
import { mockLeaseAnalysis, openLeaseAnalysis } from './helpers';

test.describe('Lease analysis template and history browser contracts', () => {
  test('shows the current quick-start templates and loads the selected template values', async ({
    page,
  }) => {
    await mockLeaseAnalysis(page);
    await openLeaseAnalysis(page);

    await expect(page.getByText('Industrial Warehouse NNN')).toBeVisible();
    await expect(page.getByText('Office Building NNN')).toBeVisible();
    await expect(page.getByText('Retail Base + Percentage')).toBeVisible();

    const viewAllTemplatesButton = page.getByRole('button', { name: 'View All Templates (4)' });
    await expect(viewAllTemplatesButton).toBeVisible();
    await expect(viewAllTemplatesButton).toBeDisabled();

    await page.getByText('Office Building NNN').click();

    await expect(page.locator('select').first()).toHaveValue('office-nnn');
    await expect(page.getByLabel('Monthly Base Rent')).toHaveValue('12000');
    await expect(page.getByLabel('Lease Term (Months)')).toHaveValue('60');
  });

  test('saves, reloads, and deletes analysis history via the current localStorage-backed UI', async ({
    page,
  }) => {
    await mockLeaseAnalysis(page);
    await openLeaseAnalysis(page);
    await expect(page.getByText('Financial Summary')).toBeVisible();

    await page.getByRole('button', { name: 'Save Current' }).click();
    await expect(page.getByText('Save Analysis')).toBeVisible();

    await page.getByPlaceholder('e.g., analysis name').fill('Warehouse baseline');
    await page.getByPlaceholder('Add a description...').fill('Default warehouse scenario');
    await page.locator('div.fixed.inset-0').getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Warehouse baseline')).toBeVisible();
    await expect(page.getByText('Default warehouse scenario')).toBeVisible();

    const savedAnalyses = await page.evaluate(() => {
      const raw = window.localStorage.getItem('lease-analyses');
      return raw ? (JSON.parse(raw) as Array<{ name: string; description?: string }>) : [];
    });
    expect(savedAnalyses).toHaveLength(1);
    expect(savedAnalyses[0]).toMatchObject({
      name: 'Warehouse baseline',
      description: 'Default warehouse scenario',
    });

    await page.getByText('Office Building NNN').click();
    await expect(page.getByText('Financial Summary')).not.toBeVisible();

    await page.getByText('Warehouse baseline').click();
    await expect(page.getByText('Financial Summary')).toBeVisible();
    await expect(page.getByLabel('Monthly Base Rent')).toHaveValue('45000');

    const savedAnalysisCard = page
      .locator('div')
      .filter({ has: page.getByText('Warehouse baseline') })
      .filter({ has: page.getByText('Default warehouse scenario') })
      .first();
    await savedAnalysisCard.getByTitle('Delete analysis').click();

    await expect(page.getByText('Warehouse baseline')).not.toBeVisible();
    await expect(page.getByText('No saved analyses yet')).toBeVisible();

    const savedAnalysesAfterDelete = await page.evaluate(() => {
      const raw = window.localStorage.getItem('lease-analyses');
      return raw ? (JSON.parse(raw) as unknown[]) : [];
    });
    expect(savedAnalysesAfterDelete).toHaveLength(0);
  });
});
