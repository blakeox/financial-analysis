/**
 * Bond Pricing Calculator Client Script
 * Handles bond pricing analysis and form interactions
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class BondPricingCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('bond-pricing-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Bond pricing form not found');
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
      const response = await fetch('/api/analyze-bond-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze bond pricing');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Bond pricing error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze bond pricing');
    } finally {
      hideLoading();
    }
  }

  private buildInput(formData: FormData): Record<string, unknown> {
    return {
      bondType: formData.get('bondType'),
      faceValue: parseFloat((formData.get('faceValue') as string) || '1000'),
      couponRate: parseFloat((formData.get('couponRate') as string) || '0') / 100,
      yearsToMaturity: parseFloat((formData.get('yearsToMaturity') as string) || '10'),
      marketPrice: formData.get('marketPrice')
        ? parseFloat(formData.get('marketPrice') as string)
        : undefined,
      yieldToMaturity: formData.get('yieldToMaturity')
        ? parseFloat(formData.get('yieldToMaturity') as string) / 100
        : undefined,
    };
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('bond-results');
    const contentDiv = document.getElementById('bond-results-content');

    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');

    // Format and display results
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="fa-panel-title text-lg mb-2">Bond Pricing Analysis</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your bond pricing analysis is complete. Use the AI assistant to get detailed recommendations and insights.
          </p>
        </div>
        <div class="fa-script-copy-muted">
          <p>💡 <strong>Tip:</strong> Click the chat icon to get AI-powered bond analysis and recommendations based on your specific situation.</p>
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
    new BondPricingCalculator();
  });
} else {
  new BondPricingCalculator();
}
