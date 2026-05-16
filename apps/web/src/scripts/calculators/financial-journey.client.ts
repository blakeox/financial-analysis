/**
 * Financial Journey Client Script
 * Handles financial journey planning and form interactions
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class FinancialJourneyCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('financial-journey-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Financial journey form not found');
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
      const response = await fetch('/api/analyze-financial-journey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze financial journey');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Financial journey error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze financial journey');
    } finally {
      hideLoading();
    }
  }

  private buildInput(formData: FormData): Record<string, unknown> {
    return {
      personalInfo: {
        age: parseInt((formData.get('age') as string) || '35'),
        maritalStatus: (formData.get('maritalStatus') as string) || 'single',
        dependents: parseInt((formData.get('dependents') as string) || '0'),
        employmentStatus: (formData.get('employmentStatus') as string) || 'employed',
        education: 'bachelors',
      },
      currentFinancials: {
        annualIncome: parseFloat((formData.get('annualIncome') as string) || '0'),
        monthlyExpenses: parseFloat((formData.get('monthlyExpenses') as string) || '0'),
        totalDebt: parseFloat((formData.get('totalDebt') as string) || '0'),
        emergencyFund: parseFloat((formData.get('emergencyFund') as string) || '0'),
        retirementSavings: parseFloat((formData.get('retirementSavings') as string) || '0'),
        otherAssets: parseFloat((formData.get('otherAssets') as string) || '0'),
      },
      goals: {
        shortTerm: [],
        mediumTerm: [],
        longTerm: [],
        riskTolerance: (formData.get('riskTolerance') as string) || 'moderate',
        timeHorizon: parseInt((formData.get('timeHorizon') as string) || '10'),
      },
    };
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('journey-results');
    const contentDiv = document.getElementById('journey-results-content');

    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');

    // Format and display results
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="fa-panel-title text-lg mb-2">Financial Journey Plan</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your financial journey plan is complete. Use the AI assistant to get detailed recommendations and next steps.
          </p>
        </div>
        <div class="fa-script-copy-muted">
          <p>💡 <strong>Tip:</strong> Click the chat icon to get AI-powered financial journey recommendations and personalized action plans.</p>
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
    new FinancialJourneyCalculator();
  });
} else {
  new FinancialJourneyCalculator();
}
