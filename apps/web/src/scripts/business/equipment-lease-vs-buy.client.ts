/**
 * Equipment Lease vs Buy Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class EquipmentLeaseVsBuyCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('equipment-lease-vs-buy-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Equipment Lease vs Buy form not found');
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
        equipmentInfo: {
          purchasePrice: parseFloat((formData.get('purchasePrice') as string) || '0'),
          usefulLife: parseInt((formData.get('usefulLife') as string) || '5'),
          expectedResidualValue: parseFloat(
            (formData.get('expectedResidualValue') as string) || '0'
          ),
        },
        leaseTerms: {
          leaseType: (formData.get('leaseType') as string) || 'operating-lease',
          leaseTerm: parseInt((formData.get('leaseTerm') as string) || '5'),
          monthlyPayment: parseFloat((formData.get('monthlyPayment') as string) || '0'),
          downPayment: parseFloat((formData.get('leaseDownPayment') as string) || '0'),
          buyoutOption: formData.get('buyoutOption') === 'true',
          buyoutPrice: parseFloat((formData.get('buyoutPrice') as string) || '0'),
          maintenanceIncluded: formData.get('maintenanceIncluded') === 'true',
        },
        purchaseTerms: {
          downPayment: parseFloat((formData.get('purchaseDownPayment') as string) || '0'),
          loanTerm: parseInt((formData.get('loanTerm') as string) || '5'),
          interestRate: parseFloat((formData.get('interestRate') as string) || '0.08'),
          annualMaintenanceCost: parseFloat(
            (formData.get('annualMaintenanceCost') as string) || '0'
          ),
        },
        taxInfo: {
          federalTaxRate: parseFloat((formData.get('federalTaxRate') as string) || '0.21'),
          section179Eligible: formData.get('section179Eligible') !== 'false',
          bonusDepreciationEligible: formData.get('bonusDepreciationEligible') !== 'false',
        },
        analysis: {
          includeNPV: formData.get('includeNPV') !== 'false',
          includeIRR: formData.get('includeIRR') !== 'false',
          includeCashFlowComparison: formData.get('includeCashFlowComparison') !== 'false',
          includeTaxImpact: formData.get('includeTaxImpact') !== 'false',
          analysisPeriod: parseInt((formData.get('analysisPeriod') as string) || '5'),
        },
      };

      const response = await fetch('/api/analyze-equipment-lease-vs-buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze equipment lease vs buy');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Equipment Lease vs Buy error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to analyze equipment lease vs buy'
      );
    } finally {
      hideLoading();
    }
  }

  private displayResults(result: unknown): void {
    const resultsDiv = document.getElementById('equipment-lease-vs-buy-results');
    const contentDiv = document.getElementById('equipment-lease-vs-buy-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Equipment Lease vs Buy Analysis</h3>
          <p class="text-gray-700 dark:text-gray-300">
            Your equipment lease vs buy analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new EquipmentLeaseVsBuyCalculator());
} else {
  new EquipmentLeaseVsBuyCalculator();
}
