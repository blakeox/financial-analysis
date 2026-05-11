/**
 * International Tax Planning Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class InternationalTaxPlanningCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('international-tax-planning-form') as HTMLFormElement;
    if (!this.form) {
      console.error('International Tax Planning form not found');
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
        personalInfo: {
          citizenship: (formData.get('citizenship') as string) || '',
          residency: (formData.get('residency') as string) || '',
          filingStatus: (formData.get('filingStatus') as string) || 'single',
        },
        income: {
          domesticIncome: parseFloat((formData.get('domesticIncome') as string) || '0'),
          foreignIncome: parseFloat((formData.get('foreignIncome') as string) || '0'),
          foreignTaxPaid: parseFloat((formData.get('foreignTaxPaid') as string) || '0'),
        },
        taxTreaties: {
          hasTaxTreaty: formData.get('hasTaxTreaty') === 'true',
          treatyCountry: (formData.get('treatyCountry') as string) || '',
          treatyBenefits: formData.get('treatyBenefits')
            ? JSON.parse(formData.get('treatyBenefits') as string)
            : [],
        },
        businessStructure: {
          hasForeignEntity: formData.get('hasForeignEntity') === 'true',
          entityType: (formData.get('entityType') as string) || 'corporation',
          transferPricing: formData.get('transferPricing') === 'true',
        },
        analysis: {
          includeForeignTaxCredit: formData.get('includeForeignTaxCredit') !== 'false',
          includeTaxTreatyAnalysis: formData.get('includeTaxTreatyAnalysis') !== 'false',
          includeTransferPricing: formData.get('includeTransferPricing') !== 'false',
          includeCFCAnalysis: formData.get('includeCFCAnalysis') !== 'false',
          includeBEPSCompliance: formData.get('includeBEPSCompliance') !== 'false',
        },
      };

      const response = await fetch('/api/analyze-international-tax-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze international tax planning');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('International Tax Planning error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to analyze international tax planning'
      );
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('international-tax-planning-results');
    const contentDiv = document.getElementById('international-tax-planning-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="fa-panel-title text-lg mb-2">International Tax Planning Analysis</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your international tax planning analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new InternationalTaxPlanningCalculator());
} else {
  new InternationalTaxPlanningCalculator();
}

