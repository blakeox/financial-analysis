/**
 * Employee Stock Options Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class EmployeeStockOptionsCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('employee-stock-options-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Employee Stock Options form not found');
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
      const optionsJson = formData.get('options') as string;
      const options = optionsJson ? JSON.parse(optionsJson) : [];

      const input = {
        personalInfo: {
          age: parseInt((formData.get('age') as string) || '35'),
          currentSalary: parseFloat((formData.get('currentSalary') as string) || '0'),
          expectedRetirementAge: parseInt(
            (formData.get('expectedRetirementAge') as string) || '65'
          ),
        },
        options,
        taxInfo: {
          federalTaxRate: {
            ordinary: parseFloat((formData.get('ordinaryTaxRate') as string) || '0.37'),
            capitalGains: parseFloat((formData.get('capitalGainsRate') as string) || '0.2'),
          },
          includeAMT: formData.get('includeAMT') !== 'false',
        },
        exerciseStrategy: {
          strategy: (formData.get('strategy') as string) || 'exercise-at-vest',
          includeTaxOptimization: formData.get('includeTaxOptimization') !== 'false',
        },
        analysis: {
          includeValuation: formData.get('includeValuation') !== 'false',
          includeTaxAnalysis: formData.get('includeTaxAnalysis') !== 'false',
          includeExerciseScenarios: formData.get('includeExerciseScenarios') !== 'false',
          projectionYears: parseInt((formData.get('projectionYears') as string) || '10'),
        },
      };

      const response = await fetch('/api/analyze-employee-stock-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze employee stock options');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Employee Stock Options error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to analyze employee stock options'
      );
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('employee-stock-options-results');
    const contentDiv = document.getElementById('employee-stock-options-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Employee Stock Options Analysis</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your employee stock options analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new EmployeeStockOptionsCalculator());
} else {
  new EmployeeStockOptionsCalculator();
}

