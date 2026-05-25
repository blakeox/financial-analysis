/**
 * Charitable Giving Calculator Client Script
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
  const taxSavings = Number(record.totalTaxSavings) || 0;
  const impact =
    record.projectedImpact && typeof record.projectedImpact === 'object'
      ? (record.projectedImpact as Record<string, unknown>)
      : {};

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Tax Savings',
      value: formatCurrency(taxSavings),
      meta: 'estimated federal benefit',
      tone: 'emerald',
    },
    {
      title: 'Immediate Benefit',
      value: formatCurrency(Number(impact.immediateTaxBenefit) || taxSavings),
      tone: 'violet',
    },
    {
      title: 'Giving Method',
      value: String(record.optimalGivingStrategy ?? 'Optimized').slice(0, 24),
      meta: 'see full strategy below',
      tone: 'amber',
    },
    {
      title: 'Estate Impact',
      value: formatCurrency(Number(impact.estateTaxReduction) || 0),
      tone: 'violet',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initCharitableGivingCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const annualGiving = parseNumber(form, 'annualGivingAmount');
      const filingStatus =
        (form.elements.namedItem('filingStatus') as HTMLSelectElement)?.value || 'single';
      const agi = Math.max(annualGiving * 10, 100000);

      const input = {
        personalInfo: {
          age: Math.round(parseNumber(form, 'age')) || 45,
          filingStatus,
          adjustedGrossIncome: agi,
        },
        taxInfo: {
          federalTaxRate: parseRate(form, 'federalTaxRate') || 0.22,
          stateTaxRate: 0,
          itemizeDeductions: annualGiving > 14600,
          standardDeduction: filingStatus === 'married-joint' ? 29200 : 14600,
        },
        givingDetails: {
          annualGivingAmount: annualGiving,
          givingMethod:
            (form.elements.namedItem('givingMethod') as HTMLSelectElement)?.value || 'cash',
        },
        strategy: { optimizeFor: 'max-tax-benefit' as const },
        analysis: { compareMethods: true, includeMultiYearProjection: true, projectionYears: 5 },
      };

      const response = await fetch('/api/analyze-charitable-giving', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze charitable giving'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_charitable_giving', result);
    } catch (error) {
      console.error('Charitable Giving error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze charitable giving');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCharitableGivingCalculator);
} else {
  initCharitableGivingCalculator();
}
