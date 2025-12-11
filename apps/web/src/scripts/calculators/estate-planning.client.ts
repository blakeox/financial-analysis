/**
 * Estate Planning Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class EstatePlanningCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('estate-planning-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Estate Planning form not found');
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
          age: parseInt((formData.get('age') as string) || '65'),
          maritalStatus: (formData.get('maritalStatus') as string) || 'married',
          stateOfResidence: (formData.get('stateOfResidence') as string) || 'CA',
        },
        assets: {
          totalAssets: parseFloat((formData.get('totalAssets') as string) || '0'),
          realEstate: parseFloat((formData.get('realEstate') as string) || '0'),
          investments: parseFloat((formData.get('investments') as string) || '0'),
          retirementAccounts: parseFloat((formData.get('retirementAccounts') as string) || '0'),
          businessInterests: parseFloat((formData.get('businessInterests') as string) || '0'),
          otherAssets: parseFloat((formData.get('otherAssets') as string) || '0'),
        },
        estatePlan: {
          hasWill: formData.get('hasWill') === 'true',
          hasTrust: formData.get('hasTrust') === 'true',
          beneficiaries: parseInt((formData.get('beneficiaries') as string) || '1'),
          charitableGiving: parseFloat((formData.get('charitableGiving') as string) || '0'),
        },
        taxInfo: {
          federalEstateTaxExemption: parseFloat(
            (formData.get('federalEstateTaxExemption') as string) || '12920000'
          ),
          stateEstateTaxExemption: parseFloat(
            (formData.get('stateEstateTaxExemption') as string) || '0'
          ),
          expectedGrowthRate: parseFloat((formData.get('expectedGrowthRate') as string) || '0.05'),
          yearsToProject: parseInt((formData.get('yearsToProject') as string) || '20'),
        },
        analysis: {
          includeEstateTaxProjection: true,
          includeInheritanceProjection: true,
          includeTrustAnalysis: formData.get('includeTrustAnalysis') === 'true',
        },
      };

      const response = await fetch('/api/analyze-estate-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze estate planning');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Estate Planning error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze estate planning');
    } finally {
      hideLoading();
    }
  }

  private displayResults(result: unknown): void {
    const resultsDiv = document.getElementById('estate-planning-results');
    const contentDiv = document.getElementById('estate-planning-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Estate Planning Analysis</h3>
          <p class="text-gray-700 dark:text-gray-300">
            Your estate planning analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new EstatePlanningCalculator());
} else {
  new EstatePlanningCalculator();
}
