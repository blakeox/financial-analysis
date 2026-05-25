/**
 * Car Lease vs Buy Calculator Client Script
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

  const betterOption = String(summary.betterOption ?? 'lease');
  const costDifference = Number(summary.costDifference) || 0;
  const leaseTotal = Number(summary.leaseTotalCost) || 0;
  const purchaseTotal = Number(summary.purchaseTotalCost) || 0;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Better Option',
      value: betterOption === 'lease' ? 'Lease' : 'Buy',
      meta: `saves ${formatCurrency(costDifference)}`,
      tone: 'emerald',
    },
    {
      title: 'Lease Total Cost',
      value: formatCurrency(leaseTotal),
      tone: betterOption === 'lease' ? 'emerald' : 'violet',
    },
    {
      title: 'Purchase Total Cost',
      value: formatCurrency(purchaseTotal),
      tone: betterOption === 'buy' ? 'emerald' : 'violet',
    },
    {
      title: 'Cost Difference',
      value: formatCurrency(costDifference),
      tone: 'amber',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initCarLeaseVsBuyCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const msrp = parseNumber(form, 'msrp');
      const negotiatedPrice = parseNumber(form, 'negotiatedPrice') || msrp;
      const leaseTerm = Math.round(parseNumber(form, 'leaseTerm')) || 36;
      const loanTerm = Math.round(parseNumber(form, 'loanTerm')) || 60;

      const input = {
        vehicleInfo: {
          msrp,
          negotiatedPrice,
          residualValue: negotiatedPrice * 0.5,
        },
        leaseTerms: {
          leaseTerm,
          downPayment: 0,
          monthlyPayment: parseNumber(form, 'monthlyPayment'),
          moneyFactor: 0.001,
          residualPercentage: 0.5,
          mileageAllowance: 12000,
          excessMileageFee: 0.25,
        },
        purchaseTerms: {
          loanTerm,
          downPayment: 0,
          interestRate: parseRate(form, 'interestRate'),
          salesTaxRate: 0.08,
        },
        ownershipCosts: {
          annualInsurance: parseNumber(form, 'annualInsurance'),
          annualMaintenance: 0,
          annualRepairs: 0,
          fuelCost: 0,
          expectedOwnershipYears: 6,
        },
        financialAssumptions: {
          opportunityCostRate: 0.07,
          expectedDepreciation: 0.15,
        },
        analysis: {
          analysisPeriod: Math.max(1, Math.round(leaseTerm / 12)),
          includeTaxBenefits: true,
          includeEarlyTermination: false,
        },
      };

      const response = await fetch('/api/analyze-car-lease-vs-buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze car lease vs buy'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_car_lease_vs_buy', result);
    } catch (error) {
      console.error('Car lease vs buy error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze car lease vs buy');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCarLeaseVsBuyCalculator);
} else {
  initCarLeaseVsBuyCalculator();
}
