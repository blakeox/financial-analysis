/**
 * Startup Financial Model Calculator Client Script
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

  const runwayMonths = Number(summary.runwayMonths) || 0;
  const monthlyBurn = Number(summary.monthlyBurnRate) || 0;
  const fundingNeeded = Number(summary.fundingNeeded) || 0;
  const currentCash = Number(summary.currentCash) || 0;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Cash on Hand',
      value: formatCurrency(currentCash),
      tone: 'violet',
    },
    {
      title: 'Monthly Burn',
      value: formatCurrency(monthlyBurn),
      tone: monthlyBurn > 0 ? 'orange' : 'emerald',
    },
    {
      title: 'Runway',
      value: runwayMonths > 0 ? `${runwayMonths.toFixed(1)} mo` : '—',
      meta: runwayMonths < 6 ? 'critical — plan raise' : 'months at current burn',
      tone: runwayMonths >= 12 ? 'emerald' : runwayMonths >= 6 ? 'amber' : 'orange',
    },
    {
      title: 'Funding Needed',
      value: fundingNeeded > 0 ? formatCurrency(fundingNeeded) : 'None modeled',
      tone: fundingNeeded > 0 ? 'amber' : 'emerald',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initStartupFinancialModelCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const currentCash = parseNumber(form, 'currentCash');
      const monthlyBurnRate = parseNumber(form, 'monthlyBurnRate');
      const monthlyRevenue = parseNumber(form, 'monthlyRevenue');

      const input = {
        companyInfo: {
          name: (form.elements.namedItem('companyName') as HTMLInputElement)?.value || undefined,
          stage: 'seed' as const,
          businessModel: 'saas' as const,
        },
        currentSituation: {
          currentCash,
          monthlyBurnRate,
          currentRevenue: monthlyRevenue * 12,
          currentMRR: monthlyRevenue,
          currentCustomers: 0,
        },
        revenueProjections: {
          revenueModel: 'subscription' as const,
          monthlyRevenue: [],
          growthAssumptions: {
            customerGrowthRate: 0.1,
            revenuePerCustomer: 0,
            churnRate: 0.05,
          },
        },
        expenses: {
          fixedCosts: {
            salaries: monthlyBurnRate * 12,
            rent: 0,
            utilities: 0,
            insurance: 0,
            otherFixed: 0,
          },
          variableCosts: {
            costOfGoodsSold: 0.2,
            marketing: 0.3,
            sales: 0.1,
            customerAcquisitionCost: 0,
          },
        },
        funding: {
          fundingRounds: [],
          plannedFunding: [],
        },
        milestones: [],
        analysis: {
          includeBurnRate: true,
          includeRunway: true,
          includeUnitEconomics: false,
          includeFundingNeeds: true,
          includeMilestoneTracking: false,
          projectionMonths: 24,
        },
      };

      const response = await fetch('/api/analyze-startup-financial-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze startup financial model'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_startup_financial_model', result);
    } catch (error) {
      console.error('Startup financial model error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to analyze startup financial model'
      );
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStartupFinancialModelCalculator);
} else {
  initStartupFinancialModelCalculator();
}
