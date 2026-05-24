/**
 * Cryptocurrency Tax Calculator Client Script
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

function mapCostBasisMethod(raw: string): string {
  if (raw === 'hifo' || raw === 'highest-cost') return 'highest-cost';
  if (raw === 'lifo') return 'lifo';
  if (raw === 'specific-identification') return 'specific-identification';
  return 'fifo';
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
      title: 'Total Tax',
      value: formatCurrency(Number(summary.totalTaxLiability) || 0),
      tone: 'orange',
    },
    {
      title: 'Net Capital Gains',
      value: formatCurrency(Number(summary.netCapitalGains) || 0),
      tone: Number(summary.netCapitalGains) >= 0 ? 'emerald' : 'orange',
    },
    {
      title: 'Realized Gains',
      value: formatCurrency(Number(summary.totalRealizedGains) || 0),
      tone: 'violet',
    },
    {
      title: 'Realized Losses',
      value: formatCurrency(Number(summary.totalRealizedLosses) || 0),
      tone: 'amber',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initCryptocurrencyTaxCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const shortTermRate = parseRate(form, 'federalTaxRate') || 0.22;
      const costBasisMethod = mapCostBasisMethod(
        (form.elements.namedItem('costBasisMethod') as HTMLSelectElement)?.value || 'fifo'
      );

      const transactions = [
        {
          date: `${Math.round(parseNumber(form, 'taxYear')) || new Date().getFullYear()}-03-15`,
          transactionType: 'buy' as const,
          asset: 'BTC',
          quantity: 1,
          pricePerUnit: 45000,
          totalValue: 45000,
          fees: 50,
        },
        {
          date: `${Math.round(parseNumber(form, 'taxYear')) || new Date().getFullYear()}-11-20`,
          transactionType: 'sell' as const,
          asset: 'BTC',
          quantity: 0.5,
          pricePerUnit: 62000,
          totalValue: 31000,
          fees: 40,
        },
      ];

      const input = {
        personalInfo: {
          taxYear: Math.round(parseNumber(form, 'taxYear')) || new Date().getFullYear(),
          filingStatus:
            (form.elements.namedItem('filingStatus') as HTMLSelectElement)?.value || 'single',
        },
        transactions,
        costBasisMethod,
        taxInfo: {
          federalTaxRate: { shortTerm: shortTermRate, longTerm: Math.min(shortTermRate, 0.2) },
          stateTaxRate: 0,
          incomeBracket: shortTermRate,
        },
        incomeTransactions: {
          miningIncome: 0,
          stakingRewards: 0,
          defiYield: 0,
          airdrops: 0,
          forks: 0,
        },
        analysis: {
          includeRealizedGains: true,
          includeUnrealizedGains: true,
          includeTaxLossHarvesting: true,
          includeWashSaleAnalysis: true,
          includeMethodComparison: false,
        },
      };

      const response = await fetch('/api/analyze-cryptocurrency-tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze cryptocurrency tax'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_cryptocurrency_tax', result);
    } catch (error) {
      console.error('Cryptocurrency Tax error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze cryptocurrency tax');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCryptocurrencyTaxCalculator);
} else {
  initCryptocurrencyTaxCalculator();
}
