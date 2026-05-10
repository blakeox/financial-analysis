/**
 * Debt Capacity Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class DebtCapacityCalculator {
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
        financials: {
          annualEBITDA: parseFloat((formData.get('annualEBITDA') as string) || '0'),
          monthlyDebtPayments: parseFloat((formData.get('monthlyDebtPayments') as string) || '0'),
          expectedEBITDAIncrease: parseFloat(
            (formData.get('expectedEBITDAIncrease') as string) || '0'
          ),
        },
        loanPreferences: {
          preferredTerm: parseInt((formData.get('preferredTerm') as string) || '5'),
          preferredRate: formData.get('preferredRate')
            ? parseFloat(formData.get('preferredRate') as string) / 100
            : undefined,
          loanType: (formData.get('loanType') as string) || 'term-loan',
        },
        requestedAmount: formData.get('requestedAmount')
          ? parseFloat(formData.get('requestedAmount') as string)
          : undefined,
      };

      const response = await fetch('/api/analyze-debt-capacity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to calculate debt capacity');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Debt capacity error:', error);
      showError(error instanceof Error ? error.message : 'Failed to calculate debt capacity');
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
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Debt Capacity Analysis</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your debt capacity analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new DebtCapacityCalculator());
} else {
  new DebtCapacityCalculator();
}
