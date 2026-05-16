/**
 * Business Succession Planning Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class BusinessSuccessionPlanningCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('business-succession-planning-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Business Succession Planning form not found');
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
        businessInfo: {
          businessName: (formData.get('businessName') as string) || '',
          businessType: (formData.get('businessType') as string) || 'llc',
          annualRevenue: parseFloat((formData.get('annualRevenue') as string) || '0'),
          businessValue: parseFloat((formData.get('businessValue') as string) || '0'),
        },
        ownerInfo: {
          age: parseInt((formData.get('age') as string) || '50'),
          ownershipPercentage: parseFloat((formData.get('ownershipPercentage') as string) || '1'),
          expectedRetirementAge: parseInt(
            (formData.get('expectedRetirementAge') as string) || '65'
          ),
        },
        successionOptions: {
          successionType: (formData.get('successionType') as string) || 'family-transfer',
          hasBuySellAgreement: formData.get('hasBuySellAgreement') === 'true',
          buySellFunding: (formData.get('buySellFunding') as string) || 'life-insurance',
        },
        estatePlanning: {
          estateTaxExemption: parseFloat(
            (formData.get('estateTaxExemption') as string) || '12920000'
          ),
          includeGiftingStrategy: formData.get('includeGiftingStrategy') !== 'false',
          annualGiftExclusion: parseFloat(
            (formData.get('annualGiftExclusion') as string) || '18000'
          ),
        },
        analysis: {
          includeValuation: formData.get('includeValuation') !== 'false',
          includeTaxAnalysis: formData.get('includeTaxAnalysis') !== 'false',
          includeTransitionPlan: formData.get('includeTransitionPlan') !== 'false',
          includeFundingAnalysis: formData.get('includeFundingAnalysis') !== 'false',
          projectionYears: parseInt((formData.get('projectionYears') as string) || '10'),
        },
      };

      const response = await fetch('/api/analyze-business-succession-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze business succession planning');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Business Succession Planning error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to analyze business succession planning'
      );
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('business-succession-planning-results');
    const contentDiv = document.getElementById('business-succession-planning-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Business Succession Planning Analysis</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your business succession planning analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new BusinessSuccessionPlanningCalculator());
} else {
  new BusinessSuccessionPlanningCalculator();
}
