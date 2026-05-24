/**
 * Bond Pricing Calculator Client Script
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

function mapBondType(raw: string): string {
  if (raw === 'zero-coupon') return 'zero-coupon';
  if (raw === 'floating-rate') return 'floating-rate';
  if (raw === 'convertible') return 'convertible';
  if (raw === 'inflation-linked') return 'inflation-linked';
  if (raw === 'treasury' || raw === 'municipal') return raw;
  return 'corporate';
}

function buildInput(form: HTMLFormElement): Record<string, unknown> {
  const rawType = (form.elements.namedItem('bondType') as HTMLSelectElement)?.value || 'corporate';
  const bondType = mapBondType(rawType);
  const years = parseNumber(form, 'yearsToMaturity') || 10;
  const couponRate = bondType === 'zero-coupon' ? 0 : parseRate(form, 'couponRate') || 0.05;
  const issueDate = new Date();
  const maturityDate = new Date();
  maturityDate.setFullYear(maturityDate.getFullYear() + Math.round(years));
  const marketPrice = parseNumber(form, 'marketPrice') || undefined;
  let yieldToMaturity = parseRate(form, 'yieldToMaturity');
  if (!yieldToMaturity && marketPrice) {
    yieldToMaturity = couponRate + 0.005;
  }
  if (!yieldToMaturity) {
    yieldToMaturity = couponRate || 0.05;
  }

  const input: Record<string, unknown> = {
    bondType,
    faceValue: parseNumber(form, 'faceValue') || 1000,
    couponRate,
    couponFrequency: bondType === 'zero-coupon' ? 'zero' : 'semi-annual',
    issueDate: issueDate.toISOString().split('T')[0],
    maturityDate: maturityDate.toISOString().split('T')[0],
    yieldToMaturity,
    marketPrice,
  };

  if (bondType === 'floating-rate') {
    input.floatingRateFeatures = {
      referenceRate: 'SOFR',
      spread: 0.02,
      resetFrequency: 'quarterly',
    };
  }
  if (bondType === 'convertible') {
    input.convertibleFeatures = {
      conversionRatio: 20,
      conversionPrice: 50,
      currentStockPrice: 55,
    };
  }

  return input;
}

function displayResults(result: unknown): void {
  const resultsDiv = document.getElementById('bond-results');
  const contentDiv = document.getElementById('bond-results-content');
  if (!resultsDiv || !contentDiv) return;

  const record = result && typeof result === 'object' ? (result as Record<string, unknown>) : {};
  const metrics =
    record.metrics && typeof record.metrics === 'object'
      ? (record.metrics as Record<string, unknown>)
      : {};

  const ytm = Number(metrics.yieldToMaturity) || 0;
  const ytmPct = ytm > 1 ? ytm : ytm * 100;

  contentDiv.innerHTML = renderMetricCards([
    {
      title: 'Clean Price',
      value: formatCurrency(Number(metrics.price) || 0),
      tone: 'violet',
    },
    {
      title: 'Yield to Maturity',
      value: `${ytmPct.toFixed(2)}%`,
      tone: 'emerald',
    },
    {
      title: 'Modified Duration',
      value: `${(Number(metrics.modifiedDuration) || 0).toFixed(2)} yrs`,
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

function initBondPricingCalculator(): void {
  const form = document.getElementById('bond-pricing-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      showLoading();
      hideError();

      const response = await fetch('/api/analyze-bond-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildInput(form)),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze bond pricing'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_bond_pricing', result);
    } catch (error) {
      console.error('Bond pricing error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze bond pricing');
    } finally {
      hideLoading();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBondPricingCalculator);
} else {
  initBondPricingCalculator();
}
