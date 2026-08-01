/**
 * Refinancing Calculator Client Script
 */

import { storeAnalysisResult } from '../analysis/analysis-results';
import { renderTheAnswer } from '../_shared/answer-html';
import { bindAssumptionChipClicks } from '../_shared/assumption-chip-html';
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

  const monthlySavings = Number(summary.monthlySavings) || 0;
  const netBenefit = Number(summary.netBenefit) || 0;
  const breakEvenMonths = Number(summary.breakEvenMonths) || 0;
  const newPayment = Number(summary.newMonthlyPayment) || 0;

  const savingsAbs = Math.abs(monthlySavings);
  const meaning =
    monthlySavings >= 0
      ? breakEvenMonths > 0
        ? `You save this each month versus your current payment — break-even in about ${breakEvenMonths} months.`
        : 'You save this each month versus your current payment.'
      : 'Your new payment is higher by this amount each month — review term and closing costs.';

  summaryCards.innerHTML = `${renderTheAnswer({
    label: monthlySavings >= 0 ? 'Monthly savings' : 'Monthly increase',
    value: formatCurrency(savingsAbs),
    meaning,
    assumptions: [
      ...(breakEvenMonths > 0
        ? [
            {
              label: `${breakEvenMonths} mo BE`,
              fieldName: 'closingCosts',
              title: 'Break-even vs closing costs',
            },
          ]
        : []),
      {
        label: formatCurrency(newPayment),
        title: 'New monthly payment',
      },
    ],
    cta: {
      label: 'Review net benefit',
      attrs: 'data-action="scroll-refi-detail"',
    },
  })}
    <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      ${renderMetricCards([
        {
          title: 'New Payment',
          value: formatCurrency(newPayment),
          tone: 'violet',
        },
        {
          title: 'Break-even',
          value: breakEvenMonths > 0 ? `${breakEvenMonths} mo` : '—',
          meta: breakEvenMonths > 0 ? 'to recover closing costs' : 'add cost details',
          tone: breakEvenMonths > 0 && breakEvenMonths <= 24 ? 'emerald' : 'orange',
        },
        {
          title: 'Net Benefit',
          value: formatCurrency(netBenefit),
          tone: netBenefit > 0 ? 'emerald' : 'amber',
        },
      ])}
    </div>`;
  bindAssumptionChipClicks(summaryCards);
  summaryCards
    .querySelector('[data-action="scroll-refi-detail"]')
    ?.addEventListener('click', () => {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initRefinancingCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const refinanceType =
        (form.elements.namedItem('refinanceType') as HTMLSelectElement)?.value || 'rate-and-term';

      const input = {
        currentMortgage: {
          principalBalance: parseNumber(form, 'principalBalance'),
          interestRate: parseRate(form, 'currentInterestRate'),
          remainingTerm: Math.round(parseNumber(form, 'remainingTerm')) || 30,
          monthlyPayment: parseNumber(form, 'monthlyPayment'),
        },
        newMortgage: {
          interestRate: parseRate(form, 'newInterestRate'),
          term: Math.round(parseNumber(form, 'newTerm')) || 30,
          refinanceType,
          cashOutAmount: 0,
          cashInAmount: 0,
        },
        costs: {
          closingCosts: parseNumber(form, 'closingCosts'),
          points: 0,
          appraisalFee: 0,
          otherFees: 0,
        },
        goals: {
          priority: 'lower-rate' as const,
          includeBreakEvenAnalysis: true,
        },
      };

      const response = await fetch('/api/analyze-refinancing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { message?: string }).message || 'Failed to analyze refinancing');
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_refinancing', result);
    } catch (error) {
      console.error('Refinancing error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze refinancing');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRefinancingCalculator);
} else {
  initRefinancingCalculator();
}
