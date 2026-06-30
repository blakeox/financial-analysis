import type { AutoLoanInput, AutoLoanResult } from '@financial-analysis/analysis';
import { AutoLoanEngine } from '@financial-analysis/analysis';
import { storeAnalysisResult } from '../analysis/analysis-results';
import { clearCalculatorFormErrors, handleCalculatorFormError } from '../_shared/form-field-errors';
import { renderMetricCards } from '../_shared/metric-card-html';
import { renderResultPanel, renderResultRow } from '../_shared/result-panel-html';
import { renderDataTableCell, renderDataTableHeaderCell } from '../_shared/spine-html';
import {
  parseNumber,
  formatCurrency,
  formatCurrencyWhole,
  formatPercentDecimal,
  hideError,
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
  gasPrice: number = 3.5
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
  const deprecationRate = vehiclePrice > 30000 ? 0.6 : 0.55; // Luxury cars depreciate faster
  const estimatedResaleValue = vehiclePrice * (1 - deprecationRate * (loanYears / 5));
  const depreciation = Math.max(0, vehiclePrice - estimatedResaleValue);

  // Calculate totals
  const monthlyTCO =
    monthlyPayment +
    insuranceMonthly +
    maintenanceMonthly +
    fuelMonthly +
    depreciation / loanTermMonths;
  const annualTCO = monthlyTCO * 12;
  const totalOverLoanTerm =
    totalLoanCost + insuranceTotal + maintenanceTotal + fuelTotal + depreciation;
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

  if (
    !(checkboxElement instanceof HTMLInputElement) ||
    !(inputElement instanceof HTMLInputElement)
  ) {
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
    throw new Error('Please enter a valid vehicle loan term.');
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
  const tco =
    enableTCO && vehiclePrice > 0
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
  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Monthly Payment',
      value: formatCurrency(summary.monthlyPayment),
      meta: tco ? `TCO: ${formatCurrency(tco.totals.monthlyTCO)}/mo` : undefined,
      tone: 'violet',
    },
    {
      title: 'Total Interest',
      value: formatCurrency(summary.totalInterest),
      tone: 'emerald',
    },
    {
      title: 'Total Cost',
      value: formatCurrencyWhole(summary.totalCost),
      meta: tco ? `With ownership: ${formatCurrency(tco.totals.totalOverLoanTerm)}` : undefined,
      tone: 'violet',
    },
    {
      title: tco ? 'Cost Per Mile' : 'Loan Term',
      value: tco ? formatCurrency(tco.totals.costPerMile) : `${termMonths} months`,
      tone: 'orange',
    },
  ]);

  // Render detailed breakdown
  const netTradeIn = Number.parseFloat(costBreakdown.netTradeIn);
  const totalFees =
    Number.parseFloat(costBreakdown.registrationFees) +
    Number.parseFloat(costBreakdown.dealerFees) +
    Number.parseFloat(costBreakdown.gapInsurance) +
    Number.parseFloat(costBreakdown.extendedWarranty);

  const tradeInRow =
    Number.isFinite(netTradeIn) && netTradeIn !== 0
      ? renderResultRow(
          'Trade-in Value',
          `${formatCurrency(Math.abs(netTradeIn))}${netTradeIn < 0 ? ' (negative equity)' : ''}`
        )
      : '';

  const costBreakdownHtml = `
      <div class="space-y-4">
        ${renderResultRow('Vehicle Price', formatCurrency(costBreakdown.vehiclePrice))}
        ${renderResultRow('Down Payment', formatCurrency(costBreakdown.downPayment))}
        ${tradeInRow}
        ${renderResultRow('Sales Tax', formatCurrency(costBreakdown.salesTax))}
        ${renderResultRow('Fees', formatCurrency(Number.isFinite(totalFees) ? totalFees : 0))}
        ${renderResultRow('Amount Financed', formatCurrency(costBreakdown.amountFinanced))}
      </div>`;

  const loanSummaryHtml = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
          ${renderResultRow('Total Payments', formatCurrency(summary.totalPayments))}
          ${renderResultRow('Effective APR', formatPercent(Number.parseFloat(summary.aprEffective)))}
        </div>
        <div class="space-y-4">
          ${renderResultRow('Loan-to-Value', formatPercent(Number.parseFloat(summary.loanToValue) / 100))}
          ${renderResultRow('Cost per Mile', formatCurrency(summary.costPerMile))}
        </div>
      </div>`;

  const earlyPayoffHtml = `
      <div class="overflow-x-auto">
        <table class="fa-data-table min-w-full">
          <thead>
            <tr>
              ${renderDataTableHeaderCell('Payoff Time')}
              ${renderDataTableHeaderCell('Remaining Balance', 'right')}
              ${renderDataTableHeaderCell('Interest Saved', 'right')}
            </tr>
          </thead>
          <tbody>
            ${earlyPayoffScenarios
              .map((scenario: AutoLoanResult['earlyPayoffScenarios'][number]) => {
                const years = scenario.monthsPaid / 12;
                const yearsLabel = `${years} year${years !== 1 ? 's' : ''}`;
                return `
                <tr>
                  ${renderDataTableCell(yearsLabel)}
                  ${renderDataTableCell(formatCurrency(scenario.remainingBalance), 'right')}
                  <td class="fa-data-table-cell text-right text-emerald-600 dark:text-emerald-400">${formatCurrency(scenario.interestSaved)}</td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>
      </div>`;

  resultsContainer.innerHTML = [
    renderResultPanel({ title: 'Cost Breakdown', bodyHtml: costBreakdownHtml }),
    renderResultPanel({ title: 'Loan Summary', bodyHtml: loanSummaryHtml }),
    renderResultPanel({
      title: 'Early Payoff Scenarios',
      bodyHtml: earlyPayoffHtml,
      className: '',
    }),
  ].join('');
};

const initAutoLoanPage = (): void => {
  toggleOptionalInput('includeGapInsurance', 'gapInsuranceCost');
  toggleOptionalInput('includeExtendedWarranty', 'extendedWarrantyCost');

  const form = document.getElementById('calculator-form');
  const loading = document.getElementById('loading');
  const results = document.getElementById('results');

  if (!(form instanceof HTMLFormElement)) {
    console.error('Auto loan form not found');
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearCalculatorFormErrors(form);

    // Show loading state
    const calculateBtn = document.getElementById('calculate-btn');
    if (calculateBtn instanceof HTMLButtonElement) {
      calculateBtn.disabled = true;
      calculateBtn.textContent = 'Calculating...';
    }
    loading?.classList.remove('hidden');
    results?.classList.add('hidden');
    hideError();

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
      handleCalculatorFormError(form, err);
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
      clearCalculatorFormErrors(form);
      hideError();
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
