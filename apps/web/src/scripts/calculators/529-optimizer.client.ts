/**
 * 529 Plan Optimizer Client Script
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

  const totalCosts = Number(summary.totalEducationCosts) || 0;
  const rawProjected = summary.projectedBalance ?? summary.projected529Balance;
  const projected =
    typeof rawProjected === 'object' && rawProjected !== null && 'toNumber' in rawProjected
      ? Number((rawProjected as { toNumber: () => number }).toNumber())
      : Number(rawProjected) || 0;
  const shortfall = Number(summary.shortfall) || 0;
  const optimalState = String(summary.optimalState ?? '');

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Education Costs',
      value: formatCurrency(totalCosts),
      tone: 'violet',
    },
    {
      title: 'Projected 529 Balance',
      value: formatCurrency(projected),
      tone: shortfall > 0 ? 'amber' : 'emerald',
    },
    {
      title: 'Funding Gap',
      value: shortfall > 0 ? formatCurrency(shortfall) : 'On track',
      meta: shortfall > 0 ? 'increase contributions' : 'covers estimated costs',
      tone: shortfall > 0 ? 'orange' : 'emerald',
    },
    {
      title: 'Best State Plan',
      value: optimalState || 'Compare plans',
      tone: 'violet',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function init529OptimizerCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const annualContribution = parseNumber(form, 'annualContribution');
      const stateOfResidence =
        (form.elements.namedItem('stateOfResidence') as HTMLInputElement)?.value || 'CA';

      const input = {
        personalInfo: {
          stateOfResidence,
          filingStatus:
            (form.elements.namedItem('filingStatus') as HTMLSelectElement)?.value ||
            'married-joint',
          stateTaxRate: 0,
        },
        children: [
          {
            age: 10,
            yearsUntilCollege: 8,
            expectedCollegeCost: 120000,
            collegeType: 'public-in-state' as const,
          },
        ],
        current529Accounts: [],
        contributionPlan: {
          annualContribution,
          contributionIncrease: 0.03,
          lumpSumContributions: [],
        },
        financialAid: {
          expectFinancialAid: true,
          expectedAidPercentage: 0.3,
          includeAidImpact: true,
        },
        strategy: {
          optimizeFor: 'max-tax-benefit' as const,
          includeMultiStateComparison: true,
          includeCoverdellESA: false,
        },
        analysis: {
          includeProjection: true,
          includeShortfallAnalysis: true,
          includeRolloverAnalysis: false,
        },
      };

      const response = await fetch('/api/analyze-529-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze 529 plan optimization'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_529_optimizer', result);
    } catch (error) {
      console.error('529 optimizer error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze 529 plan optimization');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init529OptimizerCalculator);
} else {
  init529OptimizerCalculator();
}
