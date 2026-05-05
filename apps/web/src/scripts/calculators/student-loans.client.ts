import type { StudentLoanResult } from '@financial-analysis/analysis';
import { StudentLoanEngine } from '@financial-analysis/analysis';
import { storeAnalysisResult } from '../analysis/analysis-results';
import { registerChatButton } from '../chat/chat-actions';
import { formatCurrency, formatPercent } from '../../utils/calculator-utilities';

type PaymentStrategy = 'avalanche' | 'snowball' | 'standard';
type LoanType = 'federal_unsubsidized' | 'federal_subsidized' | 'private';

type StudentLoanInput = {
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  loanType: LoanType;
};

type LoanSummary = StudentLoanResult['summary']['loanSummaries'][number];

// Forgiveness Program Eligibility
interface ForgivenessEligibility {
  pslf: { eligible: boolean; requirements: string[]; timeline: string };
  idrForgiveness: { eligible: boolean; requirements: string[]; timeline: string };
  teacherLoan: { eligible: boolean; requirements: string[]; timeline: string };
  savings: { pslf: number; idr: number; teacher: number };
}

type ForgivenessProgramKey = 'pslf' | 'idrForgiveness' | 'teacherLoan';

const FORGIVENESS_PROGRAM_CONFIG: Record<
  ForgivenessProgramKey,
  { label: string; savingsKey: keyof ForgivenessEligibility['savings'] }
> = {
  pslf: { label: 'PSLF', savingsKey: 'pslf' },
  idrForgiveness: { label: 'IDR Forgiveness', savingsKey: 'idr' },
  teacherLoan: { label: 'Teacher Loan', savingsKey: 'teacher' },
};

const FORGIVENESS_PROGRAM_KEYS: ForgivenessProgramKey[] = ['pslf', 'idrForgiveness', 'teacherLoan'];

function checkForgivenessEligibility(
  balance: number,
  loanType: LoanType,
  employment: string = 'private',
  isTeacher: boolean = false,
  yearsEmployed: number = 0
): ForgivenessEligibility {
  const isFederal = loanType.startsWith('federal');
  const normalizedYearsEmployed = Math.max(0, yearsEmployed);
  
  // PSLF (Public Service Loan Forgiveness)
  const pslf = {
    eligible: isFederal && employment === 'public',
    requirements: [
      'Work full-time for qualifying public service employer',
      'Make 120 qualifying monthly payments (10 years)',
      'Be enrolled in income-driven repayment plan',
      'Have Direct Loans (or consolidate first)',
    ],
    timeline:
      normalizedYearsEmployed >= 10
        ? 'All PSLF service years completed'
        : `${Math.max(0, 10 - normalizedYearsEmployed)} years remaining`,
  };
  
  // IDR Forgiveness (Income-Driven Repayment)
  const idrForgiveness = {
    eligible: isFederal,
    requirements: [
      'Enroll in an income-driven repayment plan (IDR)',
      'Make payments for 20-25 years',
      'Remaining balance forgiven (may be taxable)',
      'Federal loans only',
    ],
    timeline:
      normalizedYearsEmployed >= 25
        ? 'Eligible for review now'
        : `${Math.max(0, 25 - normalizedYearsEmployed)} years remaining`,
  };
  
  // Teacher Loan Forgiveness
  const teacherLoan = {
    eligible: isFederal && isTeacher,
    requirements: [
      'Teach full-time for 5 years',
      'Teach at low-income school',
      'Up to $17,500 forgiveness',
      'Cannot combine with PSLF',
    ],
    timeline:
      normalizedYearsEmployed >= 5
        ? 'All five years satisfied'
        : `${Math.max(0, 5 - normalizedYearsEmployed)} years remaining`,
  };
  
  // Estimate savings
  const pslfSavings = pslf.eligible ? balance * 0.5 : 0; // Avg 50% forgiven
  const idrSavings = idrForgiveness.eligible ? balance * 0.3 : 0; // Avg 30% forgiven after 20-25 years
  const teacherSavings = teacherLoan.eligible ? Math.min(17500, balance) : 0;
  
  return {
    pslf,
    idrForgiveness,
    teacherLoan,
    savings: {
      pslf: pslfSavings,
      idr: idrSavings,
      teacher: teacherSavings,
    },
  };
}

