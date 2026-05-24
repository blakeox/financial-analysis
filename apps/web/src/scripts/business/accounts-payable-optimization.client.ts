/**
 * Accounts Payable Optimization Calculator Client Script
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

function buildSyntheticInvoices(totalPayables: number) {
  const invoiceDate = new Date().toISOString().split('T')[0];
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);
  const half = totalPayables > 0 ? totalPayables / 2 : 5000;

  return [
    {
      invoiceNumber: 'INV-001',
      vendorName: 'Primary Vendor',
      invoiceDate,
      dueDate: dueDate.toISOString().split('T')[0],
      invoiceAmount: half,
      paymentTerms: 'Net 30',
      earlyPaymentDiscount: { discountPercentage: 0.02, discountDays: 10 },
    },
    {
      invoiceNumber: 'INV-002',
      vendorName: 'Secondary Vendor',
      invoiceDate,
      dueDate: dueDate.toISOString().split('T')[0],
      invoiceAmount: Math.max(0, totalPayables - half),
      paymentTerms: 'Net 30',
      earlyPaymentDiscount: { discountPercentage: 0, discountDays: 0 },
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

  const savings = Number(summary.potentialDiscountSavings) || 0;
  const cashImpact = Number(summary.cashFlowImpact) || 0;
  const paymentDays = Number(summary.optimalPaymentDays) || 0;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Total Payables',
      value: formatCurrency(Number(summary.totalPayables) || 0),
      tone: 'primary',
    },
    {
      title: 'Discount Savings',
      value: formatCurrency(savings),
      tone: savings > 0 ? 'emerald' : 'surface',
    },
    {
      title: 'Cash Flow Impact',
      value: formatCurrency(cashImpact),
      tone: cashImpact >= 0 ? 'emerald' : 'amber',
    },
    {
      title: 'Optimal Pay Days',
      value: paymentDays ? `${paymentDays.toFixed(0)} days` : '—',
      tone: 'violet',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initAccountsPayableOptimizationCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const totalPayables = parseNumber(form, 'totalPayables');
      const input = {
        payables: {
          totalPayables,
          invoices: buildSyntheticInvoices(totalPayables),
        },
        cashFlow: {
          currentCash: parseNumber(form, 'currentCash'),
          monthlyCashFlow: parseNumber(form, 'monthlyCashFlow'),
          costOfCapital: parseNumber(form, 'costOfCapital') / 100,
        },
        strategy: {
          optimizeFor: 'balanced' as const,
          includeEarlyPaymentAnalysis: true,
        },
        analysis: {
          includeDiscountAnalysis: true,
          includeCashFlowImpact: true,
          includePaymentSchedule: true,
          includeVendorAnalysis: true,
        },
      };

      const response = await fetch('/api/analyze-accounts-payable-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message ||
            'Failed to analyze accounts payable optimization'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_accounts_payable_optimization', result);
    } catch (error) {
      console.error('Accounts Payable Optimization error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to analyze accounts payable optimization'
      );
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAccountsPayableOptimizationCalculator);
} else {
  initAccountsPayableOptimizationCalculator();
}
