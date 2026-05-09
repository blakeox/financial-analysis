/**
 * Business Financial Health Assessment Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class BusinessFinancialHealthCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('calculator-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Calculator form not found');
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
        businessInfo: {
          yearsInBusiness: parseInt((formData.get('yearsInBusiness') as string) || '0'),
          industry: (formData.get('industry') as string) || undefined,
          employeeCount: formData.get('employeeCount')
            ? parseInt(formData.get('employeeCount') as string)
            : undefined,
        },
        financials: {
          annualRevenue: parseFloat((formData.get('annualRevenue') as string) || '0'),
          annualEBITDA: parseFloat((formData.get('annualEBITDA') as string) || '0'),
          currentDebt: parseFloat((formData.get('currentDebt') as string) || '0'),
          monthlyDebtPayments: parseFloat((formData.get('monthlyDebtPayments') as string) || '0'),
          cashOnHand: parseFloat((formData.get('cashOnHand') as string) || '0'),
          accountsReceivable: parseFloat((formData.get('accountsReceivable') as string) || '0'),
          accountsPayable: parseFloat((formData.get('accountsPayable') as string) || '0'),
          creditScore: formData.get('creditScore')
            ? parseInt(formData.get('creditScore') as string)
            : undefined,
        },
      };

      const response = await fetch('/api/analyze-business-financial-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze financial health');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Financial health error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze financial health');
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('results');
    if (!resultsDiv) return;

    resultsDiv.classList.remove('hidden');
    resultsDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Financial Health Analysis</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your business financial health analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new BusinessFinancialHealthCalculator());
} else {
  new BusinessFinancialHealthCalculator();
}
