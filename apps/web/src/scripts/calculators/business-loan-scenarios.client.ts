/**
 * Business Loan Scenarios Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class BusinessLoanScenariosCalculator {
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
      const loanAmount = parseFloat((formData.get('loanAmount') as string) || '0');
      const currentDebtPayments = parseFloat(
        (formData.get('currentDebtPayments') as string) || '0'
      );

      const scenarios = [];
      if (formData.get('scenario1Name')) {
        scenarios.push({
          name: formData.get('scenario1Name') as string,
          term: parseInt(formData.get('scenario1Term') as string),
          rate: parseFloat(formData.get('scenario1Rate') as string) / 100,
        });
      }
      if (formData.get('scenario2Name')) {
        scenarios.push({
          name: formData.get('scenario2Name') as string,
          term: parseInt(formData.get('scenario2Term') as string),
          rate: parseFloat(formData.get('scenario2Rate') as string) / 100,
        });
      }

      const input = {
        loanAmount,
        scenarios,
        currentDebtPayments,
      };

      const response = await fetch('/api/analyze-business-loan-scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to compare loan scenarios');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Loan scenarios error:', error);
      showError(error instanceof Error ? error.message : 'Failed to compare loan scenarios');
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
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Loan Scenario Comparison</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your loan scenario comparison is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new BusinessLoanScenariosCalculator());
} else {
  new BusinessLoanScenariosCalculator();
}
