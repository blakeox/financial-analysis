/**
 * Debt Capacity Calculator Client Script
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

function parseRate(form: HTMLFormElement, name: string): number | undefined {
  const raw = (form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? '';
  if (!raw.trim()) return undefined;
  const pct = Number.parseFloat(raw.replace(/,/g, ''));
  if (!Number.isFinite(pct)) return undefined;
  return pct > 1 ? pct / 100 : pct;
}

function displayResults(result: unknown): void {
  const summaryCards = document.getElementById('summary-cards');
  const resultsContainer = document.getElementById('results-container');
  const resultsSection = document.getElementById('results-section');

  if (!summaryCards || !resultsContainer || !resultsSection) return;

  const record = result && typeof result === 'object' ? (result as Record<string, unknown>) : {};
  const maxLoan = Number(record.maxLoanAmount) || 0;
  const recommended = Number(record.recommendedLoanAmount) || 0;
  const monthlyCapacity = Number(record.monthlyPaymentCapacity) || 0;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Max Loan Amount',
      value: formatCurrency(maxLoan),
      meta: 'at 1.5x DSCR target',
      tone: maxLoan > 0 ? 'emerald' : 'orange',
    },
    {
      title: 'Recommended',
      value: formatCurrency(recommended),
      meta: '80% of max (safety buffer)',
      tone: 'violet',
    },
    {
      title: 'Monthly Capacity',
      value: formatCurrency(monthlyCapacity),
      meta: 'for new debt service',
      tone: 'amber',
    },
    {
      title: 'Requested vs Max',
      value:
        record.debtCapacityRatio !== undefined
          ? `${(Number(record.debtCapacityRatio) * 100).toFixed(0)}%`
          : '—',
      meta: 'of max capacity used',
      tone: 'violet',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initDebtCapacityCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const input = {
        financials: {
          annualEBITDA: parseNumber(form, 'annualEBITDA'),
          monthlyDebtPayments: parseNumber(form, 'monthlyDebtPayments'),
          expectedEBITDAIncrease: parseNumber(form, 'expectedEBITDAIncrease'),
        },
        loanPreferences: {
          preferredTerm: Math.round(parseNumber(form, 'preferredTerm')) || 5,
          preferredRate: parseRate(form, 'preferredRate'),
          loanType:
            (form.elements.namedItem('loanType') as HTMLSelectElement)?.value || 'term-loan',
        },
        requestedAmount: parseNumber(form, 'requestedAmount') || undefined,
      };

      const response = await fetch('/api/analyze-debt-capacity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to calculate debt capacity'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_debt_capacity', result);
    } catch (error) {
      console.error('Debt capacity error:', error);
      showError(error instanceof Error ? error.message : 'Failed to calculate debt capacity');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDebtCapacityCalculator);
} else {
  initDebtCapacityCalculator();
}
