/**
 * Project Finance Analyzer Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class ProjectFinanceAnalyzer {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('project-finance-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Project Finance form not found');
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

      // Parse annual cash flows from form
      const cashFlowYears = parseInt((formData.get('cashFlowYears') as string) || '5');
      const annualCashFlows = [];
      for (let year = 1; year <= cashFlowYears; year++) {
        annualCashFlows.push({
          year,
          revenue: parseFloat((formData.get(`revenue_${year}`) as string) || '0'),
          operatingExpenses: parseFloat(
            (formData.get(`operatingExpenses_${year}`) as string) || '0'
          ),
          capitalExpenditures: parseFloat((formData.get(`capex_${year}`) as string) || '0'),
          workingCapital: parseFloat((formData.get(`workingCapital_${year}`) as string) || '0'),
        });
      }

      const input = {
        projectInfo: {
          name: (formData.get('projectName') as string) || 'Project',
          type: (formData.get('projectType') as string) || 'other',
          duration: parseInt((formData.get('duration') as string) || '5'),
        },
        cashFlows: {
          initialInvestment: parseFloat((formData.get('initialInvestment') as string) || '0'),
          annualCashFlows,
        },
        financing: {
          equityPercentage: parseFloat((formData.get('equityPercentage') as string) || '30'),
          debtPercentage: parseFloat((formData.get('debtPercentage') as string) || '70'),
          costOfEquity: parseFloat((formData.get('costOfEquity') as string) || '0'),
          costOfDebt: parseFloat((formData.get('costOfDebt') as string) || '0'),
          taxRate: parseFloat((formData.get('taxRate') as string) || '0'),
        },
        analysis: {
          includeNPV: true,
          includeIRR: true,
          includePayback: true,
          includeSensitivity: true,
          discountRate: formData.get('discountRate')
            ? parseFloat(formData.get('discountRate') as string)
            : undefined,
        },
      };

      const response = await fetch('/api/analyze-project-finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze project finance');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Project Finance error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze project finance');
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('project-finance-results');
    const contentDiv = document.getElementById('project-finance-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="fa-panel-title text-lg mb-2">Project Finance Analysis</h3>
          <p class="text-slate-700 dark:text-slate-300">
            Your project finance analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ProjectFinanceAnalyzer());
} else {
  new ProjectFinanceAnalyzer();
}
