/**
 * HELOC Analyzer Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class HELOCCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('heloc-form') as HTMLFormElement;
    if (!this.form) {
      console.error('HELOC form not found');
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
        propertyInfo: {
          currentHomeValue: parseFloat((formData.get('currentHomeValue') as string) || '0'),
          currentMortgageBalance: parseFloat(
            (formData.get('currentMortgageBalance') as string) || '0'
          ),
          mortgageInterestRate: parseFloat((formData.get('mortgageInterestRate') as string) || '0'),
          yearsRemaining: parseInt((formData.get('yearsRemaining') as string) || '30'),
        },
        helocDetails: {
          creditLimit: parseFloat((formData.get('creditLimit') as string) || '0'),
          interestRate: parseFloat((formData.get('interestRate') as string) || '0'),
          drawPeriod: parseInt((formData.get('drawPeriod') as string) || '10'),
          repaymentPeriod: parseInt((formData.get('repaymentPeriod') as string) || '20'),
          initialDraw: parseFloat((formData.get('initialDraw') as string) || '0'),
          annualFee: parseFloat((formData.get('annualFee') as string) || '0'),
        },
        usage: {
          purpose: (formData.get('purpose') as string) || 'other',
          drawAmount: parseFloat((formData.get('drawAmount') as string) || '0'),
          drawTiming: (formData.get('drawTiming') as string) || 'immediate',
        },
        comparison: {
          compareToRefinancing: formData.get('compareToRefinancing') === 'true',
          compareToPersonalLoan: formData.get('compareToPersonalLoan') === 'true',
          newMortgageRate: formData.get('newMortgageRate')
            ? parseFloat(formData.get('newMortgageRate') as string)
            : undefined,
          personalLoanRate: formData.get('personalLoanRate')
            ? parseFloat(formData.get('personalLoanRate') as string)
            : undefined,
        },
      };

      const response = await fetch('/api/analyze-heloc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze HELOC');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('HELOC error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze HELOC');
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('heloc-results');
    const contentDiv = document.getElementById('heloc-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="fa-panel-title text-lg mb-2">HELOC Analysis</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your HELOC analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new HELOCCalculator());
} else {
  new HELOCCalculator();
}
