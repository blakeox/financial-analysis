/**
 * Insurance Needs Calculator Client Script
 * Handles insurance needs analysis and form interactions
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

interface InsuranceNeedsInput {
  personalInfo: {
    age: number;
    maritalStatus: string;
    dependents: number;
    annualIncome: number;
    netWorth: number;
    healthStatus: string;
    occupation?: string;
    hobbies?: string[];
  };
  currentCoverage: {
    lifeInsurance: number;
    disabilityInsurance: number;
    longTermCareInsurance: number;
  };
  goals: {
    incomeReplacementYears: number;
    educationFunding: number;
    debtPayoff: number;
    finalExpenses: number;
    riskTolerance: string;
  };
}

class InsuranceNeedsCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('insurance-needs-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Insurance needs form not found');
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
      const response = await fetch('/api/analyze-insurance-needs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze insurance needs');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Insurance needs error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze insurance needs');
    } finally {
      hideLoading();
    }
  }

  private buildInput(formData: FormData): InsuranceNeedsInput {
    return {
      personalInfo: {
        age: parseInt((formData.get('age') as string) || '35'),
        maritalStatus: (formData.get('maritalStatus') as string) || 'single',
        dependents: parseInt((formData.get('dependents') as string) || '0'),
        annualIncome: parseFloat((formData.get('annualIncome') as string) || '0'),
        netWorth: parseFloat((formData.get('netWorth') as string) || '0'),
        healthStatus: (formData.get('healthStatus') as string) || 'good',
        occupation: undefined,
        hobbies: [],
      },
      currentCoverage: {
        lifeInsurance: parseFloat((formData.get('lifeInsurance') as string) || '0'),
        disabilityInsurance: parseFloat((formData.get('disabilityInsurance') as string) || '0'),
        longTermCareInsurance: parseFloat((formData.get('longTermCareInsurance') as string) || '0'),
      },
      goals: {
        incomeReplacementYears: parseInt(
          (formData.get('incomeReplacementYears') as string) || '10'
        ),
        educationFunding: parseFloat((formData.get('educationFunding') as string) || '0'),
        debtPayoff: parseFloat((formData.get('debtPayoff') as string) || '0'),
        finalExpenses: parseFloat((formData.get('finalExpenses') as string) || '10000'),
        riskTolerance: 'moderate',
      },
    };
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('insurance-results');
    const contentDiv = document.getElementById('insurance-results-content');

    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');

    // Format and display results
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="fa-panel-title text-lg mb-2">Insurance Needs Analysis</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your insurance needs analysis is complete. Use the AI assistant to get detailed recommendations and coverage gap analysis.
          </p>
        </div>
        <div class="fa-script-copy-muted">
          <p>💡 <strong>Tip:</strong> Click the chat icon to get AI-powered insurance recommendations based on your specific situation.</p>
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
    new InsuranceNeedsCalculator();
  });
} else {
  new InsuranceNeedsCalculator();
}
