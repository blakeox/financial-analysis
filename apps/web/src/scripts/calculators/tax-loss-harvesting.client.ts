/**
 * Tax Loss Harvesting Calculator Client Script
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
  const harvestCount = Array.isArray(record.harvestableLosses)
    ? record.harvestableLosses.length
    : 0;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Harvestable Losses',
      value: formatCurrency(Number(record.totalTaxLoss) || 0),
      meta: `${harvestCount} position${harvestCount === 1 ? '' : 's'}`,
      tone: 'orange',
    },
    {
      title: 'Projected Tax Savings',
      value: formatCurrency(Number(record.projectedTaxSavings) || 0),
      tone: 'emerald',
    },
    {
      title: 'Wash-Sale Window',
      value: `${Number(record.washSalePeriod) || 30} days`,
      meta: 'avoid repurchase',
      tone: 'amber',
    },
    {
      title: 'Actions',
      value: String(harvestCount),
      meta: 'harvest candidates',
      tone: 'violet',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initTaxLossHarvestingCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const totalValue = parseNumber(form, 'totalValue');
      const shortTermRate = parseRate(form, 'shortTermRate') || 0.37;
      const longTermRate = parseRate(form, 'longTermRate') || 0.2;
      const shares = 100;
      const currentPrice = totalValue > 0 ? totalValue / shares : 0;
      const holdings =
        totalValue > 0
          ? [
              {
                symbol: 'PORT',
                shares,
                costBasis: totalValue * 1.12,
                currentPrice,
                purchaseDate: '2022-06-01',
                holdingPeriod: 'long-term' as const,
              },
            ]
          : [];

      const input = {
        portfolio: { holdings, totalValue },
        taxInfo: {
          federalTaxRate: { shortTerm: shortTermRate, longTerm: longTermRate },
          stateTaxRate: 0,
          incomeBracket: shortTermRate,
        },
        realizedGains: { shortTermGains: 0, longTermGains: 0, ordinaryIncome: 0 },
        harvestingStrategy: {
          maxHarvestAmount: 3000,
          includeWashSaleRules: true,
          washSaleWindow: 30,
          replacementSecuritySimilarity: 'similar',
        },
        analysis: {
          includeTaxSavingsProjection: true,
          includeCarryForwardAnalysis: true,
          projectionYears: 5,
        },
      };

      const response = await fetch('/api/analyze-tax-loss-harvesting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze tax loss harvesting'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_tax_loss_harvesting', result);
    } catch (error) {
      console.error('Tax Loss Harvesting error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze tax loss harvesting');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTaxLossHarvestingCalculator);
} else {
  initTaxLossHarvestingCalculator();
}
