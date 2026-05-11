/**
 * Charitable Giving Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class CharitableGivingCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('charitable-giving-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Charitable Giving form not found');
      return;
    }

    this.form.addEventListener('submit', this.handleSubmit.bind(this));
  }

  private async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    if (!this.form) return;

    try {
      showLoading();
      hideError();

      const formData = new FormData(this.form);

      const input = {
        personalInfo: {
          age: parseInt((formData.get('age') as string) || '45'),
          filingStatus: (formData.get('filingStatus') as string) || 'single',
          adjustedGrossIncome: parseFloat((formData.get('adjustedGrossIncome') as string) || '0'),
        },
        taxInfo: {
          federalTaxRate: parseFloat((formData.get('federalTaxRate') as string) || '0.22'),
          stateTaxRate: parseFloat((formData.get('stateTaxRate') as string) || '0'),
          itemizeDeductions: formData.get('itemizeDeductions') === 'true',
          standardDeduction: parseFloat((formData.get('standardDeduction') as string) || '14600'),
        },
        givingDetails: {
          annualGivingAmount: parseFloat((formData.get('annualGivingAmount') as string) || '0'),
          givingMethod: (formData.get('givingMethod') as string) || 'cash',
          appreciatedAssetDetails: formData.get('appreciatedAssetDetails')
            ? JSON.parse(formData.get('appreciatedAssetDetails') as string)
            : undefined,
          qcdDetails: formData.get('qcdDetails')
            ? JSON.parse(formData.get('qcdDetails') as string)
            : undefined,
        },
        strategy: {
          optimizeFor: (formData.get('optimizeFor') as string) || 'max-tax-benefit',
          bunchingStrategy: formData.get('bunchingStrategy') === 'true',
          includeEstatePlanning: formData.get('includeEstatePlanning') === 'true',
        },
        analysis: {
          compareMethods: formData.get('compareMethods') !== 'false',
          includeMultiYearProjection: formData.get('includeMultiYearProjection') !== 'false',
          projectionYears: parseInt((formData.get('projectionYears') as string) || '5'),
        },
      };

      const response = await fetch('/api/analyze-charitable-giving', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze charitable giving');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Charitable Giving error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze charitable giving');
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('charitable-giving-results');
    const contentDiv = document.getElementById('charitable-giving-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="fa-panel-title text-lg mb-2">Charitable Giving Analysis</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your charitable giving analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new CharitableGivingCalculator());
} else {
  new CharitableGivingCalculator();
}
