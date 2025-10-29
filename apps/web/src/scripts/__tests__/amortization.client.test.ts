import { AmortizationAnalyzer } from '@financial-analysis/analysis';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  handleSuccess,
  parseAmortizationInput,
  renderSchedule,
  renderSummaryCards,
} from '../amortization.client';

describe('amortization.client', () => {
  const buildFormData = (overrides: Record<string, string> = {}) => {
    const defaults: Record<string, string> = {
      principal: '350000',
      annualRate: '4.5',
      termMonths: '360',
      extraMonthlyPayment: '150',
      propertyTaxAnnual: '3600',
      homeInsuranceAnnual: '1200',
      hoaMonthly: '75',
      downPayment: '20000',
      closingCosts: '4500',
    };

    const formData = new FormData();
    Object.entries({ ...defaults, ...overrides }).forEach(([key, value]) => {
      formData.set(key, value);
    });
    return formData;
  };

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('parseAmortizationInput converts rates and validates inputs', () => {
    const input = parseAmortizationInput(buildFormData());

    expect(input.principal).toBe(350000);
    expect(input.annualRate).toBeCloseTo(0.045);
    expect(input.termMonths).toBe(360);
    expect(input.extraMonthlyPayment).toBe(150);
    expect(input.propertyTaxAnnual).toBe(3600);
    expect(input.downPayment).toBe(20000);
    expect(input.paymentFrequency).toBe('monthly');
  });

  it('parseAmortizationInput throws on invalid loan amount', () => {
    expect(() => parseAmortizationInput(buildFormData({ principal: '0' }))).toThrow(
      'Please enter a valid loan amount'
    );
  });

  it('renderSummaryCards populates summary metrics', () => {
    const input = parseAmortizationInput(buildFormData());
    const result = AmortizationAnalyzer.analyze(input);

    document.body.innerHTML = '<div id="summary-cards"></div>';
    const container = document.getElementById('summary-cards');

    renderSummaryCards(result, input.termMonths, container);

    expect(container?.innerHTML).toMatch(/Monthly Payment/);
    expect(container?.innerHTML).toMatch(/Total Interest/);
  });

  it('renderSchedule outputs amortization rows with highlights', () => {
    const input = parseAmortizationInput(buildFormData());
    const result = AmortizationAnalyzer.analyze(input);

    document.body.innerHTML = '<table><tbody id="table-body"></tbody></table>';
    const tableBody = document.getElementById('table-body');

    renderSchedule(result.schedule, tableBody);

    const rows = tableBody?.querySelectorAll('tr') ?? [];
    expect(rows.length).toBeGreaterThan(0);
    const twelfthRow = rows[11];
    expect(twelfthRow?.className).toContain('bg-blue-50');
  });

  it('handleSuccess stores results and reveals container', () => {
    const input = parseAmortizationInput(buildFormData());
    const result = AmortizationAnalyzer.analyze(input);

    document.body.innerHTML = `
      <div id="results-container" class="hidden"></div>
      <div id="summary-cards"></div>
      <table><tbody id="table-body"></tbody></table>
    `;

    handleSuccess(result, input);

    expect(document.getElementById('results-container')?.classList.contains('hidden')).toBe(false);
    expect(document.getElementById('summary-cards')?.innerHTML).toMatch(/Monthly Payment/);
  });
});
