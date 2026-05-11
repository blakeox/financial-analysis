/**
 * Car Lease vs Buy Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class CarLeaseVsBuyCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('car-lease-vs-buy-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Car Lease vs Buy form not found');
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
        vehicleInfo: {
          msrp: parseFloat((formData.get('msrp') as string) || '0'),
          negotiatedPrice: parseFloat((formData.get('negotiatedPrice') as string) || '0'),
          residualValue: parseFloat((formData.get('residualValue') as string) || '0'),
        },
        leaseTerms: {
          leaseTerm: parseInt((formData.get('leaseTerm') as string) || '36'),
          downPayment: parseFloat((formData.get('leaseDownPayment') as string) || '0'),
          monthlyPayment: parseFloat((formData.get('monthlyPayment') as string) || '0'),
          moneyFactor: parseFloat((formData.get('moneyFactor') as string) || '0.001'),
          residualPercentage: parseFloat((formData.get('residualPercentage') as string) || '0.5'),
          mileageAllowance: parseFloat((formData.get('mileageAllowance') as string) || '12000'),
          excessMileageFee: parseFloat((formData.get('excessMileageFee') as string) || '0.25'),
        },
        purchaseTerms: {
          loanTerm: parseInt((formData.get('loanTerm') as string) || '60'),
          downPayment: parseFloat((formData.get('purchaseDownPayment') as string) || '0'),
          interestRate: parseFloat((formData.get('interestRate') as string) || '0.05'),
          salesTaxRate: parseFloat((formData.get('salesTaxRate') as string) || '0.08'),
        },
        ownershipCosts: {
          annualInsurance: parseFloat((formData.get('annualInsurance') as string) || '0'),
          annualMaintenance: parseFloat((formData.get('annualMaintenance') as string) || '0'),
          annualRepairs: parseFloat((formData.get('annualRepairs') as string) || '0'),
          fuelCost: parseFloat((formData.get('fuelCost') as string) || '0'),
          expectedOwnershipYears: parseInt((formData.get('expectedOwnershipYears') as string) || '6'),
        },
        financialAssumptions: {
          opportunityCostRate: parseFloat((formData.get('opportunityCostRate') as string) || '0.07'),
          expectedDepreciation: parseFloat((formData.get('expectedDepreciation') as string) || '0.15'),
        },
        analysis: {
          analysisPeriod: parseInt((formData.get('analysisPeriod') as string) || '3'),
          includeTaxBenefits: formData.get('includeTaxBenefits') !== 'false',
          includeEarlyTermination: formData.get('includeEarlyTermination') === 'true',
        },
      };

      const response = await fetch('/api/analyze-car-lease-vs-buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze car lease vs buy');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Car Lease vs Buy error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze car lease vs buy');
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('car-lease-vs-buy-results');
    const contentDiv = document.getElementById('car-lease-vs-buy-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="fa-panel-title text-lg mb-2">Car Lease vs Buy Analysis</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your car lease vs buy analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new CarLeaseVsBuyCalculator());
} else {
  new CarLeaseVsBuyCalculator();
}
