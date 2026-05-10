/**
 * Home Buying Affordability Calculator Client Script
 * Handles home buying affordability analysis and form interactions
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class HomeBuyingAffordabilityCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('home-buying-affordability-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Home buying affordability form not found');
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
      const response = await fetch('/api/analyze-home-buying-affordability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze home buying affordability');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Home buying affordability error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to analyze home buying affordability'
      );
    } finally {
      hideLoading();
    }
  }

  private buildInput(formData: FormData): Record<string, unknown> {
    return {
      personalInfo: {
        age: parseInt((formData.get('age') as string) || '35'),
        maritalStatus: 'married',
        dependents: 0,
        employmentStatus: 'employed',
        yearsEmployed: 5,
        creditScore: parseInt((formData.get('creditScore') as string) || '700'),
      },
      finances: {
        annualIncome: parseFloat((formData.get('annualIncome') as string) || '0'),
        monthlyDebtPayments: parseFloat((formData.get('monthlyDebtPayments') as string) || '0'),
        downPaymentAvailable: parseFloat((formData.get('downPaymentAvailable') as string) || '0'),
        emergencyFund: parseFloat((formData.get('emergencyFund') as string) || '0'),
        otherAssets: 0,
      },
      homePreferences: {
        targetPrice: parseFloat((formData.get('targetPrice') as string) || '0'),
        location: 'Unknown',
        homeType: (formData.get('homeType') as string) || 'single-family',
        mustHaves: [],
        niceToHaves: [],
      },
      goals: {
        timeline: 2,
        riskTolerance: 'moderate',
        priority: 'affordability',
      },
    };
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('home-buying-results');
    const contentDiv = document.getElementById('home-buying-results-content');

    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');

    // Format and display results
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Home Buying Affordability Analysis</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your home buying affordability analysis is complete. Use the AI assistant to get detailed recommendations and strategies.
          </p>
        </div>
        <div class="fa-script-copy-muted">
          <p>💡 <strong>Tip:</strong> Click the chat icon to get AI-powered home buying recommendations based on your specific situation.</p>
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
    new HomeBuyingAffordabilityCalculator();
  });
} else {
  new HomeBuyingAffordabilityCalculator();
}
