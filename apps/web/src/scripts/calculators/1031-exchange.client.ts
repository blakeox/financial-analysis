/**
 * 1031 Exchange Calculator Client Script
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

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Tax Deferred',
      value: formatCurrency(Number(summary.taxDeferred) || 0),
      tone: 'emerald',
    },
    {
      title: 'Net Tax Savings',
      value: formatCurrency(Number(summary.netTaxSavings) || 0),
      tone: 'violet',
    },
    {
      title: 'Boot Tax',
      value: formatCurrency(Number(summary.taxOnBoot) || 0),
      tone: Number(summary.taxOnBoot) > 0 ? 'orange' : 'emerald',
    },
    {
      title: 'Replacement Value',
      value: formatCurrency(Number(summary.replacementValue) || 0),
      tone: 'amber',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function init1031ExchangeCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const salePrice = parseNumber(form, 'salePrice');
      const adjustedBasis = parseNumber(form, 'adjustedBasis');
      const replacementPrice = parseNumber(form, 'replacementPurchasePrice');
      const capitalGainsRate = parseRate(form, 'capitalGainsRate') || 0.2;
      const sellingExpenses = salePrice * 0.03;
      const netProceeds = salePrice - sellingExpenses;
      const boot = Math.max(0, netProceeds - replacementPrice);
      const saleDate = new Date().toISOString().split('T')[0];
      const identificationDeadline = new Date(Date.now() + 45 * 86_400_000)
        .toISOString()
        .split('T')[0];
      const closingDeadline = new Date(Date.now() + 180 * 86_400_000).toISOString().split('T')[0];

      const input = {
        relinquishedProperty: {
          purchaseDate: saleDate,
          purchasePrice: adjustedBasis,
          currentValue: salePrice,
          adjustedBasis,
          accumulatedDepreciation: Math.max(0, adjustedBasis * 0.2),
          mortgageBalance: 0,
          sellingPrice: salePrice,
          sellingExpenses,
          netProceeds,
        },
        replacementProperty: {
          purchasePrice: replacementPrice,
          purchaseExpenses: replacementPrice * 0.02,
          expectedValue: replacementPrice,
          mortgageAmount: 0,
          downPayment: replacementPrice * 0.25,
        },
        exchangeTimeline: {
          saleDate,
          identificationDeadline,
          closingDeadline,
          qualifiedIntermediary: true,
        },
        taxInfo: {
          federalTaxRate: {
            ordinary: 0.37,
            capitalGains: capitalGainsRate,
            depreciationRecapture: 0.25,
          },
          stateTaxRate: 0,
        },
        boot: {
          cashReceived: boot,
          debtRelief: 0,
          nonLikeKindProperty: 0,
          totalBoot: boot,
        },
        analysis: {
          includeTaxDeferral: true,
          includeDepreciationRecapture: true,
          includeBootAnalysis: true,
          includeComparison: true,
        },
      };

      const response = await fetch('/api/analyze-1031-exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze 1031 exchange'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_1031_exchange', result);
    } catch (error) {
      console.error('1031 Exchange error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze 1031 exchange');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init1031ExchangeCalculator);
} else {
  init1031ExchangeCalculator();
}
