/**
 * Tax Optimization Planner Client Script
 * Handles tax optimization analysis and form interactions
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

interface TaxOptimizationInput {
  personalInfo: {
    age: number;
    maritalStatus: string;
    dependents: number;
    state?: string;
    filingStatus: string;
  };
  currentTaxSituation: {
    annualIncome: number;
    adjustedGrossIncome: number;
    taxableIncome: number;
    federalTaxOwed: number;
    stateTaxOwed?: number;
    effectiveTaxRate: number;
    marginalTaxRate: number;
    totalTaxOwed: number;
  };
  retirementAccounts: {
    traditional401k: { balance: number; annualContribution: number; employerMatch: number };
    roth401k: { balance: number; annualContribution: number };
    traditionalIRA: { balance: number; annualContribution: number; deductibleContribution: number };
    rothIRA: { balance: number; annualContribution: number };
    hsa: { balance: number; annualContribution: number; employerContribution: number };
  };
}

class TaxOptimizationCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('tax-optimization-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Tax optimization form not found');
      return;
    }

    this.form.addEventListener('submit', this.handleSubmit.bind(this));
    this.setupDefaultValues();
  }

  private setupDefaultValues(): void {
    // Set default values if needed
    const ageInput = document.getElementById('age') as HTMLInputElement;
    if (ageInput && !ageInput.value) {
      ageInput.value = '35';
    }
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
      const response = await fetch('/api/analyze-tax-optimization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze tax optimization');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Tax optimization error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze tax optimization');
    } finally {
      hideLoading();
    }
  }

  private buildInput(formData: FormData): TaxOptimizationInput {
    const annualIncome = parseFloat((formData.get('annualIncome') as string) || '0');
    const adjustedGrossIncome = parseFloat((formData.get('adjustedGrossIncome') as string) || '0');
    const taxableIncome = parseFloat((formData.get('taxableIncome') as string) || '0');
    const federalTaxOwed = parseFloat((formData.get('federalTaxOwed') as string) || '0');

    // Calculate effective and marginal tax rates
    const effectiveTaxRate = annualIncome > 0 ? federalTaxOwed / annualIncome : 0;
    const marginalTaxRate = this.calculateMarginalTaxRate(
      taxableIncome,
      formData.get('maritalStatus') as string
    );

    return {
      personalInfo: {
        age: parseInt((formData.get('age') as string) || '35'),
        maritalStatus: (formData.get('maritalStatus') as string) || 'single',
        dependents: parseInt((formData.get('dependents') as string) || '0'),
        state: (formData.get('state') as string) || undefined,
        filingStatus: this.mapMaritalStatusToFilingStatus(formData.get('maritalStatus') as string),
      },
      currentTaxSituation: {
        annualIncome,
        adjustedGrossIncome,
        taxableIncome,
        federalTaxOwed,
        stateTaxOwed: 0,
        effectiveTaxRate,
        marginalTaxRate,
        totalTaxOwed: federalTaxOwed,
      },
      retirementAccounts: {
        traditional401k: {
          balance: parseFloat((formData.get('traditional401k') as string) || '0'),
          annualContribution: 0,
          employerMatch: 0,
        },
        roth401k: {
          balance: parseFloat((formData.get('roth401k') as string) || '0'),
          annualContribution: 0,
        },
        traditionalIRA: {
          balance: parseFloat((formData.get('traditionalIRA') as string) || '0'),
          annualContribution: 0,
          deductibleContribution: 0,
        },
        rothIRA: {
          balance: parseFloat((formData.get('rothIRA') as string) || '0'),
          annualContribution: 0,
        },
        hsa: {
          balance: 0,
          annualContribution: 0,
          employerContribution: 0,
        },
      },
    };
  }

  private calculateMarginalTaxRate(taxableIncome: number, maritalStatus: string): number {
    // Simplified 2024 tax brackets (single)
    if (maritalStatus === 'married-filing-jointly') {
      if (taxableIncome <= 23200) return 0.1;
      if (taxableIncome <= 94300) return 0.12;
      if (taxableIncome <= 201050) return 0.22;
      if (taxableIncome <= 383900) return 0.24;
      if (taxableIncome <= 487450) return 0.32;
      if (taxableIncome <= 731200) return 0.35;
      return 0.37;
    } else {
      // Single
      if (taxableIncome <= 11600) return 0.1;
      if (taxableIncome <= 47150) return 0.12;
      if (taxableIncome <= 100525) return 0.22;
      if (taxableIncome <= 191950) return 0.24;
      if (taxableIncome <= 243725) return 0.32;
      if (taxableIncome <= 609350) return 0.35;
      return 0.37;
    }
  }

  private mapMaritalStatusToFilingStatus(maritalStatus: string): string {
    const mapping: Record<string, string> = {
      single: 'single',
      'married-filing-jointly': 'married-joint',
      'married-filing-separately': 'married-separate',
      'head-of-household': 'head-of-household',
      'qualifying-widow': 'widow',
    };
    return mapping[maritalStatus] || 'single';
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('tax-results');
    const contentDiv = document.getElementById('tax-results-content');

    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');

    // Format and display results
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Tax Summary</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your tax optimization analysis is complete. Use the AI assistant to get detailed recommendations and strategies.
          </p>
        </div>
        <div class="fa-script-copy-muted">
          <p>💡 <strong>Tip:</strong> Click the chat icon to get AI-powered tax optimization recommendations based on your specific situation.</p>
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
    new TaxOptimizationCalculator();
  });
} else {
  new TaxOptimizationCalculator();
}
