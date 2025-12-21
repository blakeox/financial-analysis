/**
 * Financial Ratio Analyzer Calculator Client Script
 */

import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

class FinancialRatioAnalyzerCalculator {
  private form: HTMLFormElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.form = document.getElementById('financial-ratio-analyzer-form') as HTMLFormElement;
    if (!this.form) {
      console.error('Financial Ratio Analyzer form not found');
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
        financialStatements: {
          balanceSheet: {
            currentAssets: parseFloat((formData.get('currentAssets') as string) || '0'),
            totalAssets: parseFloat((formData.get('totalAssets') as string) || '0'),
            currentLiabilities: parseFloat((formData.get('currentLiabilities') as string) || '0'),
            totalLiabilities: parseFloat((formData.get('totalLiabilities') as string) || '0'),
            totalEquity: parseFloat((formData.get('totalEquity') as string) || '0'),
            cash: parseFloat((formData.get('cash') as string) || '0'),
            accountsReceivable: parseFloat((formData.get('accountsReceivable') as string) || '0'),
            inventory: parseFloat((formData.get('inventory') as string) || '0'),
            accountsPayable: parseFloat((formData.get('accountsPayable') as string) || '0'),
            shortTermDebt: parseFloat((formData.get('shortTermDebt') as string) || '0'),
            longTermDebt: parseFloat((formData.get('longTermDebt') as string) || '0'),
          },
          incomeStatement: {
            revenue: parseFloat((formData.get('revenue') as string) || '0'),
            costOfGoodsSold: parseFloat((formData.get('costOfGoodsSold') as string) || '0'),
            grossProfit: parseFloat((formData.get('grossProfit') as string) || '0'),
            operatingExpenses: parseFloat((formData.get('operatingExpenses') as string) || '0'),
            ebitda: parseFloat((formData.get('ebitda') as string) || '0'),
            ebit: parseFloat((formData.get('ebit') as string) || '0'),
            netIncome: parseFloat((formData.get('netIncome') as string) || '0'),
            interestExpense: parseFloat((formData.get('interestExpense') as string) || '0'),
            taxExpense: parseFloat((formData.get('taxExpense') as string) || '0'),
          },
          cashFlowStatement: {
            operatingCashFlow: parseFloat((formData.get('operatingCashFlow') as string) || '0'),
            capitalExpenditures: parseFloat((formData.get('capitalExpenditures') as string) || '0'),
            freeCashFlow: parseFloat((formData.get('freeCashFlow') as string) || '0'),
          },
        },
        marketData: {
          sharePrice: parseFloat((formData.get('sharePrice') as string) || '0'),
          sharesOutstanding: parseFloat((formData.get('sharesOutstanding') as string) || '0'),
          industryAverages: formData.get('industryAverages')
            ? JSON.parse(formData.get('industryAverages') as string)
            : undefined,
        },
        analysis: {
          includeLiquidityRatios: formData.get('includeLiquidityRatios') !== 'false',
          includeProfitabilityRatios: formData.get('includeProfitabilityRatios') !== 'false',
          includeEfficiencyRatios: formData.get('includeEfficiencyRatios') !== 'false',
          includeLeverageRatios: formData.get('includeLeverageRatios') !== 'false',
          includeMarketRatios: formData.get('includeMarketRatios') !== 'false',
          includeBenchmarking: formData.get('includeBenchmarking') !== 'false',
        },
      };

      const response = await fetch('/api/analyze-financial-ratios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze financial ratios');
      }

      const result = await response.json();
      this.displayResults(result);
    } catch (error) {
      console.error('Financial Ratio Analyzer error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze financial ratios');
    } finally {
      hideLoading();
    }
  }

  private displayResults(_result: unknown): void {
    const resultsDiv = document.getElementById('financial-ratio-analyzer-results');
    const contentDiv = document.getElementById('financial-ratio-analyzer-results-content');
    if (!resultsDiv || !contentDiv) return;

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Financial Ratio Analysis</h3>
          <p class="text-gray-700 dark:text-gray-300">
            Your financial ratio analysis is complete. Use the AI assistant to get detailed recommendations.
          </p>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new FinancialRatioAnalyzerCalculator());
} else {
  new FinancialRatioAnalyzerCalculator();
}
