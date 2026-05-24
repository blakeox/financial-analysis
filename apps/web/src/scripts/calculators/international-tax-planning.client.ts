/**
 * International Tax Planning Calculator Client Script
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
  const taxLiability =
    record.taxLiability && typeof record.taxLiability === 'object'
      ? (record.taxLiability as Record<string, unknown>)
      : {};

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Net U.S. Tax',
      value: formatCurrency(Number(taxLiability.netTaxOwed) || 0),
      tone: 'orange',
    },
    {
      title: 'Foreign Tax Credit',
      value: formatCurrency(Number(taxLiability.foreignTaxCredit) || 0),
      tone: 'emerald',
    },
    {
      title: 'Projected Savings',
      value: formatCurrency(Number(record.projectedSavings) || 0),
      tone: 'violet',
    },
    {
      title: 'Total Tax',
      value: formatCurrency(Number(taxLiability.totalTax) || 0),
      meta: 'before credits',
      tone: 'amber',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initInternationalTaxPlanningCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const domesticIncome = parseNumber(form, 'domesticIncome');
      const foreignIncome = parseNumber(form, 'foreignIncome');
      const residency =
        (form.elements.namedItem('residency') as HTMLInputElement)?.value || 'Unknown';

      const input = {
        personalInfo: {
          citizenship: (form.elements.namedItem('citizenship') as HTMLInputElement)?.value || 'US',
          residenceCountry: residency,
          filingStatus:
            (form.elements.namedItem('filingStatus') as HTMLSelectElement)?.value || 'single',
          taxYear: new Date().getFullYear(),
        },
        foreignIncome: {
          foreignEarnedIncome: foreignIncome,
          foreignUnearnedIncome: 0,
          foreignTaxPaid: foreignIncome * 0.15,
          foreignTaxRate: 0.15,
          countries: [{ country: residency, income: foreignIncome, taxPaid: foreignIncome * 0.15 }],
        },
        feie: {
          eligibleForFEIE: foreignIncome > 0 && foreignIncome >= domesticIncome * 0.5,
          physicalPresenceTest: true,
          bonaFideResidenceTest: false,
          daysAbroad: 330,
        },
        foreignTaxCredit: {
          eligibleForFTC: true,
          foreignTaxPaid: foreignIncome * 0.15,
          foreignIncome,
          useFTC: true,
        },
        foreignAssets: { foreignBankAccounts: [], foreignFinancialAssets: [] },
        taxTreaties: [],
        analysis: {
          includeFEIEvsFTC: true,
          includeTaxSavings: true,
          includeComplianceCheck: true,
          includeOptimization: true,
        },
      };

      const response = await fetch('/api/analyze-international-tax-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze international tax planning'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_international_tax_planning', result);
    } catch (error) {
      console.error('International Tax Planning error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to analyze international tax planning'
      );
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initInternationalTaxPlanningCalculator);
} else {
  initInternationalTaxPlanningCalculator();
}
