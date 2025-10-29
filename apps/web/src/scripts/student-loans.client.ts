import type { StudentLoanResult } from '@financial-analysis/analysis';
import { StudentLoanEngine } from '@financial-analysis/analysis';
import { storeAnalysisResult } from './analysis-results';
import { registerChatButton } from './chat-actions';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const formatCurrency = (value: string | number | undefined): string => {
  if (value === undefined || value === null) return 'N/A';
  const numeric = typeof value === 'number' ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(numeric)) return 'N/A';
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

const calculateMinimumPayment = (
  balance: number,
  annualRate: number,
  plan: string,
  annualIncome?: number,
  familySize?: number
): number => {
  const monthlyRate = annualRate / 12;

  switch (plan) {
    case 'standard':
      // Standard 10-year repayment
      return (
        (balance * (monthlyRate * Math.pow(1 + monthlyRate, 120))) /
        (Math.pow(1 + monthlyRate, 120) - 1)
      );

    case 'extended':
      // Extended 25-year repayment
      return (
        (balance * (monthlyRate * Math.pow(1 + monthlyRate, 300))) /
        (Math.pow(1 + monthlyRate, 300) - 1)
      );

    case 'income-driven':
      // Income-driven repayment (REPAYE/PAYE/IBR/ICR)
      if (annualIncome && familySize) {
        // Calculate discretionary income (simplified)
        const povertyGuideline = 12760 + (familySize - 1) * 4480; // 2023 poverty guidelines
        const discretionaryIncome = Math.max(0, annualIncome - 1.5 * povertyGuideline);

        // REPAYE: 10% of discretionary income
        const monthlyPayment = (discretionaryIncome * 0.1) / 12;

        // Minimum $50 or 1% of balance
        return Math.max(50, Math.min(monthlyPayment, balance * 0.01));
      }
      return Math.max(balance * 0.01, 50);

    case 'refinance': {
      // Refinanced loan (typically lower rate)
      const refinancedRate = Math.max(annualRate - 0.02, 0.02); // Assume 2% lower rate
      const refinancedMonthlyRate = refinancedRate / 12;
      return (
        (balance * (refinancedMonthlyRate * Math.pow(1 + refinancedMonthlyRate, 120))) /
        (Math.pow(1 + refinancedMonthlyRate, 120) - 1)
      );
    }

    default:
      // Default to standard 10-year
      return (
        (balance * (monthlyRate * Math.pow(1 + monthlyRate, 120))) /
        (Math.pow(1 + monthlyRate, 120) - 1)
      );
  }
};

// Modern student loan calculator - streamlined for single loan analysis

