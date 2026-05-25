/**
 * Insurance Needs Calculator Client Script
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

function buildInput(form: HTMLFormElement): Record<string, unknown> {
  const annualIncome = parseNumber(form, 'annualIncome');
  const netWorth = parseNumber(form, 'netWorth');
  const debtPayoff = parseNumber(form, 'debtPayoff');
  const lifeCoverage = parseNumber(form, 'lifeInsurance');
  const disabilityCoverage = parseNumber(form, 'disabilityInsurance');
  const ltcCoverage = parseNumber(form, 'longTermCareInsurance');
  const incomeReplacementYears = Math.round(parseNumber(form, 'incomeReplacementYears')) || 10;
  const replacementRatio = Math.min(1, Math.max(0.5, incomeReplacementYears / 15));

  return {
    personalInfo: {
      age: Math.round(parseNumber(form, 'age')) || 35,
      maritalStatus:
        (form.elements.namedItem('maritalStatus') as HTMLSelectElement)?.value || 'single',
      dependents: Math.round(parseNumber(form, 'dependents')),
      employmentStatus: 'employed',
      healthStatus: (form.elements.namedItem('healthStatus') as HTMLSelectElement)?.value || 'good',
      annualIncome,
      monthlyExpenses: annualIncome > 0 ? annualIncome / 12 : 0,
    },
    currentInsurance: {
      lifeInsurance: {
        termLife: { coverage: lifeCoverage, termYears: 20, monthlyPremium: 0 },
        wholeLife: { coverage: 0, cashValue: 0, monthlyPremium: 0 },
      },
      disabilityInsurance: {
        shortTerm: {
          coverage: disabilityCoverage,
          waitingPeriod: 0,
          benefitPeriod: 0,
          monthlyPremium: 0,
        },
        longTerm: { coverage: 0, waitingPeriod: 90, benefitPeriod: 0, monthlyPremium: 0 },
      },
      longTermCare: {
        coverage: ltcCoverage,
        dailyBenefit: 0,
        benefitPeriod: 0,
        eliminationPeriod: 90,
        monthlyPremium: 0,
      },
      healthInsurance: { monthlyPremium: 0, deductible: 0, outOfPocketMax: 0 },
    },
    financialSituation: {
      totalAssets: netWorth,
      totalDebts: debtPayoff,
      emergencyFund: netWorth * 0.1,
      retirementSavings: netWorth * 0.35,
      otherIncome: 0,
      socialSecurityBenefit: 0,
    },
    goals: {
      incomeReplacementRatio: replacementRatio,
      debtPayoffGoal: debtPayoff > 0,
      educationFunding: parseNumber(form, 'educationFunding'),
      retirementGoal: 0,
      legacyGoal: parseNumber(form, 'finalExpenses'),
    },
    analysis: {
      includeLifeInsurance: true,
      includeDisabilityInsurance: true,
      includeLongTermCare: true,
      includeHealthInsurance: false,
    },
  };
}

function displayResults(result: unknown): void {
  const resultsDiv = document.getElementById('insurance-results');
  const contentDiv = document.getElementById('insurance-results-content');
  if (!resultsDiv || !contentDiv) return;

  const record = result && typeof result === 'object' ? (result as Record<string, unknown>) : {};
  const summary =
    record.insuranceSummary && typeof record.insuranceSummary === 'object'
      ? (record.insuranceSummary as Record<string, unknown>)
      : {};

  contentDiv.innerHTML = renderMetricCards([
    {
      title: 'Recommended Coverage',
      value: formatCurrency(Number(summary.totalRecommendedCoverage) || 0),
      tone: 'violet',
    },
    {
      title: 'Coverage Gap',
      value: formatCurrency(Number(summary.totalCoverageGap) || 0),
      meta: Number(summary.totalCoverageGap) > 0 ? 'underinsured' : 'on track',
      tone: Number(summary.totalCoverageGap) > 0 ? 'orange' : 'emerald',
    },
    {
      title: 'Monthly Premiums',
      value: formatCurrency(Number(summary.totalMonthlyPremiums) || 0),
      tone: 'amber',
    },
    {
      title: 'Insurance Health',
      value: `${Number(summary.insuranceHealthScore) || 0}/100`,
      tone:
        Number(summary.insuranceHealthScore) >= 70
          ? 'emerald'
          : Number(summary.insuranceHealthScore) >= 50
            ? 'amber'
            : 'orange',
    },
  ]);

  resultsDiv.classList.remove('hidden');
  resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initInsuranceNeedsCalculator(): void {
  const form = document.getElementById('insurance-needs-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      showLoading();
      hideError();

      const response = await fetch('/api/analyze-insurance-needs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildInput(form)),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze insurance needs'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_insurance_needs', result);
    } catch (error) {
      console.error('Insurance needs error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze insurance needs');
    } finally {
      hideLoading();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initInsuranceNeedsCalculator);
} else {
  initInsuranceNeedsCalculator();
}
