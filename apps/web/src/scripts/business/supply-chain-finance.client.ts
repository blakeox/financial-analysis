/**
 * Supply Chain Finance Calculator Client Script
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

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Cash Flow Uplift',
      value: formatCurrency(Number(summary.cashFlowImprovement) || 0),
      tone: 'emerald',
    },
    {
      title: 'Program Savings',
      value: formatCurrency(Number(summary.totalSavings) || 0),
      tone: 'violet',
    },
    {
      title: 'Cash Conversion',
      value: `${Number(summary.optimizedCycle ?? summary.currentCashConversionCycle) || 0} days`,
      tone: 'amber',
    },
    {
      title: 'Best Program',
      value: String(summary.recommendedFinancing ?? '—').slice(0, 20),
      tone: 'orange',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initSupplyChainFinanceCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const annualRevenue = parseNumber(form, 'annualRevenue');
      const accountsPayable = parseNumber(form, 'accountsPayable');
      const accountsReceivable = parseNumber(form, 'accountsReceivable');
      const inventory = parseNumber(form, 'inventory');
      const dso =
        accountsReceivable > 0 && annualRevenue > 0
          ? (accountsReceivable / annualRevenue) * 365
          : 45;
      const dpo =
        accountsPayable > 0 && annualRevenue > 0 ? (accountsPayable / annualRevenue) * 365 : 30;
      const dio = inventory > 0 && annualRevenue > 0 ? (inventory / annualRevenue) * 365 : 60;
      const ccc = dso + dio - dpo;

      const input = {
        companyInfo: {
          companyName: (form.elements.namedItem('companyName') as HTMLInputElement)?.value || '',
          industry: 'general',
          annualRevenue,
          paymentTerms: 30,
        },
        supplyChain: {
          suppliers: [
            {
              annualPurchaseVolume: accountsPayable * 4,
              paymentTerms: 30,
              averageInvoiceAmount: accountsPayable / 12,
              invoicesPerMonth: 12,
            },
          ],
          customers: [
            {
              annualSalesVolume: annualRevenue,
              paymentTerms: 30,
              averageInvoiceAmount: accountsReceivable / 12 || annualRevenue / 24,
              invoicesPerMonth: 12,
            },
          ],
        },
        workingCapital: {
          accountsReceivable,
          accountsPayable,
          inventory,
          daysSalesOutstanding: dso,
          daysPayableOutstanding: dpo,
          daysInventoryOutstanding: dio,
          cashConversionCycle: ccc,
        },
        financingOptions: {
          dynamicDiscounting: {
            enabled: true,
            discountRate: 0.02,
            earlyPaymentDays: 10,
            annualVolume: accountsPayable * 4,
          },
          reverseFactoring: {
            enabled: true,
            financingRate: 0.08,
            programFee: 0.01,
            annualVolume: accountsPayable * 2,
          },
          supplyChainFinance: {
            enabled: false,
            financingRate: 0.06,
            programFee: 0.005,
            annualVolume: 0,
          },
        },
        costOfCapital: {
          costOfDebt: 0.08,
          costOfEquity: 0.12,
          wacc: 0.1,
          opportunityCostRate: 0.07,
        },
        analysis: {
          includeWorkingCapitalOptimization: true,
          includeFinancingComparison: true,
          includeCashFlowImpact: true,
          includeSupplierBenefits: true,
          includeRiskAnalysis: true,
        },
      };

      const response = await fetch('/api/analyze-supply-chain-finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze supply chain finance'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_supply_chain_finance', result);
    } catch (error) {
      console.error('Supply Chain Finance error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze supply chain finance');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSupplyChainFinanceCalculator);
} else {
  initSupplyChainFinanceCalculator();
}
