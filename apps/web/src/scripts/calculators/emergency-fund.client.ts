/**
 * Emergency Fund Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class EmergencyFundCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('emergency-fund-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Emergency Fund form not found');
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
          monthlyExpenses: parseFloat((formData.get('monthlyExpenses') as string) || '0'),
          monthlyIncome: parseFloat((formData.get('monthlyIncome') as string) || '0'),
          currentEmergencyFund: parseFloat((formData.get('currentEmergencyFund') as string) || '0'),
          dependents: parseInt((formData.get('dependents') as string) || '0'),
          employmentStatus: (formData.get('employmentStatus') as string) || 'employed',
        },
        goals: {
          targetMonths: parseInt((formData.get('targetMonths') as string) || '6'),
          priority: (formData.get('priority') as string) || 'build-gradually',
        },
        assumptions: {
          monthlySavings: parseFloat((formData.get('monthlySavings') as string) || '0'),
          expectedReturn: parseFloat((formData.get('expectedReturn') as string) || '0.02'),
        },
        analysis: {
          includeTimeline: true,
          includeScenarios: true,
        },
      };

      const response = await fetch('/api/analyze-emergency-fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to calculate emergency fund');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Emergency Fund error:', error);
      showError(error instanceof Error ? error.message : 'Failed to calculate emergency fund');
    } finally {
      hideLoading();
    }
  }

  private displayResults(result: unknown): void {
    const resultsDiv = document.getElementById('emergency-fund-results');
    const contentDiv = document.getElementById('emergency-fund-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Emergency Fund Analysis</h3>
          <p class="text-gray-700 dark:text-gray-300">
            Your emergency fund analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new EmergencyFundCalculator());
} else {
  new EmergencyFundCalculator();
}
