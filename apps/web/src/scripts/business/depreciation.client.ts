/**
 * Depreciation Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class DepreciationCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('depreciation-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Depreciation form not found');
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
        assetInfo: {
          purchaseDate:
            (formData.get('purchaseDate') as string) || new Date().toISOString().split('T')[0],
          purchaseCost: parseFloat((formData.get('purchaseCost') as string) || '0'),
          salvageValue: parseFloat((formData.get('salvageValue') as string) || '0'),
          usefulLife: parseInt((formData.get('usefulLife') as string) || '5'),
          assetClass: (formData.get('assetClass') as string) || 'equipment',
          businessUsePercentage: parseFloat(
            (formData.get('businessUsePercentage') as string) || '1'
          ),
        },
        depreciationMethod: (formData.get('depreciationMethod') as string) || 'straight-line',
        taxInfo: {
          taxYear: parseInt(
            (formData.get('taxYear') as string) || new Date().getFullYear().toString()
          ),
          federalTaxRate: parseFloat((formData.get('federalTaxRate') as string) || '0.21'),
          stateTaxRate: parseFloat((formData.get('stateTaxRate') as string) || '0'),
          section179Limit: parseFloat((formData.get('section179Limit') as string) || '1080000'),
          bonusDepreciationPercentage: parseFloat(
            (formData.get('bonusDepreciationPercentage') as string) || '0.6'
          ),
        },
        macrsDetails: formData.get('macrsDetails')
          ? JSON.parse(formData.get('macrsDetails') as string)
          : undefined,
        analysis: {
          includeSchedule: formData.get('includeSchedule') !== 'false',
          includeTaxSavings: formData.get('includeTaxSavings') !== 'false',
          includeMethodComparison: formData.get('includeMethodComparison') === 'true',
          projectionYears: parseInt((formData.get('projectionYears') as string) || '5'),
        },
      };

      const response = await fetch('/api/analyze-depreciation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze depreciation');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Depreciation error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze depreciation');
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('depreciation-results');
    const contentDiv = document.getElementById('depreciation-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="fa-panel-title text-lg mb-2">Depreciation Analysis</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your depreciation analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new DepreciationCalculator());
} else {
  new DepreciationCalculator();
}

