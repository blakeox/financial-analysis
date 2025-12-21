/**
 * Capital Structure Optimizer Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class CapitalStructureOptimizer {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('capital-structure-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Capital Structure form not found');
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
        companyInfo: {
          marketCap: parseFloat((formData.get('marketCap') as string) || '0'),
          currentDebt: parseFloat((formData.get('currentDebt') as string) || '0'),
          cashAndEquivalents: parseFloat((formData.get('cashAndEquivalents') as string) || '0'),
          sharesOutstanding: parseFloat((formData.get('sharesOutstanding') as string) || '0'),
          stockPrice: parseFloat((formData.get('stockPrice') as string) || '0'),
        },
        financials: {
          annualEBITDA: parseFloat((formData.get('annualEBITDA') as string) || '0'),
          annualEBIT: parseFloat((formData.get('annualEBIT') as string) || '0'),
          netIncome: parseFloat((formData.get('netIncome') as string) || '0'),
          taxRate: parseFloat((formData.get('taxRate') as string) || '0'),
          annualInterestExpense: parseFloat(
            (formData.get('annualInterestExpense') as string) || '0'
          ),
        },
        marketData: {
          riskFreeRate: parseFloat((formData.get('riskFreeRate') as string) || '0'),
          marketRiskPremium: parseFloat((formData.get('marketRiskPremium') as string) || '0.06'),
          beta: parseFloat((formData.get('beta') as string) || '1'),
          creditRating: (formData.get('creditRating') as string) || undefined,
        },
        analysis: {
          includeWACCOptimization: true,
          includeDebtCapacity: true,
          includeCreditRatingImpact: true,
          includeDividendPolicy: formData.get('includeDividendPolicy') === 'true',
        },
      };

      const response = await fetch('/api/analyze-capital-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to optimize capital structure');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Capital Structure error:', error);
      showError(error instanceof Error ? error.message : 'Failed to optimize capital structure');
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('capital-structure-results');
    const contentDiv = document.getElementById('capital-structure-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Capital Structure Analysis</h3>
          <p class="text-gray-700 dark:text-gray-300">
            Your capital structure optimization is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new CapitalStructureOptimizer());
} else {
  new CapitalStructureOptimizer();
}
