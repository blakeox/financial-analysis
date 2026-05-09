/**
 * 529 Plan Optimizer Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class FiveTwoNineOptimizerCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('529-optimizer-form') as HTMLFormElement;
    if (!this.form) {
      console.error('529 Optimizer form not found');
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
      const childrenJson = formData.get('children') as string;
      const children = childrenJson ? JSON.parse(childrenJson) : [];

      const input = {
        personalInfo: {
          stateOfResidence: (formData.get('stateOfResidence') as string) || '',
          filingStatus: (formData.get('filingStatus') as string) || 'single',
          stateTaxRate: parseFloat((formData.get('stateTaxRate') as string) || '0'),
        },
        children,
        contributionPlan: {
          annualContribution: parseFloat((formData.get('annualContribution') as string) || '0'),
          contributionIncrease: parseFloat((formData.get('contributionIncrease') as string) || '0.03'),
        },
        financialAid: {
          expectFinancialAid: formData.get('expectFinancialAid') !== 'false',
          expectedAidPercentage: parseFloat((formData.get('expectedAidPercentage') as string) || '0.3'),
        },
        strategy: {
          optimizeFor: (formData.get('optimizeFor') as string) || 'max-tax-benefit',
          includeMultiStateComparison: formData.get('includeMultiStateComparison') !== 'false',
        },
        analysis: {
          includeProjection: formData.get('includeProjection') !== 'false',
          includeShortfallAnalysis: formData.get('includeShortfallAnalysis') !== 'false',
          includeRolloverAnalysis: formData.get('includeRolloverAnalysis') !== 'false',
        },
      };

      const response = await fetch('/api/analyze-529-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze 529 optimizer');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('529 Optimizer error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze 529 optimizer');
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('529-optimizer-results');
    const contentDiv = document.getElementById('529-optimizer-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">529 Plan Optimizer Analysis</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your 529 plan optimizer analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new FiveTwoNineOptimizerCalculator());
} else {
  new FiveTwoNineOptimizerCalculator();
}
