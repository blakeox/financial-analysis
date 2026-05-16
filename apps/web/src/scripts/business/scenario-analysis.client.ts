/**
 * Multi-Model Scenario Analysis Client Script
 * Handles scenario analysis and form interactions
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class ScenarioAnalysisCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('scenario-analysis-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Scenario analysis form not found');
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
      const input = this.buildInput(formData);

      // Call API endpoint
      const response = await fetch('/api/multi-model-scenario-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze scenario');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Scenario analysis error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze scenario');
    } finally {
      hideLoading();
    }
  }

  private buildInput(formData: FormData): Record<string, unknown> {
    return {
      scenarioId: formData.get('scenarioId') || 'young-professional',
      userProfile: {
        age: parseInt((formData.get('userAge') as string) || '35'),
        income: parseFloat((formData.get('userIncome') as string) || '0'),
        maritalStatus: 'single',
        dependents: 0,
        riskTolerance: (formData.get('riskTolerance') as string) || 'moderate',
      },
      currentProgress: {
        completedModels: [],
        currentModel: null,
        overallProgress: 0,
      },
      analysisType: 'comprehensive',
    };
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('scenario-results');
    const contentDiv = document.getElementById('scenario-results-content');

    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');

    // Format and display results
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="fa-panel-title text-lg mb-2">Scenario Analysis Complete</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your scenario analysis is complete. Use the AI assistant to get detailed recommendations and guidance.
          </p>
        </div>
        <div class="fa-script-copy-muted">
          <p>💡 <strong>Tip:</strong> Click the chat icon to get AI-powered scenario analysis and recommendations based on your specific situation.</p>
        </div>
      </div>
    `;

    // Scroll to results
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ScenarioAnalysisCalculator();
  });
} else {
  new ScenarioAnalysisCalculator();
}
