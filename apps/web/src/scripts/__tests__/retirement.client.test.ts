import { beforeEach, describe, expect, it } from 'vitest';
import { RetirementEngine } from '@financial-analysis/analysis';
import type { RetirementResult } from '@financial-analysis/analysis';
import {
  collectAccounts,
  describeIncomeReplacement,
  displayResults,
  formatAnnualIncome,
  parseNumber,
} from '../retirement.client';

describe('retirement.client', () => {
  const buildFormData = () => {
    const formData = new FormData();
    formData.set('account-type-0', '401k');
    formData.set('account-balance-0', '45000');
    formData.set('account-contribution-0', '12000');
    formData.set('account-match-0', '4');
    formData.set('account-match-limit-0', '5');

    formData.set('account-type-1', 'invalid');
    formData.set('account-balance-1', '10000');
    formData.set('account-contribution-1', '3000');

    return formData;
  };

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('collectAccounts returns valid account entries and skips invalid types', () => {
    const accounts = collectAccounts(buildFormData(), 2);

    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toMatchObject({
      accountType: '401k',
      currentBalance: 45000,
      annualContribution: 12000,
      employerMatch: 0.04,
      employerMatchLimit: 0.05,
    });
  });

  it('formatAnnualIncome converts a monthly income string to annual currency', () => {
    expect(formatAnnualIncome('$4,500')).toBe('$54,000');
    expect(formatAnnualIncome(undefined)).toBeNull();
  });

  it('parseNumber returns NaN for invalid entries', () => {
    expect(Number.isNaN(parseNumber('oops'))).toBe(true);
  });

  it('describeIncomeReplacement produces markup when data exists', () => {
    const sample = {
      withdrawalAnalysis: {
        projectedMonthlyIncome: '$4,500',
      },
      summary: {
        replacementRatio: '80%',
      },
    } as RetirementResult;

    const markup = describeIncomeReplacement(sample);
    expect(markup).toContain('Projected Annual Retirement Income');
    expect(markup).toContain('$54,000');
  });

  it('displayResults fills DOM elements with engine output', () => {
    const input = {
      currentAge: 35,
      retirementAge: 67,
      currentIncome: 95000,
      accounts: [
        {
          accountType: '401k' as const,
          currentBalance: 45000,
          annualContribution: 12000,
          employerMatch: 0.04,
          employerMatchLimit: 0.05,
        },
      ],
      expectedAnnualReturn: 0.07,
      inflationRate: 0.02,
      incomeIncreaseRate: 0.03,
      withdrawalStrategy: '4_percent_rule' as const,
    };

    const result = RetirementEngine.analyze(input);

    document.body.innerHTML = `
      <div id="results" class="hidden"></div>
      <div id="years-to-retirement"></div>
      <div id="total-savings"></div>
      <div id="total-contributions"></div>
      <div id="investment-growth"></div>
      <div id="employer-match"></div>
      <div id="income-replacement"></div>
    `;

    displayResults(result, input.retirementAge - input.currentAge);

    expect(document.getElementById('results')?.classList.contains('hidden')).toBe(false);
    expect(document.getElementById('years-to-retirement')?.textContent).toContain('years');
    expect(document.getElementById('income-replacement')?.innerHTML).toContain('Projected Annual');
  });
});
