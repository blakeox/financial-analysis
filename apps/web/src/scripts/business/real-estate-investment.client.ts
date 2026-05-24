/**
 * Real Estate Investment Analyzer Client Script
 */

import { storeAnalysisResult } from '../analysis/analysis-results';
import { renderMetricCards } from '../_shared/metric-card-html';
import {
  formatCurrency,
  hideError,
  hideLoading,
  showError,
  showLoading,
} from '../../utils/calculator-utilities';

function parseNumber(form: HTMLFormElement, name: string): number {
  const raw = (form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? '';
  const parsed = Number.parseFloat(raw.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseRate(form: HTMLFormElement, name: string): number {
  const pct = parseNumber(form, name);
  return pct > 1 ? pct / 100 : pct;
}

function displayResults(result: unknown): void {
  const summaryCards = document.getElementById('summary-cards');
  const resultsContainer = document.getElementById('results-container');
  const resultsSection = document.getElementById('results-section');

  if (!summaryCards || !resultsContainer || !resultsSection) return;

  const record = result && typeof result === 'object' ? (result as Record<string, unknown>) : {};
  const summary =
    record.summary && typeof record.summary === 'object'
      ? (record.summary as Record<string, unknown>)
      : record;

  const capRate = Number(summary.capRate) || 0;
  const cashOnCash = Number(summary.cashOnCashReturn) || 0;
  const monthlyCashFlow = Number(summary.monthlyCashFlow) || 0;
  const irr = Number(summary.irr) || 0;
  const annualNoi = Number(summary.annualNOI) || 0;

  const fmtPct = (v: number) => `${(v > 1 ? v : v * 100).toFixed(2)}%`;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Cap Rate',
      value: fmtPct(capRate),
      meta: annualNoi ? `NOI ${formatCurrency(annualNoi)}` : undefined,
      tone: capRate >= 0.06 ? 'emerald' : 'amber',
    },
    {
      title: 'Cash-on-Cash',
      value: fmtPct(cashOnCash),
      tone: cashOnCash >= 0.08 ? 'emerald' : 'violet',
    },
    {
      title: 'Monthly Cash Flow',
      value: formatCurrency(monthlyCashFlow),
      tone: monthlyCashFlow >= 0 ? 'emerald' : 'orange',
    },
    {
      title: 'IRR',
      value: irr ? fmtPct(irr) : '—',
      meta: irr ? 'hold period return' : 'add projections',
      tone: irr >= 0.1 ? 'emerald' : 'violet',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initRealEstateInvestmentCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const purchasePrice = parseNumber(form, 'purchasePrice');
      const downPayment = parseNumber(form, 'downPayment');
      const loanAmount =
        parseNumber(form, 'loanAmount') || Math.max(0, purchasePrice - downPayment);

      const input = {
        propertyInfo: {
          purchasePrice,
          propertyType:
            (form.elements.namedItem('propertyType') as HTMLSelectElement)?.value || 'residential',
        },
        financing: {
          downPayment,
          loanAmount,
          interestRate: parseRate(form, 'interestRate') || 0.07,
          loanTerm: 30,
          loanType: 'conventional' as const,
        },
        income: {
          monthlyRent: parseNumber(form, 'monthlyRent'),
          annualRentIncrease: 0.03,
          occupancyRate: 0.95,
          otherIncome: 0,
        },
        expenses: {
          propertyTaxes: parseNumber(form, 'propertyTaxes'),
          insurance: parseNumber(form, 'insurance'),
          maintenance: 0,
          propertyManagement: 0,
          utilities: 0,
          otherExpenses: 0,
          vacancyRate: 0.05,
        },
        projections: {
          holdingPeriod: 10,
          appreciationRate: 0.03,
          saleCosts: 0.06,
        },
        analysis: {
          includeCapRate: true,
          includeCashOnCash: true,
          includeIRR: true,
          includeNOI: true,
        },
      };

      const response = await fetch('/api/analyze-real-estate-investment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze real estate investment'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_real_estate_investment', result);
    } catch (error) {
      console.error('Real estate investment error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to analyze real estate investment'
      );
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRealEstateInvestmentCalculator);
} else {
  initRealEstateInvestmentCalculator();
}
