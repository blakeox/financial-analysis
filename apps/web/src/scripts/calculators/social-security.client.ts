/**
 * Social Security Optimizer Client Script
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

  const optimalAge = Number(summary.optimalClaimingAge) || 67;
  const maxLifetime = Number(summary.maximumLifetimeBenefit) || 0;
  const pia = Number(summary.primaryInsuranceAmount) || 0;
  const fra = Number(summary.fullRetirementAge) || 67;
  const breakEvenAge = Number(summary.breakEvenAge) || 0;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Optimal Claiming Age',
      value: `${optimalAge}`,
      meta: `FRA ${fra}`,
      tone: optimalAge >= 70 ? 'emerald' : 'violet',
    },
    {
      title: 'Monthly Benefit (PIA)',
      value: formatCurrency(pia),
      tone: 'violet',
    },
    {
      title: 'Max Lifetime Benefits',
      value: formatCurrency(maxLifetime),
      tone: 'emerald',
    },
    {
      title: 'Break-even Age',
      value: breakEvenAge > 0 ? `${breakEvenAge}` : '—',
      meta: breakEvenAge > 0 ? 'vs early claiming' : 'add earnings history',
      tone: breakEvenAge > 0 ? 'amber' : 'orange',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initSocialSecurityCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const birthDate =
        (form.elements.namedItem('birthDate') as HTMLInputElement)?.value || '1970-01-01';

      const input = {
        personalInfo: {
          birthDate,
          currentAge: Math.round(parseNumber(form, 'currentAge')) || 65,
          fullRetirementAge: parseNumber(form, 'fullRetirementAge') || 67,
          lifeExpectancy: Math.round(parseNumber(form, 'lifeExpectancy')) || 85,
        },
        earnings: {
          currentAnnualEarnings: parseNumber(form, 'currentAnnualEarnings'),
          averageLifetimeEarnings: parseNumber(form, 'averageLifetimeEarnings') || undefined,
        },
        maritalStatus:
          (form.elements.namedItem('maritalStatus') as HTMLSelectElement)?.value || 'single',
        claimingStrategy: {
          primaryClaimingAge: Math.round(parseNumber(form, 'primaryClaimingAge')) || 67,
        },
        goals: {
          optimizeFor:
            (form.elements.namedItem('optimizeFor') as HTMLSelectElement)?.value ||
            'maximum-lifetime',
          includeBreakEvenAnalysis: true,
        },
      };

      const response = await fetch('/api/analyze-social-security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to optimize Social Security strategy'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_social_security', result);
    } catch (error) {
      console.error('Social Security error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to optimize Social Security strategy'
      );
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSocialSecurityCalculator);
} else {
  initSocialSecurityCalculator();
}
