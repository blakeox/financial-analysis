/**
 * Roth vs Traditional IRA Calculator Client Script
 */

import { storeAnalysisResult } from '../analysis/analysis-results';
import { renderMetricCards } from '../_shared/metric-card-html';
import { formatCurrency, hideError, showError } from '../../utils/calculator-utilities';

function parseDecimal(value: FormDataEntryValue | null, fallback: number): number {
  const parsed = parseFloat((value as string) || '');
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseOptionalBoolean(value: FormDataEntryValue | null, fallback: boolean): boolean {
  if (value === null) return fallback;
  if (value === 'on' || value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

export const initRothVsTraditionalIRACalculator = (): void => {
  const form = document.getElementById('calculator-form') as HTMLFormElement;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement;

    try {
      hideError();
      if (calculateBtn) {
        calculateBtn.disabled = true;
        calculateBtn.textContent = 'Analyzing...';
      }

      const formData = new FormData(form);
      const input = {
        personalInfo: {
          age: parseInt((formData.get('age') as string) || '35', 10),
          retirementAge: parseInt((formData.get('retirementAge') as string) || '65', 10),
          currentTaxBracket: parseDecimal(formData.get('currentMarginalTaxRate'), 0.22),
          expectedRetirementTaxBracket: parseDecimal(
            formData.get('expectedRetirementMarginalTaxRate'),
            0.15
          ),
        },
        contributionDetails: {
          annualContribution: parseDecimal(formData.get('annualContribution'), 0),
          catchUpContribution: parseDecimal(formData.get('catchUpContribution'), 0),
          yearsToContribute: parseInt((formData.get('yearsToContribute') as string) || '30', 10),
        },
        accountDetails: {
          currentTraditionalBalance: parseDecimal(formData.get('currentTraditionalBalance'), 0),
          currentRothBalance: parseDecimal(formData.get('currentRothBalance'), 0),
          expectedReturn: parseDecimal(formData.get('expectedReturn'), 0.07),
        },
        taxInfo: {
          currentMarginalTaxRate: parseDecimal(formData.get('currentMarginalTaxRate'), 0.22),
          expectedRetirementMarginalTaxRate: parseDecimal(
            formData.get('expectedRetirementMarginalTaxRate'),
            0.15
          ),
          stateTaxRate: parseDecimal(formData.get('stateTaxRate'), 0),
          stateTaxDeduction: parseOptionalBoolean(formData.get('stateTaxDeduction'), false),
        },
        withdrawalStrategy: {
          annualWithdrawalAmount: parseDecimal(formData.get('annualWithdrawalAmount'), 0),
          withdrawalStartAge: parseDecimal(formData.get('withdrawalStartAge'), 65),
          includeRequiredMinimumDistributions: parseOptionalBoolean(
            formData.get('includeRequiredMinimumDistributions'),
            true
          ),
          rmdsStartAge: parseInt((formData.get('rmdsStartAge') as string) || '73', 10),
        },
        analysis: {
          includeConversionAnalysis: parseOptionalBoolean(
            formData.get('includeConversionAnalysis'),
            true
          ),
          includeTaxBracketOptimization: parseOptionalBoolean(
            formData.get('includeTaxBracketOptimization'),
            true
          ),
          projectionYears: parseInt((formData.get('projectionYears') as string) || '30', 10),
        },
      };

      const response = await fetch('/api/analyze-roth-vs-traditional-ira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze Roth vs Traditional IRA');
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_roth_vs_traditional_ira', result);
    } catch (error) {
      console.error('Roth vs Traditional IRA error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to analyze Roth vs Traditional IRA'
      );
    } finally {
      if (calculateBtn) {
        calculateBtn.disabled = false;
        calculateBtn.textContent = '📊 Calculate Scenarios';
      }
    }
  });
};

function displayResults(result: unknown): void {
  const resultsSection = document.getElementById('results-section');
  const summaryCards = document.getElementById('summary-cards');
  const resultsContainer = document.getElementById('results-container');

  if (!summaryCards || !resultsContainer) return;

  resultsSection?.classList.remove('hidden');
  resultsContainer.classList.remove('hidden');

  const record = result && typeof result === 'object' ? (result as Record<string, unknown>) : {};
  const comparison =
    record.comparison && typeof record.comparison === 'object'
      ? (record.comparison as Record<string, unknown>)
      : {};
  const recommendation =
    record.recommendation && typeof record.recommendation === 'object'
      ? (record.recommendation as Record<string, unknown>)
      : {};
  const better = String(comparison.betterOption ?? recommendation.recommendedAccount ?? '—');
  const rothAfterTax = Number(comparison.rothAfterTaxValue) || 0;
  const traditionalAfterTax = Number(comparison.traditionalAfterTaxValue) || 0;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Recommended',
      value: better === 'roth' ? 'Roth IRA' : better === 'traditional' ? 'Traditional IRA' : better,
      meta: String(recommendation.rationale ?? 'Based on after-tax projections'),
      tone: 'primary',
      spanCols: 2,
    },
    {
      title: 'Roth (after tax)',
      value: formatCurrency(rothAfterTax),
      tone: better === 'roth' ? 'emerald' : 'violet',
    },
    {
      title: 'Traditional (after tax)',
      value: formatCurrency(traditionalAfterTax),
      tone: better === 'traditional' ? 'emerald' : 'violet',
    },
  ]);

  resultsContainer.innerHTML = `
    <div class="fa-callout-success p-4">
      <p class="fa-callout-copy-success">
        Your comparison is ready. Review the summary above and ask the assistant about conversion timing or tax bracket changes.
      </p>
    </div>
  `;

  resultsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('/calculator/roth-vs-traditional-ira')) {
      initRothVsTraditionalIRACalculator();
    }
  });
}
