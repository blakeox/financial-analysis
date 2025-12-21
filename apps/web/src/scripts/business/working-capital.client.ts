/**
 * Working Capital Optimizer Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class WorkingCapitalOptimizer {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('working-capital-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Working Capital form not found');
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
          industry: (formData.get('industry') as string) || undefined,
          annualRevenue: parseFloat((formData.get('annualRevenue') as string) || '0'),
        },
        currentAssets: {
          cash: parseFloat((formData.get('cash') as string) || '0'),
          accountsReceivable: parseFloat((formData.get('accountsReceivable') as string) || '0'),
          inventory: parseFloat((formData.get('inventory') as string) || '0'),
          otherCurrentAssets: parseFloat((formData.get('otherCurrentAssets') as string) || '0'),
        },
        currentLiabilities: {
          accountsPayable: parseFloat((formData.get('accountsPayable') as string) || '0'),
          shortTermDebt: parseFloat((formData.get('shortTermDebt') as string) || '0'),
          accruedExpenses: parseFloat((formData.get('accruedExpenses') as string) || '0'),
          otherCurrentLiabilities: parseFloat(
            (formData.get('otherCurrentLiabilities') as string) || '0'
          ),
        },
        operatingMetrics: {
          daysSalesOutstanding: formData.get('daysSalesOutstanding')
            ? parseFloat(formData.get('daysSalesOutstanding') as string)
            : undefined,
          daysPayableOutstanding: formData.get('daysPayableOutstanding')
            ? parseFloat(formData.get('daysPayableOutstanding') as string)
            : undefined,
          daysInventoryOutstanding: formData.get('daysInventoryOutstanding')
            ? parseFloat(formData.get('daysInventoryOutstanding') as string)
            : undefined,
          inventoryTurnover: formData.get('inventoryTurnover')
            ? parseFloat(formData.get('inventoryTurnover') as string)
            : undefined,
        },
        analysis: {
          includeCashConversionCycle: true,
          includeOptimization: true,
          includeLiquidityAnalysis: true,
        },
      };

      const response = await fetch('/api/analyze-working-capital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to optimize working capital');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Working Capital error:', error);
      showError(error instanceof Error ? error.message : 'Failed to optimize working capital');
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('working-capital-results');
    const contentDiv = document.getElementById('working-capital-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Working Capital Analysis</h3>
          <p class="text-gray-700 dark:text-gray-300">
            Your working capital optimization is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new WorkingCapitalOptimizer());
} else {
  new WorkingCapitalOptimizer();
}