// Refinance Comparison
interface RefinanceComparison {
  current: { rate: number; payment: number; totalCost: number; months: number };
  refinanced: { rate: number; payment: number; totalCost: number; months: number };
  savings: number;
  costDifference: number;
  recommendation: string;
  warnings: string[];
}

function compareRefinance(
  balance: number,
  currentRate: number,
  loanType: LoanType,
  creditScore: number = 700
): RefinanceComparison {
  const isFederal = loanType.startsWith('federal');
  
  // Estimate refinance rate based on credit score
  let refinanceRate = currentRate;
  if (creditScore >= 780) refinanceRate = Math.max(0.03, currentRate - 0.03); // 3% reduction
  else if (creditScore >= 720) refinanceRate = Math.max(0.035, currentRate - 0.02); // 2% reduction
  else if (creditScore >= 680) refinanceRate = Math.max(0.04, currentRate - 0.01); // 1% reduction
  else refinanceRate = currentRate; // No benefit
  
  const months = 120; // 10-year term
  
  // Current loan calculations
  const currentMonthlyRate = currentRate / 12;
  const currentPayment = (balance * (currentMonthlyRate * Math.pow(1 + currentMonthlyRate, months))) /
    (Math.pow(1 + currentMonthlyRate, months) - 1);
  const currentTotalCost = currentPayment * months;
  
  // Refinanced loan calculations
  const refinanceMonthlyRate = refinanceRate / 12;
  const refinancePayment = (balance * (refinanceMonthlyRate * Math.pow(1 + refinanceMonthlyRate, months))) /
    (Math.pow(1 + refinanceMonthlyRate, months) - 1);
  const refinanceTotalCost = refinancePayment * months;
  
  const savings = currentTotalCost - refinanceTotalCost;
  const costDifference = currentPayment - refinancePayment;
  
  // Warnings for federal loans
  const warnings: string[] = [];
  if (isFederal) {
    warnings.push('⚠️ You will lose federal protections (forbearance, deferment)');
    warnings.push('⚠️ No longer eligible for forgiveness programs (PSLF, IDR)');
    warnings.push('⚠️ Loss of income-driven repayment options');
  }
  
  let recommendation = '';
  if (savings > 5000 && !isFederal) {
    recommendation = 'Refinancing recommended: Significant savings with no federal benefits to lose';
  } else if (savings > 5000 && isFederal) {
    recommendation = 'Consider carefully: Savings are significant but you will lose federal protections';
  } else if (savings > 0 && savings < 5000) {
    recommendation = 'Marginal benefit: Savings are modest. Weigh against refinancing costs and federal benefits';
  } else {
    recommendation = 'Not recommended: Insufficient savings or your credit score may not qualify for better rates';
  }
  
  return {
    current: {
      rate: currentRate * 100,
      payment: currentPayment,
      totalCost: currentTotalCost,
      months,
    },
    refinanced: {
      rate: refinanceRate * 100,
      payment: refinancePayment,
      totalCost: refinanceTotalCost,
      months,
    },
    savings,
    costDifference,
    recommendation,
    warnings,
  };
}

type ScreenRefs = {
  loading: HTMLElement | null;
  error: HTMLElement | null;
  errorMessage: HTMLElement | null;
  results: HTMLElement | null;
  resultsSection?: HTMLElement | null;
};

