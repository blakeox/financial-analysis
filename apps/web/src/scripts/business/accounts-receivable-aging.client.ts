/**
 * Accounts Receivable Aging Calculator Client Script
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

function buildSyntheticInvoices(totalReceivables: number) {
  if (totalReceivables <= 0) return [];

  const invoiceDate = new Date();
  invoiceDate.setDate(invoiceDate.getDate() - 45);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() - 15);

  return [
    {
      invoiceNumber: 'AR-001',
      customerName: 'Primary Customer',
      invoiceDate: invoiceDate.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      invoiceAmount: totalReceivables,
      amountOutstanding: totalReceivables,
      daysOutstanding: 45,
      agingBucket: '31-60' as const,
    },
  ];
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

  const dso = Number(summary.daysSalesOutstanding) || 0;
  const overdue = Number(summary.overdueAmount) || 0;
  const badDebt = Number(summary.estimatedBadDebt) || 0;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Total Receivables',
      value: formatCurrency(Number(summary.totalReceivables) || 0),
      tone: 'primary',
    },
    {
      title: 'DSO',
      value: `${dso.toFixed(0)} days`,
      tone: dso > 45 ? 'amber' : 'emerald',
    },
    {
      title: 'Overdue',
      value: formatCurrency(overdue),
      tone: overdue > 0 ? 'orange' : 'emerald',
    },
    {
      title: 'Est. Bad Debt',
      value: formatCurrency(badDebt),
      tone: 'violet',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initAccountsReceivableAgingCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const annualSales = parseNumber(form, 'annualSales');
      const annualCreditSales = parseNumber(form, 'annualCreditSales') || annualSales;

      const input = {
        receivables: {
          totalReceivables: parseNumber(form, 'totalReceivables'),
          invoices: buildSyntheticInvoices(parseNumber(form, 'totalReceivables')),
        },
        creditPolicy: { paymentTerms: 30, creditLimit: 0 },
        historicalData: {
          averageCollectionPeriod: 0,
          badDebtPercentage: 0.02,
          annualSales,
          annualCreditSales,
        },
        analysis: {
          includeDSO: true,
          includeAgingAnalysis: true,
          includeBadDebtForecast: true,
          includeCollectionRecommendations: true,
          includeCreditPolicyOptimization: true,
        },
      };

      const response = await fetch('/api/analyze-accounts-receivable-aging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze accounts receivable aging'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_accounts_receivable_aging', result);
    } catch (error) {
      console.error('Accounts Receivable Aging error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to analyze accounts receivable aging'
      );
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAccountsReceivableAgingCalculator);
} else {
  initAccountsReceivableAgingCalculator();
}
