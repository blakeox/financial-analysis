/**
 * Retirement Planning Engine Client Script
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

function buildInput(form: HTMLFormElement): Record<string, unknown> {
  return {
    personalInfo: {
      age: Math.round(parseNumber(form, 'age')) || 35,
      retirementAge: Math.round(parseNumber(form, 'retirementAge')) || 65,
      lifeExpectancy: Math.round(parseNumber(form, 'lifeExpectancy')) || 85,
      maritalStatus:
        (form.elements.namedItem('maritalStatus') as HTMLSelectElement)?.value || 'married',
      dependents: 0,
    },
    currentAccounts: [
      {
        type: '401k',
        balance: parseNumber(form, 'currentBalance') || 50000,
        annualContribution: parseNumber(form, 'annualContribution') || 20000,
        employerMatch: 0.5,
        expectedReturn: 0.07,
      },
    ],
    income: {
      currentAnnual: parseNumber(form, 'currentAnnual'),
      expectedGrowthRate: parseRate(form, 'expectedGrowthRate'),
      socialSecurity: parseNumber(form, 'socialSecurity') || undefined,
    },
    expenses: {
      currentAnnual: parseNumber(form, 'currentAnnualExpenses'),
      retirementAnnual: parseNumber(form, 'retirementAnnualExpenses'),
      inflationRate: parseRate(form, 'inflationRate') || 0.03,
    },
    goals: {
      targetRetirementIncome: parseNumber(form, 'targetRetirementIncome'),
      riskTolerance:
        (form.elements.namedItem('riskTolerance') as HTMLSelectElement)?.value || 'moderate',
      taxStrategy: 'balanced',
    },
  };
}

function displayResults(result: unknown): void {
  const resultsDiv = document.getElementById('retirement-planning-results');
  const contentDiv = document.getElementById('retirement-planning-results-content');

  if (!resultsDiv || !contentDiv) return;

  const record = result && typeof result === 'object' ? (result as Record<string, unknown>) : {};
  const summary =
    record.summary && typeof record.summary === 'object'
      ? (record.summary as Record<string, unknown>)
      : record;

  const readiness = Number(summary.retirementReadinessScore) || 0;
  const projected = Number(summary.projectedRetirementBalance) || 0;
  const yearsToRetirement = Number(summary.yearsToRetirement) || 0;
  const incomeNeeds = Number(summary.retirementIncomeNeeds) || 0;
  const currentBalance = Number(summary.currentTotalBalance) || 0;

  contentDiv.innerHTML = `<div class="grid grid-cols-1 gap-4">${renderMetricCards([
    {
      title: 'Readiness Score',
      value: `${readiness}/100`,
      meta: readiness >= 80 ? 'on track' : readiness >= 60 ? 'needs work' : 'critical gap',
      tone: readiness >= 80 ? 'emerald' : readiness >= 60 ? 'amber' : 'orange',
    },
    {
      title: 'Years to Retirement',
      value: `${yearsToRetirement}`,
      tone: 'violet',
    },
    {
      title: 'Projected Balance',
      value: formatCurrency(projected),
      meta: `current ${formatCurrency(currentBalance)}`,
      tone: 'emerald',
    },
    {
      title: 'Annual Income Need',
      value: formatCurrency(incomeNeeds),
      meta: 'in retirement',
      tone: 'violet',
    },
  ])}</div>`;

  resultsDiv.classList.remove('hidden');
  resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initRetirementPlanningCalculator(): void {
  const form = document.getElementById('retirement-planning-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      showLoading();
      hideError();

      const response = await fetch('/api/analyze-retirement-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildInput(form)),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze retirement planning'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_retirement_planning', result);
    } catch (error) {
      console.error('Retirement planning error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze retirement planning');
    } finally {
      hideLoading();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRetirementPlanningCalculator);
} else {
  initRetirementPlanningCalculator();
}
