/**
 * Disability Insurance Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class DisabilityInsuranceCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('disability-insurance-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Disability Insurance form not found');
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
          age: parseInt((formData.get('age') as string) || '35'),
          occupation: (formData.get('occupation') as string) || '',
          occupationClass: (formData.get('occupationClass') as string) || 'professional',
          annualIncome: parseFloat((formData.get('annualIncome') as string) || '0'),
          monthlyExpenses: parseFloat((formData.get('monthlyExpenses') as string) || '0'),
        },
        currentCoverage: {
          hasGroupCoverage: formData.get('hasGroupCoverage') === 'true',
          groupCoverageAmount: parseFloat((formData.get('groupCoverageAmount') as string) || '0'),
          hasIndividualPolicy: formData.get('hasIndividualPolicy') === 'true',
        },
        needsAnalysis: {
          targetReplacementIncome: parseFloat(
            (formData.get('targetReplacementIncome') as string) || '0.6'
          ),
          includeSocialSecurity: formData.get('includeSocialSecurity') !== 'false',
          expectedSSDIBenefit: parseFloat((formData.get('expectedSSDIBenefit') as string) || '0'),
        },
        policyOptions: {
          benefitAmount: parseFloat((formData.get('benefitAmount') as string) || '0'),
          benefitPeriod: (formData.get('benefitPeriod') as string) || 'to-age-65',
          eliminationPeriod: parseInt((formData.get('eliminationPeriod') as string) || '90'),
          definitionOfDisability:
            (formData.get('definitionOfDisability') as string) || 'own-occupation',
          estimatedAnnualPremium: parseFloat(
            (formData.get('estimatedAnnualPremium') as string) || '0'
          ),
        },
        analysis: {
          includeCoverageGapAnalysis: formData.get('includeCoverageGapAnalysis') !== 'false',
          includeCostBenefitAnalysis: formData.get('includeCostBenefitAnalysis') !== 'false',
          includeProbabilityAnalysis: formData.get('includeProbabilityAnalysis') !== 'false',
        },
      };

      const response = await fetch('/api/analyze-disability-insurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze disability insurance');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Disability Insurance error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze disability insurance');
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('disability-insurance-results');
    const contentDiv = document.getElementById('disability-insurance-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Disability Insurance Analysis</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your disability insurance analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new DisabilityInsuranceCalculator());
} else {
  new DisabilityInsuranceCalculator();
}
