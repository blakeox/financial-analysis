/**
 * Credit Score Impact Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class CreditScoreImpactCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('credit-score-impact-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Credit Score Impact form not found');
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
        currentCredit: {
          currentScore: parseInt((formData.get('currentScore') as string) || '700'),
          creditBureau: (formData.get('creditBureau') as string) || 'fico-8',
        },
        creditUtilization: {
          totalCreditLimit: parseFloat((formData.get('totalCreditLimit') as string) || '0'),
          totalCreditUsed: parseFloat((formData.get('totalCreditUsed') as string) || '0'),
          utilizationPercentage: parseFloat(
            (formData.get('utilizationPercentage') as string) || '0'
          ),
        },
        paymentHistory: {
          onTimePayments: parseFloat((formData.get('onTimePayments') as string) || '100'),
          latePayments30Days: parseInt((formData.get('latePayments30Days') as string) || '0'),
          latePayments60Days: parseInt((formData.get('latePayments60Days') as string) || '0'),
          latePayments90Days: parseInt((formData.get('latePayments90Days') as string) || '0'),
        },
        plannedActions: {
          payDownDebt: {
            amount: parseFloat((formData.get('payDownAmount') as string) || '0'),
            targetUtilization: parseFloat((formData.get('targetUtilization') as string) || '0.3'),
          },
          openNewAccount: formData.get('openNewAccount') === 'true',
          requestCreditLimitIncrease: formData.get('requestCreditLimitIncrease') === 'true',
        },
        analysis: {
          includeScoreProjection: formData.get('includeScoreProjection') !== 'false',
          includeActionRecommendations: formData.get('includeActionRecommendations') !== 'false',
          includeTimelineAnalysis: formData.get('includeTimelineAnalysis') !== 'false',
          projectionMonths: parseInt((formData.get('projectionMonths') as string) || '12'),
        },
      };

      const response = await fetch('/api/analyze-credit-score-impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze credit score impact');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Credit Score Impact error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze credit score impact');
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('credit-score-impact-results');
    const contentDiv = document.getElementById('credit-score-impact-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Credit Score Impact Analysis</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your credit score impact analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new CreditScoreImpactCalculator());
} else {
  new CreditScoreImpactCalculator();
}
