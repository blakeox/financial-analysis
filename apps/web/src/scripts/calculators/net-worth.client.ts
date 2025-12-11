/**
 * Net Worth Tracker Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class NetWorthTracker {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('net-worth-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Net Worth form not found');
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
        assets: {
          cash: parseFloat((formData.get('cash') as string) || '0'),
          investments: parseFloat((formData.get('investments') as string) || '0'),
          realEstate: parseFloat((formData.get('realEstate') as string) || '0'),
          retirementAccounts: parseFloat((formData.get('retirementAccounts') as string) || '0'),
          businessValue: parseFloat((formData.get('businessValue') as string) || '0'),
          otherAssets: parseFloat((formData.get('otherAssets') as string) || '0'),
        },
        liabilities: {
          mortgages: parseFloat((formData.get('mortgages') as string) || '0'),
          creditCardDebt: parseFloat((formData.get('creditCardDebt') as string) || '0'),
          studentLoans: parseFloat((formData.get('studentLoans') as string) || '0'),
          autoLoans: parseFloat((formData.get('autoLoans') as string) || '0'),
          otherDebt: parseFloat((formData.get('otherDebt') as string) || '0'),
        },
        projections: {
          assetGrowthRate: parseFloat((formData.get('assetGrowthRate') as string) || '0.07'),
          debtPaydownRate: parseFloat((formData.get('debtPaydownRate') as string) || '0.05'),
          yearsToProject: parseInt((formData.get('yearsToProject') as string) || '10'),
        },
        goals: {
          targetNetWorth: formData.get('targetNetWorth')
            ? parseFloat(formData.get('targetNetWorth') as string)
            : undefined,
          targetDate: formData.get('targetDate') as string | undefined,
          includeMilestones: true,
        },
      };

      const response = await fetch('/api/analyze-net-worth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze net worth');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Net Worth error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze net worth');
    } finally {
      hideLoading();
    }
  }

  private displayResults(result: unknown): void {
    const resultsDiv = document.getElementById('net-worth-results');
    const contentDiv = document.getElementById('net-worth-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Net Worth Analysis</h3>
          <p class="text-gray-700 dark:text-gray-300">
            Your net worth analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new NetWorthTracker());
} else {
  new NetWorthTracker();
}
