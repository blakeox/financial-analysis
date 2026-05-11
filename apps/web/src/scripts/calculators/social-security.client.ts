/**
 * Social Security Optimizer Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class SocialSecurityCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('social-security-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Social Security form not found');
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
      const birthDate = formData.get('birthDate') as string;
      // const birthYear = new Date(birthDate).getFullYear();
      const fullRetirementAge = parseFloat((formData.get('fullRetirementAge') as string) || '67');

      const input = {
        personalInfo: {
          birthDate,
          currentAge: parseInt((formData.get('currentAge') as string) || '65'),
          fullRetirementAge,
          lifeExpectancy: parseInt((formData.get('lifeExpectancy') as string) || '85'),
        },
        earnings: {
          currentAnnualEarnings: parseFloat(
            (formData.get('currentAnnualEarnings') as string) || '0'
          ),
          averageLifetimeEarnings: formData.get('averageLifetimeEarnings')
            ? parseFloat(formData.get('averageLifetimeEarnings') as string)
            : undefined,
        },
        maritalStatus: (formData.get('maritalStatus') as string) || 'single',
        claimingStrategy: {
          primaryClaimingAge: parseInt((formData.get('primaryClaimingAge') as string) || '67'),
          strategy: undefined,
        },
        goals: {
          optimizeFor: (formData.get('optimizeFor') as string) || 'maximum-lifetime',
          includeBreakEvenAnalysis: true,
        },
      };

      const response = await fetch('/api/analyze-social-security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to optimize Social Security strategy');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Social Security error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to optimize Social Security strategy'
      );
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('social-security-results');
    const contentDiv = document.getElementById('social-security-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="fa-panel-title text-lg mb-2">Social Security Optimization</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your Social Security strategy analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new SocialSecurityCalculator());
} else {
  new SocialSecurityCalculator();
}
