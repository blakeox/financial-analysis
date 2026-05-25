/**
 * Working Capital Optimizer Client Script
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

  const netWc = Number(summary.workingCapital) || 0;
  const currentRatio = Number(summary.currentRatio) || 0;
  const quickRatio = Number(summary.quickRatio) || 0;
  const ccc = Number(summary.cashConversionCycle) || 0;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Net Working Capital',
      value: formatCurrency(netWc),
      tone: netWc >= 0 ? 'emerald' : 'orange',
    },
    {
      title: 'Current Ratio',
      value: `${currentRatio.toFixed(2)}x`,
      meta: currentRatio >= 1.5 ? 'strong' : currentRatio >= 1 ? 'adequate' : 'tight',
      tone: currentRatio >= 1.5 ? 'emerald' : currentRatio >= 1 ? 'amber' : 'orange',
    },
    {
      title: 'Quick Ratio',
      value: `${quickRatio.toFixed(2)}x`,
      tone: 'violet',
    },
    {
      title: 'Cash Conversion',
      value: ccc ? `${ccc.toFixed(0)} days` : '—',
      tone: ccc > 60 ? 'amber' : 'emerald',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initWorkingCapitalCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const input = {
        companyInfo: { annualRevenue: parseNumber(form, 'annualRevenue') },
        currentAssets: {
          cash: parseNumber(form, 'cash'),
          accountsReceivable: parseNumber(form, 'accountsReceivable'),
          inventory: parseNumber(form, 'inventory'),
        },
        currentLiabilities: {
          accountsPayable: parseNumber(form, 'accountsPayable'),
          shortTermDebt: parseNumber(form, 'shortTermDebt'),
        },
        operatingMetrics: {},
        analysis: {
          includeCashConversionCycle: true,
          includeOptimization: true,
          includeLiquidityAnalysis: true,
        },
      };

      const response = await fetch('/api/analyze-working-capital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze working capital'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_working_capital', result);
    } catch (error) {
      console.error('Working capital error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze working capital');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWorkingCapitalCalculator);
} else {
  initWorkingCapitalCalculator();
}
