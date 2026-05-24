/**
 * Disability Insurance Calculator Client Script
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
  const recommended = Number(record.recommendedCoverage) || Number(record.benefitAmount) || 0;
  const monthlyPremium = Number(record.monthlyPremium) || 0;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Recommended Coverage',
      value: formatCurrency(recommended),
      meta: 'annual benefit',
      tone: 'violet',
    },
    {
      title: 'Monthly Premium',
      value: formatCurrency(monthlyPremium),
      tone: 'amber',
    },
    {
      title: 'Annual Cost',
      value: formatCurrency(Number(record.totalCost) || monthlyPremium * 12),
      tone: 'orange',
    },
    {
      title: 'Elimination Period',
      value: `${Number(record.eliminationPeriod) || 90} days`,
      meta: String(record.benefitPeriod ?? 'To age 65'),
      tone: 'emerald',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initDisabilityInsuranceCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const annualIncome = parseNumber(form, 'annualIncome');
      const benefitAmount = parseNumber(form, 'benefitAmount') || annualIncome * 0.6;

      const input = {
        personalInfo: {
          age: Math.round(parseNumber(form, 'age')) || 35,
          occupation: 'General',
          occupationClass: 'professional',
          annualIncome,
          monthlyExpenses: parseNumber(form, 'monthlyExpenses') || annualIncome / 12,
        },
        currentCoverage: {
          hasGroupCoverage: false,
          groupCoverageAmount: 0,
          groupCoveragePercentage: 0.6,
          hasIndividualPolicy: benefitAmount > 0,
        },
        needsAnalysis: {
          targetReplacementIncome: 0.6,
          includeSocialSecurity: true,
          expectedSSDIBenefit: 0,
          includeOtherIncome: false,
          otherIncomeSources: 0,
        },
        policyOptions: {
          benefitAmount,
          benefitPeriod: 'to-age-65',
          eliminationPeriod: 90,
          definitionOfDisability: 'own-occupation',
          riders: {
            costOfLivingAdjustment: false,
            residualDisability: true,
            futureIncreaseOption: false,
            catastrophicDisability: false,
          },
          estimatedAnnualPremium: benefitAmount * 0.02,
        },
        analysis: {
          includeCoverageGapAnalysis: true,
          includeCostBenefitAnalysis: true,
          includeProbabilityAnalysis: true,
        },
      };

      const response = await fetch('/api/analyze-disability-insurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze disability insurance'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_disability_insurance', result);
    } catch (error) {
      console.error('Disability Insurance error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze disability insurance');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDisabilityInsuranceCalculator);
} else {
  initDisabilityInsuranceCalculator();
}
