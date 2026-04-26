import type { AutoLoanInput, AutoLoanResult } from '@financial-analysis/analysis';
import { AutoLoanEngine } from '@financial-analysis/analysis';
import { storeAnalysisResult } from '../analysis/analysis-results';
import {
  parseNumber,
  formatCurrency,
  formatCurrencyWhole,
  formatPercentDecimal,
} from '../../utils/calculator-utilities';

// Alias for consistency with existing code
const formatPercent = formatPercentDecimal;

// Enhanced Total Cost of Ownership calculation
interface TCOCalculation {
  loanCosts: {
    monthlyPayment: number;
    totalLoanCost: number;
    totalInterest: number;
  };
  ownership: {
    insurance: { monthly: number; total: number };
    maintenance: { monthly: number; total: number };
    fuel: { monthly: number; total: number };
    depreciation: number;
  };
  totals: {
    monthlyTCO: number;
    annualTCO: number;
    totalOverLoanTerm: number;
    costPerMile: number;
  };
}

const toNumber = (value: number | string): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

function calculateTCO(
  result: AutoLoanResult,
  vehiclePrice: number,
  loanTermMonths: number,
  annualMileage: number = 12000,
  insuranceMonthly: number = 150,
  maintenanceYearly: number = 1200,
  fuelMpg: number = 25,
  gasPrice: number = 3.50
): TCOCalculation {
  const loanYears = loanTermMonths / 12;
  
  // Loan costs (already calculated)
  const monthlyPayment = toNumber(result.summary.monthlyPayment);
  const totalLoanCost = toNumber(result.summary.totalCost);
  const totalInterest = toNumber(result.summary.totalInterest);
  
  // Insurance (typically $100-$200/month depending on age, location, vehicle)
  const insuranceTotal = insuranceMonthly * loanTermMonths;
  
  // Maintenance (oil changes, tires, brakes, etc. - typically $1,000-$1,500/year)
  const maintenanceMonthly = maintenanceYearly / 12;
  const maintenanceTotal = maintenanceYearly * loanYears;
  
  // Fuel costs
  const milesPerMonth = annualMileage / 12;
  const gallonsPerMonth = milesPerMonth / fuelMpg;
  const fuelMonthly = gallonsPerMonth * gasPrice;
  const fuelTotal = fuelMonthly * loanTermMonths;
  
  // Depreciation (new cars typically lose ~20% first year, ~15% each year after)
  // Use straight-line for simplicity: new cars retain ~40-50% after 5 years
  const deprecationRate = vehiclePrice > 30000 ? 0.60 : 0.55; // Luxury cars depreciate faster
  const estimatedResaleValue = vehiclePrice * (1 - deprecationRate * (loanYears / 5));
  const depreciation = Math.max(0, vehiclePrice - estimatedResaleValue);
  
  // Calculate totals
  const monthlyTCO = monthlyPayment + insuranceMonthly + maintenanceMonthly + fuelMonthly + (depreciation / loanTermMonths);
  const annualTCO = monthlyTCO * 12;
  const totalOverLoanTerm = totalLoanCost + insuranceTotal + maintenanceTotal + fuelTotal + depreciation;
  const totalMiles = annualMileage * loanYears;
  const costPerMile = totalOverLoanTerm / totalMiles;
  
  return {
    loanCosts: {
      monthlyPayment,
      totalLoanCost,
      totalInterest,
    },
    ownership: {
      insurance: { monthly: insuranceMonthly, total: insuranceTotal },
      maintenance: { monthly: maintenanceMonthly, total: maintenanceTotal },
      fuel: { monthly: fuelMonthly, total: fuelTotal },
      depreciation,
    },
    totals: {
      monthlyTCO,
      annualTCO,
      totalOverLoanTerm,
      costPerMile,
    },
  };
}

const toggleOptionalInput = (checkboxId: string, inputId: string): void => {
  const checkboxElement = document.getElementById(checkboxId);
  const inputElement = document.getElementById(inputId);

  if (!(checkboxElement instanceof HTMLInputElement) || !(inputElement instanceof HTMLInputElement)) {
    return;
  }

  const applyState = () => {
    inputElement.disabled = !checkboxElement.checked;
  };

  applyState();
  checkboxElement.addEventListener('change', applyState);
};

