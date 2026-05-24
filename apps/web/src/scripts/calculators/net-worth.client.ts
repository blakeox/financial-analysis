/**
 * Net Worth Tracker Client Script
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

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Net Worth',
      value: formatCurrency(Number(summary.currentNetWorth) || 0),
      meta: `${formatCurrency(Number(summary.totalAssets) || 0)} assets`,
      tone: 'violet',
    },
    {
      title: 'Total Liabilities',
      value: formatCurrency(Number(summary.totalLiabilities) || 0),
      tone: 'amber',
    },
    {
      title: 'Projected Net Worth',
      value: formatCurrency(Number(summary.projectedNetWorth) || 0),
      meta: summary.yearsToTarget
        ? `target in ${summary.yearsToTarget} years`
        : 'based on growth assumptions',
      tone: 'emerald',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initNetWorthCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const input = {
        assets: {
          cash: parseNumber(form, 'cash'),
          investments: parseNumber(form, 'investments'),
          realEstate: parseNumber(form, 'realEstate'),
          retirementAccounts: parseNumber(form, 'retirementAccounts'),
          businessValue: parseNumber(form, 'businessValue'),
          otherAssets: parseNumber(form, 'otherAssets'),
        },
        liabilities: {
          mortgages: parseNumber(form, 'mortgages'),
          creditCardDebt: parseNumber(form, 'creditCardDebt'),
          studentLoans: parseNumber(form, 'studentLoans'),
          autoLoans: parseNumber(form, 'autoLoans'),
          otherDebt: parseNumber(form, 'otherDebt'),
        },
        projections: {
          assetGrowthRate: parseNumber(form, 'assetGrowthRate') / 100 || 0.07,
          debtPaydownRate: 0.05,
          yearsToProject: 10,
        },
        goals: {
          includeMilestones: true,
        },
      };

      const response = await fetch('/api/analyze-net-worth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { message?: string }).message || 'Failed to analyze net worth');
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_net_worth', result);

      document.getElementById('results')?.classList.remove('hidden');
    } catch (error) {
      console.error('Net Worth error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze net worth');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNetWorthCalculator);
  } else {
    initNetWorthCalculator();
  }
}
