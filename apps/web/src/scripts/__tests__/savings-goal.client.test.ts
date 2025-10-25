import { beforeEach, describe, expect, it } from 'vitest';
import { SavingsGoalEngine } from '@financial-analysis/analysis';
import {
  displayResults,
  handleSubmit,
  parseNumber,
  toRecommendationText,
} from '../savings-goal.client';

describe('savings-goal.client', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('toRecommendationText extracts readable recommendations', () => {
    expect(toRecommendationText('Increase contributions')).toBe('Increase contributions');
    expect(toRecommendationText({ recommendation: 'Automate transfers ' })).toBe('Automate transfers');
    expect(toRecommendationText({})).toBeNull();
  });

  it('parseNumber flags invalid values', () => {
    expect(Number.isNaN(parseNumber(''))).toBe(true);
  });

  it('displayResults writes summary data and bullet list', () => {
    const result = SavingsGoalEngine.analyze({
      goalAmount: 15000,
      currentSavings: 2000,
      monthlyContribution: 400,
      annualReturnRate: 0.04,
      inflationRate: 0.02,
      goalType: 'general',
    });

    document.body.innerHTML = `
      <div id="results" class="hidden"></div>
      <div id="months-to-goal"></div>
      <div id="years-to-goal"></div>
      <div id="target-date"></div>
      <div id="total-saved"></div>
      <div id="total-contributions"></div>
      <div id="total-interest"></div>
      <div id="effective-rate"></div>
      <ul id="recommendations-list"></ul>
    `;

    displayResults(result);

    const currencyFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });

    expect(document.getElementById('results')?.classList.contains('hidden')).toBe(false);
    expect(document.getElementById('months-to-goal')?.textContent).toBe(
      String(result.summary.monthsToGoal),
    );
    expect(document.getElementById('years-to-goal')?.textContent).toBe(
      `${result.summary.yearsToGoal} years`,
    );
    expect(document.getElementById('total-saved')?.textContent).toBe(
      currencyFormatter.format(Number.parseFloat(result.summary.finalBalance)),
    );
    expect(document.getElementById('target-date')?.textContent).not.toBe('');
  });

  it('handleSubmit computes results and toggles UI states', async () => {
    document.body.innerHTML = `
      <form id="savings-goal-form">
        <input name="goalAmount" value="15000" />
        <input name="currentSavings" value="2000" />
        <input name="monthlyContribution" value="400" />
        <input name="annualInterestRate" value="4" />
        <input name="annualInflationRate" value="2" />
      </form>
      <div id="loading" class="hidden"></div>
      <div id="error" class="hidden"></div>
      <div id="error-message"></div>
      <div id="results" class="hidden"></div>
      <div id="months-to-goal"></div>
      <div id="years-to-goal"></div>
      <div id="target-date"></div>
      <div id="total-saved"></div>
      <div id="total-contributions"></div>
      <div id="total-interest"></div>
      <div id="effective-rate"></div>
      <ul id="recommendations-list"></ul>
    `;

    const form = document.getElementById('savings-goal-form') as HTMLFormElement;
    const button = document.createElement('button');

    const refs = {
      loading: document.getElementById('loading'),
      error: document.getElementById('error'),
      errorMessage: document.getElementById('error-message'),
      results: document.getElementById('results'),
    };

    await handleSubmit(form, button, refs);

    expect(button.disabled).toBe(false);
    expect(refs.loading?.classList.contains('hidden')).toBe(true);
    expect(refs.error?.classList.contains('hidden')).toBe(true);
    expect(refs.results?.classList.contains('hidden')).toBe(false);
  expect(document.getElementById('effective-rate')?.textContent).toMatch(/%/);
  expect(document.getElementById('total-contributions')?.textContent).toMatch(/\$/);
  });

  it('handleSubmit surfaces validation errors', async () => {
    document.body.innerHTML = `
      <form id="savings-goal-form">
        <input name="goalAmount" value="" />
        <input name="currentSavings" value="" />
        <input name="monthlyContribution" value="" />
        <input name="annualInterestRate" value="4" />
        <input name="annualInflationRate" value="2" />
      </form>
      <div id="loading" class="hidden"></div>
      <div id="error" class="hidden"></div>
      <div id="error-message"></div>
      <div id="results" class="hidden"></div>
    `;

    const form = document.getElementById('savings-goal-form') as HTMLFormElement;
    const refs = {
      loading: document.getElementById('loading'),
      error: document.getElementById('error'),
      errorMessage: document.getElementById('error-message'),
      results: document.getElementById('results'),
    };

    await handleSubmit(form, null, refs);

    expect(refs.error?.classList.contains('hidden')).toBe(false);
    expect(refs.errorMessage?.textContent).toMatch(/valid numeric inputs/);
  });
});
