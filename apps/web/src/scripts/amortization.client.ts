import type {
  AmortizationAnalysisResult,
  AmortizationInput,
  AmortizationResultItem,
} from '@financial-analysis/analysis';
import { AnalysisRequestError, postAnalysisRequest } from './analysis-api';
import { storeAnalysisResult } from './analysis-results';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const parseNumber = (value: FormDataEntryValue | null, fallback = Number.NaN): number => {
  if (value === null) return fallback;
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const coerceNumber = (value: unknown, fallback = Number.NaN): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/[$,]/g, ''));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const toCurrency = (value: unknown): string => {
  const numeric = coerceNumber(value, Number.NaN);
  return Number.isFinite(numeric) ? currencyFormatter.format(numeric) : '';
};

export const renderSummaryCards = (
  result: AmortizationAnalysisResult,
  termMonths: number,
  target: HTMLElement | null = document.getElementById('summary-cards')
): void => {
  if (!target) return;

  const monthlyPayment = coerceNumber(result.monthlyPayment, 0);
  const totalInterest = coerceNumber(result.totalInterest, 0);
  const totalPayments = coerceNumber(
    'totalPayments' in result && result.totalPayments !== undefined
      ? result.totalPayments
      : (result as { totalAmount?: number }).totalAmount,
    0
  );
  const interestShare =
    totalPayments > 0 ? ((totalInterest / totalPayments) * 100).toFixed(1) : '0.0';

  target.innerHTML = `
    <div class="bg-blue-600 text-white rounded-lg p-6">
      <p class="text-sm uppercase tracking-wide opacity-90 mb-2">Monthly Payment</p>
      <p class="text-3xl font-bold">${currencyFormatter.format(monthlyPayment)}</p>
    </div>
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Interest</p>
      <p class="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">${currencyFormatter.format(totalInterest)}</p>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${interestShare}% of total payments</p>
    </div>
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Paid</p>
      <p class="text-2xl font-semibold text-purple-600 dark:text-purple-400">${currencyFormatter.format(totalPayments)}</p>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Over ${termMonths} months</p>
    </div>
  `;
};

