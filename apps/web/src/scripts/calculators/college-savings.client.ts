/**
 * College Savings Planner Client Script
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
  const numberOfChildren = Math.max(1, Math.round(parseNumber(form, 'numberOfChildren')) || 1);
  const children = [];
  for (let i = 0; i < numberOfChildren; i++) {
    children.push({
      name: `Child ${i + 1}`,
      age: 10 + i * 2,
      expectedCollegeStartAge: 18,
      expectedGraduationAge: 22,
      collegeType: 'public' as const,
      specialNeeds: false,
    });
  }

  return {
    familyInfo: {
      numberOfChildren,
      children,
      stateOfResidence:
        (form.elements.namedItem('stateOfResidence') as HTMLInputElement)?.value || 'CA',
      maritalStatus:
        (form.elements.namedItem('maritalStatus') as HTMLSelectElement)?.value || 'married',
    },
    currentSavings: {
      total529Balance: parseNumber(form, 'total529Balance'),
      totalCoverdellBalance: 0,
      totalOtherSavings: 0,
      monthlyContribution: parseNumber(form, 'monthlyContribution'),
    },
    goals: {
      targetCoverage: parseNumber(form, 'targetCoverage') / 100 || 1,
      riskTolerance:
        (form.elements.namedItem('riskTolerance') as HTMLSelectElement)?.value || 'moderate',
      investmentStrategy: 'age-based' as const,
    },
  };
}

function displayResults(result: unknown): void {
  const resultsDiv = document.getElementById('college-savings-results');
  const contentDiv = document.getElementById('college-savings-results-content');

  if (!resultsDiv || !contentDiv) return;

  const record = result && typeof result === 'object' ? (result as Record<string, unknown>) : {};
  const summary =
    record.summary && typeof record.summary === 'object'
      ? (record.summary as Record<string, unknown>)
      : record;

  const totalCost = Number(summary.totalProjectedCost) || 0;
  const gap = Number(summary.savingsGap) || 0;
  const monthlyNeeded = Number(summary.requiredMonthlyContribution) || 0;
  const successPct = Number(summary.successProbability) || 0;
  const currentSavings = Number(summary.totalCurrentSavings) || 0;

  contentDiv.innerHTML = `<div class="grid grid-cols-1 gap-4">${renderMetricCards([
    {
      title: 'Projected Costs',
      value: formatCurrency(totalCost),
      tone: 'violet',
    },
    {
      title: 'Current Savings',
      value: formatCurrency(currentSavings),
      tone: 'violet',
    },
    {
      title: 'Funding Gap',
      value: gap > 0 ? formatCurrency(gap) : 'On track',
      meta: gap > 0 ? `save ${formatCurrency(monthlyNeeded)}/mo` : undefined,
      tone: gap > 0 ? 'orange' : 'emerald',
    },
    {
      title: 'Success Probability',
      value: `${successPct.toFixed(0)}%`,
      meta: 'meeting savings goals',
      tone: successPct >= 85 ? 'emerald' : successPct >= 70 ? 'amber' : 'orange',
    },
  ])}</div>`;

  resultsDiv.classList.remove('hidden');
  resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initCollegeSavingsCalculator(): void {
  const form = document.getElementById('college-savings-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      showLoading();
      hideError();

      const response = await fetch('/api/analyze-college-savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildInput(form)),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze college savings'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_college_savings', result);
    } catch (error) {
      console.error('College savings error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze college savings');
    } finally {
      hideLoading();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCollegeSavingsCalculator);
} else {
  initCollegeSavingsCalculator();
}
