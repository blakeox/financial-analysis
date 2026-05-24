/**
 * Depreciation Calculator Client Script
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

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Total Depreciation',
      value: formatCurrency(Number(summary.totalDepreciation) || 0),
      tone: 'violet',
    },
    {
      title: 'Tax Savings',
      value: formatCurrency(Number(summary.totalTaxSavings) || 0),
      tone: 'emerald',
    },
    {
      title: 'Book Value',
      value: formatCurrency(Number(summary.bookValue) || 0),
      tone: 'amber',
    },
    {
      title: 'Asset Cost',
      value: formatCurrency(Number(summary.assetCost) || 0),
      tone: 'orange',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initDepreciationCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const purchaseCost = parseNumber(form, 'purchaseCost');
      const usefulLife = Math.round(parseNumber(form, 'usefulLife')) || 5;

      const input = {
        assetInfo: {
          purchaseDate: new Date().toISOString().split('T')[0],
          purchaseCost,
          salvageValue: 0,
          usefulLife,
          assetClass: 'equipment',
          businessUsePercentage: 1,
        },
        depreciationMethod:
          (form.elements.namedItem('depreciationMethod') as HTMLSelectElement)?.value ||
          'straight-line',
        taxInfo: {
          taxYear: new Date().getFullYear(),
          federalTaxRate: parseRate(form, 'federalTaxRate') || 0.21,
          stateTaxRate: 0,
          section179Limit: 1080000,
          bonusDepreciationPercentage: 0.6,
        },
        analysis: {
          includeSchedule: true,
          includeTaxSavings: true,
          includeMethodComparison: false,
          projectionYears: usefulLife,
        },
      };

      const response = await fetch('/api/analyze-depreciation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze depreciation'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_depreciation', result);
    } catch (error) {
      console.error('Depreciation error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze depreciation');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDepreciationCalculator);
} else {
  initDepreciationCalculator();
}
