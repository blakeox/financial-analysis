import type {
  AmortizationAnalysisResult,
  AmortizationInput,
  AmortizationResultItem,
} from '@financial-analysis/analysis';
import { AnalysisRequestError, postAnalysisRequest } from './analysis-api';
import { storeAnalysisResult } from './analysis-results';

// Helper to safely extract total paid amount from API result
const getTotalPaid = (result: AmortizationAnalysisResult): number => {
  if (isFiniteNumber((result as any).totalPayments)) return Number((result as any).totalPayments);
  if (isFiniteNumber((result as any).totalAmount)) return Number((result as any).totalAmount);
  return 0;
};

// Helper to safely extract total interest from API result
const getTotalInterest = (result: AmortizationAnalysisResult): number => {
  if (isFiniteNumber((result as any).totalInterest)) return Number((result as any).totalInterest);
  if (isFiniteNumber((result as any).interestPaid)) return Number((result as any).interestPaid);
  return 0;
};

// Chart color constants to prevent legend/SVG drift
const CHART_COLORS = {
  balance: '#3b82f6', // blue-500
  principal: '#10b981', // emerald-500
  interest: '#f59e0b', // amber-500
} as const;

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
  const totalInterest = getTotalInterest(result);
  const totalPayments = getTotalPaid(result);
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
  const initialMaxPayment = Math.max(...schedule.map((item) => item.payment));
  const initialMaxBalance = Math.max(...schedule.map((item) => item.balance + item.principal));

  // Determine how many bars to show based on the loan term
  // For longer loans, we'll sample the data to keep the chart readable
  const totalMonths = schedule.length;
  let displayData = schedule;
  let sampleRate = 1;

  if (totalMonths > 120) {
    // For loans longer than 10 years, sample every 3rd month
    sampleRate = 3;
    displayData = schedule.filter(
      (_, index) => index % sampleRate === 0 || index === schedule.length - 1
    );
  } else if (totalMonths > 60) {
    // For loans longer than 5 years, sample every 2nd month
    sampleRate = 2;
    displayData = schedule.filter(
      (_, index) => index % sampleRate === 0 || index === schedule.length - 1
    );
  }

  // Calculate responsive bar width and gap
  const maxBars = Math.min(displayData.length, 100); // Cap at 100 bars for readability
  const barWidth = Math.max(3, Math.floor(100 / maxBars)); // Minimum 3px width for visibility
  const gapSize = Math.max(1, barWidth * 0.1); // 10% gap, minimum 1px

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('Chart Debug:', {
      totalMonths,
      displayDataLength: displayData.length,
      sampleRate,
      maxBars,
      barWidth,
      gapSize,
      maxPayment: initialMaxPayment,
      maxBalance: initialMaxBalance,
      firstEntry: displayData[0],
      lastEntry: displayData[displayData.length - 1],
    });
  }

  // Create responsive dual-axis line chart using SVG
  const chartWidth = Math.max(600, displayData.length * 3); // Responsive width based on data
  const chartHeight = 300;
  const padding = 60;
  const plotWidth = chartWidth - padding * 2;
  const plotHeight = chartHeight - padding * 2;

  // Separate scaling for balance vs payment components
  const maxBalance = Math.max(1, Math.max(...displayData.map((entry) => entry.balance)));
  const maxPayment = Math.max(1, Math.max(...displayData.map((entry) => entry.payment)));

  // Generate line paths with dual Y-axis scaling
  const generateLinePath = (data: number[], maxValue: number, _isLeftAxis: boolean = true) => {
    const points = data.map((value, index) => {
      const denom = data.length > 1 ? (data.length - 1) : 1;
      const x = padding + (index / denom) * plotWidth;
      const y = padding + plotHeight - (value / maxValue) * plotHeight;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  // Prepare data for lines
  const balanceData = displayData.map((entry) => entry.balance);
  const principalData = displayData.map((entry) => entry.principal);
  const interestData = displayData.map((entry) => entry.interest);

  // Generate SVG paths with proper scaling
  const balancePath = generateLinePath(balanceData, maxBalance, true);
  const principalPath = generateLinePath(principalData, maxPayment, false);
  const interestPath = generateLinePath(interestData, maxPayment, false);

  // Generate Y-axis labels
  const generateYAxisLabels = (maxValue: number, isLeftAxis: boolean = true) => {
    const steps = 5;
    const stepValue = maxValue / steps;
    const labels = [];

    for (let i = 0; i <= steps; i++) {
      const value = stepValue * i;
      const y = padding + plotHeight - (value / maxValue) * plotHeight;
      const x = isLeftAxis ? padding - 35 : chartWidth - padding + 35;
      const textAnchor = isLeftAxis ? 'end' : 'start';

      labels.push(
        `<text x="${x}" y="${y + 4}" text-anchor="${textAnchor}" class="text-xs fill-gray-600 dark:fill-gray-400">${toCurrency(value)}</text>`
      );
    }
    return labels.join('');
  };

  // Generate x-axis labels
  const xAxisLabels = displayData
    .filter(
      (entry, _index) =>
        entry.month === 1 ||
        entry.month % 12 === 0 ||
        entry.month === totalMonths ||
        (totalMonths > 60 && entry.month % 24 === 0)
    )
    .map((entry) => {
      const denom = totalMonths > 1 ? (totalMonths - 1) : 1;
      const x = padding + ((entry.month - 1) / denom) * plotWidth;
      return `<text x="${x}" y="${chartHeight - 20}" text-anchor="middle" class="text-xs fill-gray-600 dark:fill-gray-400">${entry.month}</text>`;
    })
    .join('');

  // Generate grid lines
  const generateGridLines = (maxValue: number, _isLeftAxis: boolean = true) => {
    const steps = 5;
    const stepValue = maxValue / steps;
    const lines = [];

    for (let i = 0; i <= steps; i++) {
      const value = stepValue * i;
      const y = padding + plotHeight - (value / maxValue) * plotHeight;
      const x1 = padding;
      const x2 = chartWidth - padding;

      lines.push(
        `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#e5e7eb" stroke-width="0.5" opacity="0.3"/>`
      );
    }
    return lines.join('');
  };

  target.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded-full" style="background-color: ${CHART_COLORS.balance}"></div>
            <span class="font-medium">Remaining Balance</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded-full" style="background-color: ${CHART_COLORS.principal}"></div>
            <span class="font-medium">Principal</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded-full" style="background-color: ${CHART_COLORS.interest}"></div>
            <span class="font-medium">Interest</span>
          </div>
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          <div>Left axis: Balance | Right axis: Payment components</div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 overflow-x-auto">
        <svg width="${chartWidth}" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}" class="w-full">
          <!-- Background -->
          <rect width="100%" height="100%" fill="transparent" />
          
          <!-- Grid lines -->
          ${generateGridLines(maxBalance, true)}
          
          <!-- Chart lines -->
          <path d="${balancePath}" fill="none" stroke="${CHART_COLORS.balance}" stroke-width="3" opacity="0.9"/>
          <path d="${principalPath}" fill="none" stroke="${CHART_COLORS.principal}" stroke-width="3" opacity="0.9"/>
          <path d="${interestPath}" fill="none" stroke="${CHART_COLORS.interest}" stroke-width="3" opacity="0.9"/>
          
          <!-- X-axis labels -->
          ${xAxisLabels}
          
          <!-- Y-axis labels -->
          ${generateYAxisLabels(maxBalance, true)}
          ${generateYAxisLabels(maxPayment, false)}
          
          <!-- Axis lines -->
          <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${chartHeight - padding}" stroke="#374151" stroke-width="2"/>
          <line x1="${chartWidth - padding}" y1="${padding}" x2="${chartWidth - padding}" y2="${chartHeight - padding}" stroke="#374151" stroke-width="2"/>
          <line x1="${padding}" y1="${chartHeight - padding}" x2="${chartWidth - padding}" y2="${chartHeight - padding}" stroke="#374151" stroke-width="2"/>
          
          <!-- Axis titles -->
          <text x="${padding - 90}" y="${chartHeight / 2}" text-anchor="middle" transform="rotate(-90, ${padding - 90}, ${chartHeight / 2})" class="text-sm fill-gray-700 dark:fill-gray-300 font-medium">Balance ($)</text>
          <text x="${chartWidth - padding + 90}" y="${chartHeight / 2}" text-anchor="middle" transform="rotate(90, ${chartWidth - padding + 90}, ${chartHeight / 2})" class="text-sm fill-gray-700 dark:fill-gray-300 font-medium">Payment ($)</text>
        </svg>
      </div>
      
      <div class="text-xs text-gray-500 dark:text-gray-400 text-center">
        Complete ${totalMonths}-month amortization schedule. Use the detailed table below for exact values.
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
    totalInterest: getTotalInterest(result),
    totalPayments: getTotalPaid(result),
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
