/**
 * Accounts Payable Optimization Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class AccountsPayableOptimizationCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('accounts-payable-optimization-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Accounts Payable Optimization form not found');
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
        payables: {
          totalPayables: parseFloat((formData.get('totalPayables') as string) || '0'),
          invoices,
        },
        cashFlow: {
          currentCash: parseFloat((formData.get('currentCash') as string) || '0'),
          monthlyCashFlow: parseFloat((formData.get('monthlyCashFlow') as string) || '0'),
          costOfCapital: parseFloat((formData.get('costOfCapital') as string) || '0.1'),
        },
        strategy: {
          optimizeFor: (formData.get('optimizeFor') as string) || 'balanced',
          includeEarlyPaymentAnalysis: formData.get('includeEarlyPaymentAnalysis') !== 'false',
        },
        analysis: {
          includeDiscountAnalysis: formData.get('includeDiscountAnalysis') !== 'false',
          includeCashFlowImpact: formData.get('includeCashFlowImpact') !== 'false',
          includePaymentSchedule: formData.get('includePaymentSchedule') !== 'false',
          includeVendorAnalysis: formData.get('includeVendorAnalysis') !== 'false',
        },
      };

      const response = await fetch('/api/analyze-accounts-payable-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze accounts payable optimization');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Accounts Payable Optimization error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to analyze accounts payable optimization'
      );
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('accounts-payable-optimization-results');
    const contentDiv = document.getElementById('accounts-payable-optimization-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Accounts Payable Optimization Analysis</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your accounts payable optimization analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new AccountsPayableOptimizationCalculator());
} else {
  new AccountsPayableOptimizationCalculator();
}

