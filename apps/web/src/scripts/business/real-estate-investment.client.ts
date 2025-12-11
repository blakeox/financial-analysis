/**
 * Real Estate Investment Analyzer Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class RealEstateInvestmentAnalyzer {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('real-estate-investment-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Real Estate Investment form not found');
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
        propertyInfo: {
          purchasePrice: parseFloat((formData.get('purchasePrice') as string) || '0'),
          propertyType: (formData.get('propertyType') as string) || 'residential',
          squareFeet: formData.get('squareFeet')
            ? parseFloat(formData.get('squareFeet') as string)
            : undefined,
          units: formData.get('units') ? parseInt(formData.get('units') as string) : undefined,
        },
        financing: {
          downPayment: parseFloat((formData.get('downPayment') as string) || '0'),
          loanAmount: parseFloat((formData.get('loanAmount') as string) || '0'),
          interestRate: parseFloat((formData.get('interestRate') as string) || '0'),
          loanTerm: parseInt((formData.get('loanTerm') as string) || '30'),
          loanType: (formData.get('loanType') as string) || 'conventional',
        },
        income: {
          monthlyRent: parseFloat((formData.get('monthlyRent') as string) || '0'),
          annualRentIncrease: parseFloat((formData.get('annualRentIncrease') as string) || '0.03'),
          occupancyRate: parseFloat((formData.get('occupancyRate') as string) || '0.95'),
          otherIncome: parseFloat((formData.get('otherIncome') as string) || '0'),
        },
        expenses: {
          propertyTaxes: parseFloat((formData.get('propertyTaxes') as string) || '0'),
          insurance: parseFloat((formData.get('insurance') as string) || '0'),
          maintenance: parseFloat((formData.get('maintenance') as string) || '0'),
          propertyManagement: parseFloat((formData.get('propertyManagement') as string) || '0'),
          utilities: parseFloat((formData.get('utilities') as string) || '0'),
          otherExpenses: parseFloat((formData.get('otherExpenses') as string) || '0'),
          vacancyRate: parseFloat((formData.get('vacancyRate') as string) || '0.05'),
        },
        projections: {
          holdingPeriod: parseInt((formData.get('holdingPeriod') as string) || '10'),
          appreciationRate: parseFloat((formData.get('appreciationRate') as string) || '0.03'),
          saleCosts: parseFloat((formData.get('saleCosts') as string) || '0.06'),
        },
        analysis: {
          includeCapRate: true,
          includeCashOnCash: true,
          includeIRR: true,
          includeNOI: true,
        },
      };

      const response = await fetch('/api/analyze-real-estate-investment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze real estate investment');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Real Estate Investment error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to analyze real estate investment'
      );
    } finally {
      hideLoading();
    }
  }

  private displayResults(result: unknown): void {
    const resultsDiv = document.getElementById('real-estate-investment-results');
    const contentDiv = document.getElementById('real-estate-investment-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Real Estate Investment Analysis</h3>
          <p class="text-gray-700 dark:text-gray-300">
            Your real estate investment analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new RealEstateInvestmentAnalyzer());
} else {
  new RealEstateInvestmentAnalyzer();
}
