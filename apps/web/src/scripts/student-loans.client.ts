import { registerChatButton } from './chat-actions';
import { storeAnalysisResult } from './analysis-results';
import { StudentLoanEngine } from '@financial-analysis/analysis';
import type { StudentLoanResult } from '@financial-analysis/analysis';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const formatCurrency = (value: string): string => {
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) return value;
  return currencyFormatter.format(numeric);
};

type PaymentStrategy = 'avalanche' | 'snowball' | 'standard';
type LoanType = 'federal_unsubsidized' | 'federal_subsidized' | 'private';

type StudentLoanInput = {
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  loanType: LoanType;
};

type ScreenRefs = {
  loading: HTMLElement | null;
  error: HTMLElement | null;
  errorMessage: HTMLElement | null;
  results: HTMLElement | null;
};

export const parseNumber = (value: FormDataEntryValue | null): number => {
  if (value === null) return Number.NaN;
  const numericValue = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isFinite(numericValue) ? numericValue : Number.NaN;
};

const appendLoanInputs = (container: HTMLElement | null, index: number): void => {
  if (!container) return;
  const loanHtml = `
    <div class="loan-item border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2">
          <label for="loan-name-${index}" class="block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">Loan Name</label>
          <input id="loan-name-${index}" type="text" name="loan-name-${index}" placeholder="Loan name" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm" />
        </div>
        <div>
          <label for="loan-balance-${index}" class="block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">Balance ($)</label>
          <input id="loan-balance-${index}" type="number" name="loan-balance-${index}" placeholder="Balance" min="0" step="100" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm" />
        </div>
        <div>
          <label for="loan-rate-${index}" class="block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">Interest Rate (% APR)</label>
          <input id="loan-rate-${index}" type="number" name="loan-rate-${index}" placeholder="APR %" min="0" max="100" step="0.01" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm" />
        </div>
        <div>
          <label for="loan-minimum-${index}" class="block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">Minimum Payment ($)</label>
          <input id="loan-minimum-${index}" type="number" name="loan-minimum-${index}" placeholder="Min payment" min="0" step="10" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm" />
        </div>
        <div>
          <label for="loan-type-${index}" class="block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">Loan Type</label>
          <select id="loan-type-${index}" name="loan-type-${index}" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm"><option value="federal_unsubsidized">Federal Unsubsidized</option><option value="federal_subsidized">Federal Subsidized</option><option value="private">Private</option></select>
        </div>
      </div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', loanHtml);
};

const isLoanType = (value: string): value is LoanType =>
  value === 'federal_unsubsidized' || value === 'federal_subsidized' || value === 'private';

export const collectLoans = (formData: FormData, limit: number): StudentLoanInput[] => {
  const loans: StudentLoanInput[] = [];

  for (let i = 0; i < limit; i += 1) {
    const name = formData.get(`loan-name-${i}`);
    const balance = parseNumber(formData.get(`loan-balance-${i}`));
    const rate = parseNumber(formData.get(`loan-rate-${i}`));
    const minimum = parseNumber(formData.get(`loan-minimum-${i}`));
    const loanType = formData.get(`loan-type-${i}`);

    if (
      typeof name === 'string' &&
      name.trim() &&
      !Number.isNaN(balance) &&
      !Number.isNaN(rate) &&
      !Number.isNaN(minimum)
    ) {
      loans.push({
        name: name.trim(),
        balance,
        interestRate: rate / 100,
        minimumPayment: minimum,
        loanType:
          typeof loanType === 'string' && loanType && isLoanType(loanType)
            ? loanType
            : 'federal_unsubsidized',
      });
    }
  }

  return loans;
};

export const displayResults = (result: StudentLoanResult): void => {
  const balanceEl = document.getElementById('total-balance');
  if (balanceEl) balanceEl.textContent = formatCurrency(result.input.totalBalance);

  const interestEl = document.getElementById('total-interest');
  if (interestEl) interestEl.textContent = formatCurrency(result.summary.totalInterestPaid);

  const paymentEl = document.getElementById('monthly-payment');
  if (paymentEl) paymentEl.textContent = formatCurrency(result.summary.averageMonthlyPayment);

  const payoffTimeEl = document.getElementById('payoff-time');
  if (payoffTimeEl) {
    payoffTimeEl.textContent = `${result.summary.totalMonthsToPayoff} months (${(result.summary.totalMonthsToPayoff / 12).toFixed(1)} years)`;
  }

  const orderEl = document.getElementById('payoff-order');
  if (orderEl) {
    const summaries = result.summary.loanSummaries.slice().sort((a, b) => a.monthsToPayoff - b.monthsToPayoff);
    const orderHtml = summaries
      .map(
        (loan, index) => `
          <div class="flex justify-between items-center text-sm">
            <span class="font-medium">${index + 1}. ${loan.name}</span>
            <span class="text-gray-600 dark:text-gray-400">${loan.monthsToPayoff} months</span>
          </div>
        `,
      )
      .join('');
    orderEl.innerHTML = orderHtml;
  }

  document.getElementById('results')?.classList.remove('hidden');
};

export const handleSubmit = async (
  form: HTMLFormElement,
  loanCountRef: { value: number },
  refs: ScreenRefs,
): Promise<void> => {
  refs.results?.classList.add('hidden');
  refs.error?.classList.add('hidden');
  refs.loading?.classList.remove('hidden');

  try {
    const formData = new FormData(form);
    const extraMonthlyPayment = parseNumber(formData.get('extraMonthlyPayment')) || 0;
    const paymentStrategyValue = formData.get('paymentStrategy');
    const paymentStrategy = (typeof paymentStrategyValue === 'string' && paymentStrategyValue
      ? paymentStrategyValue
      : 'standard') as PaymentStrategy;

    const loans = collectLoans(formData, loanCountRef.value);

    if (loans.length === 0) {
      throw new Error('Please add at least one loan');
    }

    const result = StudentLoanEngine.analyze({
      loans,
      extraMonthlyPayment,
      paymentStrategy,
      forgivenessEligible: false,
    });

    storeAnalysisResult('analyze_student_loans', result);
    displayResults(result);
  } catch (error) {
    if (refs.errorMessage) {
      refs.errorMessage.textContent = error instanceof Error ? error.message : 'An unexpected error occurred';
    }
    refs.error?.classList.remove('hidden');
    console.error('Student loan calculation error:', error);
  } finally {
    refs.loading?.classList.add('hidden');
  }
};

const initStudentLoansPage = (): void => {
  registerChatButton('#student-loans-chat-button', 'Student Loan Analyzer', {
    tool: 'analyze_student_loans',
  });

  const form = document.getElementById('loan-form');
  const loansContainer = document.getElementById('loans-container');

  if (!(form instanceof HTMLFormElement)) {
    console.error('Student loan form not found');
    return;
  }

  const addLoanBtn = document.getElementById('add-loan-btn');
  const resetBtn = document.getElementById('reset-btn');

  const loanCountRef = {
    value: loansContainer instanceof HTMLElement ? loansContainer.querySelectorAll('.loan-item').length : 0,
  };

  if (addLoanBtn instanceof HTMLButtonElement) {
    addLoanBtn.addEventListener('click', () => {
      appendLoanInputs(loansContainer instanceof HTMLElement ? loansContainer : null, loanCountRef.value);
      loanCountRef.value += 1;
    });
  }

  const refs: ScreenRefs = {
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    errorMessage: document.getElementById('error-message'),
    results: document.getElementById('results'),
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void handleSubmit(form, loanCountRef, refs);
  });

  if (resetBtn instanceof HTMLButtonElement) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      refs.results?.classList.add('hidden');
      refs.error?.classList.add('hidden');
    });
  }
};

initStudentLoansPage();

export {};
