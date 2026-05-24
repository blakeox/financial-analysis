/**
 * Franchise ROI Calculator Client Script
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

  const roi = Number(summary.roi ?? summary.totalROI) || 0;
  const roiPct = roi > 1 ? roi : roi * 100;
  const payback = Number(summary.paybackPeriod) || 0;
  const npv = Number(summary.npv) || 0;
  const irr = Number(summary.irr) || 0;
  const irrPct = irr > 1 ? irr : irr * 100;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'ROI',
      value: `${roiPct.toFixed(1)}%`,
      tone: roiPct >= 20 ? 'emerald' : 'amber',
    },
    {
      title: 'Payback',
      value: payback > 0 ? `${payback.toFixed(1)} yr` : '—',
      tone: payback <= 4 ? 'emerald' : 'orange',
    },
    {
      title: 'NPV',
      value: formatCurrency(npv),
      tone: npv >= 0 ? 'emerald' : 'orange',
    },
    {
      title: 'IRR',
      value: irr ? `${irrPct.toFixed(1)}%` : '—',
      tone: 'violet',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initFranchiseRoiCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const franchiseFee = parseNumber(form, 'franchiseFee');
      const totalInvestment = parseNumber(form, 'initialInvestment');
      const firstYearRevenue = parseNumber(form, 'firstYearRevenue');

      const input = {
        franchiseInfo: {
          franchiseName:
            (form.elements.namedItem('franchiseName') as HTMLInputElement)?.value || 'Franchise',
          franchiseType: 'service' as const,
        },
        initialInvestment: {
          franchiseFee,
          totalInvestment,
        },
        ongoingCosts: {
          royaltyFee: parseRate(form, 'royaltyFee') || 0.05,
          marketingFee: 0.02,
        },
        revenueProjections: {
          firstYearRevenue,
          revenueGrowthRate: 0.08,
          revenueProjectionYears: 10,
        },
        analysis: {
          includeROI: true,
          includePaybackPeriod: true,
          includeNPV: true,
          includeIRR: true,
          includeBreakEven: true,
        },
      };

      const response = await fetch('/api/analyze-franchise-roi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze franchise ROI'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_franchise_roi', result);
    } catch (error) {
      console.error('Franchise ROI error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze franchise ROI');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFranchiseRoiCalculator);
} else {
  initFranchiseRoiCalculator();
}
