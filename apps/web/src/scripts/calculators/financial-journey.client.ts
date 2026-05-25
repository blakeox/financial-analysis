/**
 * Financial Journey Client Script
 */

import { storeAnalysisResult } from '../analysis/analysis-results';
import { renderMetricCards } from '../_shared/metric-card-html';
import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

function parseNumber(form: HTMLFormElement, name: string): number {
  const raw = (form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? '';
  const parsed = Number.parseFloat(raw.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapInvestmentRisk(tolerance: string): 'conservative' | 'moderate' | 'aggressive' {
  if (tolerance === 'conservative' || tolerance === 'aggressive') return tolerance;
  return 'moderate';
}

function buildInput(form: HTMLFormElement): Record<string, unknown> {
  const annualIncome = parseNumber(form, 'annualIncome');
  const monthlyExpenses = parseNumber(form, 'monthlyExpenses');
  const totalDebt = parseNumber(form, 'totalDebt');
  const emergencyFund = parseNumber(form, 'emergencyFund');
  const retirementSavings = parseNumber(form, 'retirementSavings');
  const otherAssets = parseNumber(form, 'otherAssets');
  const riskTolerance =
    (form.elements.namedItem('riskTolerance') as HTMLSelectElement)?.value || 'moderate';

  return {
    personalInfo: {
      age: Math.round(parseNumber(form, 'age')) || 35,
      maritalStatus:
        (form.elements.namedItem('maritalStatus') as HTMLSelectElement)?.value || 'single',
      dependents: Math.round(parseNumber(form, 'dependents')),
      employmentStatus:
        (form.elements.namedItem('employmentStatus') as HTMLSelectElement)?.value || 'employed',
      annualIncome,
      monthlyExpenses,
    },
    currentFinancials: {
      totalAssets: emergencyFund + retirementSavings + otherAssets,
      totalDebts: totalDebt,
      emergencyFund,
      monthlySavings: Math.max(0, annualIncome / 12 - monthlyExpenses),
    },
    financialGoals: {
      shortTermGoals: [],
      mediumTermGoals: [],
      longTermGoals: [],
    },
    journeyStage: 'getting-started',
    analysis: {
      includeCrossModelAnalysis: true,
      includeProgressTracking: true,
      includeMilestoneAnalysis: true,
      includeActionPlan: true,
      includeRiskAssessment: true,
      timeHorizon: Math.round(parseNumber(form, 'timeHorizon')) || 10,
    },
    riskTolerance: {
      investmentRisk: mapInvestmentRisk(riskTolerance),
      debtTolerance: 'medium',
      emergencyTolerance: 'medium',
    },
  };
}

function displayResults(result: unknown): void {
  const resultsDiv = document.getElementById('journey-results');
  const contentDiv = document.getElementById('journey-results-content');
  if (!resultsDiv || !contentDiv) return;

  const record = result && typeof result === 'object' ? (result as Record<string, unknown>) : {};
  const overview =
    record.journeyOverview && typeof record.journeyOverview === 'object'
      ? (record.journeyOverview as Record<string, unknown>)
      : {};

  const health = Number(overview.overallFinancialHealth) || 0;
  const progress = Number(overview.progressPercentage) || 0;

  contentDiv.innerHTML = renderMetricCards([
    {
      title: 'Health Score',
      value: `${health}/100`,
      tone: health >= 70 ? 'emerald' : health >= 50 ? 'amber' : 'orange',
    },
    {
      title: 'Current Stage',
      value: String(overview.currentStage ?? '—').replace(/-/g, ' '),
      tone: 'primary',
    },
    {
      title: 'Next Stage',
      value: String(overview.nextStage ?? '—').replace(/-/g, ' '),
      tone: 'violet',
    },
    {
      title: 'Progress',
      value: `${progress.toFixed(0)}%`,
      meta: String(overview.estimatedTimeToNextStage ?? '').slice(0, 28),
      tone: 'emerald',
    },
  ]);

  resultsDiv.classList.remove('hidden');
  resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initFinancialJourneyCalculator(): void {
  const form = document.getElementById('financial-journey-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      showLoading();
      hideError();

      const response = await fetch('/api/analyze-financial-journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildInput(form)),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze financial journey'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_financial_journey', result);
    } catch (error) {
      console.error('Financial journey error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze financial journey');
    } finally {
      hideLoading();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFinancialJourneyCalculator);
} else {
  initFinancialJourneyCalculator();
}