type ExtendedInsights = {
  forgiveness?: ForgivenessEligibility;
  refinance?: RefinanceComparison;
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

export const displayResults = (
  result: StudentLoanResult,
  insights?: ExtendedInsights
): void => {
  // Use the generic results structure from IndividualCalculatorPage.astro
  const resultsContainer = document.getElementById('results-container');
  const summaryCards = document.getElementById('summary-cards');

  if (!resultsContainer || !summaryCards) {
    console.error('Required DOM elements not found for student-loans results');
    return;
  }

  const forgiveness = insights?.forgiveness;
  const refinance = insights?.refinance;
  const weightedAverageRate = formatPercent(result.input.weightedAverageRate);

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
            <span class="fa-script-label font-medium">Total Amount Paid</span>
            <p class="fa-script-copy-subtle">Principal + Interest</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-gray-900 dark:text-white">${formatCurrency(result.summary.totalAmountPaid)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="fa-script-label font-medium">Interest Rate</span>
            <p class="fa-script-copy-subtle">Annual percentage rate</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-gray-900 dark:text-white">${weightedAverageRate}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="fa-script-label font-medium">Payoff Time</span>
            <p class="fa-script-copy-subtle">Total months to pay off</p>
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
                .sort((a: LoanSummary, b: LoanSummary) => a.monthsToPayoff - b.monthsToPayoff)
                .map(
                  (loan: LoanSummary, index: number) => `
                <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span class="fa-script-title-sm">${index + 1}. ${loan.name}</span>
                  <span class="fa-script-copy-muted">${loan.monthsToPayoff} months</span>
                </div>
              `
                )
                .join('')
            : '<div class="fa-script-copy-subtle">No loan details available</div>'
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
    ${
      forgiveness
        ? `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Forgiveness Programs</h3>
      <div class="grid gap-4 sm:grid-cols-3">
        ${FORGIVENESS_PROGRAM_KEYS.map((key) => {
          const program = forgiveness[key];
          const { label, savingsKey } = FORGIVENESS_PROGRAM_CONFIG[key];
          const savingsAmount = forgiveness.savings[savingsKey];
          return `
        <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <h4 class="font-semibold text-gray-900 dark:text-white">${label}</h4>
            <span class="text-sm ${program.eligible ? 'text-green-600' : 'text-gray-500'}">
              ${program.eligible ? 'Eligible' : 'Not Eligible'}
            </span>
          </div>
          <p class="fa-script-copy-strong mb-2">Timeline: ${program.timeline}</p>
          <p class="fa-script-copy-strong">Potential Savings: ${formatCurrency(savingsAmount)}</p>
        </div>`;
        }).join('')}
      </div>
    </div>`
        : ''
    }
    ${
      refinance
        ? `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Refinance Analysis</h3>
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Current Loan</h4>
          <p class="fa-script-copy-strong">Rate: ${refinance.current.rate.toFixed(2)}%</p>
          <p class="fa-script-copy-strong">Payment: ${formatCurrency(refinance.current.payment)}</p>
          <p class="fa-script-copy-strong">Total Cost: ${formatCurrency(refinance.current.totalCost)}</p>
        </div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Refinanced Loan</h4>
          <p class="fa-script-copy-strong">Rate: ${refinance.refinanced.rate.toFixed(2)}%</p>
          <p class="fa-script-copy-strong">Payment: ${formatCurrency(refinance.refinanced.payment)}</p>
          <p class="fa-script-copy-strong">Total Cost: ${formatCurrency(refinance.refinanced.totalCost)}</p>
        </div>
      </div>
      <div class="mt-4">
        <p class="text-base font-semibold text-gray-900 dark:text-white">${refinance.recommendation}</p>
        <p class="fa-script-copy-strong mt-1">Monthly Savings: ${formatCurrency(refinance.costDifference)}</p>
        <p class="fa-script-copy-strong">Total Savings: ${formatCurrency(refinance.savings)}</p>
        ${
          refinance.warnings.length > 0
            ? `<ul class="mt-3 space-y-1 text-sm text-orange-600 dark:text-orange-300">
            ${refinance.warnings.map((warning) => `<li>${warning}</li>`).join('')}
          </ul>`
            : ''
        }
      </div>
    </div>`
        : ''
    }
  `;
};

export const handleSubmit = async (form: HTMLFormElement, refs?: ScreenRefs): Promise<void> => {
  // Show loading state
  const calculateBtn = document.querySelector<HTMLButtonElement>('#calculate-btn');
  if (calculateBtn) {
    calculateBtn.disabled = true;
    calculateBtn.textContent = 'Calculating...';
  }

  // Hide previous results
  const successBanner = refs?.results || document.getElementById('results');
  const resultsSection = refs?.resultsSection || document.getElementById('results-section');
  const resultsContainer = document.getElementById('results-container');
  const summaryCards = document.getElementById('summary-cards');
  successBanner?.classList.add('hidden');
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
    const employmentStatus = (formData.get('employmentStatus') as string) || 'private';
    const isTeacher = formData.get('isTeacher') === 'true' || formData.get('isTeacher') === 'on';
    const yearsEmployedInput = parseNumber(formData.get('yearsEmployed'));
    const yearsEmployed = Number.isFinite(yearsEmployedInput) ? Math.max(0, yearsEmployedInput) : 0;
    const creditScoreInput = parseNumber(formData.get('creditScore'));
    const creditScore = Number.isFinite(creditScoreInput) ? creditScoreInput : 700;

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

    const forgivenessInsights = checkForgivenessEligibility(
      loanBalance,
      loans[0].loanType,
      employmentStatus,
      isTeacher,
      yearsEmployed
    );
    const refinanceInsights = compareRefinance(
      loanBalance,
      interestRate / 100,
      loans[0].loanType,
      creditScore
    );

    const enhancedResult = {
      result,
      forgivenessInsights,
      refinanceInsights,
    };

    // Store result for chatbot integration
    storeAnalysisResult('analyze_student_loans', enhancedResult);

    // Display results
    displayResults(result, {
      forgiveness: forgivenessInsights,
      refinance: refinanceInsights,
    });

    // Show results
    successBanner?.classList.remove('hidden');
    resultsSection?.classList.remove('hidden');
    resultsContainer?.classList.remove('hidden');
    summaryCards?.classList.remove('hidden');

    // Dispatch calculator completion event for journey integration
    window.dispatchEvent(
      new CustomEvent('calculator-completed', {
        detail: {
          calculatorId: 'student-loans',
          result: result,
          forgivenessInsights,
          refinanceInsights,
          formData: {
            loanBalance,
            interestRate,
            annualIncome,
            familySize,
            repaymentPlan,
            employmentStatus,
            isTeacher,
            yearsEmployed,
            creditScore,
          },
        },
      })
    );
  } catch (error) {
    console.error('Student loan calculation error:', error);
    
    // Show error in UI
    if (refs?.error && refs?.errorMessage) {
      refs.error.classList.remove('hidden');
      refs.errorMessage.textContent = error instanceof Error ? error.message : 'An unexpected error occurred';
    } else {
      // Fallback to alert if refs not provided (backward compatibility)
      if (typeof alert !== 'undefined') {
        alert(error instanceof Error ? error.message : 'An unexpected error occurred');
      }
    }
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
    resultsSection: document.getElementById('results-section'),
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void handleSubmit(form, refs);
  });

  // Fallback: also listen for direct button clicks
  if (calculateBtn instanceof HTMLButtonElement) {
    calculateBtn.addEventListener('click', (event) => {
      event.preventDefault();
      void handleSubmit(form, refs);
    });
  }

  if (resetBtn instanceof HTMLButtonElement) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      const successBanner = document.getElementById('results');
      const resultsSection = document.getElementById('results-section');
      const resultsContainer = document.getElementById('results-container');
      const summaryCards = document.getElementById('summary-cards');
      successBanner?.classList.add('hidden');
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
