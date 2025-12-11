/**
 * M&A Analysis Client Script
 * Handles M&A deal analysis and form interactions
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class MAAnalysisCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('ma-analysis-form') as HTMLFormElement;
    if (!this.form) {
      console.error('M&A analysis form not found');
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
      const input = this.buildInput(formData);

      // Call API endpoint
      const response = await fetch('/api/analyze-ma-deal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze M&A deal');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('M&A analysis error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze M&A deal');
    } finally {
      hideLoading();
    }
  }

  private buildInput(formData: FormData): Record<string, unknown> {
    return {
      transactionInfo: {
        acquirer: formData.get('acquirer') || '',
        target: formData.get('target') || '',
        transactionType: formData.get('transactionType') || 'acquisition',
        purchasePrice: parseFloat((formData.get('purchasePrice') as string) || '0'),
        premium: parseFloat((formData.get('premium') as string) || '0') / 100,
        dealSize: 'medium',
      },
      financialData: {
        acquirerRevenue: parseFloat((formData.get('acquirerRevenue') as string) || '0'),
        acquirerEbitda: parseFloat((formData.get('acquirerEbitda') as string) || '0'),
        targetRevenue: parseFloat((formData.get('targetRevenue') as string) || '0'),
        targetEbitda: parseFloat((formData.get('targetEbitda') as string) || '0'),
        synergies: parseFloat((formData.get('synergies') as string) || '0'),
        integrationCosts: parseFloat((formData.get('integrationCosts') as string) || '0'),
      },
      assumptions: {
        synergyProbability: 0.7,
        integrationTimeline: 2,
        revenueSynergies: 0,
        costSynergies: parseFloat((formData.get('synergies') as string) || '0'),
      },
      goals: {
        analysisType: 'accretion-dilution',
        includeSensitivity: true,
        includeIntegrationPlanning: true,
      },
    };
  }

  private displayResults(result: unknown): void {
    const resultsDiv = document.getElementById('ma-results');
    const contentDiv = document.getElementById('ma-results-content');

    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');

    // Format and display results
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">M&A Analysis Complete</h3>
          <p class="text-gray-700 dark:text-gray-300">
            Your M&A deal analysis is complete. Use the AI assistant to get detailed recommendations and deal insights.
          </p>
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          <p>💡 <strong>Tip:</strong> Click the chat icon to get AI-powered M&A analysis and recommendations based on your specific deal.</p>
        </div>
      </div>
    `;

    // Scroll to results
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new MAAnalysisCalculator();
  });
} else {
  new MAAnalysisCalculator();
}
