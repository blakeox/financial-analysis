/**
 * Retirement Planning Engine Client Script
 * Handles retirement planning analysis and form interactions
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class RetirementPlanningCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('retirement-planning-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Retirement planning form not found');
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
      const response = await fetch('/api/analyze-retirement-planning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze retirement planning');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Retirement planning error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze retirement planning');
    } finally {
      hideLoading();
    }
  }

  private buildInput(formData: FormData): Record<string, unknown> {
    return {
      personalInfo: {
        age: parseInt((formData.get('age') as string) || '35'),
        retirementAge: parseInt((formData.get('retirementAge') as string) || '65'),
        lifeExpectancy: parseInt((formData.get('lifeExpectancy') as string) || '85'),
        maritalStatus: (formData.get('maritalStatus') as string) || 'married',
        dependents: 0,
      },
      currentAccounts: [
        {
          type: '401k',
          balance: 50000,
          annualContribution: 20000,
          employerMatch: 0.5,
          expectedReturn: 0.07,
        },
      ],
      income: {
        currentAnnual: parseFloat((formData.get('currentAnnual') as string) || '0'),
        expectedGrowthRate: parseFloat((formData.get('expectedGrowthRate') as string) || '0') / 100,
        socialSecurity: formData.get('socialSecurity')
          ? parseFloat(formData.get('socialSecurity') as string)
          : undefined,
      },
      expenses: {
        currentAnnual: parseFloat((formData.get('currentAnnualExpenses') as string) || '0'),
        retirementAnnual: parseFloat((formData.get('retirementAnnualExpenses') as string) || '0'),
        inflationRate: parseFloat((formData.get('inflationRate') as string) || '0') / 100,
      },
      goals: {
        targetRetirementIncome: parseFloat(
          (formData.get('targetRetirementIncome') as string) || '0'
        ),
        riskTolerance: (formData.get('riskTolerance') as string) || 'moderate',
        taxStrategy: 'balanced',
      },
    };
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('retirement-planning-results');
    const contentDiv = document.getElementById('retirement-planning-results-content');

    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');

    // Format and display results
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Retirement Planning Analysis</h3>
          <p class="text-gray-700 dark:text-gray-300">
            Your retirement planning analysis is complete. Use the AI assistant to get detailed recommendations and strategies.
          </p>
        </div>
        <div class="fa-script-copy-muted">
          <p>💡 <strong>Tip:</strong> Click the chat icon to get AI-powered retirement planning recommendations based on your specific situation.</p>
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
    new RetirementPlanningCalculator();
  });
} else {
  new RetirementPlanningCalculator();
}
