/**
 * VaR Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class VaRCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('var-form') as HTMLFormElement;
    if (!this.form) {
      console.error('VaR form not found');
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

      // Parse positions from form
      const positionCount = parseInt((formData.get('positionCount') as string) || '1');
      const positions = [];
      for (let i = 0; i < positionCount; i++) {
        positions.push({
          symbol: (formData.get(`symbol_${i}`) as string) || '',
          quantity: parseFloat((formData.get(`quantity_${i}`) as string) || '0'),
          currentPrice: parseFloat((formData.get(`price_${i}`) as string) || '0'),
          assetClass: (formData.get(`assetClass_${i}`) as string) || 'stock',
        });
      }

      const totalValue = positions.reduce((sum, pos) => sum + pos.quantity * pos.currentPrice, 0);

      const input = {
        portfolio: {
          positions,
          totalValue,
        },
        parameters: {
          confidenceLevel: parseFloat((formData.get('confidenceLevel') as string) || '0.95'),
          timeHorizon: parseInt((formData.get('timeHorizon') as string) || '1'),
          method: (formData.get('method') as string) || 'historical',
        },
        marketData: {
          historicalReturns: formData.get('historicalReturns')
            ? JSON.parse(formData.get('historicalReturns') as string)
            : undefined,
          volatilities: formData.get('volatilities')
            ? JSON.parse(formData.get('volatilities') as string)
            : undefined,
          correlations: formData.get('correlations')
            ? JSON.parse(formData.get('correlations') as string)
            : undefined,
        },
        analysis: {
          includeStressTesting: formData.get('includeStressTesting') === 'true',
          includeBacktesting: formData.get('includeBacktesting') === 'true',
        },
      };

      const response = await fetch('/api/analyze-var', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to calculate VaR');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('VaR error:', error);
      showError(error instanceof Error ? error.message : 'Failed to calculate VaR');
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('var-results');
    const contentDiv = document.getElementById('var-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">VaR Analysis</h3>
          <p class="text-gray-700 dark:text-gray-300">
            Your VaR calculation is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new VaRCalculator());
} else {
  new VaRCalculator();
}
