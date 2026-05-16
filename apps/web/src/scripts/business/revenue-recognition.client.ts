/**
 * Revenue Recognition Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class RevenueRecognitionCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('revenue-recognition-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Revenue Recognition form not found');
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
      const contractsJson = formData.get('contracts') as string;
      const contracts = contractsJson ? JSON.parse(contractsJson) : [];

      const input = {
        companyInfo: {
          industry: (formData.get('industry') as string) || '',
          revenueModel: (formData.get('revenueModel') as string) || 'service',
          accountingStandard: (formData.get('accountingStandard') as string) || 'asc-606',
        },
        contracts,
        analysis: {
          includeRevenueSchedule: formData.get('includeRevenueSchedule') !== 'false',
          includeDeferredRevenue: formData.get('includeDeferredRevenue') !== 'false',
          includeContractAssetAnalysis: formData.get('includeContractAssetAnalysis') !== 'false',
          includeComplianceCheck: formData.get('includeComplianceCheck') !== 'false',
          projectionPeriod: parseInt((formData.get('projectionPeriod') as string) || '5'),
        },
      };

      const response = await fetch('/api/analyze-revenue-recognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze revenue recognition');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Revenue Recognition error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze revenue recognition');
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('revenue-recognition-results');
    const contentDiv = document.getElementById('revenue-recognition-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Revenue Recognition Analysis</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your revenue recognition analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new RevenueRecognitionCalculator());
} else {
  new RevenueRecognitionCalculator();
}
