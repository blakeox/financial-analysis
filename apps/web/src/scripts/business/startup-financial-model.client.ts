/**
 * Startup Financial Model Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class StartupFinancialModelCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('startup-financial-model-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Startup Financial Model form not found');
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
          companyName: (formData.get('companyName') as string) || '',
          industry: (formData.get('industry') as string) || '',
          businessModel: (formData.get('businessModel') as string) || 'saas',
          stage: (formData.get('stage') as string) || 'seed',
        },
        financials: {
          currentCash: parseFloat((formData.get('currentCash') as string) || '0'),
          monthlyBurnRate: parseFloat((formData.get('monthlyBurnRate') as string) || '0'),
          monthlyRevenue: parseFloat((formData.get('monthlyRevenue') as string) || '0'),
          annualRecurringRevenue: parseFloat(
            (formData.get('annualRecurringRevenue') as string) || '0'
          ),
        },
        revenueProjections: {
          monthlyGrowthRate: parseFloat((formData.get('monthlyGrowthRate') as string) || '0.1'),
          churnRate: parseFloat((formData.get('churnRate') as string) || '0.05'),
          averageRevenuePerUser: parseFloat(
            (formData.get('averageRevenuePerUser') as string) || '0'
          ),
        },
        unitEconomics: {
          customerAcquisitionCost: parseFloat(
            (formData.get('customerAcquisitionCost') as string) || '0'
          ),
          lifetimeValue: parseFloat((formData.get('lifetimeValue') as string) || '0'),
          grossMargin: parseFloat((formData.get('grossMargin') as string) || '0.7'),
        },
        analysis: {
          includeRunway: formData.get('includeRunway') !== 'false',
          includeBurnRate: formData.get('includeBurnRate') !== 'false',
          includeUnitEconomics: formData.get('includeUnitEconomics') !== 'false',
          includeFundingScenarios: formData.get('includeFundingScenarios') !== 'false',
          projectionMonths: parseInt((formData.get('projectionMonths') as string) || '24'),
        },
      };

      const response = await fetch('/api/analyze-startup-financial-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze startup financial model');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Startup Financial Model error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to analyze startup financial model'
      );
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('startup-financial-model-results');
    const contentDiv = document.getElementById('startup-financial-model-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Startup Financial Model Analysis</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your startup financial model analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new StartupFinancialModelCalculator());
} else {
  new StartupFinancialModelCalculator();
}

