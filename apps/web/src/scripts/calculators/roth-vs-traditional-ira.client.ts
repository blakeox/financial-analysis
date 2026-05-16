/**
 * Roth vs Traditional IRA Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class RothVsTraditionalIRACalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('roth-vs-traditional-ira-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Roth vs Traditional IRA form not found');
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
          retirementAge: parseInt((formData.get('retirementAge') as string) || '65'),
          currentTaxBracket: parseFloat((formData.get('currentTaxBracket') as string) || '0.22'),
          expectedRetirementTaxBracket: parseFloat(
            (formData.get('expectedRetirementTaxBracket') as string) || '0.15'
          ),
        },
        contributionDetails: {
          annualContribution: parseFloat((formData.get('annualContribution') as string) || '0'),
          catchUpContribution: parseFloat((formData.get('catchUpContribution') as string) || '0'),
          yearsToContribute: parseInt((formData.get('yearsToContribute') as string) || '30'),
        },
        accountDetails: {
          currentTraditionalBalance: parseFloat(
            (formData.get('currentTraditionalBalance') as string) || '0'
          ),
          currentRothBalance: parseFloat((formData.get('currentRothBalance') as string) || '0'),
          expectedReturn: parseFloat((formData.get('expectedReturn') as string) || '0.07'),
        },
        taxInfo: {
          currentMarginalTaxRate: parseFloat(
            (formData.get('currentMarginalTaxRate') as string) || '0.22'
          ),
          expectedRetirementMarginalTaxRate: parseFloat(
            (formData.get('expectedRetirementMarginalTaxRate') as string) || '0.15'
          ),
          stateTaxRate: parseFloat((formData.get('stateTaxRate') as string) || '0'),
          stateTaxDeduction: formData.get('stateTaxDeduction') === 'true',
        },
        withdrawalStrategy: {
          annualWithdrawalAmount: parseFloat(
            (formData.get('annualWithdrawalAmount') as string) || '0'
          ),
          withdrawalStartAge: parseFloat((formData.get('withdrawalStartAge') as string) || '65'),
          includeRequiredMinimumDistributions:
            formData.get('includeRequiredMinimumDistributions') !== 'false',
          rmdsStartAge: parseInt((formData.get('rmdsStartAge') as string) || '73'),
        },
        analysis: {
          includeConversionAnalysis: formData.get('includeConversionAnalysis') !== 'false',
          includeTaxBracketOptimization: formData.get('includeTaxBracketOptimization') !== 'false',
          projectionYears: parseInt((formData.get('projectionYears') as string) || '30'),
        },
      };

      const response = await fetch('/api/analyze-roth-vs-traditional-ira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze Roth vs Traditional IRA');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Roth vs Traditional IRA error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to analyze Roth vs Traditional IRA'
      );
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('roth-vs-traditional-ira-results');
    const contentDiv = document.getElementById('roth-vs-traditional-ira-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Roth vs Traditional IRA Analysis</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your IRA comparison analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new RothVsTraditionalIRACalculator());
} else {
  new RothVsTraditionalIRACalculator();
}
