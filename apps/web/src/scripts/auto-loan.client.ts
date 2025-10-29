import type { AutoLoanInput, AutoLoanResult } from '@financial-analysis/analysis';
import { AutoLoanEngine } from '@financial-analysis/analysis';
import { storeAnalysisResult } from './analysis-results';

const currencyFull = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const currencyWhole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatNumber = (
  value: FormDataEntryValue | string | number | null | undefined
): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (value instanceof File) {
    return null;
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,%\s]/g, '');
    if (cleaned.length === 0) return 0;
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const formatCurrency = (value: string | number, useWhole = false): string => {
  const numeric = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (!Number.isFinite(numeric)) return '$0.00';
  return useWhole ? currencyWhole.format(numeric) : currencyFull.format(numeric);
};

const formatPercent = (value: string | number): string => {
  const numeric = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (!Number.isFinite(numeric)) return '0.00%';
  return percentFormatter.format(numeric);
};

const toggleOptionalInput = (checkboxId: string, inputId: string): void => {
  const checkbox = document.getElementById(checkboxId) as HTMLInputElement | null;
  const input = document.getElementById(inputId) as HTMLInputElement | null;

  if (!checkbox || !input) return;

  const applyState = () => {
    input.disabled = !checkbox.checked;
  };

  applyState();
  checkbox.addEventListener('change', applyState);
};

export const parseAutoLoanInput = (formData: FormData): AutoLoanInput => {
  const vehiclePrice = formatNumber(formData.get('vehiclePrice'));
  const downPayment = formatNumber(formData.get('downPayment')) ?? 0;
  const tradeInValue = formatNumber(formData.get('tradeInValue')) ?? 0;
  const tradeInOwed = formatNumber(formData.get('tradeInOwed')) ?? 0;
  const salesTaxRatePercent = formatNumber(formData.get('salesTaxRate')) || 7.5; // Default 7.5% sales tax
  const registrationFees = formatNumber(formData.get('registrationFees')) ?? 0;
  const dealerFees = formatNumber(formData.get('dealerFees')) ?? 0;
  const interestRatePercent = formatNumber(formData.get('interestRate'));
  const loanTermMonths = formatNumber(formData.get('loanTerm')); // Use 'loanTerm' instead of 'loanTermMonths'
  const manufacturerRebate = formatNumber(formData.get('manufacturerRebate')) ?? 0;

  if (!vehiclePrice || vehiclePrice <= 0) {
    throw new Error('Please enter a valid vehicle price.');
  }

  if (salesTaxRatePercent < 0 || salesTaxRatePercent > 100) {
    throw new Error('Sales tax rate must be between 0 and 100.');
  }

  if (interestRatePercent === null || interestRatePercent < 0 || interestRatePercent > 100) {
    throw new Error('Interest rate must be between 0 and 100.');
  }

  if (!loanTermMonths || loanTermMonths < 1) {
    throw new Error('Please enter a valid loan term.');
  }

  const includeGapInsurance = formData.has('includeGapInsurance');
  const includeExtendedWarranty = formData.has('includeExtendedWarranty');

  const gapInsuranceCost = includeGapInsurance
    ? (formatNumber(formData.get('gapInsuranceCost')) ?? 0)
    : 0;
  const extendedWarrantyCost = includeExtendedWarranty
    ? (formatNumber(formData.get('extendedWarrantyCost')) ?? 0)
    : 0;

  return {
    vehiclePrice,
    downPayment,
    tradeInValue,
    tradeInOwed,
    salesTaxRate: salesTaxRatePercent / 100,
    registrationFees,
    dealerFees,
    interestRate: interestRatePercent / 100,
    loanTermMonths: Math.trunc(loanTermMonths),
    manufacturerRebate,
    includeGapInsurance,
    gapInsuranceCost,
    includeExtendedWarranty,
    extendedWarrantyCost,
  };
};

