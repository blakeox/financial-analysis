/**
 * 401(k) Employer Match Optimizer Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class EmployerMatch401kOptimizer {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('401k-match-form') as HTMLFormElement;
    if (!this.form) {
      console.error('401(k) Match form not found');
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
        planDetails: {
          employerMatch: parseFloat((formData.get('employerMatch') as string) || '0'),
          matchLimit: parseFloat((formData.get('matchLimit') as string) || '0'),
          vestingSchedule: (formData.get('vestingSchedule') as string) || 'immediate',
          vestingYears: parseInt((formData.get('vestingYears') as string) || '0'),
          currentVestingPercentage: parseFloat(
            (formData.get('currentVestingPercentage') as string) || '1'
          ),
        },
        employeeInfo: {
          annualSalary: parseFloat((formData.get('annualSalary') as string) || '0'),
          currentContribution: parseFloat((formData.get('currentContribution') as string) || '0'),
          currentBalance: parseFloat((formData.get('currentBalance') as string) || '0'),
          yearsOfService: parseInt((formData.get('yearsOfService') as string) || '0'),
        },
        analysis: {
          includeMaximization: true,
          includeVestingAnalysis: true,
          includeTaxAnalysis: true,
        },
      };

      const response = await fetch('/api/analyze-401k-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to optimize 401(k) match');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('401(k) Match error:', error);
      showError(error instanceof Error ? error.message : 'Failed to optimize 401(k) match');
    } finally {
      hideLoading();
    }
  }

  private displayResults(result: unknown): void {
    const resultsDiv = document.getElementById('401k-match-results');
    const contentDiv = document.getElementById('401k-match-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">401(k) Match Analysis</h3>
          <p class="text-gray-700 dark:text-gray-300">
            Your 401(k) match optimization is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new EmployerMatch401kOptimizer());
} else {
  new EmployerMatch401kOptimizer();
}
