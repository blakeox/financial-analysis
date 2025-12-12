/**
 * Franchise ROI Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class FranchiseROICalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('franchise-roi-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Franchise ROI form not found');
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
        franchiseInfo: {
          franchiseName: (formData.get('franchiseName') as string) || '',
          industry: (formData.get('industry') as string) || '',
          location: (formData.get('location') as string) || '',
        },
        initialInvestment: {
          franchiseFee: parseFloat((formData.get('franchiseFee') as string) || '0'),
          initialInvestment: parseFloat((formData.get('initialInvestment') as string) || '0'),
          workingCapital: parseFloat((formData.get('workingCapital') as string) || '0'),
          realEstateCost: parseFloat((formData.get('realEstateCost') as string) || '0'),
          equipmentCost: parseFloat((formData.get('equipmentCost') as string) || '0'),
        },
        ongoingCosts: {
          royaltyFee: parseFloat((formData.get('royaltyFee') as string) || '0.05'),
          marketingFee: parseFloat((formData.get('marketingFee') as string) || '0.02'),
          annualOperatingCosts: parseFloat((formData.get('annualOperatingCosts') as string) || '0'),
        },
        revenueProjections: {
          firstYearRevenue: parseFloat((formData.get('firstYearRevenue') as string) || '0'),
          revenueGrowthRate: parseFloat((formData.get('revenueGrowthRate') as string) || '0.1'),
          grossMargin: parseFloat((formData.get('grossMargin') as string) || '0.3'),
        },
        analysis: {
          includeROI: formData.get('includeROI') !== 'false',
          includeBreakEven: formData.get('includeBreakEven') !== 'false',
          includePaybackPeriod: formData.get('includePaybackPeriod') !== 'false',
          includeScenarioAnalysis: formData.get('includeScenarioAnalysis') !== 'false',
          projectionYears: parseInt((formData.get('projectionYears') as string) || '10'),
        },
      };

      const response = await fetch('/api/analyze-franchise-roi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze franchise ROI');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Franchise ROI error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze franchise ROI');
    } finally {
      hideLoading();
    }
  }

  private displayResults(result: unknown): void {
    const resultsDiv = document.getElementById('franchise-roi-results');
    const contentDiv = document.getElementById('franchise-roi-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Franchise ROI Analysis</h3>
          <p class="text-gray-700 dark:text-gray-300">
            Your franchise ROI analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new FranchiseROICalculator());
} else {
  new FranchiseROICalculator();
}
