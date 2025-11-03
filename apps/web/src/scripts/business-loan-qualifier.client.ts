/**
 * Business Loan Qualifier Calculator
 * 
 * Calculates DSCR, LTV, SBA loan eligibility, and approval odds
 * for various business loan types.
 */

import {
  coerceNumber,
  formatCurrency,
  showLoading,
  hideLoading,
  showError,
  hideError,
} from '../utils/calculator-utilities';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface LoanQualifierInput {
  loanAmount: number;
  businessRevenue: number;
  netIncome: number;
  existingDebtPayments: number;
  businessAge: number; // years
  creditScore: number;
  collateralValue: number;
  industry: string;
  loanPurpose: 'working-capital' | 'equipment' | 'real-estate' | 'expansion' | 'acquisition';
  personalGuaranteeAvailable: boolean;
}

export interface LoanEligibility {
  loanType: string;
  eligible: boolean;
  approvalOdds: 'excellent' | 'good' | 'fair' | 'poor';
  approvalOddsPercent: number;
  requirements: string[];
  issues: string[];
  estimatedRate: number;
  estimatedTermYears: number;
}

export interface LoanQualifierResult {
  dscr: number;
  ltv: number;
  debtToIncome: number;
  loanEligibility: {
    sba7a: LoanEligibility;
    sba504: LoanEligibility;
    bankTerm: LoanEligibility;
    lineOfCredit: LoanEligibility;
  };
  bestOption: string;
  estimatedMonthlyPayment: number;
  recommendations: string[];
}

// ============================================================================
// CALCULATIONS
// ============================================================================

function calculateLoanQualification(input: LoanQualifierInput): LoanQualifierResult {
  // DSCR = Net Operating Income / Total Debt Service
  const proposedDebtService = (input.loanAmount * 0.08) / 12; // Estimate 8% rate
  const totalDebtService = input.existingDebtPayments + proposedDebtService;
  const dscr = input.netIncome / 12 / totalDebtService;
  
  // LTV = Loan Amount / Collateral Value
  const ltv = input.collateralValue > 0 ? (input.loanAmount / input.collateralValue) * 100 : 0;
  
  // Debt-to-Income
  const debtToIncome = (totalDebtService / (input.businessRevenue / 12)) * 100;
  
  // SBA 7(a) Loan Eligibility
  const sba7a = evaluateSBA7a(input, dscr, ltv);
  
  // SBA 504 Loan Eligibility
  const sba504 = evaluateSBA504(input, dscr, ltv);
  
  // Bank Term Loan
  const bankTerm = evaluateBankTermLoan(input, dscr, ltv);
  
  // Line of Credit
  const lineOfCredit = evaluateLineOfCredit(input, dscr);
  
  // Determine best option
  const options = [sba7a, sba504, bankTerm, lineOfCredit].filter(opt => opt.eligible);
  const bestOption = options.length > 0 
    ? options.reduce((best, current) => current.estimatedRate < best.estimatedRate ? current : best).loanType
    : 'None currently - improve financials';
  
  // Estimated monthly payment for best option
  const bestLoan = options.find(opt => opt.loanType === bestOption);
  const estimatedRate = bestLoan?.estimatedRate || 8;
  const termYears = bestLoan?.estimatedTermYears || 10;
  const estimatedMonthlyPayment = calculateMonthlyPayment(input.loanAmount, estimatedRate, termYears);
  
  // Recommendations
  const recommendations = generateRecommendations(input, dscr, ltv, options.length);
  
  return {
    dscr,
    ltv,
    debtToIncome,
    loanEligibility: {
      sba7a,
      sba504,
      bankTerm,
      lineOfCredit,
    },
    bestOption,
    estimatedMonthlyPayment,
    recommendations,
  };
}

