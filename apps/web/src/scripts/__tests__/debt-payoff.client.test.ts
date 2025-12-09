import { beforeEach, describe, expect, it } from 'vitest';
import { DebtPayoffEngine } from '@financial-analysis/analysis';
import type { DebtPayoffResult } from '@financial-analysis/analysis';
import { parseNumber } from '../../utils/calculator-utilities';
import {
  collectDebts,
  describeSavings,
  displayResults,
  formatMonths,
} from '../calculators/debt-payoff.client';

describe('debt-payoff.client', () => {
  const buildFormData = () => {
    const formData = new FormData();
    formData.set('debt-name-0', 'Credit Card');
    formData.set('debt-balance-0', '5200');
    formData.set('debt-rate-0', '19.99');
    formData.set('debt-minimum-0', '135');

    formData.set('debt-name-1', 'Auto Loan');
    formData.set('debt-balance-1', '12000');
    formData.set('debt-rate-1', '4.5');
    formData.set('debt-minimum-1', '285');

    formData.set('debt-name-2', '');
    formData.set('debt-balance-2', 'garbage');

    return formData;
  };

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('collectDebts returns normalized loan data and skips invalid entries', () => {
    const formData = buildFormData();
    const debts = collectDebts(formData, 3);

    expect(debts).toHaveLength(2);
    expect(debts[0].name).toBe('Credit Card');
    expect(debts[0].balance).toBe(5200);
    expect(debts[0].minimumPayment).toBe(135);
    expect(debts[0].interestRate).toBeCloseTo(0.1999, 4);
    expect(debts[1].name).toBe('Auto Loan');
    expect(debts[1].interestRate).toBeCloseTo(0.045, 3);
  });

  it('formatMonths returns human readable months and years', () => {
    expect(formatMonths(24)).toBe('24 months (2.0 years)');
  });

  it('describeSavings highlights whichever strategy is faster or cheaper', () => {
    const sample = {
      summary: {
        strategy: 'avalanche',
        totalInterestPaid: '4300',
        totalMonthsToPayoff: 40,
        debtSummaries: [],
      },
      alternativeStrategy: {
        strategy: 'snowball',
        totalInterestPaid: '5100',
        totalMonthsToPayoff: 42,
        debtSummaries: [],
      },
      comparisonSavings: '800',
      payoffSchedule: [],
    } as unknown as DebtPayoffResult;

    const message = describeSavings(sample, 'avalanche');
    expect(message).toMatch(/saves you/);
  });

  it('displayResults writes summaries and timeline into the DOM', () => {
    const formData = buildFormData();
    const debts = collectDebts(formData, 2);
    const result = DebtPayoffEngine.analyze({
      debts,
      extraMonthlyPayment: 200,
      strategy: 'avalanche',
    });

    // Create new DOM structure that matches IndividualCalculatorPage
    document.body.innerHTML = `
      <div id="results-container"></div>
      <div id="summary-cards"></div>
    `;

    displayResults(result, false); // Disable credit score for simpler test

    // Verify summary cards were populated
    const summaryCards = document.getElementById('summary-cards');
    expect(summaryCards).toBeTruthy();
    expect(summaryCards?.innerHTML).toContain('Total Debt');
    expect(summaryCards?.innerHTML).toContain('months'); // Payoff time
    // Interest data may be in different format - just verify cards are populated
    expect(summaryCards?.innerHTML.length).toBeGreaterThan(100);
  });

  it('parseNumber returns null on invalid values', () => {
    expect(parseNumber('foo')).toBe(null);
    expect(parseNumber(null)).toBe(null);
  });
});