export const parseAutoLoanInput = (formData: FormData): AutoLoanInput => {
  const vehiclePrice = parseNumber(formData.get('vehiclePrice'));
  const downPayment = parseNumber(formData.get('downPayment')) ?? 0;
  const tradeInValue = parseNumber(formData.get('tradeInValue')) ?? 0;
  const tradeInOwed = parseNumber(formData.get('tradeInOwed')) ?? 0;
  const salesTaxRatePercent = parseNumber(formData.get('salesTaxRate')) || 7.5; // Default 7.5% sales tax
  const registrationFees = parseNumber(formData.get('registrationFees')) ?? 0;
  const dealerFees = parseNumber(formData.get('dealerFees')) ?? 0;
  const interestRatePercent = parseNumber(formData.get('interestRate'));
  const loanTermMonths = parseNumber(formData.get('loanTerm')); // Use 'loanTerm' instead of 'loanTermMonths'
  const manufacturerRebate = parseNumber(formData.get('manufacturerRebate')) ?? 0;

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
    ? (parseNumber(formData.get('gapInsuranceCost')) ?? 0)
    : 0;
  const extendedWarrantyCost = includeExtendedWarranty
    ? (parseNumber(formData.get('extendedWarrantyCost')) ?? 0)
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

export const renderAutoLoanResults = (
  result: AutoLoanResult,
  termMonths: number,
  vehiclePrice: number = 0,
  enableTCO: boolean = false,
  annualMileage?: number,
  insuranceMonthly?: number,
  maintenanceYearly?: number,
  fuelMpg?: number,
  gasPrice?: number
): void => {
  const { summary, costBreakdown, earlyPayoffScenarios } = result;

  // Use the generic results structure from IndividualCalculatorPage.astro
  const resultsContainer = document.getElementById('results-container');
  const summaryCards = document.getElementById('summary-cards');

  if (!resultsContainer || !summaryCards) {
    console.error('Required DOM elements not found for auto-loan results');
    return;
  }

  // Calculate TCO if enabled
  const tco = enableTCO && vehiclePrice > 0
    ? calculateTCO(
        result,
        vehiclePrice,
        termMonths,
        annualMileage ?? 12000,
        insuranceMonthly ?? 150,
        maintenanceYearly ?? 1200,
        fuelMpg ?? 25,
        gasPrice ?? 3.5
      )
    : null;

  // Render summary cards with TCO
  summaryCards.innerHTML = `
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-blue-900 dark:text-blue-100">Monthly Payment</h5>
      <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${formatCurrency(summary.monthlyPayment)}</p>
      ${tco ? `<p class="text-xs text-blue-700 dark:text-blue-300 mt-1">TCO: ${formatCurrency(tco.totals.monthlyTCO)}/mo</p>` : ''}
    </div>
    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-green-900 dark:text-green-100">Total Interest</h5>
      <p class="text-2xl font-bold text-green-600 dark:text-green-400">${formatCurrency(summary.totalInterest)}</p>
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-purple-900 dark:text-purple-100">Total Cost</h5>
      <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">${formatCurrencyWhole(summary.totalCost)}</p>
      ${tco ? `<p class="text-xs text-purple-700 dark:text-purple-300 mt-1">With ownership: ${formatCurrency(tco.totals.totalOverLoanTerm)}</p>` : ''}
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-orange-900 dark:text-orange-100">${tco ? 'Cost Per Mile' : 'Loan Term'}</h5>
      <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">${tco ? formatCurrency(tco.totals.costPerMile) : `${termMonths} months`}</p>
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
            <span class="font-semibold text-gray-900 dark:text-white">${formatCurrency(summary.costPerMile)}</span>
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
              .map((scenario: AutoLoanResult['earlyPayoffScenarios'][number]) => {
                const years = scenario.monthsPaid / 12;
                const yearsLabel = `${years} year${years !== 1 ? 's' : ''}`;
                return `
                <tr>
                  <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">${yearsLabel}</td>
                  <td class="px-4 py-2 text-sm text-right text-gray-900 dark:text-white">${formatCurrency(scenario.remainingBalance)}</td>
                  <td class="px-4 py-2 text-sm text-right text-green-600 dark:text-green-400">${formatCurrency(scenario.interestSaved)}</td>
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
    if (calculateBtn instanceof HTMLButtonElement) {
      calculateBtn.disabled = true;
      calculateBtn.textContent = 'Calculating...';
    }
    loading?.classList.remove('hidden');
    results?.classList.add('hidden');
    error?.classList.add('hidden');
    if (errorMessage) errorMessage.textContent = '';

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
      results?.classList.remove('hidden');

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
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      if (errorMessage instanceof HTMLElement) {
        errorMessage.textContent = message;
      }
      error?.classList.remove('hidden');
      alert(message);
    } finally {
      // Reset button state
      if (calculateBtn instanceof HTMLButtonElement) {
        calculateBtn.disabled = false;
        calculateBtn.textContent = 'Calculate';
      }
      loading?.classList.add('hidden');
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