function evaluateSBA7a(input: LoanQualifierInput, dscr: number, ltv: number): LoanEligibility {
  const requirements: string[] = [];
  const issues: string[] = [];
  
  requirements.push('Business operating for at least 2 years');
  requirements.push('For-profit business in eligible industry');
  requirements.push('Demonstrate ability to repay');
  requirements.push('Personal guarantee required');
  requirements.push('Collateral when available');
  
  let eligible = true;
  let approvalOdds: LoanEligibility['approvalOdds'] = 'excellent';
  let approvalOddsPercent = 90;
  
  if (input.businessAge < 2) {
    eligible = false;
    issues.push('❌ Business must be operating for 2+ years');
  }
  
  if (input.loanAmount > 5000000) {
    eligible = false;
    issues.push('❌ SBA 7(a) max is $5M');
  }
  
  if (dscr < 1.25) {
    if (dscr < 1.0) {
      eligible = false;
      issues.push('❌ DSCR must be at least 1.25 (yours: ' + dscr.toFixed(2) + ')');
    } else {
      approvalOdds = 'fair';
      approvalOddsPercent = 50;
      issues.push('⚠️ DSCR below 1.25 - weak cash flow coverage');
    }
  }
  
  if (input.creditScore < 680) {
    if (input.creditScore < 640) {
      eligible = false;
      issues.push('❌ Credit score too low (minimum 640)');
    } else {
      approvalOdds = 'fair';
      approvalOddsPercent = Math.min(approvalOddsPercent, 60);
      issues.push('⚠️ Credit score below 680 - may need compensating factors');
    }
  }
  
  if (!input.personalGuaranteeAvailable) {
    eligible = false;
    issues.push('❌ Personal guarantee required for SBA 7(a)');
  }
  
  // Estimate rate based on credit score
  let estimatedRate = 7.5; // Base rate
  if (input.creditScore >= 720) estimatedRate = 6.5;
  else if (input.creditScore >= 680) estimatedRate = 7.0;
  else estimatedRate = 8.0;
  
  return {
    loanType: 'SBA 7(a) Loan',
    eligible,
    approvalOdds,
    approvalOddsPercent,
    requirements,
    issues,
    estimatedRate,
    estimatedTermYears: 10,
  };
}

function evaluateSBA504(input: LoanQualifierInput, dscr: number, ltv: number): LoanEligibility {
  const requirements: string[] = [];
  const issues: string[] = [];
  
  requirements.push('Must be for real estate or equipment (not working capital)');
  requirements.push('Business must create/retain jobs');
  requirements.push('10% down payment required');
  requirements.push('Property must be owner-occupied (51%+)');
  
  let eligible = true;
  let approvalOdds: LoanEligibility['approvalOdds'] = 'good';
  let approvalOddsPercent = 75;
  
  if (input.loanPurpose !== 'real-estate' && input.loanPurpose !== 'equipment') {
    eligible = false;
    issues.push('❌ SBA 504 is only for real estate or equipment purchases');
  }
  
  if (ltv > 90) {
    eligible = false;
    issues.push('❌ LTV exceeds 90% - need at least 10% down');
  }
  
  if (input.loanAmount > 5500000) {
    eligible = false;
    issues.push('❌ SBA 504 max is $5.5M');
  }
  
  if (dscr < 1.15) {
    approvalOdds = 'fair';
    approvalOddsPercent = 50;
    issues.push('⚠️ DSCR below 1.15 - marginal cash flow');
  }
  
  return {
    loanType: 'SBA 504 Loan',
    eligible,
    approvalOdds,
    approvalOddsPercent,
    requirements,
    issues,
    estimatedRate: 5.5, // Fixed rate, typically lower
    estimatedTermYears: 20, // Real estate
  };
}

function evaluateBankTermLoan(input: LoanQualifierInput, dscr: number, ltv: number): LoanEligibility {
  const requirements: string[] = [];
  const issues: string[] = [];
  
  requirements.push('Strong business financials (2+ years profitable)');
  requirements.push('DSCR of 1.5+ preferred');
  requirements.push('Personal guarantee typically required');
  requirements.push('Collateral required');
  
  let eligible = true;
  let approvalOdds: LoanEligibility['approvalOdds'] = 'good';
  let approvalOddsPercent = 70;
  
  if (dscr < 1.25) {
    eligible = false;
    issues.push('❌ Banks typically require DSCR of 1.25+ (yours: ' + dscr.toFixed(2) + ')');
  } else if (dscr < 1.5) {
    approvalOdds = 'fair';
    approvalOddsPercent = 60;
    issues.push('⚠️ DSCR below 1.5 - banks prefer higher coverage');
  }
  
  if (input.creditScore < 700) {
    if (input.creditScore < 680) {
      eligible = false;
      issues.push('❌ Banks typically require 700+ credit score');
    } else {
      approvalOdds = 'fair';
      approvalOddsPercent = Math.min(approvalOddsPercent, 50);
      issues.push('⚠️ Credit score below 700 reduces approval odds');
    }
  }
  
  if (ltv > 75 && input.collateralValue > 0) {
    approvalOdds = 'fair';
    issues.push('⚠️ LTV above 75% - banks prefer 60-75%');
  }
  
  if (input.businessAge < 3) {
    approvalOdds = 'fair';
    approvalOddsPercent = Math.min(approvalOddsPercent, 40);
    issues.push('⚠️ Business under 3 years - considered higher risk');
  }
  
  let estimatedRate = 7.0;
  if (input.creditScore >= 750 && dscr >= 1.5) estimatedRate = 6.0;
  else if (input.creditScore >= 700 && dscr >= 1.25) estimatedRate = 6.5;
  else estimatedRate = 7.5;
  
  return {
    loanType: 'Bank Term Loan',
    eligible,
    approvalOdds,
    approvalOddsPercent,
    requirements,
    issues,
    estimatedRate,
    estimatedTermYears: 7,
  };
}

