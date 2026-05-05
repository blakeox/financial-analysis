import { AnalysisRequestError, postAnalysisRequest } from './analysis-api';
import { storeAnalysisResult } from './analysis-results';
import { formatCurrency, formatNumber, isFiniteNumber } from '../../utils/calculator-utilities';

type LeaseScheduleEntry = {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
};

type LeaseAnalysisResult = {
  monthlyPayment: number;
  totalPayments: number;
  totalInterest: number;
  schedule: LeaseScheduleEntry[];
};

type LeaseAnalysisPayload = {
  principal: number;
  annualRate: number;
  annualRatePercent: number;
  termMonths: number;
  residualValue: number;
};

const isLeaseScheduleEntry = (entry: unknown): entry is LeaseScheduleEntry => {
  if (!entry || typeof entry !== 'object') {
    return false;
  }

  const candidate = entry as Record<string, unknown>;
  return (
    isFiniteNumber(candidate.month) &&
    isFiniteNumber(candidate.payment) &&
    isFiniteNumber(candidate.principal) &&
    isFiniteNumber(candidate.interest) &&
    isFiniteNumber(candidate.balance)
  );
};

const isLeaseAnalysisResult = (data: unknown): data is LeaseAnalysisResult => {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const candidate = data as Record<string, unknown>;
  return (
    isFiniteNumber(candidate.monthlyPayment) &&
    isFiniteNumber(candidate.totalPayments) &&
    isFiniteNumber(candidate.totalInterest) &&
    Array.isArray(candidate.schedule) &&
    candidate.schedule.every(isLeaseScheduleEntry)
  );
};

const parseFloatFromForm = (formData: FormData, field: string): number => {
  const raw = formData.get(field);
  if (raw == null) {
    return Number.NaN;
  }
  const numeric = typeof raw === 'string' ? Number.parseFloat(raw) : Number(raw);
  return Number.isFinite(numeric) ? numeric : Number.NaN;
};

const parseLeasePayload = (form: HTMLFormElement): LeaseAnalysisPayload => {
  const formData = new FormData(form);

  const principal = parseFloatFromForm(formData, 'principal');
  if (!isFiniteNumber(principal) || principal <= 0) {
    throw new Error('Please enter a lease amount greater than zero.');
  }

  const annualRatePercent = parseFloatFromForm(formData, 'annualRate');
  if (!isFiniteNumber(annualRatePercent) || annualRatePercent < 0 || annualRatePercent > 100) {
    throw new Error('Annual interest rate must be between 0% and 100%.');
  }

  const termMonthsValue = Number.parseInt(String(formData.get('termMonths') ?? ''), 10);
  if (!Number.isInteger(termMonthsValue) || termMonthsValue <= 0) {
    throw new Error('Please enter a lease term in months greater than zero.');
  }

  const residualValueRaw = parseFloatFromForm(formData, 'residualValue');
  const residualValue = Number.isNaN(residualValueRaw) ? 0 : residualValueRaw;
  if (!isFiniteNumber(residualValue) || residualValue < 0) {
    throw new Error('Residual value cannot be negative.');
  }

  return {
    principal,
    annualRate: annualRatePercent / 100,
    annualRatePercent,
    termMonths: termMonthsValue,
    residualValue,
  };
};

