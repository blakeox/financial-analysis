/**
 * Life Insurance Reassessment Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class LifeInsuranceReassessmentCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('life-insurance-reassessment-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Life Insurance Reassessment form not found');
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
      const policiesJson = formData.get('policies') as string;
      const policies = policiesJson ? JSON.parse(policiesJson) : [];

      const input = {
        personalInfo: {
          age: parseInt((formData.get('age') as string) || '40'),
          healthStatus: (formData.get('healthStatus') as string) || 'good',
          smoker: formData.get('smoker') === 'true',
          gender: (formData.get('gender') as string) || 'male',
        },
        currentPolicies: policies,
        financialSituation: {
          annualIncome: parseFloat((formData.get('annualIncome') as string) || '0'),
          totalAssets: parseFloat((formData.get('totalAssets') as string) || '0'),
          totalDebt: parseFloat((formData.get('totalDebt') as string) || '0'),
          monthlyExpenses: parseFloat((formData.get('monthlyExpenses') as string) || '0'),
          dependents: parseInt((formData.get('dependents') as string) || '0'),
        },
        needsAnalysis: {
          incomeReplacement: {
            yearsOfIncome: parseInt((formData.get('yearsOfIncome') as string) || '10'),
            replacementPercentage: parseFloat(
              (formData.get('replacementPercentage') as string) || '0.7'
            ),
          },
          debtPayoff: {
            mortgageBalance: parseFloat((formData.get('mortgageBalance') as string) || '0'),
            otherDebt: parseFloat((formData.get('otherDebt') as string) || '0'),
          },
          educationFunding: {
            childrenCount: parseInt((formData.get('childrenCount') as string) || '0'),
            educationCostPerChild: parseFloat(
              (formData.get('educationCostPerChild') as string) || '0'
            ),
          },
          finalExpenses: parseFloat((formData.get('finalExpenses') as string) || '10000'),
          estateTaxes: parseFloat((formData.get('estateTaxes') as string) || '0'),
        },
        analysis: {
          includeCoverageGapAnalysis: formData.get('includeCoverageGapAnalysis') !== 'false',
          includePolicyOptimization: formData.get('includePolicyOptimization') !== 'false',
          includeConversionAnalysis: formData.get('includeConversionAnalysis') !== 'false',
          includeTermVsPermanent: formData.get('includeTermVsPermanent') !== 'false',
        },
      };

      const response = await fetch('/api/analyze-life-insurance-reassessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze life insurance reassessment');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Life Insurance Reassessment error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to analyze life insurance reassessment'
      );
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('life-insurance-reassessment-results');
    const contentDiv = document.getElementById('life-insurance-reassessment-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Life Insurance Reassessment Analysis</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your life insurance reassessment analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new LifeInsuranceReassessmentCalculator());
} else {
  new LifeInsuranceReassessmentCalculator();
}