export const renderChart = (
  schedule: AmortizationResultItem[] | undefined,
  target: HTMLElement | null = document.getElementById('amortization-chart')
): void => {
  if (!target) return;
  if (!Array.isArray(schedule) || schedule.length === 0) {
    target.innerHTML =
      '<p class="text-sm text-gray-500 dark:text-gray-400">No chart data available.</p>';
    return;
  }

  // Create a simple chart using CSS and HTML since we don't have React components available in this context
  const maxPayment = Math.max(...schedule.map((item) => item.payment));
  const maxBalance = Math.max(...schedule.map((item) => item.balance + item.principal));

  target.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Remaining Balance</span>
          </div>
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 bg-green-500 rounded"></div>
            <span>Principal</span>
          </div>
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 bg-orange-500 rounded"></div>
            <span>Interest</span>
          </div>
        </div>
        <div class="text-xs">
          ${schedule.length} months • Max payment: ${toCurrency(maxPayment)}
        </div>
      </div>
      
      <div class="relative h-64 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div class="absolute inset-4">
          <div class="h-full flex items-end gap-1">
            ${schedule
              .map((entry, index) => {
                const paymentHeight = (entry.payment / maxPayment) * 100;
                const principalHeight = (entry.principal / maxPayment) * 100;
                const interestHeight = (entry.interest / maxPayment) * 100;
                const balanceHeight = ((entry.balance + entry.principal) / maxBalance) * 100;

                // Show month labels every 12 months or at significant milestones
                const showLabel =
                  entry.month % 12 === 0 || entry.month === 1 || entry.month === schedule.length;

                return `
                <div class="flex-1 flex flex-col items-center group relative" title="Month ${entry.month}: ${toCurrency(entry.payment)} payment">
                  <div class="w-full flex flex-col-reverse" style="height: ${paymentHeight}%">
                    <div class="w-full bg-orange-500 rounded-t" style="height: ${interestHeight}%"></div>
                    <div class="w-full bg-green-500" style="height: ${principalHeight}%"></div>
                  </div>
                  <div class="w-full bg-blue-200 dark:bg-blue-800 rounded-b" style="height: ${balanceHeight}%"></div>
                  ${showLabel ? `<div class="text-xs text-gray-500 mt-1">${entry.month}</div>` : ''}
                </div>
              `;
              })
              .join('')}
          </div>
        </div>
      </div>
      
      <div class="text-xs text-gray-500 dark:text-gray-400 text-center">
        Complete ${schedule.length}-month amortization schedule. Use the detailed table below for exact values.
      </div>
    </div>
  `;
};

export const renderSchedule = (
  schedule: AmortizationResultItem[] | undefined,
  target: HTMLElement | null = document.getElementById('table-body')
): void => {
  if (!target) return;
  if (!Array.isArray(schedule) || schedule.length === 0) {
    target.innerHTML = '';
    return;
  }

  target.innerHTML = schedule
    .map((entry) => {
      const month = coerceNumber(entry.month, 0);
      const payment = toCurrency(entry.payment);
      const principal = toCurrency(entry.principal);
      const interest = toCurrency(entry.interest);
      const balance = toCurrency(entry.balance);
      const cumulativeInterest = toCurrency(entry.cumulativeInterest);
      const highlightClass = month % 12 === 0 ? 'bg-blue-50 dark:bg-blue-900/10' : '';

      return `
        <tr class="${highlightClass}">
          <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">${month}</td>
          <td class="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">${payment}</td>
          <td class="px-3 py-2 whitespace-nowrap text-sm text-right text-green-600 dark:text-green-400">${principal}</td>
          <td class="px-3 py-2 whitespace-nowrap text-sm text-right text-orange-600 dark:text-orange-400">${interest}</td>
          <td class="px-3 py-2 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-gray-100">${balance}</td>
          <td class="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-400">${cumulativeInterest}</td>
        </tr>
      `;
    })
    .join('');
};

export const parseAmortizationInput = (formData: FormData): AmortizationInput => {
  const principal = parseNumber(formData.get('principal'));
  const annualRatePercent = parseNumber(formData.get('annualRate'));
  const termMonths = parseNumber(formData.get('termMonths'));
  const extraMonthlyPayment = parseNumber(formData.get('extraMonthlyPayment'), 0);

  if (!isFiniteNumber(principal) || principal <= 0) {
    throw new Error('Please enter a valid loan amount');
  }

  if (!isFiniteNumber(annualRatePercent) || annualRatePercent < 0 || annualRatePercent > 100) {
    throw new Error('Interest rate must be between 0 and 100');
  }

  if (!isFiniteNumber(termMonths) || termMonths < 1) {
    throw new Error('Please enter a valid loan term');
  }

  const propertyTaxAnnual = parseNumber(formData.get('propertyTaxAnnual'), 0);
  const homeInsuranceAnnual = parseNumber(formData.get('homeInsuranceAnnual'), 0);
  const hoaMonthly = parseNumber(formData.get('hoaMonthly'), 0);
  const downPayment = parseNumber(formData.get('downPayment'), 0);
  const closingCosts = parseNumber(formData.get('closingCosts'), 0);

  return {
    principal,
    annualRate: annualRatePercent / 100,
    termMonths: Math.trunc(termMonths),
    extraMonthlyPayment: Number.isFinite(extraMonthlyPayment) ? extraMonthlyPayment : 0,
    propertyTaxAnnual: Number.isFinite(propertyTaxAnnual) ? propertyTaxAnnual : 0,
    homeInsuranceAnnual: Number.isFinite(homeInsuranceAnnual) ? homeInsuranceAnnual : 0,
    hoaMonthly: Number.isFinite(hoaMonthly) ? hoaMonthly : 0,
    downPayment: Number.isFinite(downPayment) ? downPayment : 0,
    closingCosts: Number.isFinite(closingCosts) ? closingCosts : 0,
    oneTimePayments: [],
    paymentFrequency: 'monthly',
    interestOnlyMonths: 0,
    balloonPayment: 0,
    origination_fee: 0,
    points: 0,
    pmi: { enabled: false, rate: 0, dropOffLTV: 0.8 },
  };
};

export const handleSuccess = (
  result: AmortizationAnalysisResult,
  inputs: {
    principal: number;
    annualRate: number;
    termMonths: number;
    extraMonthlyPayment?: number;
  },
  options: {
    resultsContainer?: HTMLElement | null;
    summaryCards?: HTMLElement | null;
    tableBody?: HTMLElement | null;
  } = {}
): void => {
  const targetResults = options.resultsContainer ?? document.getElementById('results-container');
  const resultsSection = document.getElementById('results-section');
  const targetSummary = options.summaryCards ?? document.getElementById('summary-cards');
  const targetTableBody = options.tableBody ?? document.getElementById('table-body');

  storeAnalysisResult('analyze_amortization', result);
  renderSummaryCards(result, inputs.termMonths, targetSummary);
  renderChart(result.schedule, document.getElementById('amortization-chart'));
  renderSchedule(result.schedule, targetTableBody);

  // Update enhanced analysis component
  updateEnhancedAnalysis(result, inputs);

  // Dispatch calculator completion event for journey integration
  window.dispatchEvent(
    new CustomEvent('calculator-completed', {
      detail: {
        calculatorId: 'amortization',
        result: result,
        formData: inputs,
      },
    })
  );

  targetResults?.classList.remove('hidden');
  resultsSection?.classList.remove('hidden');
  resultsSection?.removeAttribute('hidden');
  resultsSection?.setAttribute('data-rendered', 'true');

  // Show the amortization chart and table if they exist
  const chartContainer = document.getElementById('amortization-chart-container');
  const tableContainer = document.getElementById('amortization-table-container');
  chartContainer?.classList.remove('hidden');
  tableContainer?.classList.remove('hidden');
};

const updateEnhancedAnalysis = (
  result: AmortizationAnalysisResult,
  inputs: {
    principal: number;
    annualRate: number;
    termMonths: number;
    extraMonthlyPayment?: number;
  }
): void => {
  // Dispatch custom event to update the enhanced analysis component
  const analysisData = {
    principal: inputs.principal,
    annualRate: inputs.annualRate,
    termMonths: inputs.termMonths,
    extraPayment: inputs.extraMonthlyPayment || 0,
    monthlyPayment: result.monthlyPayment,
    totalInterest: result.totalInterest,
    totalPayments: result.totalPayments,
  };

  const event = new CustomEvent('analysis-result-updated', {
    detail: {
      modelType: 'amortization',
      result: analysisData,
    },
  });

  document.dispatchEvent(event);
};

const showLoading = (): void => {
  const loadingState = document.getElementById('loading-state');
  loadingState?.classList.remove('hidden');
};

const hideLoading = (): void => {
  const loadingState = document.getElementById('loading-state');
  loadingState?.classList.add('hidden');
};

const showError = (message: string): void => {
  const errorState = document.getElementById('error-state');
  const resultsContainer = document.getElementById('results-container');
  const resultsSection = document.getElementById('results-section');
  const errorMessage = document.getElementById('error-message');

  hideLoading();
  resultsContainer?.classList.add('hidden');
  resultsSection?.classList.add('hidden');
  if (errorState) errorState.classList.remove('hidden');
  if (errorMessage) errorMessage.textContent = message;
};

const hideError = (): void => {
  const errorState = document.getElementById('error-state');
  if (errorState) errorState.classList.add('hidden');
  const errorMessage = document.getElementById('error-message');
  if (errorMessage) errorMessage.textContent = '';
};

const form = document.getElementById('calculator-form');
const analyzeBtn = document.getElementById('calculate-btn');

const setAnalyzing = (isAnalyzing: boolean): void => {
  if (analyzeBtn instanceof HTMLButtonElement) {
    analyzeBtn.disabled = isAnalyzing;
    analyzeBtn.dataset.loading = isAnalyzing ? 'true' : 'false';
    analyzeBtn.classList.toggle('opacity-75', isAnalyzing);
  }
};

if (form instanceof HTMLFormElement) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideError();
    showLoading();
    setAnalyzing(true);

    try {
      const payload = parseAmortizationInput(new FormData(form));
      const data = await postAnalysisRequest<AmortizationAnalysisResult>(
        '/v1/api/analysis/amortization',
        payload
      );

      handleSuccess(data, payload);
      hideError();
    } catch (error) {
      console.error('Amortization calculation error:', error);
      const message =
        error instanceof AnalysisRequestError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to calculate amortization';
      showError(message);
    } finally {
      hideLoading();
      setAnalyzing(false);
    }
  });
} else {
  console.error('Amortization form not found');
}

const resetBtn = document.getElementById('reset-btn');

if (resetBtn instanceof HTMLButtonElement && form instanceof HTMLFormElement) {
  resetBtn.addEventListener('click', () => {
    form.reset();
    const resultsContainer = document.getElementById('results-container');
    const resultsSection = document.getElementById('results-section');
    const chartContainer = document.getElementById('amortization-chart-container');
    const tableContainer = document.getElementById('amortization-table-container');
    resultsContainer?.classList.add('hidden');
    resultsSection?.classList.add('hidden');
    chartContainer?.classList.add('hidden');
    tableContainer?.classList.add('hidden');
    hideError();
    hideLoading();
    setAnalyzing(false);
  });
}

export {};
