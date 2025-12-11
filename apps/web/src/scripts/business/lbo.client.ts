/**
 * LBO Model Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class LBOModel {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('lbo-form') as HTMLFormElement;
    if (!this.form) {
      console.error('LBO form not found');
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
        targetCompany: {
          ebitda: parseFloat((formData.get('ebitda') as string) || '0'),
          revenue: parseFloat((formData.get('revenue') as string) || '0'),
          debt: parseFloat((formData.get('currentDebt') as string) || '0'),
          equity: parseFloat((formData.get('equity') as string) || '0'),
        },
        transaction: {
          purchasePrice: parseFloat((formData.get('purchasePrice') as string) || '0'),
          equityContribution: parseFloat((formData.get('equityContribution') as string) || '0'),
          debtAmount: parseFloat((formData.get('debtAmount') as string) || '0'),
          transactionFees: parseFloat((formData.get('transactionFees') as string) || '0'),
        },
        financing: {
          seniorDebt: {
            amount: parseFloat((formData.get('seniorDebtAmount') as string) || '0'),
            interestRate: parseFloat((formData.get('seniorDebtRate') as string) || '0'),
            term: parseInt((formData.get('seniorDebtTerm') as string) || '7'),
          },
          mezzanineDebt: {
            amount: parseFloat((formData.get('mezzanineDebtAmount') as string) || '0'),
            interestRate: parseFloat((formData.get('mezzanineDebtRate') as string) || '0.12'),
            term: parseInt((formData.get('mezzanineDebtTerm') as string) || '7'),
          },
        },
        projections: {
          ebitdaGrowth: parseFloat((formData.get('ebitdaGrowth') as string) || '0.05'),
          revenueGrowth: parseFloat((formData.get('revenueGrowth') as string) || '0.05'),
          exitMultiple: parseFloat((formData.get('exitMultiple') as string) || '8'),
          holdingPeriod: parseInt((formData.get('holdingPeriod') as string) || '5'),
        },
        analysis: {
          includeIRR: true,
          includeMOIC: true,
          includeDebtPaydown: true,
          includeExitScenarios: true,
        },
      };

      const response = await fetch('/api/analyze-lbo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze LBO');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('LBO error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze LBO');
    } finally {
      hideLoading();
    }
  }

  private displayResults(result: unknown): void {
    const resultsDiv = document.getElementById('lbo-results');
    const contentDiv = document.getElementById('lbo-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">LBO Analysis</h3>
          <p class="text-gray-700 dark:text-gray-300">
            Your LBO analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new LBOModel());
} else {
  new LBOModel();
}