export const displayResults = (result: StudentLoanResult): void => {
  // Use the generic results structure from IndividualCalculatorPage.astro
  const resultsContainer = document.getElementById('results-container');
  const summaryCards = document.getElementById('summary-cards');

  if (!resultsContainer || !summaryCards) {
    console.error('Required DOM elements not found for student-loans results');
    return;
  }

  // Render summary cards
  summaryCards.innerHTML = `
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-blue-900 dark:text-blue-100">Total Balance</h5>
      <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${formatCurrency(result.input.totalBalance)}</p>
    </div>
    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-green-900 dark:text-green-100">Monthly Payment</h5>
      <p class="text-2xl font-bold text-green-600 dark:text-green-400">${formatCurrency(result.summary.averageMonthlyPayment)}</p>
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-purple-900 dark:text-purple-100">Total Interest</h5>
      <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">${formatCurrency(result.summary.totalInterestPaid)}</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-orange-900 dark:text-orange-100">Payoff Time</h5>
      <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">${result.summary.totalMonthsToPayoff} months</p>
    </div>
  `;

  // Render detailed breakdown
  resultsContainer.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Repayment Summary</h3>
      
      <div class="space-y-4">
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Total Amount Paid</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Principal + Interest</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-gray-900 dark:text-white">${formatCurrency(result.summary.totalAmountPaid)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Interest Rate</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Annual percentage rate</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-gray-900 dark:text-white">${result.input.loans && result.input.loans.length > 0 ? (result.input.loans[0].interestRate * 100).toFixed(2) : 'N/A'}%</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Payoff Time</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Total months to pay off</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-gray-900 dark:text-white">${result.summary.totalMonthsToPayoff} months (${(result.summary.totalMonthsToPayoff / 12).toFixed(1)} years)</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Loan Details</h3>
      
      <div class="space-y-3">
        ${
          result.summary.loanSummaries && result.summary.loanSummaries.length > 0
            ? result.summary.loanSummaries
                .slice()
                .sort((a, b) => a.monthsToPayoff - b.monthsToPayoff)
                .map(
                  (loan, index) => `
                <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span class="font-medium text-gray-900 dark:text-white">${index + 1}. ${loan.name}</span>
                  <span class="text-gray-600 dark:text-gray-400">${loan.monthsToPayoff} months</span>
                </div>
              `
                )
                .join('')
            : '<div class="text-gray-500 dark:text-gray-400">No loan details available</div>'
        }
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Recommendations</h3>
      
      <div class="space-y-4">
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 class="font-semibold text-blue-900 dark:text-blue-100 mb-2">Payment Strategy</h4>
          <p class="text-blue-800 dark:text-blue-200">Consider making extra payments to reduce total interest paid and payoff time.</p>
        </div>
        
        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <h4 class="font-semibold text-green-900 dark:text-green-100 mb-2">Refinancing Options</h4>
          <p class="text-green-800 dark:text-green-200">If you have good credit, consider refinancing to a lower interest rate to save money over time.</p>
        </div>
        
        <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <h4 class="font-semibold text-purple-900 dark:text-purple-100 mb-2">Income-Driven Plans</h4>
          <p class="text-purple-800 dark:text-purple-200">If you're struggling with payments, consider income-driven repayment plans that cap payments based on your income.</p>
        </div>
      </div>
    </div>
  `;
};

export const handleSubmit = async (form: HTMLFormElement): Promise<void> => {
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
    const formData = new FormData(form);

    // Extract form data
    const loanBalance = parseNumber(formData.get('loanBalance'));
    const interestRate = parseNumber(formData.get('interestRate'));
    const annualIncome = parseNumber(formData.get('annualIncome'));
    const familySize = parseNumber(formData.get('familySize'));
    const repaymentPlan = formData.get('repaymentPlan') as string;

    // Validate required fields
    if (Number.isNaN(loanBalance) || loanBalance <= 0) {
      throw new Error('Please enter a valid loan balance');
    }

    if (Number.isNaN(interestRate) || interestRate <= 0) {
      throw new Error('Please enter a valid interest rate');
    }

    // Additional validation
    if (loanBalance > 1000000) {
      throw new Error('Loan balance cannot exceed $1,000,000');
    }

    if (interestRate > 30) {
      throw new Error('Interest rate cannot exceed 30%');
    }

    if (annualIncome && annualIncome < 0) {
      throw new Error('Annual income cannot be negative');
    }

    if (familySize && (familySize < 1 || familySize > 20)) {
      throw new Error('Family size must be between 1 and 20');
    }

    // Create loan object with enhanced minimum payment calculation
    const loans: StudentLoanInput[] = [
      {
        name: 'Student Loan',
        balance: loanBalance,
        interestRate: interestRate / 100,
        minimumPayment: calculateMinimumPayment(
          loanBalance,
          interestRate / 100,
          repaymentPlan,
          annualIncome,
          familySize
        ),
        loanType: 'federal_unsubsidized',
      },
    ];

    // Determine payment strategy based on repayment plan
    let paymentStrategy: PaymentStrategy = 'standard';
    let forgivenessEligible = false;

    switch (repaymentPlan) {
      case 'income-driven':
        paymentStrategy = 'standard'; // Will be overridden by income-driven logic
        forgivenessEligible = true;
        break;
      case 'extended':
        paymentStrategy = 'standard';
        break;
      case 'refinance':
        paymentStrategy = 'standard';
        break;
      default:
        paymentStrategy = 'standard';
    }

    const result = StudentLoanEngine.analyze({
      loans,
      extraMonthlyPayment: 0,
      paymentStrategy,
      forgivenessEligible,
    });

    // Store result for chatbot integration
    storeAnalysisResult('analyze_student_loans', result);

    // Display results
    displayResults(result);

    // Show results
    resultsSection?.classList.remove('hidden');
    resultsContainer?.classList.remove('hidden');
    summaryCards?.classList.remove('hidden');

    // Dispatch calculator completion event for journey integration
    window.dispatchEvent(
      new CustomEvent('calculator-completed', {
        detail: {
          calculatorId: 'student-loans',
          result: result,
          formData: {
            loanBalance,
            interestRate,
            annualIncome,
            familySize,
            repaymentPlan,
          },
        },
      })
    );
  } catch (error) {
    console.error('Student loan calculation error:', error);
    alert(error instanceof Error ? error.message : 'An unexpected error occurred');
  } finally {
    // Reset button state
    if (calculateBtn) {
      calculateBtn.disabled = false;
      calculateBtn.textContent = 'Calculate';
    }
  }
};

const initStudentLoansPage = (): void => {
  registerChatButton('#student-loans-chat-button', 'Student Loan Analyzer', {
    tool: 'analyze_student_loans',
  });

  const form = document.getElementById('calculator-form');

  if (!(form instanceof HTMLFormElement)) {
    console.error('Student loan form not found');
    return;
  }

  const resetBtn = document.getElementById('reset-btn');
  const saveBtn = document.getElementById('save-scenario-btn');
  const calculateBtn = document.getElementById('calculate-btn');

  const refs: ScreenRefs = {
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    errorMessage: document.getElementById('error-message'),
    results: document.getElementById('results'),
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void handleSubmit(form);
  });

  // Fallback: also listen for direct button clicks
  if (calculateBtn instanceof HTMLButtonElement) {
    calculateBtn.addEventListener('click', (event) => {
      event.preventDefault();
      void handleSubmit(form);
    });
  }

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

  if (saveBtn instanceof HTMLButtonElement) {
    saveBtn.addEventListener('click', () => {
      // TODO: Implement save scenario functionality
      console.log('Save scenario clicked');
    });
  }
};

initStudentLoansPage();

export {};
