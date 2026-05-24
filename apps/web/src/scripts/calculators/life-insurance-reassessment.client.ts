/**
 * Life Insurance Reassessment Calculator Client Script
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

  const gap = Number(summary.coverageGap) || 0;
  const needed = Number(summary.totalNeeded) || 0;
  const current = Number(summary.currentCoverage) || 0;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Coverage Needed',
      value: formatCurrency(needed),
      tone: 'violet',
    },
    {
      title: 'Current Coverage',
      value: formatCurrency(current),
      tone: 'amber',
    },
    {
      title: 'Coverage Gap',
      value: formatCurrency(gap),
      meta: gap > 0 ? 'underinsured' : 'adequate',
      tone: gap > 0 ? 'orange' : 'emerald',
    },
    {
      title: 'Action',
      value: String(summary.recommendation ?? 'maintain'),
      tone: gap > 0 ? 'orange' : 'emerald',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initLifeInsuranceReassessmentCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const annualIncome = parseNumber(form, 'annualIncome');
      const totalDebt = parseNumber(form, 'totalDebt');
      const dependents = Math.round(parseNumber(form, 'dependents'));

      const input = {
        personalInfo: {
          age: Math.round(parseNumber(form, 'age')) || 40,
          healthStatus: 'good',
          smoker: false,
          gender:
            (form.elements.namedItem('gender') as HTMLSelectElement)?.value === 'female'
              ? 'female'
              : 'male',
        },
        currentPolicies: [],
        financialSituation: {
          annualIncome,
          totalAssets: annualIncome * 5,
          totalDebt,
          monthlyExpenses: annualIncome > 0 ? annualIncome / 12 : 0,
          dependents,
          yearsUntilRetirement: Math.max(5, 65 - (Math.round(parseNumber(form, 'age')) || 40)),
        },
        needsAnalysis: {
          incomeReplacement: { yearsOfIncome: 10, replacementPercentage: 0.7 },
          debtPayoff: { mortgageBalance: totalDebt * 0.7, otherDebt: totalDebt * 0.3 },
          educationFunding: { childrenCount: dependents, educationCostPerChild: 50000 },
          finalExpenses: 15000,
          estateTaxes: 0,
        },
        analysis: {
          includeCoverageGapAnalysis: true,
          includePolicyOptimization: true,
          includeConversionAnalysis: true,
          includeTermVsPermanent: true,
        },
      };

      const response = await fetch('/api/analyze-life-insurance-reassessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze life insurance reassessment'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_life_insurance_reassessment', result);
    } catch (error) {
      console.error('Life Insurance Reassessment error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to analyze life insurance reassessment'
      );
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLifeInsuranceReassessmentCalculator);
} else {
  initLifeInsuranceReassessmentCalculator();
}
