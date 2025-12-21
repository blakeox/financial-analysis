/**
 * Inventory Optimization Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class InventoryOptimizationCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('inventory-optimization-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Inventory Optimization form not found');
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
      const inventoryJson = formData.get('inventory') as string;
      const inventory = inventoryJson ? JSON.parse(inventoryJson) : [];

      const input = {
        inventoryData: {
          currentInventory: inventory,
          totalInventoryValue: parseFloat((formData.get('totalInventoryValue') as string) || '0'),
        },
        costs: {
          orderingCost: parseFloat((formData.get('orderingCost') as string) || '50'),
          holdingCostRate: parseFloat((formData.get('holdingCostRate') as string) || '0.2'),
          stockoutCost: parseFloat((formData.get('stockoutCost') as string) || '0'),
        },
        serviceLevel: {
          targetServiceLevel: parseFloat((formData.get('targetServiceLevel') as string) || '0.95'),
        },
        analysis: {
          includeEOQ: formData.get('includeEOQ') !== 'false',
          includeABC: formData.get('includeABC') !== 'false',
          includeSafetyStock: formData.get('includeSafetyStock') !== 'false',
          includeReorderPoint: formData.get('includeReorderPoint') !== 'false',
          includeTotalCostAnalysis: formData.get('includeTotalCostAnalysis') !== 'false',
        },
      };

      const response = await fetch('/api/analyze-inventory-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze inventory optimization');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Inventory Optimization error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze inventory optimization');
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('inventory-optimization-results');
    const contentDiv = document.getElementById('inventory-optimization-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Inventory Optimization Analysis</h3>
          <p class="text-gray-700 dark:text-gray-300">
            Your inventory optimization analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new InventoryOptimizationCalculator());
} else {
  new InventoryOptimizationCalculator();
}
