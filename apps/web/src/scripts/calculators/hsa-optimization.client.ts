/**
 * HSA Optimization Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class HSAOptimizationCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('hsa-optimization-form') as HTMLFormElement;
    if (!this.form) {
      console.error('HSA Optimization form not found');
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
          filingStatus: (formData.get('filingStatus') as string) || 'single',
          currentHSABalance: parseFloat((formData.get('currentHSABalance') as string) || '0'),
        },
        contributionLimits: {
          individualLimit: parseFloat((formData.get('individualLimit') as string) || '4150'),
          familyLimit: parseFloat((formData.get('familyLimit') as string) || '8300'),
          catchUpContribution: parseFloat(
            (formData.get('catchUpContribution') as string) || '1000'
          ),
          currentYear: parseInt(
            (formData.get('currentYear') as string) || new Date().getFullYear().toString()
          ),
        },
        hsaDetails: {
          annualContribution: parseFloat((formData.get('annualContribution') as string) || '0'),
          employerContribution: parseFloat((formData.get('employerContribution') as string) || '0'),
          investmentReturn: parseFloat((formData.get('investmentReturn') as string) || '0.07'),
          accountFees: parseFloat((formData.get('accountFees') as string) || '0'),
        },
        medicalExpenses: {
          annualMedicalExpenses: parseFloat(
            (formData.get('annualMedicalExpenses') as string) || '0'
          ),
          expectedRetirementMedicalCosts: parseFloat(
            (formData.get('expectedRetirementMedicalCosts') as string) || '0'
          ),
          yearsUntilRetirement: parseInt((formData.get('yearsUntilRetirement') as string) || '30'),
        },
        strategy: {
          optimizeFor: (formData.get('optimizeFor') as string) || 'hybrid',
          useForCurrentExpenses: formData.get('useForCurrentExpenses') === 'true',
          saveReceipts: formData.get('saveReceipts') !== 'false',
        },
        taxInfo: {
          federalTaxRate: parseFloat((formData.get('federalTaxRate') as string) || '0.22'),
          stateTaxRate: parseFloat((formData.get('stateTaxRate') as string) || '0'),
          ficaTaxRate: parseFloat((formData.get('ficaTaxRate') as string) || '0.0765'),
        },
      };

      const response = await fetch('/api/analyze-hsa-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze HSA optimization');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('HSA Optimization error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze HSA optimization');
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('hsa-optimization-results');
    const contentDiv = document.getElementById('hsa-optimization-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">HSA Optimization Analysis</h3>
          <p class="text-gray-700 dark:text-gray-300">
            Your HSA optimization analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new HSAOptimizationCalculator());
} else {
  new HSAOptimizationCalculator();
}


