/**
 * Business Expansion Loan Journey Client Script
 * Handles business expansion loan analysis and form interactions
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class BusinessExpansionLoanCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('business-expansion-loan-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Business expansion loan form not found');
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
      const response = await fetch('/api/analyze-business-expansion-loan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze business expansion loan');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Business expansion loan error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to analyze business expansion loan'
      );
    } finally {
      hideLoading();
    }
  }

  private buildInput(formData: FormData): Record<string, unknown> {
    return {
      businessInfo: {
        businessName: formData.get('businessName') || '',
        industry: formData.get('industry') || '',
        yearsInBusiness: parseInt((formData.get('yearsInBusiness') as string) || '0'),
        businessType: (formData.get('businessType') as string) || 'llc',
        employeeCount: parseInt((formData.get('employeeCount') as string) || '0'),
      },
      currentFinancials: {
        annualRevenue: parseFloat((formData.get('annualRevenue') as string) || '0'),
        annualEBITDA: parseFloat((formData.get('annualEBITDA') as string) || '0'),
        currentDebt: parseFloat((formData.get('currentDebt') as string) || '0'),
        monthlyDebtPayments: parseFloat((formData.get('monthlyDebtPayments') as string) || '0'),
        cashOnHand: parseFloat((formData.get('cashOnHand') as string) || '0'),
        accountsReceivable: 0,
        accountsPayable: 0,
        creditScore: formData.get('creditScore')
          ? parseInt(formData.get('creditScore') as string)
          : undefined,
      },
      expansionPlan: {
        loanAmount: parseFloat((formData.get('loanAmount') as string) || '0'),
        loanPurpose: (formData.get('loanPurpose') as string) || 'expansion',
        expectedRevenueIncrease: parseFloat(
          (formData.get('expectedRevenueIncrease') as string) || '0'
        ),
        expectedEBITDAIncrease: parseFloat(
          (formData.get('expectedEBITDAIncrease') as string) || '0'
        ),
        timeline: parseInt((formData.get('timeline') as string) || '3'),
        description: '',
      },
      loanPreferences: {
        preferredTerm: parseInt((formData.get('preferredTerm') as string) || '5'),
        preferredRate: formData.get('preferredRate')
          ? parseFloat(formData.get('preferredRate') as string) / 100
          : undefined,
        loanType: (formData.get('loanType') as string) || 'term-loan',
        collateralAvailable: false,
        collateralValue: 0,
      },
      goals: {
        riskTolerance: 'moderate',
        priority: (formData.get('priority') as string) || 'lowest-cost',
        includeScenarioAnalysis: true,
      },
    };
  }

  private displayResults(result: unknown): void {
    const resultsDiv = document.getElementById('expansion-loan-results');
    const contentDiv = document.getElementById('expansion-loan-results-content');

    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');

    // Format and display results
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Expansion Loan Analysis</h3>
          <p class="text-gray-700 dark:text-gray-300">
            Your business expansion loan analysis is complete. Use the AI assistant to get detailed recommendations and strategies.
          </p>
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          <p>💡 <strong>Tip:</strong> Click the chat icon to get AI-powered expansion loan recommendations based on your specific business situation.</p>
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
    new BusinessExpansionLoanCalculator();
  });
} else {
  new BusinessExpansionLoanCalculator();
}
