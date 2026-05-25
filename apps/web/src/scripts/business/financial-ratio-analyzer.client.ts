/**
 * Financial Ratio Analyzer Client Script
 */

import { storeAnalysisResult } from '../analysis/analysis-results';
import { renderMetricCards } from '../_shared/metric-card-html';
import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

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

  const currentRatio = Number(summary.currentRatio) || 0;
  const quickRatio = Number(summary.quickRatio) || 0;
  const roe = Number(summary.roe) || 0;
  const roePct = roe > 1 ? roe : roe * 100;
  const debtToEquity = Number(summary.debtToEquity) || 0;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Current Ratio',
      value: `${currentRatio.toFixed(2)}x`,
      tone: currentRatio >= 1.5 ? 'emerald' : currentRatio >= 1 ? 'amber' : 'orange',
    },
    {
      title: 'Quick Ratio',
      value: `${quickRatio.toFixed(2)}x`,
      tone: 'violet',
    },
    {
      title: 'ROE',
      value: `${roePct.toFixed(1)}%`,
      tone: roePct >= 15 ? 'emerald' : 'amber',
    },
    {
      title: 'Debt / Equity',
      value: `${debtToEquity.toFixed(2)}x`,
      tone: debtToEquity > 2 ? 'orange' : 'violet',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initFinancialRatioAnalyzer(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const currentAssets = parseNumber(form, 'currentAssets');
      const totalAssets = parseNumber(form, 'totalAssets');
      const currentLiabilities = parseNumber(form, 'currentLiabilities');
      const totalLiabilities = parseNumber(form, 'totalLiabilities');
      const totalEquity = parseNumber(form, 'totalEquity');
      const revenue = parseNumber(form, 'revenue');
      const netIncome = parseNumber(form, 'netIncome');
      const cogs = revenue * 0.6;

      const input = {
        companyInfo: {},
        financialStatements: {
          balanceSheet: {
            currentAssets,
            totalAssets,
            currentLiabilities,
            totalLiabilities,
            totalEquity,
            cash: currentAssets * 0.15,
            accountsReceivable: currentAssets * 0.35,
            inventory: currentAssets * 0.25,
            accountsPayable: currentLiabilities * 0.5,
            shortTermDebt: currentLiabilities * 0.3,
            longTermDebt: Math.max(0, totalLiabilities - currentLiabilities),
          },
          incomeStatement: {
            revenue,
            costOfGoodsSold: cogs,
            grossProfit: revenue - cogs,
            operatingExpenses: revenue - cogs - netIncome,
            ebitda: netIncome * 1.15,
            ebit: netIncome * 1.05,
            netIncome,
          },
          cashFlowStatement: {
            operatingCashFlow: netIncome * 1.1,
            capitalExpenditures: revenue * 0.05,
            freeCashFlow: netIncome,
          },
        },
        marketData: {},
        analysis: {
          includeLiquidityRatios: true,
          includeProfitabilityRatios: true,
          includeEfficiencyRatios: true,
          includeLeverageRatios: true,
          includeMarketRatios: false,
          includeBenchmarking: true,
        },
      };

      const response = await fetch('/api/analyze-financial-ratio-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze financial ratios'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_financial_ratio_analyzer', result);
    } catch (error) {
      console.error('Financial ratio analyzer error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze financial ratios');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFinancialRatioAnalyzer);
} else {
  initFinancialRatioAnalyzer();
}
