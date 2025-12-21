/**
 * Supply Chain Finance Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class SupplyChainFinanceCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('supply-chain-finance-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Supply Chain Finance form not found');
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
        companyInfo: {
          companyName: (formData.get('companyName') as string) || '',
          industry: (formData.get('industry') as string) || '',
          annualRevenue: parseFloat((formData.get('annualRevenue') as string) || '0'),
        },
        supplyChain: {
          accountsPayable: parseFloat((formData.get('accountsPayable') as string) || '0'),
          accountsReceivable: parseFloat((formData.get('accountsReceivable') as string) || '0'),
          inventory: parseFloat((formData.get('inventory') as string) || '0'),
          averagePaymentTerms: parseInt((formData.get('averagePaymentTerms') as string) || '30'),
          averageCollectionTerms: parseInt(
            (formData.get('averageCollectionTerms') as string) || '30'
          ),
        },
        financingOptions: {
          dynamicDiscounting: {
            enabled: formData.get('dynamicDiscountingEnabled') === 'true',
            discountRate: parseFloat((formData.get('discountRate') as string) || '0.02'),
          },
          reverseFactoring: {
            enabled: formData.get('reverseFactoringEnabled') === 'true',
            financingRate: parseFloat((formData.get('financingRate') as string) || '0.08'),
          },
          inventoryFinancing: {
            enabled: formData.get('inventoryFinancingEnabled') === 'true',
            financingRate: parseFloat((formData.get('inventoryFinancingRate') as string) || '0.1'),
          },
        },
        analysis: {
          includeWorkingCapital: formData.get('includeWorkingCapital') !== 'false',
          includeCashFlow: formData.get('includeCashFlow') !== 'false',
          includeCostBenefit: formData.get('includeCostBenefit') !== 'false',
          includeScenarioAnalysis: formData.get('includeScenarioAnalysis') !== 'false',
        },
      };

      const response = await fetch('/api/analyze-supply-chain-finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze supply chain finance');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Supply Chain Finance error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze supply chain finance');
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('supply-chain-finance-results');
    const contentDiv = document.getElementById('supply-chain-finance-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Supply Chain Finance Analysis</h3>
          <p class="text-gray-700 dark:text-gray-300">
            Your supply chain finance analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new SupplyChainFinanceCalculator());
} else {
  new SupplyChainFinanceCalculator();
}

