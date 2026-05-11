/**
 * Tax Loss Harvesting Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class TaxLossHarvestingCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('tax-loss-harvesting-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Tax Loss Harvesting form not found');
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
      const holdingsJson = formData.get('holdings') as string;
      const holdings = holdingsJson ? JSON.parse(holdingsJson) : [];

      const input = {
        portfolio: {
          holdings,
          totalValue: parseFloat((formData.get('totalValue') as string) || '0'),
        },
        taxInfo: {
          federalTaxRate: {
            shortTerm: parseFloat((formData.get('shortTermRate') as string) || '0.37'),
            longTerm: parseFloat((formData.get('longTermRate') as string) || '0.2'),
          },
          stateTaxRate: parseFloat((formData.get('stateTaxRate') as string) || '0'),
          incomeBracket: parseFloat((formData.get('incomeBracket') as string) || '0.22'),
        },
        realizedGains: {
          shortTermGains: parseFloat((formData.get('shortTermGains') as string) || '0'),
          longTermGains: parseFloat((formData.get('longTermGains') as string) || '0'),
          ordinaryIncome: parseFloat((formData.get('ordinaryIncome') as string) || '0'),
        },
        harvestingStrategy: {
          maxHarvestAmount: parseFloat((formData.get('maxHarvestAmount') as string) || '3000'),
          includeWashSaleRules: formData.get('includeWashSaleRules') !== 'false',
          washSaleWindow: parseInt((formData.get('washSaleWindow') as string) || '30'),
          replacementSecuritySimilarity: (formData.get('replacementSecuritySimilarity') as string) || 'similar',
        },
        analysis: {
          includeTaxSavingsProjection: formData.get('includeTaxSavingsProjection') !== 'false',
          includeCarryForwardAnalysis: formData.get('includeCarryForwardAnalysis') !== 'false',
          projectionYears: parseInt((formData.get('projectionYears') as string) || '5'),
        },
      };

      const response = await fetch('/api/analyze-tax-loss-harvesting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze tax loss harvesting');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Tax Loss Harvesting error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze tax loss harvesting');
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('tax-loss-harvesting-results');
    const contentDiv = document.getElementById('tax-loss-harvesting-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="fa-panel-title text-lg mb-2">Tax Loss Harvesting Analysis</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your tax loss harvesting analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new TaxLossHarvestingCalculator());
} else {
  new TaxLossHarvestingCalculator();
}
