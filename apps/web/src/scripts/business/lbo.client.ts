/**
 * LBO Model Client Script
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

  const irr = Number(summary.irr) || 0;
  const irrPct = irr > 1 ? irr : irr * 100;
  const moic = Number(summary.moic) || 0;
  const leverage = Number(summary.leverage) || 0;
  const exitValue = Number(summary.exitValue) || 0;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'IRR',
      value: `${irrPct.toFixed(1)}%`,
      meta: 'equity return',
      tone: irrPct >= 20 ? 'emerald' : irrPct >= 15 ? 'amber' : 'orange',
    },
    {
      title: 'MOIC',
      value: `${moic.toFixed(2)}x`,
      tone: moic >= 2 ? 'emerald' : 'violet',
    },
    {
      title: 'Leverage',
      value: `${leverage.toFixed(1)}x`,
      meta: 'debt / EBITDA',
      tone: leverage > 6 ? 'orange' : 'violet',
    },
    {
      title: 'Exit Value',
      value: formatCurrency(exitValue),
      tone: 'emerald',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initLboCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const ebitda = parseNumber(form, 'ebitda');
      const purchasePrice = parseNumber(form, 'purchasePrice');
      const equityContribution = parseNumber(form, 'equityContribution');
      const debtAmount = parseNumber(form, 'debtAmount');
      const seniorDebtAmount = parseNumber(form, 'seniorDebtAmount') || debtAmount;

      const input = {
        targetCompany: {
          ebitda,
          revenue: parseNumber(form, 'revenue'),
          debt: 0,
          equity: 0,
        },
        transaction: {
          purchasePrice,
          equityContribution,
          debtAmount,
          transactionFees: purchasePrice * 0.02,
        },
        financing: {
          seniorDebt: {
            amount: seniorDebtAmount,
            interestRate: parseRate(form, 'seniorDebtRate') || 0.07,
            term: 7,
          },
          mezzanineDebt: {
            amount: Math.max(0, debtAmount - seniorDebtAmount),
            interestRate: 0.12,
            term: 7,
          },
        },
        projections: {
          ebitdaGrowth: 0.05,
          revenueGrowth: 0.05,
          exitMultiple: parseNumber(form, 'exitMultiple') || 8,
          holdingPeriod: Math.round(parseNumber(form, 'holdingPeriod')) || 5,
        },
        analysis: {
          includeIRR: true,
          includeMOIC: true,
          includeDebtPaydown: true,
          includeExitScenarios: true,
        },
      };

      const response = await fetch('/api/analyze-lbo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { message?: string }).message || 'Failed to analyze LBO');
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_lbo', result);
    } catch (error) {
      console.error('LBO error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze LBO');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLboCalculator);
} else {
  initLboCalculator();
}
