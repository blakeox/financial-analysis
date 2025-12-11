/**
 * Investment Portfolio Analyzer Client Script
 * Handles portfolio analysis and form interactions
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class InvestmentPortfolioCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('investment-portfolio-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Investment portfolio form not found');
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
      const response = await fetch('/api/analyze-investment-portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze investment portfolio');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Investment portfolio error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze investment portfolio');
    } finally {
      hideLoading();
    }
  }

  private buildInput(formData: FormData): Record<string, unknown> {
    const totalValue = parseFloat((formData.get('totalValue') as string) || '0');
    const targetStocks = parseFloat((formData.get('targetStocks') as string) || '70') / 100;
    const targetBonds = parseFloat((formData.get('targetBonds') as string) || '20') / 100;
    const targetCash = parseFloat((formData.get('targetCash') as string) || '10') / 100;
    const targetAlternatives = 1 - targetStocks - targetBonds - targetCash;

    return {
      personalInfo: {
        age: parseInt((formData.get('age') as string) || '35'),
        maritalStatus: 'single',
        dependents: 0,
        employmentStatus: 'employed',
      },
      currentPortfolio: {
        totalValue,
        holdings: [
          {
            symbol: 'SAMPLE',
            name: 'Sample Stock',
            shares: 100,
            currentPrice: (totalValue * targetStocks) / 100,
            sector: 'Technology',
            assetClass: 'stock',
          },
        ],
        cashReserve: totalValue * targetCash,
      },
      goals: {
        targetAllocation: {
          stocks: targetStocks,
          bonds: targetBonds,
          cash: targetCash,
          alternatives: Math.max(0, targetAlternatives),
        },
        riskTolerance: (formData.get('riskTolerance') as string) || 'moderate',
        timeHorizon: 20,
        rebalancingFrequency: 'annually',
      },
    };
  }

  private displayResults(result: unknown): void {
    const resultsDiv = document.getElementById('portfolio-results');
    const contentDiv = document.getElementById('portfolio-results-content');

    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');

    // Format and display results
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Portfolio Analysis</h3>
          <p class="text-gray-700 dark:text-gray-300">
            Your investment portfolio analysis is complete. Use the AI assistant to get detailed recommendations and rebalancing strategies.
          </p>
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          <p>💡 <strong>Tip:</strong> Click the chat icon to get AI-powered portfolio recommendations based on your specific situation.</p>
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
    new InvestmentPortfolioCalculator();
  });
} else {
  new InvestmentPortfolioCalculator();
}
