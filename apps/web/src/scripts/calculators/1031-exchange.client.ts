/**
 * 1031 Exchange Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class OneZeroThreeOneExchangeCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('1031-exchange-form') as HTMLFormElement;
    if (!this.form) {
      console.error('1031 Exchange form not found');
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
        relinquishedProperty: {
          propertyType: (formData.get('propertyType') as string) || 'real-estate',
          purchasePrice: parseFloat((formData.get('purchasePrice') as string) || '0'),
          adjustedBasis: parseFloat((formData.get('adjustedBasis') as string) || '0'),
          salePrice: parseFloat((formData.get('salePrice') as string) || '0'),
          accumulatedDepreciation: parseFloat(
            (formData.get('accumulatedDepreciation') as string) || '0'
          ),
          sellingExpenses: parseFloat((formData.get('sellingExpenses') as string) || '0'),
        },
        replacementProperty: {
          purchasePrice: parseFloat((formData.get('replacementPurchasePrice') as string) || '0'),
          closingCosts: parseFloat((formData.get('closingCosts') as string) || '0'),
        },
        exchangeDetails: {
          exchangeType: (formData.get('exchangeType') as string) || 'delayed',
          identificationDeadline: (formData.get('identificationDeadline') as string) || '',
          closingDeadline: (formData.get('closingDeadline') as string) || '',
          qualifiedIntermediary: formData.get('qualifiedIntermediary') !== 'false',
        },
        taxInfo: {
          federalTaxRate: {
            ordinary: parseFloat((formData.get('ordinaryTaxRate') as string) || '0.37'),
            capitalGains: parseFloat((formData.get('capitalGainsRate') as string) || '0.2'),
          },
          stateTaxRate: parseFloat((formData.get('stateTaxRate') as string) || '0'),
          includeDepreciationRecapture: formData.get('includeDepreciationRecapture') !== 'false',
        },
        analysis: {
          includeTaxDeferral: formData.get('includeTaxDeferral') !== 'false',
          includeBootAnalysis: formData.get('includeBootAnalysis') !== 'false',
          includeComplianceCheck: formData.get('includeComplianceCheck') !== 'false',
          includeReplacementAnalysis: formData.get('includeReplacementAnalysis') !== 'false',
        },
      };

      const response = await fetch('/api/analyze-1031-exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze 1031 exchange');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('1031 Exchange error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze 1031 exchange');
    } finally {
      hideLoading();
    }
  }

  private displayResults(result: unknown): void {
    const resultsDiv = document.getElementById('1031-exchange-results');
    const contentDiv = document.getElementById('1031-exchange-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">1031 Exchange Analysis</h3>
          <p class="text-gray-700 dark:text-gray-300">
            Your 1031 exchange analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new OneZeroThreeOneExchangeCalculator());
} else {
  new OneZeroThreeOneExchangeCalculator();
}

