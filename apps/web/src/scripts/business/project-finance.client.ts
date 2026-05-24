/**
 * Project Finance Analyzer Client Script
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

  const npv = Number(summary.npv) || 0;
  const irr = Number(summary.irr) || 0;
  const irrPct = irr > 1 ? irr : irr * 100;
  const payback = Number(summary.paybackPeriod) || 0;
  const viability = String(summary.projectViability ?? '');

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'NPV',
      value: formatCurrency(npv),
      meta: npv >= 0 ? 'value-accretive' : 'negative NPV',
      tone: npv >= 0 ? 'emerald' : 'orange',
    },
    {
      title: 'IRR',
      value: `${irrPct.toFixed(1)}%`,
      tone: irrPct >= 12 ? 'emerald' : 'amber',
    },
    {
      title: 'Payback',
      value: payback > 0 ? `${payback.toFixed(1)} yr` : '—',
      tone: 'violet',
    },
    {
      title: 'Viability',
      value: viability || 'Review',
      tone: viability.toLowerCase().includes('viable') ? 'emerald' : 'amber',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initProjectFinanceCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const years = Math.max(1, Math.round(parseNumber(form, 'cashFlowYears')) || 5);
      const initialInvestment = parseNumber(form, 'initialInvestment');
      const annualNet = initialInvestment * 0.22;

      const annualCashFlows = Array.from({ length: years }, (_, index) => {
        const year = index + 1;
        const revenue = annualNet * 1.15;
        return {
          year,
          revenue,
          operatingExpenses: revenue * 0.55,
          capitalExpenditures: year === 1 ? initialInvestment * 0.05 : 0,
          workingCapital: 0,
        };
      });

      const equityPct = parseRate(form, 'equityPercentage') || 0.3;
      const input = {
        projectInfo: {
          name: (form.elements.namedItem('projectName') as HTMLInputElement)?.value || 'Project',
          type: (form.elements.namedItem('projectType') as HTMLSelectElement)?.value || 'other',
          duration: years,
        },
        cashFlows: { initialInvestment, annualCashFlows },
        financing: {
          equityPercentage: equityPct * 100,
          debtPercentage: (1 - equityPct) * 100,
          costOfEquity: parseRate(form, 'costOfEquity') || 0.12,
          costOfDebt: parseRate(form, 'costOfDebt') || 0.06,
          taxRate: 0.25,
        },
        analysis: {
          includeNPV: true,
          includeIRR: true,
          includePayback: true,
          includeSensitivity: false,
        },
      };

      const response = await fetch('/api/analyze-project-finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze project finance'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_project_finance', result);
    } catch (error) {
      console.error('Project Finance error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze project finance');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProjectFinanceCalculator);
} else {
  initProjectFinanceCalculator();
}
