/**
 * FIRE Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class FIRECalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('fire-calculator-form') as HTMLFormElement;
    if (!this.form) {
      console.error('FIRE Calculator form not found');
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
        currentSituation: {
          age: parseInt((formData.get('age') as string) || '30'),
          currentSavings: parseFloat((formData.get('currentSavings') as string) || '0'),
          annualIncome: parseFloat((formData.get('annualIncome') as string) || '0'),
          annualExpenses: parseFloat((formData.get('annualExpenses') as string) || '0'),
          monthlySavings: parseFloat((formData.get('monthlySavings') as string) || '0'),
        },
        fireGoals: {
          targetAge: parseInt((formData.get('targetAge') as string) || '65'),
          annualExpensesInRetirement: parseFloat(
            (formData.get('annualExpensesInRetirement') as string) || '0'
          ),
          safeWithdrawalRate: parseFloat((formData.get('safeWithdrawalRate') as string) || '0.04'),
          fireType: (formData.get('fireType') as string) || 'traditional',
        },
        assumptions: {
          expectedReturn: parseFloat((formData.get('expectedReturn') as string) || '0.07'),
          inflationRate: parseFloat((formData.get('inflationRate') as string) || '0.03'),
          incomeGrowth: parseFloat((formData.get('incomeGrowth') as string) || '0.03'),
          expenseReduction: parseFloat((formData.get('expenseReduction') as string) || '0'),
        },
        analysis: {
          includeProjections: true,
          includeScenarios: true,
          includeExpenseOptimization: true,
        },
      };

      const response = await fetch('/api/analyze-fire-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to calculate FIRE');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('FIRE Calculator error:', error);
      showError(error instanceof Error ? error.message : 'Failed to calculate FIRE');
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('fire-calculator-results');
    const contentDiv = document.getElementById('fire-calculator-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="fa-panel-title text-lg mb-2">FIRE Analysis</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your FIRE calculation is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new FIRECalculator());
} else {
  new FIRECalculator();
}