export const renderAutoLoanResults = (result: AutoLoanResult, termMonths: number): void => {
  const { summary, costBreakdown, earlyPayoffScenarios } = result;

  // Use the generic results structure from IndividualCalculatorPage.astro
  const resultsContainer = document.getElementById('results-container');
  const summaryCards = document.getElementById('summary-cards');

  if (!resultsContainer || !summaryCards) {
    console.error('Required DOM elements not found for auto-loan results');
    return;
  }

  // Render summary cards
  summaryCards.innerHTML = `
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-blue-900 dark:text-blue-100">Monthly Payment</h5>
      <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${formatCurrency(summary.monthlyPayment)}</p>
    </div>
    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-green-900 dark:text-green-100">Total Interest</h5>
      <p class="text-2xl font-bold text-green-600 dark:text-green-400">${formatCurrency(summary.totalInterest)}</p>
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-purple-900 dark:text-purple-100">Total Cost</h5>
      <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">${formatCurrency(summary.totalCost)}</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-orange-900 dark:text-orange-100">Loan Term</h5>
      <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">${termMonths} months</p>
    </div>
  `;

  // Render detailed breakdown
  const netTradeIn = Number.parseFloat(costBreakdown.netTradeIn);
  const totalFees =
    Number.parseFloat(costBreakdown.registrationFees) +
    Number.parseFloat(costBreakdown.dealerFees) +
    Number.parseFloat(costBreakdown.gapInsurance) +
    Number.parseFloat(costBreakdown.extendedWarranty);

  resultsContainer.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Cost Breakdown</h3>
      
      <div class="space-y-4">
        <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
          <span class="text-gray-700 dark:text-gray-300">Vehicle Price</span>
          <span class="font-semibold text-gray-900 dark:text-white">${formatCurrency(costBreakdown.vehiclePrice)}</span>
        </div>
        
        <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
          <span class="text-gray-700 dark:text-gray-300">Down Payment</span>
          <span class="font-semibold text-gray-900 dark:text-white">${formatCurrency(costBreakdown.downPayment)}</span>
        </div>
        
        ${
          Number.isFinite(netTradeIn) && netTradeIn !== 0
            ? `
        <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
          <span class="text-gray-700 dark:text-gray-300">Trade-in Value</span>
          <span class="font-semibold text-gray-900 dark:text-white">${formatCurrency(Math.abs(netTradeIn))}${netTradeIn < 0 ? ' (negative equity)' : ''}</span>
        </div>
        `
            : ''
        }
        
        <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
          <span class="text-gray-700 dark:text-gray-300">Sales Tax</span>
          <span class="font-semibold text-gray-900 dark:text-white">${formatCurrency(costBreakdown.salesTax)}</span>
        </div>
        
        <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
          <span class="text-gray-700 dark:text-gray-300">Fees</span>
          <span class="font-semibold text-gray-900 dark:text-white">${formatCurrency(Number.isFinite(totalFees) ? totalFees : 0)}</span>
        </div>
        
        <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
          <span class="text-gray-700 dark:text-gray-300">Amount Financed</span>
          <span class="font-semibold text-gray-900 dark:text-white">${formatCurrency(costBreakdown.amountFinanced)}</span>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Loan Summary</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
            <span class="text-gray-700 dark:text-gray-300">Total Payments</span>
            <span class="font-semibold text-gray-900 dark:text-white">${formatCurrency(summary.totalPayments)}</span>
          </div>
          
          <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
            <span class="text-gray-700 dark:text-gray-300">Effective APR</span>
            <span class="font-semibold text-gray-900 dark:text-white">${formatPercent(Number.parseFloat(summary.aprEffective))}</span>
          </div>
        </div>
        
        <div class="space-y-4">
          <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
            <span class="text-gray-700 dark:text-gray-300">Loan-to-Value</span>
            <span class="font-semibold text-gray-900 dark:text-white">${formatPercent(Number.parseFloat(summary.loanToValue) / 100)}</span>
          </div>
          
          <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
            <span class="text-gray-700 dark:text-gray-300">Cost per Mile</span>
            <span class="font-semibold text-gray-900 dark:text-white">${formatCurrency(Number.parseFloat(summary.costPerMile), false)}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Early Payoff Scenarios</h3>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payoff Time</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Remaining Balance</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Interest Saved</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            ${earlyPayoffScenarios
              .map((scenario) => {
                const years = scenario.monthsPaid / 12;
                const yearsLabel = `${years} year${years !== 1 ? 's' : ''}`;
                return `
                <tr>
                  <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">${yearsLabel}</td>
                  <td class="px-4 py-2 text-sm text-right text-gray-900 dark:text-white">${formatCurrency(scenario.remainingBalance, true)}</td>
                  <td class="px-4 py-2 text-sm text-right text-green-600 dark:text-green-400">${formatCurrency(scenario.interestSaved, true)}</td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
};

const initAutoLoanPage = (): void => {
  toggleOptionalInput('includeGapInsurance', 'gapInsuranceCost');
  toggleOptionalInput('includeExtendedWarranty', 'extendedWarrantyCost');

  const form = document.getElementById('calculator-form');
  const loading = document.getElementById('loading');
  const results = document.getElementById('results');
  const error = document.getElementById('error');
  const errorMessage = document.getElementById('error-message');

  if (!(form instanceof HTMLFormElement)) {
    console.error('Auto loan form not found');
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    // Show loading state
    const calculateBtn = document.getElementById('calculate-btn');
    if (calculateBtn) {
      calculateBtn.disabled = true;
      calculateBtn.textContent = 'Calculating...';
    }

    // Hide previous results
    const resultsSection = document.getElementById('results-section');
    const resultsContainer = document.getElementById('results-container');
    const summaryCards = document.getElementById('summary-cards');
    resultsSection?.classList.add('hidden');
    resultsContainer?.classList.add('hidden');
    summaryCards?.classList.add('hidden');

    try {
      const input = parseAutoLoanInput(new FormData(form));
      const result = AutoLoanEngine.analyze(input);

      storeAnalysisResult('analyze_auto_loan', result);
      renderAutoLoanResults(result, input.loanTermMonths);

      // Show results
      resultsSection?.classList.remove('hidden');
      resultsContainer?.classList.remove('hidden');
      summaryCards?.classList.remove('hidden');

      // Dispatch calculator completion event for journey integration
      window.dispatchEvent(
        new CustomEvent('calculator-completed', {
          detail: {
            calculatorId: 'auto-loan',
            result: result,
            formData: input,
          },
        })
      );
    } catch (err) {
      console.error('Auto loan calculation error:', err);
      alert(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      // Reset button state
      if (calculateBtn) {
        calculateBtn.disabled = false;
        calculateBtn.textContent = 'Calculate';
      }
    }
  });

  // Add reset handler
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn instanceof HTMLButtonElement) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      const resultsSection = document.getElementById('results-section');
      const resultsContainer = document.getElementById('results-container');
      const summaryCards = document.getElementById('summary-cards');
      resultsSection?.classList.add('hidden');
      resultsContainer?.classList.add('hidden');
      summaryCards?.classList.add('hidden');
    });
  }
};

export {};

initAutoLoanPage();
