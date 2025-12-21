/**
 * Refinancing Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class RefinancingCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('refinancing-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Refinancing form not found');
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
        currentMortgage: {
          principalBalance: parseFloat((formData.get('principalBalance') as string) || '0'),
          interestRate: parseFloat((formData.get('currentInterestRate') as string) || '0'),
          remainingTerm: parseInt((formData.get('remainingTerm') as string) || '30'),
          monthlyPayment: parseFloat((formData.get('monthlyPayment') as string) || '0'),
        },
        newMortgage: {
          interestRate: parseFloat((formData.get('newInterestRate') as string) || '0'),
          term: parseInt((formData.get('newTerm') as string) || '30'),
          refinanceType: (formData.get('refinanceType') as string) || 'rate-and-term',
          cashOutAmount: parseFloat((formData.get('cashOutAmount') as string) || '0'),
          cashInAmount: parseFloat((formData.get('cashInAmount') as string) || '0'),
        },
        costs: {
          closingCosts: parseFloat((formData.get('closingCosts') as string) || '0'),
          points: parseFloat((formData.get('points') as string) || '0'),
          appraisalFee: parseFloat((formData.get('appraisalFee') as string) || '0'),
          otherFees: parseFloat((formData.get('otherFees') as string) || '0'),
        },
        goals: {
          priority: (formData.get('priority') as string) || 'lower-rate',
          includeBreakEvenAnalysis: true,
        },
      };

      const response = await fetch('/api/analyze-refinancing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze refinancing');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Refinancing error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze refinancing');
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('refinancing-results');
    const contentDiv = document.getElementById('refinancing-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Refinancing Analysis</h3>
          <p class="text-gray-700 dark:text-gray-300">
            Your refinancing analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new RefinancingCalculator());
} else {
  new RefinancingCalculator();
}
