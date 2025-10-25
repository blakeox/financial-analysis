import { AutoLoanEngine } from '@financial-analysis/analysis';
import type { AutoLoanInput, AutoLoanResult } from '@financial-analysis/analysis';
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
  value: FormDataEntryValue | string | number | null | undefined,
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
  const salesTaxRatePercent = formatNumber(formData.get('salesTaxRate'));
  const registrationFees = formatNumber(formData.get('registrationFees')) ?? 0;
  const dealerFees = formatNumber(formData.get('dealerFees')) ?? 0;
  const interestRatePercent = formatNumber(formData.get('interestRate'));
  const loanTermMonths = formatNumber(formData.get('loanTermMonths'));
  const manufacturerRebate = formatNumber(formData.get('manufacturerRebate')) ?? 0;

  if (!vehiclePrice || vehiclePrice <= 0) {
    throw new Error('Please enter a valid vehicle price.');
  }

  if (salesTaxRatePercent === null || salesTaxRatePercent < 0 || salesTaxRatePercent > 100) {
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
    ? formatNumber(formData.get('gapInsuranceCost')) ?? 0
    : 0;
  const extendedWarrantyCost = includeExtendedWarranty
    ? formatNumber(formData.get('extendedWarrantyCost')) ?? 0
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

  const monthlyPaymentEl = document.getElementById('monthly-payment');
  if (monthlyPaymentEl) {
    monthlyPaymentEl.textContent = formatCurrency(summary.monthlyPayment);
  }

  const termDisplayEl = document.getElementById('term-display');
  if (termDisplayEl) {
    termDisplayEl.textContent = String(termMonths);
  }

  const setCurrencyText = (id: string, value: string | number, whole = true) => {
    const el = document.getElementById(id);
    if (el) el.textContent = formatCurrency(value, whole);
  };

  setCurrencyText('breakdown-vehicle-price', costBreakdown.vehiclePrice);
  setCurrencyText('breakdown-down-payment', costBreakdown.downPayment);

  const netTradeIn = Number.parseFloat(costBreakdown.netTradeIn);
  const tradeInRow = document.getElementById('trade-in-row');
  if (tradeInRow) {
    if (Number.isFinite(netTradeIn) && netTradeIn !== 0) {
      tradeInRow.style.display = 'flex';
      const label = document.getElementById('breakdown-trade-in');
      if (label) {
        const absValue = Math.abs(netTradeIn);
        label.textContent = `${formatCurrency(absValue, true)}${netTradeIn < 0 ? ' (negative equity)' : ''}`;
      }
    } else {
      tradeInRow.style.display = 'none';
    }
  }

  setCurrencyText('breakdown-sales-tax', costBreakdown.salesTax);

  const totalFees =
    Number.parseFloat(costBreakdown.registrationFees) +
    Number.parseFloat(costBreakdown.dealerFees) +
    Number.parseFloat(costBreakdown.gapInsurance) +
    Number.parseFloat(costBreakdown.extendedWarranty);
  setCurrencyText('breakdown-fees', Number.isFinite(totalFees) ? totalFees : 0);
  setCurrencyText('breakdown-financed', costBreakdown.amountFinanced);

  setCurrencyText('summary-total-payments', summary.totalPayments);
  setCurrencyText('summary-total-interest', summary.totalInterest);
  setCurrencyText('summary-total-cost', summary.totalCost);

  const aprEl = document.getElementById('summary-apr');
  if (aprEl) {
    aprEl.textContent = formatPercent(Number.parseFloat(summary.aprEffective));
  }

  const ltvEl = document.getElementById('summary-ltv');
  if (ltvEl) {
    const loanToValue = Number.parseFloat(summary.loanToValue) / 100;
    ltvEl.textContent = formatPercent(Number.isFinite(loanToValue) ? loanToValue : 0);
  }

  const costPerMileEl = document.getElementById('summary-cost-per-mile');
  if (costPerMileEl) {
    costPerMileEl.textContent = formatCurrency(Number.parseFloat(summary.costPerMile), false);
  }

  const tableBody = document.getElementById('early-payoff-table');
  if (tableBody) {
    tableBody.innerHTML = earlyPayoffScenarios
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
      .join('');
  }
}

const initAutoLoanPage = (): void => {
  toggleOptionalInput('includeGapInsurance', 'gapInsuranceCost');
  toggleOptionalInput('includeExtendedWarranty', 'extendedWarrantyCost');

  const form = document.getElementById('auto-loan-form');
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

    loading?.classList.remove('hidden');
    results?.classList.add('hidden');
    error?.classList.add('hidden');

    try {
      const input = parseAutoLoanInput(new FormData(form));
      const result = AutoLoanEngine.analyze(input);

      storeAnalysisResult('analyze_auto_loan', result);
      renderAutoLoanResults(result, input.loanTermMonths);
      results?.classList.remove('hidden');
    } catch (err) {
      console.error('Auto loan calculation error:', err);
      if (error && errorMessage) {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        errorMessage.textContent = message;
        error.classList.remove('hidden');
      }
    } finally {
      loading?.classList.add('hidden');
    }
  });
};

export {};

initAutoLoanPage();
