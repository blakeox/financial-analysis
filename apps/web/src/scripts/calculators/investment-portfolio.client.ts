/**
 * Investment Portfolio Analyzer Client Script
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function displayResults(result: unknown): void {
  const resultsDiv = document.getElementById('portfolio-results');
  const contentDiv = document.getElementById('portfolio-results-content');
  const summaryHost = document.getElementById('portfolio-summary-cards');

  if (!resultsDiv || !contentDiv) return;

  resultsDiv.classList.remove('hidden');

  const record = result && typeof result === 'object' ? (result as Record<string, unknown>) : {};
  const summary =
    record.summary && typeof record.summary === 'object'
      ? (record.summary as Record<string, unknown>)
      : record;
  const actual =
    summary.actualAllocation && typeof summary.actualAllocation === 'object'
      ? (summary.actualAllocation as Record<string, unknown>)
      : {};

  const currentValue = Number(summary.currentValue) || 0;
  const score = Number(summary.portfolioScore) || 0;
  const drift = Number(summary.allocationDrift) || 0;
  const stockPct = Number(actual.stocks) || 0;

  if (summaryHost) {
    summaryHost.innerHTML = renderMetricCards([
      {
        title: 'Portfolio Value',
        value: formatCurrency(currentValue),
        tone: 'primary',
      },
      {
        title: 'Fit Score',
        value: `${score}/100`,
        tone: score >= 80 ? 'emerald' : score >= 60 ? 'amber' : 'orange',
      },
      {
        title: 'Allocation Drift',
        value: `${drift.toFixed(1)}%`,
        tone: drift > 15 ? 'orange' : 'emerald',
      },
      {
        title: 'Stock Allocation',
        value: `${stockPct.toFixed(1)}%`,
        meta: 'current weight',
        tone: 'violet',
      },
    ]);
  }

  const recommendations = Array.isArray(record.recommendations)
    ? (record.recommendations as string[])
    : [];

  contentDiv.innerHTML =
    recommendations.length > 0
      ? `<ul class="list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">${recommendations
          .slice(0, 5)
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join('')}</ul>`
      : '<p class="text-sm text-slate-600 dark:text-slate-400">Allocation is within target bands.</p>';

  resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initInvestmentPortfolioCalculator(): void {
  const form = document.getElementById('investment-portfolio-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      showLoading();
      hideError();

      const formData = new FormData(form);
      const totalValue = parseFloat((formData.get('totalValue') as string) || '0');
      const targetStocks = parseFloat((formData.get('targetStocks') as string) || '70') / 100;
      const targetBonds = parseFloat((formData.get('targetBonds') as string) || '20') / 100;
      const targetCash = parseFloat((formData.get('targetCash') as string) || '10') / 100;
      const targetAlternatives = Math.max(0, 1 - targetStocks - targetBonds - targetCash);

      const input = {
        personalInfo: {
          age: parseInt((formData.get('age') as string) || '35', 10),
          maritalStatus: 'single',
          dependents: 0,
          employmentStatus: 'employed',
        },
        currentPortfolio: {
          totalValue,
          holdings: [
            {
              symbol: 'SAMPLE',
              name: 'Sample Stock',
              shares: 100,
              currentPrice: totalValue > 0 ? (totalValue * targetStocks) / 100 : 0,
              sector: 'Technology',
              assetClass: 'stock',
            },
          ],
          cashReserve: totalValue * targetCash,
        },
        goals: {
          targetAllocation: {
            stocks: targetStocks,
            bonds: targetBonds,
            cash: targetCash,
            alternatives: targetAlternatives,
          },
          riskTolerance: (formData.get('riskTolerance') as string) || 'moderate',
          timeHorizon: 20,
          rebalancingFrequency: 'annually',
        },
      };

      const response = await fetch('/api/analyze-investment-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze investment portfolio'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_investment_portfolio', result);
    } catch (error) {
      console.error('Investment portfolio error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze investment portfolio');
    } finally {
      hideLoading();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initInvestmentPortfolioCalculator);
} else {
  initInvestmentPortfolioCalculator();
}
