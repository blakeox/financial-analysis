/**
 * Portfolio Optimizer Client Script
 */

import { storeAnalysisResult } from '../analysis/analysis-results';
import { renderMetricCards } from '../_shared/metric-card-html';
import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

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

  const currentReturn = Number(summary.currentReturn) || 0;
  const optimalReturn = Number(summary.optimalReturn) || 0;
  const currentPct = currentReturn > 1 ? currentReturn : currentReturn * 100;
  const optimalPct = optimalReturn > 1 ? optimalReturn : optimalReturn * 100;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Current Return',
      value: `${currentPct.toFixed(1)}%`,
      tone: 'amber',
    },
    {
      title: 'Optimal Return',
      value: `${optimalPct.toFixed(1)}%`,
      tone: 'emerald',
    },
    {
      title: 'Current Risk',
      value: `${((Number(summary.currentRisk) || 0) * 100).toFixed(1)}%`,
      tone: 'orange',
    },
    {
      title: 'Optimal Risk',
      value: `${((Number(summary.optimalRisk) || 0) * 100).toFixed(1)}%`,
      tone: 'violet',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initPortfolioOptimizer(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const holdingCount = Math.min(
        20,
        Math.max(1, Math.round(parseNumber(form, 'holdingCount')) || 3)
      );
      const symbols = ['SPY', 'BND', 'VXUS', 'VTI', 'AGG', 'QQQ', 'IWM', 'GLD'];
      const prices = [450, 75, 55, 240, 98, 380, 200, 180];
      const currentHoldings = Array.from({ length: holdingCount }, (_, i) => ({
        symbol: symbols[i % symbols.length],
        shares: 100,
        currentPrice: prices[i % prices.length],
        assetClass: i % 2 === 0 ? 'stock' : 'bond',
      }));
      const totalValue = currentHoldings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0);

      const input = {
        portfolio: { currentHoldings, totalValue },
        constraints: {
          riskTolerance:
            (form.elements.namedItem('riskTolerance') as HTMLSelectElement)?.value || 'moderate',
          minAllocation: parseRate(form, 'minAllocation'),
          maxAllocation: parseRate(form, 'maxAllocation') || 1,
        },
        marketData: {},
        analysis: { includeEfficientFrontier: true, includeRebalancing: false },
      };

      const response = await fetch('/api/analyze-portfolio-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { message?: string }).message || 'Failed to optimize portfolio');
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_portfolio_optimization', result);
    } catch (error) {
      console.error('Portfolio Optimization error:', error);
      showError(error instanceof Error ? error.message : 'Failed to optimize portfolio');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPortfolioOptimizer);
} else {
  initPortfolioOptimizer();
}
