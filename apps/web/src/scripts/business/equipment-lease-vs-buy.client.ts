/**
 * Equipment Lease vs Buy Calculator Client Script
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

  const better = String(summary.betterOption ?? 'lease');

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Recommendation',
      value: better === 'buy' ? 'Buy' : 'Lease',
      tone: 'violet',
    },
    {
      title: 'Cost Difference',
      value: formatCurrency(Number(summary.costDifference) || 0),
      meta: 'lower-cost option wins',
      tone: 'emerald',
    },
    {
      title: 'Lease Total',
      value: formatCurrency(Number(summary.leaseTotalCost) || 0),
      tone: 'amber',
    },
    {
      title: 'Purchase Total',
      value: formatCurrency(Number(summary.purchaseTotalCost) || 0),
      tone: 'orange',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initEquipmentLeaseVsBuyCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const purchasePrice = parseNumber(form, 'purchasePrice');
      const leaseTerm = Math.round(parseNumber(form, 'leaseTerm')) || 5;
      const monthlyPayment = parseNumber(form, 'monthlyPayment');

      const input = {
        equipmentInfo: {
          purchasePrice,
          usefulLife: Math.round(parseNumber(form, 'usefulLife')) || leaseTerm,
          expectedResidualValue: purchasePrice * 0.2,
        },
        leaseTerms: {
          leaseType: 'operating-lease',
          leaseTerm,
          monthlyPayment,
          downPayment: 0,
          buyoutOption: false,
          buyoutPrice: 0,
          maintenanceIncluded: false,
          annualMaintenanceCost: 0,
        },
        purchaseTerms: {
          downPayment: purchasePrice * 0.1,
          loanTerm: leaseTerm,
          interestRate: parseRate(form, 'interestRate') || 0.08,
          annualMaintenanceCost: purchasePrice * 0.02,
          insuranceCost: 0,
        },
        taxInfo: {
          federalTaxRate: 0.21,
          stateTaxRate: 0,
          section179Eligible: true,
          bonusDepreciationEligible: true,
        },
        analysis: {
          includeNPV: true,
          includeIRR: true,
          includeCashFlowComparison: true,
          includeTaxImpact: true,
          analysisPeriod: leaseTerm,
        },
      };

      const response = await fetch('/api/analyze-equipment-lease-vs-buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze equipment lease vs buy'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_equipment_lease_vs_buy', result);
    } catch (error) {
      console.error('Equipment Lease vs Buy error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to analyze equipment lease vs buy'
      );
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEquipmentLeaseVsBuyCalculator);
} else {
  initEquipmentLeaseVsBuyCalculator();
}
