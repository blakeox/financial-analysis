/**
 * Credit Risk Analyzer Client Script
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

  const pd = Number(summary.pd) || 0;
  const pdPct = pd > 1 ? pd : pd * 100;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Probability of Default',
      value: `${pdPct.toFixed(2)}%`,
      tone: pdPct > 5 ? 'orange' : 'emerald',
    },
    {
      title: 'Expected Loss',
      value: formatCurrency(Number(summary.expectedLoss) || 0),
      tone: 'orange',
    },
    {
      title: 'Credit Rating',
      value: String(summary.creditRating ?? '—'),
      tone: 'violet',
    },
    {
      title: 'LGD',
      value: `${((Number(summary.lgd) || 0) > 1 ? Number(summary.lgd) : (Number(summary.lgd) || 0) * 100).toFixed(1)}%`,
      meta: String(summary.riskLevel ?? ''),
      tone: 'amber',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initCreditRiskAnalyzer(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const totalAssets = parseNumber(form, 'totalAssets');
      const totalDebt = parseNumber(form, 'totalDebt');

      const input = {
        borrowerInfo: { industry: 'general' },
        financials: {
          annualRevenue: parseNumber(form, 'annualRevenue'),
          ebitda: parseNumber(form, 'ebitda'),
          netIncome: parseNumber(form, 'netIncome'),
          totalDebt,
          totalAssets,
          cashAndEquivalents: totalAssets * 0.1,
          currentLiabilities: totalDebt * 0.4,
        },
        debtInfo: {
          exposureAtDefault: parseNumber(form, 'exposureAtDefault') || totalDebt,
          recoveryRate: parseRate(form, 'recoveryRate') || 0.4,
        },
        analysis: {
          includePD: true,
          includeLGD: true,
          includeEL: true,
          includeStressTesting: false,
        },
      };

      const response = await fetch('/api/analyze-credit-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { message?: string }).message || 'Failed to analyze credit risk');
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_credit_risk', result);
    } catch (error) {
      console.error('Credit Risk error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze credit risk');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCreditRiskAnalyzer);
} else {
  initCreditRiskAnalyzer();
}
