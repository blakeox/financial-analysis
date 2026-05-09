/**
 * College Savings Planner Client Script
 * Handles college savings analysis and form interactions
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class CollegeSavingsCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('college-savings-form') as HTMLFormElement;
    if (!this.form) {
      console.error('College savings form not found');
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
      const response = await fetch('/api/analyze-college-savings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze college savings');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('College savings error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze college savings');
    } finally {
      hideLoading();
    }
  }

  private buildInput(formData: FormData): Record<string, unknown> {
    const numberOfChildren = parseInt((formData.get('numberOfChildren') as string) || '1');
    const children = [];
    for (let i = 0; i < numberOfChildren; i++) {
      children.push({
        name: `Child ${i + 1}`,
        age: 10 + i * 2, // Sample ages
        expectedCollegeStartAge: 18,
        expectedGraduationAge: 22,
        collegeType: 'public',
        specialNeeds: false,
      });
    }

    return {
      familyInfo: {
        numberOfChildren,
        children,
        stateOfResidence: formData.get('stateOfResidence') || 'CA',
        maritalStatus: formData.get('maritalStatus') || 'married',
      },
      currentSavings: {
        total529Balance: parseFloat((formData.get('total529Balance') as string) || '0'),
        totalCoverdellBalance: 0,
        totalOtherSavings: 0,
        monthlyContribution: parseFloat((formData.get('monthlyContribution') as string) || '0'),
      },
      goals: {
        targetCoverage: parseFloat((formData.get('targetCoverage') as string) || '100') / 100,
        riskTolerance: (formData.get('riskTolerance') as string) || 'moderate',
        investmentStrategy: 'age-based',
      },
    };
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('college-savings-results');
    const contentDiv = document.getElementById('college-savings-results-content');

    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');

    // Format and display results
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">College Savings Analysis</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your college savings analysis is complete. Use the AI assistant to get detailed recommendations and strategies.
          </p>
        </div>
        <div class="fa-script-copy-muted">
          <p>💡 <strong>Tip:</strong> Click the chat icon to get AI-powered college savings recommendations based on your specific situation.</p>
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
    new CollegeSavingsCalculator();
  });
} else {
  new CollegeSavingsCalculator();
}
