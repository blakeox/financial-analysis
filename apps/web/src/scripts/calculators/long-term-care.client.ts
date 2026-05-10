/**
 * Long-Term Care Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class LongTermCareCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('long-term-care-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Long-Term Care form not found');
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
        personalInfo: {
          age: parseInt((formData.get('age') as string) || '55'),
          gender: (formData.get('gender') as string) || 'male',
          healthStatus: (formData.get('healthStatus') as string) || 'good',
        },
        careNeeds: {
          expectedCareStartAge: parseInt((formData.get('expectedCareStartAge') as string) || '80'),
          expectedCareDuration: parseFloat((formData.get('expectedCareDuration') as string) || '3'),
          careType: (formData.get('careType') as string) || 'mixed',
          annualCareCost: parseFloat((formData.get('annualCareCost') as string) || '100000'),
          careCostInflation: parseFloat((formData.get('careCostInflation') as string) || '0.05'),
        },
        insuranceOptions: {
          hasLTCInsurance: formData.get('hasLTCInsurance') === 'true',
          policyDetails: formData.get('policyDetails')
            ? JSON.parse(formData.get('policyDetails') as string)
            : undefined,
        },
        financialResources: {
          currentAssets: parseFloat((formData.get('currentAssets') as string) || '0'),
          annualIncome: parseFloat((formData.get('annualIncome') as string) || '0'),
          expectedRetirementAssets: parseFloat((formData.get('expectedRetirementAssets') as string) || '0'),
        },
        strategy: {
          fundingMethod: (formData.get('fundingMethod') as string) || 'hybrid',
        },
        analysis: {
          includeProbabilityAnalysis: formData.get('includeProbabilityAnalysis') !== 'false',
          includeScenarioAnalysis: formData.get('includeScenarioAnalysis') !== 'false',
          projectionYears: parseInt((formData.get('projectionYears') as string) || '30'),
        },
      };

      const response = await fetch('/api/analyze-long-term-care', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze long-term care');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Long-Term Care error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze long-term care');
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('long-term-care-results');
    const contentDiv = document.getElementById('long-term-care-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Long-Term Care Analysis</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your long-term care analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new LongTermCareCalculator());
} else {
  new LongTermCareCalculator();
}
