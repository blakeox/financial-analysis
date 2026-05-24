/**
 * HELOC Analyzer Client Script
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

  const availableEquity = Number(summary.availableEquity) || 0;
  const monthlyPayment = Number(summary.monthlyPayment) || 0;
  const totalCost = Number(summary.totalCost) || 0;
  const creditLimit = Number(summary.helocCreditLimit) || 0;
  const equityPct = Number(summary.equityPercentage) || 0;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Available Equity',
      value: formatCurrency(availableEquity),
      meta: `${equityPct.toFixed(1)}% of home value`,
      tone: 'violet',
    },
    {
      title: 'Credit Limit',
      value: formatCurrency(creditLimit),
      tone: 'violet',
    },
    {
      title: 'Monthly Payment',
      value: formatCurrency(monthlyPayment),
      meta: 'amortizing after draw period',
      tone: monthlyPayment > 2500 ? 'orange' : 'emerald',
    },
    {
      title: 'Total Cost',
      value: formatCurrency(totalCost),
      tone: 'amber',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initHelocCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const drawAmount = parseNumber(form, 'drawAmount');

      const input = {
        propertyInfo: {
          currentHomeValue: parseNumber(form, 'currentHomeValue'),
          currentMortgageBalance: parseNumber(form, 'currentMortgageBalance'),
          mortgageInterestRate: parseRate(form, 'mortgageInterestRate'),
          yearsRemaining: Math.round(parseNumber(form, 'yearsRemaining')) || 30,
        },
        helocDetails: {
          creditLimit: parseNumber(form, 'creditLimit'),
          interestRate: parseRate(form, 'interestRate'),
          drawPeriod: Math.round(parseNumber(form, 'drawPeriod')) || 10,
          repaymentPeriod: Math.round(parseNumber(form, 'repaymentPeriod')) || 20,
          initialDraw: drawAmount,
          annualFee: 0,
        },
        usage: {
          purpose: (form.elements.namedItem('purpose') as HTMLSelectElement)?.value || 'other',
          drawAmount,
          drawTiming: 'immediate' as const,
        },
        comparison: {
          compareToRefinancing: true,
          compareToPersonalLoan: false,
        },
      };

      const response = await fetch('/api/analyze-heloc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { message?: string }).message || 'Failed to analyze HELOC');
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_heloc', result);
    } catch (error) {
      console.error('HELOC error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze HELOC');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHelocCalculator);
} else {
  initHelocCalculator();
}
