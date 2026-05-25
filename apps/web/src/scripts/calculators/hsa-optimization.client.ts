/**
 * HSA Optimization Calculator Client Script
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

  const taxSavings = Number(summary.totalTaxSavings) || 0;
  const maxContribution = Number(summary.maxContribution) || 0;
  const currentContribution = Number(summary.currentContribution) || 0;
  const projectedBalance = Number(summary.projectedBalanceAtRetirement) || 0;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Annual Tax Savings',
      value: formatCurrency(taxSavings),
      meta: 'triple tax advantage',
      tone: 'emerald',
    },
    {
      title: 'Your Contribution',
      value: formatCurrency(currentContribution),
      tone: 'violet',
    },
    {
      title: 'Contribution Limit',
      value: formatCurrency(maxContribution),
      meta:
        maxContribution > currentContribution
          ? `${formatCurrency(maxContribution - currentContribution)} headroom`
          : 'at limit',
      tone: 'amber',
    },
    {
      title: 'Balance at Retirement',
      value: formatCurrency(projectedBalance),
      tone: 'violet',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initHsaOptimizationCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const age = Math.round(parseNumber(form, 'age')) || 40;
      const annualContribution = parseNumber(form, 'annualContribution');

      const input = {
        personalInfo: {
          age,
          filingStatus:
            (form.elements.namedItem('filingStatus') as HTMLSelectElement)?.value || 'single',
          currentHSABalance: 0,
        },
        hsaDetails: {
          annualContribution,
          employerContribution: 0,
          investmentReturn: 0.07,
          accountFees: 0,
        },
        medicalExpenses: {
          annualMedicalExpenses: 0,
          expectedRetirementMedicalCosts: 0,
          yearsUntilRetirement: Math.max(0, 65 - age),
        },
        strategy: {
          optimizeFor: 'hybrid' as const,
          useForCurrentExpenses: false,
          saveReceipts: true,
        },
        taxInfo: {
          federalTaxRate: parseRate(form, 'federalTaxRate') || 0.22,
          stateTaxRate: 0,
          ficaTaxRate: 0.0765,
        },
      };

      const response = await fetch('/api/analyze-hsa-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze HSA optimization'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_hsa_optimization', result);
    } catch (error) {
      console.error('HSA optimization error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze HSA optimization');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHsaOptimizationCalculator);
} else {
  initHsaOptimizationCalculator();
}
