/**
 * Accounts Receivable Aging Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class AccountsReceivableAgingCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('accounts-receivable-aging-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Accounts Receivable Aging form not found');
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
      const invoicesJson = formData.get('invoices') as string;
      const invoices = invoicesJson ? JSON.parse(invoicesJson) : [];

      const input = {
        receivables: {
          totalReceivables: parseFloat((formData.get('totalReceivables') as string) || '0'),
          invoices,
        },
        creditPolicy: {
          paymentTerms: parseInt((formData.get('paymentTerms') as string) || '30'),
          creditLimit: parseFloat((formData.get('creditLimit') as string) || '0'),
        },
        historicalData: {
          averageCollectionPeriod: parseFloat((formData.get('averageCollectionPeriod') as string) || '0'),
          badDebtPercentage: parseFloat((formData.get('badDebtPercentage') as string) || '0.02'),
          annualSales: parseFloat((formData.get('annualSales') as string) || '0'),
          annualCreditSales: parseFloat((formData.get('annualCreditSales') as string) || '0'),
        },
        analysis: {
          includeDSO: formData.get('includeDSO') !== 'false',
          includeAgingAnalysis: formData.get('includeAgingAnalysis') !== 'false',
          includeBadDebtForecast: formData.get('includeBadDebtForecast') !== 'false',
          includeCollectionRecommendations: formData.get('includeCollectionRecommendations') !== 'false',
          includeCreditPolicyOptimization: formData.get('includeCreditPolicyOptimization') !== 'false',
        },
      };

      const response = await fetch('/api/analyze-accounts-receivable-aging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze accounts receivable aging');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Accounts Receivable Aging error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze accounts receivable aging');
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('accounts-receivable-aging-results');
    const contentDiv = document.getElementById('accounts-receivable-aging-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Accounts Receivable Aging Analysis</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your accounts receivable aging analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new AccountsReceivableAgingCalculator());
} else {
  new AccountsReceivableAgingCalculator();
}
