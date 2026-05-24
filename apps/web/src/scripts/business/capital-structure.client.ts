/**
 * Capital Structure Optimizer Client Script
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

  const currentWacc = Number(summary.currentWACC) || 0;
  const optimalWacc = Number(summary.optimalWACC) || currentWacc;
  const waccPct = currentWacc > 1 ? currentWacc : currentWacc * 100;
  const optimalPct = optimalWacc > 1 ? optimalWacc : optimalWacc * 100;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Current WACC',
      value: `${waccPct.toFixed(2)}%`,
      tone: 'violet',
    },
    {
      title: 'Optimal WACC',
      value: `${optimalPct.toFixed(2)}%`,
      meta: waccPct > optimalPct ? 'room to improve' : 'near optimal',
      tone: waccPct > optimalPct + 0.5 ? 'emerald' : 'amber',
    },
    {
      title: 'Debt / Equity',
      value: `${Number(summary.currentDebtToEquity).toFixed(2)}x`,
      tone: 'orange',
    },
    {
      title: 'Debt Capacity',
      value: formatCurrency(Number(summary.debtCapacity) || 0),
      tone: 'amber',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initCapitalStructureCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const marketCap = parseNumber(form, 'marketCap');
      const currentDebt = parseNumber(form, 'currentDebt');
      const annualEBITDA = parseNumber(form, 'annualEBITDA');
      const stockPrice = marketCap > 0 ? 50 : 1;
      const sharesOutstanding = marketCap > 0 ? marketCap / stockPrice : 1;

      const input = {
        companyInfo: {
          marketCap,
          currentDebt,
          cashAndEquivalents: marketCap * 0.05,
          sharesOutstanding,
          stockPrice,
        },
        financials: {
          annualEBITDA,
          annualEBIT: annualEBITDA * 0.85,
          netIncome: annualEBITDA * 0.55,
          taxRate: parseRate(form, 'taxRate') || 0.21,
          annualInterestExpense: currentDebt * 0.05,
        },
        marketData: {
          riskFreeRate: parseRate(form, 'riskFreeRate') || 0.04,
          marketRiskPremium: 0.06,
          beta: parseNumber(form, 'beta') || 1,
        },
        analysis: {
          includeWACCOptimization: true,
          includeDebtCapacity: true,
          includeCreditRatingImpact: true,
          includeDividendPolicy: false,
        },
      };

      const response = await fetch('/api/analyze-capital-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to optimize capital structure'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_capital_structure', result);
    } catch (error) {
      console.error('Capital Structure error:', error);
      showError(error instanceof Error ? error.message : 'Failed to optimize capital structure');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCapitalStructureCalculator);
} else {
  initCapitalStructureCalculator();
}
