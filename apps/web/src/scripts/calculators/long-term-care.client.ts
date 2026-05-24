/**
 * Long-Term Care Planning Calculator Client Script
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

  const lifetimeCost = Number(summary.estimatedLifetimeCost ?? summary.totalLifetimeCost) || 0;
  const shortfall = Number(summary.selfFundingShortfall) || 0;
  const coverage = Number(summary.insuranceCoverage) || 0;
  const strategy = String(summary.recommendedStrategy ?? 'hybrid');

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Lifetime Care Cost',
      value: formatCurrency(lifetimeCost),
      tone: 'violet',
    },
    {
      title: 'Funding Shortfall',
      value: shortfall > 0 ? formatCurrency(shortfall) : 'Covered',
      meta: shortfall > 0 ? 'self-funding gap' : 'assets + insurance',
      tone: shortfall > 0 ? 'orange' : 'emerald',
    },
    {
      title: 'Insurance Coverage',
      value: formatCurrency(coverage),
      tone: 'violet',
    },
    {
      title: 'Strategy',
      value: strategy.replace(/-/g, ' '),
      tone: 'amber',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initLongTermCareCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const age = Math.round(parseNumber(form, 'age')) || 60;
      const annualCareCost = parseNumber(form, 'annualCareCost');
      const currentAssets = parseNumber(form, 'currentAssets');

      const input = {
        personalInfo: {
          age,
          gender: (form.elements.namedItem('gender') as HTMLSelectElement)?.value || 'female',
          healthStatus:
            (form.elements.namedItem('healthStatus') as HTMLSelectElement)?.value || 'good',
          familyHistory: { hasLTCNeeds: false, averageLTCDuration: 3 },
        },
        careNeeds: {
          expectedCareStartAge: Math.min(85, age + 20),
          expectedCareDuration: 3,
          careType: 'mixed' as const,
          annualCareCost,
          careCostInflation: 0.05,
        },
        insuranceOptions: { hasLTCInsurance: false },
        financialResources: {
          currentAssets,
          annualIncome: 0,
          expectedRetirementAssets: currentAssets,
          otherInsurance: { hasMedicaid: false, hasMedicare: true, hasHybridPolicy: false },
        },
        strategy: { fundingMethod: 'hybrid' as const },
        analysis: { includeProbabilityAnalysis: true, includeScenarioAnalysis: true },
      };

      const response = await fetch('/api/analyze-long-term-care', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze long-term care planning'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_long_term_care', result);
    } catch (error) {
      console.error('Long-term care error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to analyze long-term care planning'
      );
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLongTermCareCalculator);
} else {
  initLongTermCareCalculator();
}
