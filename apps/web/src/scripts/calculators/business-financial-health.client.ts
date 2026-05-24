/**
 * Business Financial Health Assessment Client Script
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
  const resultsBanner = document.getElementById('results');

  if (!summaryCards || !resultsContainer || !resultsSection) return;

  const record = result && typeof result === 'object' ? (result as Record<string, unknown>) : {};
  const metrics =
    record.metrics && typeof record.metrics === 'object'
      ? (record.metrics as Record<string, unknown>)
      : {};

  const score = Number(record.score) || 0;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Health Score',
      value: `${score}/100`,
      meta: String(record.interpretation ?? '').slice(0, 40),
      tone: score >= 70 ? 'emerald' : score >= 50 ? 'amber' : 'orange',
    },
    {
      title: 'Debt / EBITDA',
      value: `${(Number(metrics.debtToEBITDA) || 0).toFixed(1)}x`,
      tone: Number(metrics.debtToEBITDA) > 3 ? 'orange' : 'emerald',
    },
    {
      title: 'Current Ratio',
      value: `${(Number(metrics.currentRatio) || 0).toFixed(2)}x`,
      tone: Number(metrics.currentRatio) >= 1.5 ? 'emerald' : 'amber',
    },
    {
      title: 'Quick Ratio',
      value: `${(Number(metrics.quickRatio) || 0).toFixed(2)}x`,
      tone: 'violet',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsBanner?.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initBusinessFinancialHealthCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const creditScore = parseNumber(form, 'creditScore');
      const input = {
        businessInfo: {
          yearsInBusiness: Math.round(parseNumber(form, 'yearsInBusiness')),
          industry: 'general',
        },
        financials: {
          annualRevenue: parseNumber(form, 'annualRevenue'),
          annualEBITDA: parseNumber(form, 'annualEBITDA'),
          currentDebt: parseNumber(form, 'currentDebt'),
          monthlyDebtPayments: parseNumber(form, 'monthlyDebtPayments'),
          cashOnHand: parseNumber(form, 'cashOnHand'),
          accountsReceivable: parseNumber(form, 'accountsReceivable'),
          accountsPayable: parseNumber(form, 'accountsPayable'),
          creditScore: creditScore >= 300 ? creditScore : undefined,
        },
      };

      const response = await fetch('/api/analyze-business-financial-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze financial health'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_business_financial_health', result);
    } catch (error) {
      console.error('Financial health error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze financial health');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBusinessFinancialHealthCalculator);
} else {
  initBusinessFinancialHealthCalculator();
}
