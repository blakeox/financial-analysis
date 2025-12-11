/**
 * Cash Flow Analysis Client Script
 * Handles comprehensive cash flow analysis and form interactions
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class CashFlowAnalysisCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('cash-flow-analysis-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Cash flow analysis form not found');
      return;
    }

    this.form.addEventListener('submit', this.handleSubmit.bind(this));

    // Add cash flow item button
    const addButton = document.getElementById('add-cash-flow-item');
    if (addButton) {
      addButton.addEventListener('click', this.addCashFlowItem.bind(this));
    }
  }

  private addCashFlowItem(): void {
    const itemsContainer = document.getElementById('cash-flow-items');
    if (!itemsContainer) return;

    const newItem = document.createElement('div');
    newItem.className =
      'grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg';
    newItem.innerHTML = `
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
        <input
          type="text"
          name="itemDescription"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          placeholder="Monthly Revenue"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount ($)</label>
        <input
          type="number"
          name="itemAmount"
          step="100"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          placeholder="10000"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
        <select
          name="itemType"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="operating">Operating</option>
          <option value="investing">Investing</option>
          <option value="financing">Financing</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Frequency</label>
        <select
          name="itemFrequency"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="annual">Annual</option>
          <option value="one-time">One-Time</option>
        </select>
      </div>
    `;
    itemsContainer.appendChild(newItem);
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
      const response = await fetch('/api/analyze-cash-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze cash flow');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Cash flow analysis error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze cash flow');
    } finally {
      hideLoading();
    }
  }

  private buildInput(formData: FormData): Record<string, unknown> {
    const cashFlowItems: Array<Record<string, unknown>> = [];

    // Collect all cash flow items
    const itemDescriptions = formData.getAll('itemDescription');
    const itemAmounts = formData.getAll('itemAmount');
    const itemTypes = formData.getAll('itemType');
    const itemFrequencies = formData.getAll('itemFrequency');

    for (let i = 0; i < itemDescriptions.length; i++) {
      if (itemDescriptions[i] && itemAmounts[i]) {
        cashFlowItems.push({
          description: itemDescriptions[i],
          amount: parseFloat(itemAmounts[i] as string),
          type: itemTypes[i] || 'operating',
          category: 'revenue',
          frequency: itemFrequencies[i] || 'monthly',
          isRecurring: true,
        });
      }
    }

    return {
      companyName: formData.get('companyName') || undefined,
      analysisStartDate: new Date().toISOString(),
      analysisPeriodMonths: parseInt((formData.get('analysisPeriodMonths') as string) || '12'),
      cashFlowItems:
        cashFlowItems.length > 0
          ? cashFlowItems
          : [
              {
                description: 'Sample Revenue',
                amount: 10000,
                type: 'operating',
                category: 'revenue',
                frequency: 'monthly',
                isRecurring: true,
              },
            ],
      openingCashBalance: parseFloat((formData.get('openingCashBalance') as string) || '0'),
      minimumCashBalance: parseFloat((formData.get('minimumCashBalance') as string) || '0'),
      discountRate: parseFloat((formData.get('discountRate') as string) || '10') / 100,
      taxRate: parseFloat((formData.get('taxRate') as string) || '25') / 100,
      method: 'direct',
    };
  }

  private displayResults(result: unknown): void {
    const resultsDiv = document.getElementById('cash-flow-results');
    const contentDiv = document.getElementById('cash-flow-results-content');

    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');

    // Format and display results
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Cash Flow Analysis</h3>
          <p class="text-gray-700 dark:text-gray-300">
            Your cash flow analysis is complete. Use the AI assistant to get detailed recommendations and insights.
          </p>
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          <p>💡 <strong>Tip:</strong> Click the chat icon to get AI-powered cash flow analysis and recommendations based on your specific situation.</p>
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
    new CashFlowAnalysisCalculator();
  });
} else {
  new CashFlowAnalysisCalculator();
}