function evaluateLineOfCredit(input: LoanQualifierInput, dscr: number): LoanEligibility {
  const requirements: string[] = [];
  const issues: string[] = [];
  
  requirements.push('Strong cash flow and profitability');
  requirements.push('Good credit score (680+)');
  requirements.push('Business operating for 1+ years');
  requirements.push('Typically secured by AR or inventory');
  
  let eligible = true;
  let approvalOdds: LoanEligibility['approvalOdds'] = 'good';
  let approvalOddsPercent = 70;
  
  if (dscr < 1.2) {
    eligible = false;
    issues.push('❌ Insufficient cash flow for line of credit');
  }
  
  if (input.creditScore < 680) {
    eligible = false;
    issues.push('❌ Credit score too low (minimum 680)');
  }
  
  if (input.businessAge < 1) {
    eligible = false;
    issues.push('❌ Business must be operating for 1+ years');
  }
  
  if (input.loanAmount > input.businessRevenue * 0.25) {
    approvalOdds = 'fair';
    approvalOddsPercent = 50;
    issues.push('⚠️ Line amount exceeds 25% of revenue - may be difficult');
  }
  
  return {
    loanType: 'Business Line of Credit',
    eligible,
    approvalOdds,
    approvalOddsPercent,
    requirements,
    issues,
    estimatedRate: 8.5, // Variable rate, typically higher
    estimatedTermYears: 1, // Revolving
  };
}

