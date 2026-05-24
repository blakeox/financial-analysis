/**
 * Credit Score Impact Calculator Client Script
 */

import { storeAnalysisResult } from '../analysis/analysis-results';
import { renderMetricCards } from '../_shared/metric-card-html';
import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

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

  const current = Number(summary.currentScore) || 0;
  const projected = Number(summary.projectedScore) || current;
  const scoreChange = Number(summary.scoreChange) || projected - current;
  const health = String(summary.creditHealth ?? '');

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Current Score',
      value: `${current}`,
      meta: health || undefined,
      tone: current >= 740 ? 'emerald' : current >= 670 ? 'amber' : 'orange',
    },
    {
      title: 'Projected Score',
      value: `${projected}`,
      tone: projected >= current ? 'emerald' : 'orange',
    },
    {
      title: 'Point Change',
      value: scoreChange >= 0 ? `+${scoreChange}` : `${scoreChange}`,
      meta: 'with planned actions',
      tone: scoreChange > 0 ? 'emerald' : scoreChange < 0 ? 'orange' : 'violet',
    },
    {
      title: 'Utilization',
      value:
        record.utilizationAnalysis &&
        typeof record.utilizationAnalysis === 'object' &&
        'utilizationPercentage' in (record.utilizationAnalysis as object)
          ? `${(Number((record.utilizationAnalysis as Record<string, unknown>).utilizationPercentage) * 100).toFixed(0)}%`
          : '—',
      meta: 'target under 30%',
      tone: 'violet',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initCreditScoreImpactCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const limit = parseNumber(form, 'totalCreditLimit');
      const used = parseNumber(form, 'totalCreditUsed');
      const utilization = limit > 0 ? used / limit : 0;

      const input = {
        currentCredit: {
          currentScore: Math.round(parseNumber(form, 'currentScore')) || 700,
          creditBureau: 'fico-8' as const,
        },
        creditUtilization: {
          totalCreditLimit: limit,
          totalCreditUsed: used,
          utilizationPercentage: utilization,
        },
        paymentHistory: {
          onTimePayments: 100,
          latePayments30Days: 0,
          latePayments60Days: 0,
          latePayments90Days: 0,
        },
        plannedActions: {
          payDownDebt: { amount: 0, targetUtilization: 0.3 },
        },
        analysis: {
          includeScoreProjection: true,
          includeActionRecommendations: true,
          includeTimelineAnalysis: true,
          projectionMonths: 12,
        },
      };

      const response = await fetch('/api/analyze-credit-score-impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze credit score impact'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_credit_score_impact', result);
    } catch (error) {
      console.error('Credit Score Impact error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze credit score impact');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCreditScoreImpactCalculator);
} else {
  initCreditScoreImpactCalculator();
}
