/**
 * Options Pricing Calculator Client Script
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
  const years = parseNumber(form, 'timeToExpiration') || 0.25;
  const expirationDate = new Date();
  expirationDate.setMonth(expirationDate.getMonth() + Math.round(years * 12));

  return {
    optionType:
      (form.elements.namedItem('optionType') as HTMLSelectElement)?.value === 'put'
        ? 'put'
        : 'call',
    optionStyle: (form.elements.namedItem('optionStyle') as HTMLSelectElement)?.value || 'american',
    strikePrice: parseNumber(form, 'strikePrice') || 100,
    currentPrice: parseNumber(form, 'stockPrice') || 100,
    expirationDate: expirationDate.toISOString().split('T')[0],
    riskFreeRate: parseRate(form, 'riskFreeRate') || 0.04,
    volatility: parseRate(form, 'volatility') || 0.25,
    dividendYield: parseRate(form, 'dividendYield'),
    pricingModel: 'black-scholes',
  };
}

function displayResults(result: unknown): void {
  const resultsDiv = document.getElementById('options-results');
  const contentDiv = document.getElementById('options-results-content');
  if (!resultsDiv || !contentDiv) return;

  const record = result && typeof result === 'object' ? (result as Record<string, unknown>) : {};
  const pricing =
    record.pricing && typeof record.pricing === 'object'
      ? (record.pricing as Record<string, unknown>)
      : {};
  const greeks =
    record.greeks && typeof record.greeks === 'object'
      ? (record.greeks as Record<string, unknown>)
      : {};

  contentDiv.innerHTML = renderMetricCards([
    {
      title: 'Theoretical Value',
      value: formatCurrency(Number(pricing.theoreticalValue) || 0),
      meta: String(pricing.moneyness ?? ''),
      tone: 'violet',
    },
    {
      title: 'Intrinsic Value',
      value: formatCurrency(Number(pricing.intrinsicValue) || 0),
      tone: 'emerald',
    },
    {
      title: 'Delta',
      value: (Number(greeks.delta) || 0).toFixed(3),
      tone: 'amber',
    },
    {
      title: 'Recommendation',
      value: String(record.recommendation ?? 'Hold'),
      tone: 'orange',
    },
  ]);

  resultsDiv.classList.remove('hidden');
  resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initOptionsPricingCalculator(): void {
  const form = document.getElementById('options-pricing-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      showLoading();
      hideError();

      const response = await fetch('/api/analyze-options-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildInput(form)),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze options pricing'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_options_pricing', result);
    } catch (error) {
      console.error('Options pricing error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze options pricing');
    } finally {
      hideLoading();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOptionsPricingCalculator);
} else {
  initOptionsPricingCalculator();
}