function calculateMonthlyPayment(principal: number, annualRate: number, years: number): number {
  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;
  return (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
    (Math.pow(1 + monthlyRate, months) - 1);
}

function generateRecommendations(input: LoanQualifierInput, dscr: number, ltv: number, eligibleCount: number): string[] {
  const recs: string[] = [];
  
  if (eligibleCount === 0) {
    recs.push('🚨 You don\'t currently qualify for traditional financing. Consider improving DSCR, credit score, or business age first.');
  } else if (eligibleCount === 1) {
    recs.push('✓ You qualify for limited options. Improving DSCR or credit score would unlock more favorable terms.');
  } else {
    recs.push('✓ You qualify for multiple loan types. Compare rates and terms to find the best fit.');
  }
  
  if (dscr < 1.25) {
    recs.push('📊 Improve DSCR by increasing net income or reducing existing debt payments.');
  } else if (dscr > 2.0) {
    recs.push('✓ Excellent DSCR (>2.0) - strong bargaining power for better rates.');
  }
  
  if (input.creditScore < 720) {
    recs.push('📈 Improving credit score above 720 would qualify you for better rates (potentially 0.5-1% lower).');
  }
  
  if (ltv > 80 && input.collateralValue > 0) {
    recs.push('💰 Consider increasing down payment to reduce LTV below 80% for better approval odds.');
  }
  
  if (input.businessAge < 2) {
    recs.push('⏳ Operating for 2+ years significantly improves approval odds and unlocks SBA programs.');
  }
  
  if (!input.personalGuaranteeAvailable) {
    recs.push('⚠️ Most business loans require personal guarantees. Reconsider if possible.');
  }
  
  return recs;
}

// ============================================================================
// DISPLAY (continued in next part due to length)
// ============================================================================

function displayResults(result: LoanQualifierResult, input: LoanQualifierInput): void {
  const resultsContainer = document.getElementById('results-container');
  const summaryCards = document.getElementById('summary-cards');
  const resultsSection = document.getElementById('results-section');

  if (!resultsContainer || !summaryCards || !resultsSection) return;

  const eligibleLoans = Object.values(result.loanEligibility).filter(l => l.eligible);

  summaryCards.innerHTML = `
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-blue-900 dark:text-blue-100">DSCR</h5>
      <p class="text-2xl font-bold ${result.dscr >= 1.25 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">${result.dscr.toFixed(2)}</p>
      <p class="text-xs text-blue-700 dark:text-blue-300 mt-1">${result.dscr >= 1.25 ? '✓ Strong' : '❌ Too low'}</p>
    </div>
    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-green-900 dark:text-green-100">Qualified Loans</h5>
      <p class="text-2xl font-bold text-green-600 dark:text-green-400">${eligibleLoans.length}/4</p>
      <p class="text-xs text-green-700 dark:text-green-300 mt-1">loan types available</p>
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-purple-900 dark:text-purple-100">Best Option</h5>
      <p class="text-lg font-bold text-purple-600 dark:text-purple-400">${result.bestOption}</p>
      <p class="text-xs text-purple-700 dark:text-purple-300 mt-1">${eligibleLoans.length > 0 ? 'Recommended' : 'Improve financials'}</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-orange-900 dark:text-orange-100">Est. Payment</h5>
      <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">${formatCurrency(result.estimatedMonthlyPayment)}</p>
      <p class="text-xs text-orange-700 dark:text-orange-300 mt-1">per month</p>
    </div>
  `;

  resultsContainer.innerHTML = `
    <!-- Loan Eligibility -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>🏦</span> Loan Eligibility Analysis
      </h2>
      
      <div class="space-y-4">
        ${Object.values(result.loanEligibility).map(loan => `
          <div class="border-2 ${loan.eligible ? 'border-green-500' : 'border-gray-300 dark:border-gray-700'} rounded-lg p-4">
            <div class="flex justify-between items-start mb-3">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${loan.loanType}</h3>
                <p class="text-sm ${loan.eligible ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} font-semibold">
                  ${loan.eligible ? '✓ ELIGIBLE' : '❌ NOT ELIGIBLE'}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-600 dark:text-gray-400">Approval Odds</p>
                <p class="text-lg font-bold ${loan.approvalOddsPercent >= 70 ? 'text-green-600 dark:text-green-400' : loan.approvalOddsPercent >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}">${loan.approvalOddsPercent}%</p>
              </div>
            </div>
            
            ${loan.issues.length > 0 ? `
              <div class="mb-3 space-y-1">
                ${loan.issues.map(issue => `<p class="text-sm text-gray-700 dark:text-gray-300">${issue}</p>`).join('')}
              </div>
            ` : ''}
            
            <div class="bg-gray-50 dark:bg-gray-900 rounded p-3">
              <p class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Requirements:</p>
              <ul class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                ${loan.requirements.map(req => `<li>• ${req}</li>`).join('')}
              </ul>
            </div>
            
            ${loan.eligible ? `
              <div class="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span class="text-gray-600 dark:text-gray-400">Est. Rate:</span>
                  <span class="font-semibold ml-2">${loan.estimatedRate.toFixed(2)}%</span>
                </div>
                <div>
                  <span class="text-gray-600 dark:text-gray-400">Est. Term:</span>
                  <span class="font-semibold ml-2">${loan.estimatedTermYears} years</span>
                </div>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
    
    <!-- Key Ratios -->
    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 mb-6 border border-blue-200 dark:border-blue-700">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>📊</span> Key Financial Ratios
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
          <h4 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">DSCR</h4>
          <p class="text-3xl font-bold ${result.dscr >= 1.5 ? 'text-green-600 dark:text-green-400' : result.dscr >= 1.25 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}">${result.dscr.toFixed(2)}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">Debt Service Coverage Ratio</p>
          <p class="text-xs mt-1">${result.dscr >= 1.5 ? '✓ Excellent (≥1.5)' : result.dscr >= 1.25 ? '✓ Acceptable (≥1.25)' : '❌ Too Low (<1.25)'}</p>
        </div>
        
        ${input.collateralValue > 0 ? `
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
          <h4 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">LTV Ratio</h4>
          <p class="text-3xl font-bold ${result.ltv <= 75 ? 'text-green-600 dark:text-green-400' : result.ltv <= 90 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}">${result.ltv.toFixed(1)}%</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">Loan-to-Value Ratio</p>
          <p class="text-xs mt-1">${result.ltv <= 75 ? '✓ Excellent (≤75%)' : result.ltv <= 90 ? '✓ Acceptable (≤90%)' : '❌ Too High (>90%)'}</p>
        </div>
        ` : ''}
        
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
          <h4 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Debt-to-Income</h4>
          <p class="text-3xl font-bold ${result.debtToIncome <= 30 ? 'text-green-600 dark:text-green-400' : result.debtToIncome <= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}">${result.debtToIncome.toFixed(1)}%</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">Total Debt / Revenue</p>
          <p class="text-xs mt-1">${result.debtToIncome <= 30 ? '✓ Healthy (<30%)' : result.debtToIncome <= 50 ? '⚠️ Moderate (30-50%)' : '❌ High (>50%)'}</p>
        </div>
      </div>
      
      <div class="mt-4 bg-white dark:bg-gray-800 rounded-lg p-4">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">What These Mean</h4>
        <ul class="text-sm text-gray-700 dark:text-gray-300 space-y-2">
          <li><strong>DSCR (Debt Service Coverage Ratio):</strong> Your annual net income divided by total annual debt payments. Lenders want 1.25+ (meaning you earn $1.25 for every $1 of debt payments).</li>
          <li><strong>LTV (Loan-to-Value):</strong> Loan amount as percentage of collateral value. Lower is better - shows you have skin in the game.</li>
          <li><strong>Debt-to-Income:</strong> Total debt payments as percentage of revenue. Shows how much of your revenue goes to debt.</li>
        </ul>
      </div>
    </div>
    
    <!-- Recommendations -->
    <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 border border-green-200 dark:border-green-700">
      <h2 class="text-xl font-semibold mb-3 flex items-center gap-2">
        <span>💡</span> Recommendations
      </h2>
      
      <div class="space-y-3">
        ${result.recommendations.map(rec => `
          <div class="bg-white dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300">
            ${rec}
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  resultsSection.classList.remove('hidden');
}

// ============================================================================
// FORM HANDLING & INITIALIZATION
// ============================================================================

function parseFormInput(form: HTMLFormElement): LoanQualifierInput {
  const formData = new FormData(form);
  return {
    loanAmount: coerceNumber(formData.get('loanAmount'), 0),
    businessRevenue: coerceNumber(formData.get('businessRevenue'), 0),
    netIncome: coerceNumber(formData.get('netIncome'), 0),
    existingDebtPayments: coerceNumber(formData.get('existingDebtPayments'), 0),
    businessAge: coerceNumber(formData.get('businessAge'), 0),
    creditScore: coerceNumber(formData.get('creditScore'), 0),
    collateralValue: coerceNumber(formData.get('collateralValue'), 0),
    industry: (formData.get('industry') as string) || 'general',
    loanPurpose: (formData.get('loanPurpose') as string || 'working-capital') as LoanQualifierInput['loanPurpose'],
    personalGuaranteeAvailable: formData.get('personalGuaranteeAvailable') === 'yes',
  };
}

function validateInput(input: LoanQualifierInput): void {
  if (input.loanAmount <= 0) throw new Error('Loan amount must be positive');
  if (input.businessRevenue <= 0) throw new Error('Business revenue must be positive');
  if (input.netIncome <= 0) throw new Error('Net income must be positive (business must be profitable)');
  if (input.creditScore < 300 || input.creditScore > 850) throw new Error('Credit score must be 300-850');
}

function initializeLoanQualifier(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement;
  const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement;
  const resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    showLoading(calculateBtn);

    try {
      const input = parseFormInput(form);
      validateInput(input);
      
      const result = calculateLoanQualification(input);
      displayResults(result, input);
      
      window.dispatchEvent(new CustomEvent('calculator-completed', {
        detail: { calculatorId: 'business-loan-qualifier', result, formData: input },
      }));
      
      if (typeof gtag !== 'undefined') {
        gtag('event', 'loan_qualifier_calculated', {
          dscr: result.dscr,
          eligible_count: Object.values(result.loanEligibility).filter(l => l.eligible).length,
        });
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Calculation failed');
    } finally {
      hideLoading(calculateBtn);
    }
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      document.getElementById('results-section')?.classList.add('hidden');
      hideError();
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLoanQualifier);
} else {
  initializeLoanQualifier();
}

