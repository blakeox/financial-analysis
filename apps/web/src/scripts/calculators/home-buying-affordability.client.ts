/**
 * Home Buying Affordability Calculator Client Script
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
  const resultsDiv = document.getElementById('home-buying-results');
  const contentDiv = document.getElementById('home-buying-results-content');

  if (!resultsDiv || !contentDiv) return;

  const record = result && typeof result === 'object' ? (result as Record<string, unknown>) : {};
  const summary =
    record.summary && typeof record.summary === 'object'
      ? (record.summary as Record<string, unknown>)
      : record;

  const maxPrice = Number(summary.maxAffordablePrice) || 0;
  const monthlyPayment = Number(summary.monthlyPayment) || 0;
  const dti = Number(summary.debtToIncomeRatio) || 0;
  const score = String(summary.affordabilityScore ?? '');

  contentDiv.innerHTML = `<div class="grid grid-cols-1 gap-4">${renderMetricCards([
    {
      title: 'Max Affordable Price',
      value: formatCurrency(maxPrice),
      meta: score ? `score: ${score}` : undefined,
      tone: 'emerald',
    },
    {
      title: 'Monthly Payment',
      value: formatCurrency(monthlyPayment),
      meta: 'PITI estimate',
      tone: 'violet',
    },
    {
      title: 'Debt-to-Income',
      value: `${dti.toFixed(1)}%`,
      meta: dti > 43 ? 'above typical lender max' : 'within common limits',
      tone: dti > 43 ? 'orange' : dti > 36 ? 'amber' : 'emerald',
    },
    {
      title: 'Recommended Down Payment',
      value: formatCurrency(Number(summary.recommendedDownPayment) || 0),
      tone: 'violet',
    },
  ])}</div>`;

  resultsDiv.classList.remove('hidden');
  resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initHomeBuyingAffordabilityCalculator(): void {
  const form = document.getElementById('home-buying-affordability-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      showLoading();
      hideError();

      const input = {
        personalInfo: {
          age: Math.round(parseNumber(form, 'age')) || 35,
          maritalStatus: 'married' as const,
          dependents: 0,
          employmentStatus: 'employed' as const,
          yearsEmployed: 5,
          creditScore: Math.round(parseNumber(form, 'creditScore')) || 700,
        },
        finances: {
          annualIncome: parseNumber(form, 'annualIncome'),
          monthlyDebtPayments: parseNumber(form, 'monthlyDebtPayments'),
          downPaymentAvailable: parseNumber(form, 'downPaymentAvailable'),
          emergencyFund: parseNumber(form, 'emergencyFund'),
          otherAssets: 0,
        },
        homePreferences: {
          targetPrice: parseNumber(form, 'targetPrice'),
          location: 'Unknown',
          homeType:
            (form.elements.namedItem('homeType') as HTMLSelectElement)?.value || 'single-family',
          mustHaves: [],
          niceToHaves: [],
        },
        goals: {
          timeline: 2,
          riskTolerance: 'moderate' as const,
          priority: 'affordability' as const,
        },
      };

      const response = await fetch('/api/analyze-home-buying-affordability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze home buying affordability'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_home_buying_affordability', result);
    } catch (error) {
      console.error('Home buying affordability error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to analyze home buying affordability'
      );
    } finally {
      hideLoading();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHomeBuyingAffordabilityCalculator);
} else {
  initHomeBuyingAffordabilityCalculator();
}
