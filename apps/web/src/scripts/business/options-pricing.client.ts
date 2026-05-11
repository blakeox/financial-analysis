/**
 * Options Pricing Calculator Client Script
 * Handles options pricing analysis and form interactions
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class OptionsPricingCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('options-pricing-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Options pricing form not found');
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
      const response = await fetch('/api/analyze-options-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze options pricing');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Options pricing error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze options pricing');
    } finally {
      hideLoading();
    }
  }

  private buildInput(formData: FormData): Record<string, unknown> {
    return {
      optionType: formData.get('optionType'),
      optionStyle: formData.get('optionStyle'),
      stockPrice: parseFloat((formData.get('stockPrice') as string) || '0'),
      strikePrice: parseFloat((formData.get('strikePrice') as string) || '0'),
      timeToExpiration: parseFloat((formData.get('timeToExpiration') as string) || '0.25'),
      volatility: parseFloat((formData.get('volatility') as string) || '0') / 100,
      riskFreeRate: parseFloat((formData.get('riskFreeRate') as string) || '0') / 100,
      dividendYield: parseFloat((formData.get('dividendYield') as string) || '0') / 100,
    };
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('options-results');
    const contentDiv = document.getElementById('options-results-content');

    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');

    // Format and display results
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="fa-panel-title text-lg mb-2">Options Pricing Analysis</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your options pricing analysis is complete. Use the AI assistant to get detailed recommendations and Greeks analysis.
          </p>
        </div>
        <div class="fa-script-copy-muted">
          <p>💡 <strong>Tip:</strong> Click the chat icon to get AI-powered options analysis and strategy recommendations based on your specific situation.</p>
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
    new OptionsPricingCalculator();
  });
} else {
  new OptionsPricingCalculator();
}