const renderSummaryCards = (
  result: LeaseAnalysisResult,
  payload: LeaseAnalysisPayload,
  target: HTMLElement
): void => {
  const interestShare =
    result.totalPayments === 0 ? 0 : (result.totalInterest / result.totalPayments) * 100;

  target.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-blue-600 text-white rounded-lg p-6">
        <p class="text-sm uppercase tracking-wide opacity-90 mb-2">Monthly payment</p>
        <p class="text-3xl font-bold">${formatCurrency(result.monthlyPayment)}</p>
        <p class="text-xs text-blue-100/90 mt-1">Rate: ${formatNumber(payload.annualRatePercent)}%</p>
      </div>

      <div class="fa-subcard p-6">
        <p class="fa-script-copy-subtle mb-2">Total interest</p>
        <p class="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
          ${formatCurrency(result.totalInterest)}
        </p>
        <p class="fa-script-note mt-1">
          ${formatNumber(interestShare)}% of total payments
        </p>
      </div>

      <div class="fa-subcard p-6">
        <p class="fa-script-copy-subtle mb-2">Total payments</p>
        <p class="text-2xl font-semibold text-purple-600 dark:text-purple-400">
          ${formatCurrency(result.totalPayments)}
        </p>
        <p class="fa-script-note mt-1">
          Term: ${payload.termMonths} months
        </p>
      </div>

      <div class="fa-subcard p-6">
        <p class="fa-script-copy-subtle mb-2">Residual value</p>
        <p class="text-2xl font-semibold text-sky-600 dark:text-sky-400">
          ${formatCurrency(payload.residualValue)}
        </p>
        <p class="fa-script-note mt-1">
          Principal financed: ${formatCurrency(payload.principal - payload.residualValue)}
        </p>
      </div>
    </div>
  `;
};

const renderScheduleTable = (schedule: LeaseScheduleEntry[], target: HTMLElement): void => {
  if (!schedule.length) {
    target.innerHTML = `
      <div class="fa-script-copy-subtle">
        Lease schedule was not returned. Please try again with different inputs.
      </div>
    `;
    return;
  }

  const rows = schedule
    .map((entry) => {
      const highlightClass = entry.month % 12 === 0 ? 'bg-blue-50 dark:bg-blue-900/10' : '';
      return `
        <tr class="${highlightClass}">
          <td class="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">${entry.month}</td>
          <td class="px-4 py-2 text-sm text-right text-gray-900 dark:text-gray-100">
            ${formatCurrency(entry.payment)}
          </td>
          <td class="px-4 py-2 text-sm text-right text-green-600 dark:text-green-400">
            ${formatCurrency(entry.principal)}
          </td>
          <td class="px-4 py-2 text-sm text-right text-orange-600 dark:text-orange-400">
            ${formatCurrency(entry.interest)}
          </td>
          <td class="px-4 py-2 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
            ${formatCurrency(entry.balance)}
          </td>
        </tr>
      `;
    })
    .join('');

  target.innerHTML = `
    <table class="min-w-full table-auto">
      <thead>
        <tr class="bg-gray-50 dark:bg-gray-800">
          <th class="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Month</th>
          <th class="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Payment</th>
          <th class="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Principal</th>
          <th class="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Interest</th>
          <th class="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Balance</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
        ${rows}
      </tbody>
    </table>
  `;
};

const showErrorState = (container: HTMLElement, message: string): void => {
  container.classList.remove('hidden');
  const messageTarget = document.getElementById('error-message');
  if (messageTarget) {
    messageTarget.textContent = message;
  }
};

const hideErrorState = (container: HTMLElement): void => {
  container.classList.add('hidden');
  const messageTarget = document.getElementById('error-message');
  if (messageTarget) {
    messageTarget.textContent = '';
  }
};

const toggleLoadingState = (
  isLoading: boolean,
  loadingContainer: HTMLElement,
  submitButton: HTMLButtonElement
): void => {
  loadingContainer.classList.toggle('hidden', !isLoading);
  submitButton.disabled = isLoading;
  submitButton.dataset.loading = isLoading ? 'true' : 'false';
  submitButton.setAttribute('aria-busy', isLoading ? 'true' : 'false');
};

(() => {
  const formElement = document.getElementById('analysis-form');
  const submitButtonElement = document.getElementById('analyze-btn');
  const resultsSection = document.getElementById('results-section');
  const loadingState = document.getElementById('loading-state');
  const errorState = document.getElementById('error-state');
  const resultsContent = document.getElementById('results-content');
  const scheduleContent = document.getElementById('schedule-content');

  if (
    !(formElement instanceof HTMLFormElement) ||
    !(submitButtonElement instanceof HTMLButtonElement) ||
    !(resultsSection instanceof HTMLElement) ||
    !(loadingState instanceof HTMLElement) ||
    !(errorState instanceof HTMLElement) ||
    !(resultsContent instanceof HTMLElement) ||
    !(scheduleContent instanceof HTMLElement)
  ) {
    if (import.meta.env.DEV) {
      console.warn('[analysis.client] Required DOM elements were not found, skipping initialization.');
    }
    return;
  }

  const runAnalysis = async (payload: LeaseAnalysisPayload) => {
    const result = await postAnalysisRequest<LeaseAnalysisResult>('/v1/api/analysis/lease', {
      principal: payload.principal,
      annualRate: payload.annualRate,
      termMonths: payload.termMonths,
      residualValue: payload.residualValue,
    });

    if (!isLeaseAnalysisResult(result)) {
      throw new AnalysisRequestError('Received unexpected lease analysis response.');
    }

    renderSummaryCards(result, payload, resultsContent);
    renderScheduleTable(result.schedule, scheduleContent);
    storeAnalysisResult('analyze_lease', result);

    resultsSection.classList.remove('hidden');
    resultsSection.removeAttribute('hidden');
    resultsSection.setAttribute('data-rendered', 'true');
  };

  const executeLeaseAnalysis = async () => {
    hideErrorState(errorState);
    toggleLoadingState(true, loadingState, submitButtonElement);
    resultsSection.classList.add('hidden');

    try {
      const payload = parseLeasePayload(formElement);
      await runAnalysis(payload);
    } catch (error) {
      console.error('[analysis.client] Lease analysis failed:', error);
      const message =
        error instanceof AnalysisRequestError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unable to complete lease analysis. Please try again.';
      showErrorState(errorState, message);
    } finally {
      toggleLoadingState(false, loadingState, submitButtonElement);
    }
  };

  formElement.addEventListener('submit', (event) => {
    event.preventDefault();
    void executeLeaseAnalysis();
  });

  const attemptAutoRun = () => {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const shouldAutoRun = params.get('auto') === '1' || params.get('run') === '1';
    if (!shouldAutoRun) {
      return;
    }

    const setInputValue = (name: string, value: string | null) => {
      if (value === null) {
        return;
      }
      const input = formElement.querySelector<HTMLInputElement>(`[name="${name}"]`);
      if (input) {
        input.value = value;
      }
    };

    setInputValue('principal', params.get('principal'));
    setInputValue('annualRate', params.get('annualRate'));
    setInputValue('termMonths', params.get('termMonths'));
    setInputValue('residualValue', params.get('residualValue'));

    try {
      parseLeasePayload(formElement);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to parse lease analysis parameters.';
      showErrorState(errorState, message);
      return;
    }

    void executeLeaseAnalysis();
  };

  attemptAutoRun();
})();

export {};
