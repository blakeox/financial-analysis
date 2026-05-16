/**
 * Portfolio Optimizer Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class PortfolioOptimizer {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('portfolio-optimization-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Portfolio Optimization form not found');
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

      // Parse holdings from form
      const holdingCount = parseInt((formData.get('holdingCount') as string) || '1');
      const currentHoldings = [];
      for (let i = 0; i < holdingCount; i++) {
        currentHoldings.push({
          symbol: (formData.get(`symbol_${i}`) as string) || '',
          shares: parseFloat((formData.get(`shares_${i}`) as string) || '0'),
          currentPrice: parseFloat((formData.get(`price_${i}`) as string) || '0'),
          assetClass: (formData.get(`assetClass_${i}`) as string) || 'stock',
        });
      }

      const totalValue = currentHoldings.reduce(
        (sum, holding) => sum + holding.shares * holding.currentPrice,
        0
      );

      const input = {
        portfolio: {
          currentHoldings,
          totalValue,
        },
        constraints: {
          riskTolerance: (formData.get('riskTolerance') as string) || 'moderate',
          minAllocation: parseFloat((formData.get('minAllocation') as string) || '0'),
          maxAllocation: parseFloat((formData.get('maxAllocation') as string) || '1'),
          targetReturn: formData.get('targetReturn')
            ? parseFloat(formData.get('targetReturn') as string)
            : undefined,
          maxRisk: formData.get('maxRisk')
            ? parseFloat(formData.get('maxRisk') as string)
            : undefined,
        },
        marketData: {
          expectedReturns: formData.get('expectedReturns')
            ? JSON.parse(formData.get('expectedReturns') as string)
            : undefined,
          volatilities: formData.get('volatilities')
            ? JSON.parse(formData.get('volatilities') as string)
            : undefined,
          correlationMatrix: formData.get('correlationMatrix')
            ? JSON.parse(formData.get('correlationMatrix') as string)
            : undefined,
        },
        analysis: {
          includeEfficientFrontier: true,
          includeRebalancing: formData.get('includeRebalancing') === 'true',
        },
      };

      const response = await fetch('/api/analyze-portfolio-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to optimize portfolio');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Portfolio Optimization error:', error);
      showError(error instanceof Error ? error.message : 'Failed to optimize portfolio');
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('portfolio-optimization-results');
    const contentDiv = document.getElementById('portfolio-optimization-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Portfolio Optimization</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your portfolio optimization is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new PortfolioOptimizer());
} else {
  new PortfolioOptimizer();
}
