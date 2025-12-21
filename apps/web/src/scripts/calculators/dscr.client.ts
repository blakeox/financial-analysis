/**
 * DSCR Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class DSCRCalculator {
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
        ebitda: parseFloat((formData.get('ebitda') as string) || '0'),
        annualDebtService: parseFloat((formData.get('annualDebtService') as string) || '0'),
        existingDebtService: parseFloat((formData.get('existingDebtService') as string) || '0'),
        newLoanPayment: formData.get('newLoanPayment')
          ? parseFloat(formData.get('newLoanPayment') as string)
          : undefined,
      };

      const response = await fetch('/api/analyze-dscr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to calculate DSCR');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('DSCR error:', error);
      showError(error instanceof Error ? error.message : 'Failed to calculate DSCR');
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
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">DSCR Analysis</h3>
          <p class="text-gray-700 dark:text-gray-300">
            Your DSCR analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new DSCRCalculator());
} else {
  new DSCRCalculator();
}
