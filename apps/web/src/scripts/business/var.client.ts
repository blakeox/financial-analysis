/**
 * VaR Calculator Client Script
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
      title: 'Value at Risk',
      value: formatCurrency(Number(summary.var) || 0),
      meta: `${Number(summary.varPercent || 0).toFixed(2)}% of portfolio`,
      tone: 'orange',
    },
    {
      title: 'Confidence',
      value: `${((Number(summary.confidenceLevel) || 0.95) * 100).toFixed(0)}%`,
      tone: 'violet',
    },
    {
      title: 'Horizon',
      value: `${Number(summary.timeHorizon) || 1} day(s)`,
      tone: 'amber',
    },
    {
      title: 'Method',
      value: String(summary.method ?? 'historical'),
      tone: 'emerald',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initVaRCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const positionCount = Math.min(
        20,
        Math.max(1, Math.round(parseNumber(form, 'positionCount')) || 3)
      );
      const symbols = ['SPY', 'BND', 'VXUS'];
      const prices = [450, 75, 55];
      const positions = Array.from({ length: positionCount }, (_, i) => ({
        symbol: symbols[i % symbols.length],
        quantity: 100,
        currentPrice: prices[i % prices.length],
        assetClass: 'stock' as const,
      }));
      const totalValue = positions.reduce((sum, p) => sum + p.quantity * p.currentPrice, 0);

      const input = {
        portfolio: { positions, totalValue },
        parameters: {
          confidenceLevel: parseRate(form, 'confidenceLevel') || 0.95,
          timeHorizon: Math.round(parseNumber(form, 'timeHorizon')) || 1,
          method: (form.elements.namedItem('method') as HTMLSelectElement)?.value || 'historical',
        },
        marketData: {
          historicalReturns: Array.from({ length: 252 }, () => (Math.random() - 0.5) * 0.02),
        },
        analysis: { includeStressTesting: false, includeBacktesting: false },
      };

      const response = await fetch('/api/analyze-var', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { message?: string }).message || 'Failed to calculate VaR');
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_var', result);
    } catch (error) {
      console.error('VaR error:', error);
      showError(error instanceof Error ? error.message : 'Failed to calculate VaR');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVaRCalculator);
} else {
  initVaRCalculator();
}
