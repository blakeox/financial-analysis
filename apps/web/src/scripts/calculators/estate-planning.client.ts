/**
 * Estate Planning Calculator Client Script
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

function isChecked(form: HTMLFormElement, name: string): boolean {
  const el = form.elements.namedItem(name);
  return el instanceof HTMLInputElement && el.type === 'checkbox' && el.checked;
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

  const projected = Number(summary.projectedEstateValue ?? summary.currentEstateValue) || 0;
  const estateTax = Number(summary.estimatedEstateTax) || 0;
  const netInheritance = Number(summary.netInheritance) || 0;
  const taxSavings = Number(summary.taxSavings) || 0;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Projected Estate',
      value: formatCurrency(projected),
      tone: 'violet',
    },
    {
      title: 'Estimated Estate Tax',
      value: formatCurrency(estateTax),
      tone: estateTax > 0 ? 'orange' : 'emerald',
    },
    {
      title: 'Net Inheritance',
      value: formatCurrency(netInheritance),
      tone: 'emerald',
    },
    {
      title: 'Tax Planning Savings',
      value: formatCurrency(taxSavings),
      meta: 'from modeled strategies',
      tone: taxSavings > 0 ? 'emerald' : 'violet',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initEstatePlanningCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const input = {
        personalInfo: {
          age: Math.round(parseNumber(form, 'age')) || 65,
          maritalStatus:
            (form.elements.namedItem('maritalStatus') as HTMLSelectElement)?.value || 'married',
          stateOfResidence: 'CA',
        },
        assets: {
          totalAssets: parseNumber(form, 'totalAssets'),
          realEstate: parseNumber(form, 'realEstate'),
          investments: parseNumber(form, 'investments'),
          retirementAccounts: parseNumber(form, 'retirementAccounts'),
          businessInterests: 0,
          otherAssets: 0,
        },
        estatePlan: {
          hasWill: isChecked(form, 'hasWill'),
          hasTrust: isChecked(form, 'hasTrust'),
          beneficiaries: Math.round(parseNumber(form, 'beneficiaries')) || 1,
          charitableGiving: 0,
        },
        taxInfo: {
          expectedGrowthRate: 0.05,
          yearsToProject: 20,
        },
        analysis: {
          includeEstateTaxProjection: true,
          includeInheritanceProjection: true,
          includeTrustAnalysis: isChecked(form, 'hasTrust'),
        },
      };

      const response = await fetch('/api/analyze-estate-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze estate planning'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_estate_planning', result);
    } catch (error) {
      console.error('Estate Planning error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze estate planning');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEstatePlanningCalculator);
} else {
  initEstatePlanningCalculator();
}
