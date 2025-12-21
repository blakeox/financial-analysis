/**
 * Cryptocurrency Tax Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class CryptocurrencyTaxCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('cryptocurrency-tax-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Cryptocurrency Tax form not found');
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
      const transactionsJson = formData.get('transactions') as string;
      const transactions = transactionsJson ? JSON.parse(transactionsJson) : [];

      const input = {
        personalInfo: {
          taxYear: parseInt(
            (formData.get('taxYear') as string) || new Date().getFullYear().toString()
          ),
          filingStatus: (formData.get('filingStatus') as string) || 'single',
          federalTaxRate: parseFloat((formData.get('federalTaxRate') as string) || '0.22'),
          stateTaxRate: parseFloat((formData.get('stateTaxRate') as string) || '0'),
        },
        transactions,
        costBasisMethod: (formData.get('costBasisMethod') as string) || 'fifo',
        analysis: {
          includeCapitalGains: formData.get('includeCapitalGains') !== 'false',
          includeOrdinaryIncome: formData.get('includeOrdinaryIncome') !== 'false',
          includeWashSaleAnalysis: formData.get('includeWashSaleAnalysis') !== 'false',
          includeForm8949: formData.get('includeForm8949') !== 'false',
        },
      };

      const response = await fetch('/api/analyze-cryptocurrency-tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze cryptocurrency tax');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Cryptocurrency Tax error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze cryptocurrency tax');
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('cryptocurrency-tax-results');
    const contentDiv = document.getElementById('cryptocurrency-tax-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Cryptocurrency Tax Analysis</h3>
          <p class="text-gray-700 dark:text-gray-300">
            Your cryptocurrency tax analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new CryptocurrencyTaxCalculator());
} else {
  new CryptocurrencyTaxCalculator();
}

