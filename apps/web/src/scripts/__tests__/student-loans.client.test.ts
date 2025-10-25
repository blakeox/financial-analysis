import { beforeEach, describe, expect, it } from 'vitest';
import { StudentLoanEngine } from '@financial-analysis/analysis';
import {
  collectLoans,
  displayResults,
  handleSubmit,
  parseNumber,
} from '../student-loans.client';

describe('student-loans.client', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('collectLoans converts raw form data into inputs', () => {
    const formData = new FormData();
    formData.set('loan-name-0', 'Loan A');
    formData.set('loan-balance-0', '12000');
    formData.set('loan-rate-0', '5.5');
    formData.set('loan-minimum-0', '140');
    formData.set('loan-type-0', 'federal_unsubsidized');

    formData.set('loan-name-1', '');
    formData.set('loan-balance-1', 'oops');

    const loans = collectLoans(formData, 2);
    expect(loans).toHaveLength(1);
    expect(loans[0]).toMatchObject({
      name: 'Loan A',
      balance: 12000,
      interestRate: 0.055,
      minimumPayment: 140,
      loanType: 'federal_unsubsidized',
    });
  });

  it('parseNumber returns NaN for invalid inputs', () => {
    expect(Number.isNaN(parseNumber('abc'))).toBe(true);
  });

  it('displayResults renders summary details and payoff order', () => {
    const result = StudentLoanEngine.analyze({
      loans: [
        { name: 'Loan A', balance: 12000, interestRate: 0.055, minimumPayment: 140, loanType: 'federal_unsubsidized' },
        { name: 'Loan B', balance: 8000, interestRate: 0.045, minimumPayment: 110, loanType: 'private' },
      ],
      extraMonthlyPayment: 200,
      paymentStrategy: 'avalanche',
      forgivenessEligible: false,
    });

    document.body.innerHTML = `
      <div id="results" class="hidden"></div>
      <div id="total-balance"></div>
      <div id="total-interest"></div>
      <div id="monthly-payment"></div>
      <div id="payoff-time"></div>
      <div id="payoff-order"></div>
    `;

    displayResults(result);

    const currencyFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });

    expect(document.getElementById('results')?.classList.contains('hidden')).toBe(false);
    expect(document.getElementById('total-balance')?.textContent).toBe(
      currencyFormatter.format(Number.parseFloat(result.input.totalBalance)),
    );
    expect(document.getElementById('total-interest')?.textContent).toBe(
      currencyFormatter.format(Number.parseFloat(result.summary.totalInterestPaid)),
    );
    expect(document.getElementById('monthly-payment')?.textContent).toBe(
      currencyFormatter.format(Number.parseFloat(result.summary.averageMonthlyPayment)),
    );
    expect(document.querySelectorAll('#payoff-order div').length).toBeGreaterThan(0);
  });

  it('handleSubmit computes payoff plan and updates UI state', async () => {
    document.body.innerHTML = `
      <form id="loan-form">
        <input name="loan-name-0" value="Loan A" />
        <input name="loan-balance-0" value="12000" />
        <input name="loan-rate-0" value="5.5" />
        <input name="loan-minimum-0" value="140" />
        <select name="loan-type-0">
          <option value="federal_unsubsidized" selected>Federal Unsubsidized</option>
        </select>
        <input name="extraMonthlyPayment" value="150" />
        <select name="paymentStrategy">
          <option value="avalanche" selected>Avalanche</option>
        </select>
      </form>
      <div id="loading" class="hidden"></div>
      <div id="error" class="hidden"></div>
      <div id="error-message"></div>
      <div id="results" class="hidden"></div>
      <div id="total-balance"></div>
      <div id="total-interest"></div>
      <div id="monthly-payment"></div>
      <div id="payoff-time"></div>
      <div id="payoff-order"></div>
    `;

    const form = document.getElementById('loan-form') as HTMLFormElement;
    const loanCountRef = { value: 1 };
    const refs = {
      loading: document.getElementById('loading'),
      error: document.getElementById('error'),
      errorMessage: document.getElementById('error-message'),
      results: document.getElementById('results'),
    };

    await handleSubmit(form, loanCountRef, refs);

    expect(refs.loading?.classList.contains('hidden')).toBe(true);
    expect(refs.error?.classList.contains('hidden')).toBe(true);
    expect(refs.results?.classList.contains('hidden')).toBe(false);
    expect(document.getElementById('payoff-time')?.textContent).toContain('months');
  });

  it('handleSubmit reports validation errors when no loans provided', async () => {
    document.body.innerHTML = `
      <form id="loan-form"></form>
      <div id="loading" class="hidden"></div>
      <div id="error" class="hidden"></div>
      <div id="error-message"></div>
      <div id="results" class="hidden"></div>
    `;

    const form = document.getElementById('loan-form') as HTMLFormElement;
    const loanCountRef = { value: 0 };
    const refs = {
      loading: document.getElementById('loading'),
      error: document.getElementById('error'),
      errorMessage: document.getElementById('error-message'),
      results: document.getElementById('results'),
    };

    await handleSubmit(form, loanCountRef, refs);

    expect(refs.error?.classList.contains('hidden')).toBe(false);
    expect(refs.errorMessage?.textContent).toMatch(/at least one loan/);
  });
});
