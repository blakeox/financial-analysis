/**
 * Credit Risk Analyzer Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class CreditRiskAnalyzer {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('credit-risk-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Credit Risk form not found');
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
        borrowerInfo: {
          companyName: (formData.get('companyName') as string) || undefined,
          industry: (formData.get('industry') as string) || undefined,
          yearsInBusiness: formData.get('yearsInBusiness')
            ? parseInt(formData.get('yearsInBusiness') as string)
            : undefined,
        },
        financials: {
          annualRevenue: parseFloat((formData.get('annualRevenue') as string) || '0'),
          ebitda: parseFloat((formData.get('ebitda') as string) || '0'),
          netIncome: parseFloat((formData.get('netIncome') as string) || '0'),
          totalDebt: parseFloat((formData.get('totalDebt') as string) || '0'),
          totalAssets: parseFloat((formData.get('totalAssets') as string) || '0'),
          cashAndEquivalents: parseFloat((formData.get('cashAndEquivalents') as string) || '0'),
          currentLiabilities: parseFloat((formData.get('currentLiabilities') as string) || '0'),
        },
        debtInfo: {
          exposureAtDefault: parseFloat((formData.get('exposureAtDefault') as string) || '0'),
          currentRating: (formData.get('currentRating') as string) || undefined,
          recoveryRate: parseFloat((formData.get('recoveryRate') as string) || '0.4'),
        },
        analysis: {
          includePD: true,
          includeLGD: true,
          includeEL: true,
          includeStressTesting: formData.get('includeStressTesting') === 'true',
        },
      };

      const response = await fetch('/api/analyze-credit-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze credit risk');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Credit Risk error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze credit risk');
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('credit-risk-results');
    const contentDiv = document.getElementById('credit-risk-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="fa-panel-title text-lg mb-2">Credit Risk Analysis</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your credit risk analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new CreditRiskAnalyzer());
} else {
  new CreditRiskAnalyzer();
}
