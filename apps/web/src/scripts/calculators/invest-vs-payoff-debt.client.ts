/**
 * Invest vs Pay Off Debt Calculator
 * 
 * Compares the financial outcome of using extra money to pay off debt
 * versus investing it, considering interest rates, returns, and risk.
 */

import {
  coerceNumber,
  formatCurrency,
  showLoading,
  hideLoading,
  showError,
  hideError,
} from '../../utils/calculator-utilities';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface InvestVsDebtInput {
  extraMoney: number;
  debtBalance: number;
  debtInterestRate: number;
  debtMinimumPayment: number;
  debtType: 'credit-card' | 'student-loan' | 'auto-loan' | 'mortgage' | 'personal-loan';
  expectedInvestmentReturn: number;
  taxRate: number;
  timeHorizonYears: number;
  hasEmergencyFund: boolean;
  employerMatch: number;
}

export interface StrategyResult {
  name: string;
  endingWealth: number;
  totalPaid: number;
  totalGained: number;
  debtRemaining: number;
  investmentBalance: number;
  interestPaid: number;
  investmentGains: number;
  timeToDebtFree: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface InvestVsDebtResult {
  payOffDebt: StrategyResult;
  invest: StrategyResult;
  hybrid: StrategyResult;
  recommendation: {
    bestStrategy: string;
    reasoning: string;
    mathWinner: string;
    riskAdjustedWinner: string;
    factors: {
      interestRateDifference: number;
      guaranteedReturn: number;
      psychologicalBenefit: string;
      emergencyFundStatus: string;
    };
  };
}

// ============================================================================
// CALCULATIONS
// ============================================================================

function calculatePayOffDebtStrategy(input: InvestVsDebtInput): StrategyResult {
  const monthlyRate = input.debtInterestRate / 100 / 12;
  const totalMonths = input.timeHorizonYears * 12;
  
  let debtBalance = input.debtBalance;
  let totalInterestPaid = 0;
  let monthsToPayoff = 0;
  
  // Apply extra money to debt
  const monthlyPayment = input.debtMinimumPayment + input.extraMoney;
  
  for (let month = 0; month < totalMonths && debtBalance > 0; month++) {
    const interestCharge = debtBalance * monthlyRate;
    const principalPayment = Math.min(monthlyPayment - interestCharge, debtBalance);
    
    totalInterestPaid += interestCharge;
    debtBalance = Math.max(0, debtBalance - principalPayment);
    monthsToPayoff = month + 1;
  }
  
  // Once debt is paid, invest extra money
  let investmentBalance = 0;
  const monthlyInvestmentReturn = input.expectedInvestmentReturn / 100 / 12;
  
  if (monthsToPayoff < totalMonths) {
    const monthsInvesting = totalMonths - monthsToPayoff;
    for (let month = 0; month < monthsInvesting; month++) {
      investmentBalance = investmentBalance * (1 + monthlyInvestmentReturn) + input.extraMoney;
    }
  }
  
  const endingWealth = investmentBalance;
  
  return {
    name: 'Pay Off Debt First',
    endingWealth,
    totalPaid: input.extraMoney * totalMonths,
    totalGained: investmentBalance,
    debtRemaining: debtBalance,
    investmentBalance,
    interestPaid: totalInterestPaid,
    investmentGains: investmentBalance,
    timeToDebtFree: monthsToPayoff,
    riskLevel: 'low',
  };
}

function calculateInvestStrategy(input: InvestVsDebtInput): StrategyResult {
  const debtMonthlyRate = input.debtInterestRate / 100 / 12;
  const investmentMonthlyReturn = input.expectedInvestmentReturn / 100 / 12;
  const totalMonths = input.timeHorizonYears * 12;
  
  let debtBalance = input.debtBalance;
  let investmentBalance = 0;
  let totalInterestPaid = 0;
  
  // Make minimum payments, invest extra
  for (let month = 0; month < totalMonths; month++) {
    // Pay minimum on debt
    if (debtBalance > 0) {
      const interestCharge = debtBalance * debtMonthlyRate;
      const principalPayment = Math.min(input.debtMinimumPayment - interestCharge, debtBalance);
      
      totalInterestPaid += interestCharge;
      debtBalance = Math.max(0, debtBalance - principalPayment);
    }
    
    // Invest extra money
    let monthlyInvestment = input.extraMoney;
    
    // Add employer match if applicable
    if (input.employerMatch > 0 && input.debtType !== 'credit-card') {
      monthlyInvestment += input.extraMoney * (input.employerMatch / 100);
    }
    
    investmentBalance = investmentBalance * (1 + investmentMonthlyReturn) + monthlyInvestment;
  }
  
  const investmentGains = investmentBalance - (input.extraMoney * totalMonths);
  const endingWealth = investmentBalance - debtBalance;
  
  return {
    name: 'Invest While Making Minimum Payments',
    endingWealth,
    totalPaid: input.extraMoney * totalMonths,
    totalGained: investmentGains,
    debtRemaining: debtBalance,
    investmentBalance,
    interestPaid: totalInterestPaid,
    investmentGains,
    timeToDebtFree: debtBalance > 0 ? Infinity : totalMonths,
    riskLevel: input.debtInterestRate > 7 ? 'high' : input.debtInterestRate > 4 ? 'medium' : 'low',
  };
}

function calculateHybridStrategy(input: InvestVsDebtInput): StrategyResult {
  const debtMonthlyRate = input.debtInterestRate / 100 / 12;
  const investmentMonthlyReturn = input.expectedInvestmentReturn / 100 / 12;
  const totalMonths = input.timeHorizonYears * 12;
  
  // Split extra money 50/50 between debt and investing
  const extraToDebt = input.extraMoney * 0.5;
  const extraToInvest = input.extraMoney * 0.5;
  
  let debtBalance = input.debtBalance;
  let investmentBalance = 0;
  let totalInterestPaid = 0;
  let monthsToPayoff = totalMonths;
  
  for (let month = 0; month < totalMonths; month++) {
    // Pay debt
    if (debtBalance > 0) {
      const interestCharge = debtBalance * debtMonthlyRate;
      const principalPayment = Math.min((input.debtMinimumPayment + extraToDebt) - interestCharge, debtBalance);
      
      totalInterestPaid += interestCharge;
      debtBalance = Math.max(0, debtBalance - principalPayment);
      
      if (debtBalance === 0 && monthsToPayoff === totalMonths) {
        monthsToPayoff = month + 1;
      }
    }
    
    // Invest
    let monthlyInvestment = extraToInvest;
    if (debtBalance === 0) {
      monthlyInvestment += extraToDebt; // Redirect debt payment to investing once paid off
    }
    
    if (input.employerMatch > 0) {
      monthlyInvestment += monthlyInvestment * (input.employerMatch / 100);
    }
    
    investmentBalance = investmentBalance * (1 + investmentMonthlyReturn) + monthlyInvestment;
  }
  
  const investmentGains = investmentBalance - (input.extraMoney * totalMonths);
  const endingWealth = investmentBalance - debtBalance;
  
  return {
    name: 'Hybrid Approach (50/50 Split)',
    endingWealth,
    totalPaid: input.extraMoney * totalMonths,
    totalGained: investmentGains,
    debtRemaining: debtBalance,
    investmentBalance,
    interestPaid: totalInterestPaid,
    investmentGains,
    timeToDebtFree: monthsToPayoff,
    riskLevel: 'medium',
  };
}

function compareStrategies(input: InvestVsDebtInput): InvestVsDebtResult {
  const payOffDebt = calculatePayOffDebtStrategy(input);
  const invest = calculateInvestStrategy(input);
  const hybrid = calculateHybridStrategy(input);
  
  // Determine best strategy
  const strategies = [
    { name: 'payOffDebt', result: payOffDebt },
    { name: 'invest', result: invest },
    { name: 'hybrid', result: hybrid },
  ];
  
  const mathWinner = strategies.reduce((best, current) => 
    current.result.endingWealth > best.result.endingWealth ? current : best
  );
  
  // Risk-adjusted recommendation
  const interestRateDiff = input.expectedInvestmentReturn - input.debtInterestRate;
  const guaranteedReturn = input.debtInterestRate;
  
  let riskAdjustedWinner = '';
  let reasoning = '';
  
  if (!input.hasEmergencyFund) {
    riskAdjustedWinner = 'Build emergency fund first';
    reasoning = '⚠️ Priority #1: Build a 3-6 month emergency fund before paying extra on debt or investing. Without this safety net, unexpected expenses could force you into more debt.';
  } else if (input.employerMatch > 0 && input.debtInterestRate < 10) {
    riskAdjustedWinner = 'Invest (get employer match)';
    reasoning = `🎯 With ${input.employerMatch}% employer match, you get an immediate ${input.employerMatch}% return - that's guaranteed free money! Contribute enough to get the full match, then tackle debt.`;
  } else if (input.debtInterestRate >= 8) {
    riskAdjustedWinner = 'Pay off debt';
    reasoning = `💡 Your debt interest rate (${input.debtInterestRate}%) is high. Paying it off gives you a guaranteed ${input.debtInterestRate}% return, which is hard to beat in the market with less risk.`;
  } else if (input.debtInterestRate <= 4 && input.debtType === 'mortgage') {
    riskAdjustedWinner = 'Invest';
    reasoning = `📈 Your mortgage rate (${input.debtInterestRate}%) is low. Historical stock market returns (~10%) suggest investing will likely earn more, though with market risk.`;
  } else if (interestRateDiff > 2) {
    riskAdjustedWinner = 'Hybrid approach';
    reasoning = `⚖️ Rates are close (${input.debtInterestRate}% debt vs ${input.expectedInvestmentReturn}% investment). A 50/50 split balances guaranteed debt reduction with growth potential.`;
  } else {
    riskAdjustedWinner = 'Pay off debt';
    reasoning = `🎯 When investment returns barely exceed debt interest, the guaranteed return from debt payoff is safer. Plus, you'll have the psychological benefit of being debt-free.`;
  }
  
  return {
    payOffDebt,
    invest,
    hybrid,
    recommendation: {
      bestStrategy: riskAdjustedWinner,
      reasoning,
      mathWinner: mathWinner.name,
      riskAdjustedWinner,
      factors: {
        interestRateDifference: interestRateDiff,
        guaranteedReturn: guaranteedReturn,
        psychologicalBenefit: input.debtInterestRate > 6 ? 'High debt weighs heavily - peace of mind is valuable' : 'Lower rate debt is less stressful',
        emergencyFundStatus: input.hasEmergencyFund ? 'Protected' : '⚠️ Build emergency fund first!',
      },
    },
  };
}

// ============================================================================
// DISPLAY
// ============================================================================

function displayResults(result: InvestVsDebtResult, input: InvestVsDebtInput): void {
  const resultsContainer = document.getElementById('results-container');
  const summaryCards = document.getElementById('summary-cards');
  const resultsSection = document.getElementById('results-section');

  if (!resultsContainer || !summaryCards || !resultsSection) {
    console.error('Required DOM elements not found');
    return;
  }

  // Find best strategy by wealth
  const bestWealth = Math.max(result.payOffDebt.endingWealth, result.invest.endingWealth, result.hybrid.endingWealth);
  
  summaryCards.innerHTML = `
    <div class="fa-metric-card fa-metric-card-info">
      <h5 class="text-sm font-medium">Pay Debt First</h5>
      <p class="text-2xl font-bold">${formatCurrency(result.payOffDebt.endingWealth)}</p>
      ${result.payOffDebt.endingWealth === bestWealth ? '<p class="text-xs text-emerald-600 dark:text-emerald-400 mt-1">✓ Best Math</p>' : ''}
    </div>
    <div class="fa-metric-card fa-metric-card-success">
      <h5 class="text-sm font-medium">Invest First</h5>
      <p class="text-2xl font-bold">${formatCurrency(result.invest.endingWealth)}</p>
      ${result.invest.endingWealth === bestWealth ? '<p class="text-xs text-emerald-600 dark:text-emerald-400 mt-1">✓ Best Math</p>' : ''}
    </div>
    <div class="fa-metric-card fa-metric-card-accent">
      <h5 class="text-sm font-medium">Hybrid (50/50)</h5>
      <p class="text-2xl font-bold">${formatCurrency(result.hybrid.endingWealth)}</p>
      ${result.hybrid.endingWealth === bestWealth ? '<p class="text-xs text-emerald-600 dark:text-emerald-400 mt-1">✓ Best Math</p>' : ''}
    </div>
    <div class="fa-metric-card fa-metric-card-warning">
      <h5 class="text-sm font-medium">Recommended</h5>
      <p class="text-lg font-bold">${result.recommendation.riskAdjustedWinner}</p>
      <p class="mt-1 text-xs">Risk-adjusted</p>
    </div>
  `;

  resultsContainer.innerHTML = `
    <!-- Recommendation -->
    <div class="fa-integration-panel">
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <span>🎯</span> Recommendation
      </h2>
      <p class="text-lg font-semibold text-slate-900 dark:text-white mb-2">${result.recommendation.bestStrategy}</p>
      <p class="text-slate-700 dark:text-slate-300">${result.recommendation.reasoning}</p>
    </div>
    
    <!-- Strategy Comparison -->
    <div class="fa-card mb-6">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>📊</span> Strategy Comparison (${input.timeHorizonYears} years)
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${[result.payOffDebt, result.invest, result.hybrid].map(strategy => {
          const isBest = strategy.endingWealth === bestWealth;
          return `
            <div class="border-2 ${isBest ? 'border-emerald-500' : 'border-slate-300 dark:border-slate-700'} rounded-lg p-4">
              ${isBest ? '<div class="fa-chip fa-chip-success mb-3">✓ BEST MATH</div>' : ''}
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">${strategy.name}</h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="fa-script-copy-muted">Ending Wealth</span>
                  <span class="font-bold text-emerald-600 dark:text-emerald-400">${formatCurrency(strategy.endingWealth)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="fa-script-copy-muted">Investment Balance</span>
                  <span class="font-semibold">${formatCurrency(strategy.investmentBalance)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="fa-script-copy-muted">Debt Remaining</span>
                  <span class="font-semibold ${strategy.debtRemaining > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}">${formatCurrency(strategy.debtRemaining)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="fa-script-copy-muted">Interest Paid</span>
                  <span class="font-semibold text-rose-600 dark:text-rose-400">${formatCurrency(strategy.interestPaid)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="fa-script-copy-muted">Debt-Free</span>
                  <span class="font-semibold">${strategy.timeToDebtFree === Infinity ? 'No' : `${Math.round(strategy.timeToDebtFree / 12)}y`}</span>
                </div>
                <div class="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span class="fa-script-note">Risk: ${strategy.riskLevel.toUpperCase()}</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    
    <!-- Key Factors Analysis -->
    <div class="fa-card mb-6">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>💡</span> Key Decision Factors
      </h2>
      
      <div class="space-y-4">
        <div class="fa-metric-card fa-metric-card-info">
          <h4 class="mb-2 font-semibold">Rate Comparison</h4>
          <div class="space-y-2 fa-script-copy-muted">
            <div class="flex justify-between">
              <span>Debt Interest Rate (guaranteed cost):</span>
              <span class="font-bold text-rose-600 dark:text-rose-400">${input.debtInterestRate.toFixed(2)}%</span>
            </div>
            <div class="flex justify-between">
              <span>Expected Investment Return:</span>
              <span class="font-bold text-emerald-600 dark:text-emerald-400">${input.expectedInvestmentReturn.toFixed(2)}%</span>
            </div>
            <div class="flex justify-between border-t border-current/20 pt-2">
              <span>Difference:</span>
              <span class="font-bold">${result.recommendation.factors.interestRateDifference > 0 ? '+' : ''}${result.recommendation.factors.interestRateDifference.toFixed(2)}%</span>
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="fa-metric-card fa-metric-card-success">
            <h4 class="mb-2 font-semibold">✓ Pay Debt Pros</h4>
            <ul class="space-y-1 fa-script-copy-muted">
              <li>• Guaranteed return = debt interest rate</li>
              <li>• Reduces financial stress</li>
              <li>• Frees up cash flow for future</li>
              <li>• Improves credit score</li>
              <li>• No market risk</li>
            </ul>
          </div>
          
          <div class="fa-metric-card fa-metric-card-accent">
            <h4 class="mb-2 font-semibold">✓ Invest Pros</h4>
            <ul class="space-y-1 fa-script-copy-muted">
              <li>• Potential for higher returns</li>
              <li>• Employer match = free money</li>
              <li>• Compound growth over time</li>
              <li>• Maintains liquidity</li>
              <li>• Tax advantages (401k, IRA)</li>
            </ul>
          </div>
        </div>
        
        ${!input.hasEmergencyFund ? `
        <div class="fa-callout-danger">
          <h4 class="mb-2 font-semibold">⚠️ Critical: Build Emergency Fund First</h4>
          <p class="text-sm">
            You indicated you don't have an emergency fund. This should be your #1 priority before extra debt payments or investing. 
            Aim for 3-6 months of expenses in a high-yield savings account.
          </p>
        </div>
        ` : ''}
      </div>
    </div>
    
    <!-- Mathematical Breakdown -->
    <div class="fa-card">
      <h2 class="text-xl font-semibold mb-4">📐 The Math</h2>
      <div class="space-y-3 fa-script-copy-muted">
        <p><strong>Guaranteed Return (Debt Payoff):</strong> ${input.debtInterestRate.toFixed(2)}%</p>
        <p><strong>Expected Return (Investing):</strong> ${input.expectedInvestmentReturn.toFixed(2)}% (not guaranteed)</p>
        <p><strong>Difference:</strong> ${result.recommendation.factors.interestRateDifference.toFixed(2)}% in favor of ${result.recommendation.factors.interestRateDifference > 0 ? 'investing' : 'debt payoff'}</p>
        
        ${input.employerMatch > 0 ? `
        <div class="fa-metric-card fa-metric-card-success mt-4">
          <p><strong>Employer Match Boost:</strong> ${input.employerMatch}% match adds ${input.employerMatch}% to your effective return, making investing even more attractive.</p>
        </div>
        ` : ''}
        
        <div class="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
          <p class="text-xs text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> Investment returns are not guaranteed and carry market risk. Debt payoff provides a guaranteed return equal to the interest rate. 
            Your risk tolerance and financial situation should guide your decision beyond pure math.
          </p>
        </div>
      </div>
    </div>
  `;
  
  resultsSection.classList.remove('hidden');
}

// ============================================================================
// FORM HANDLING
// ============================================================================

function parseFormInput(form: HTMLFormElement): InvestVsDebtInput {
  const formData = new FormData(form);
  return {
    extraMoney: coerceNumber(formData.get('extraMoney'), 0),
    debtBalance: coerceNumber(formData.get('debtBalance'), 0),
    debtInterestRate: coerceNumber(formData.get('debtInterestRate'), 0),
    debtMinimumPayment: coerceNumber(formData.get('debtMinimumPayment'), 0),
    debtType: (formData.get('debtType') as string || 'credit-card') as InvestVsDebtInput['debtType'],
    expectedInvestmentReturn: coerceNumber(formData.get('expectedInvestmentReturn'), 7),
    taxRate: coerceNumber(formData.get('taxRate'), 22),
    timeHorizonYears: coerceNumber(formData.get('timeHorizonYears'), 10),
    hasEmergencyFund: formData.get('hasEmergencyFund') === 'yes',
    employerMatch: coerceNumber(formData.get('employerMatch'), 0),
  };
}

function validateInput(input: InvestVsDebtInput): void {
  if (input.extraMoney <= 0) throw new Error('Please enter extra money amount');
  if (input.debtBalance <= 0) throw new Error('Please enter debt balance');
  if (input.debtInterestRate < 0) throw new Error('Please enter valid interest rate');
  if (input.debtMinimumPayment <= 0) throw new Error('Please enter minimum payment');
}

// ============================================================================
// INITIALIZATION
// ============================================================================

function initializeInvestVsDebt(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement;
  const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement;
  const resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;

  if (!form) {
    console.error('Form not found');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    hideError();
    showLoading(calculateBtn);

    try {
      const input = parseFormInput(form);
      validateInput(input);
      
      const result = compareStrategies(input);
      displayResults(result, input);
      
      window.dispatchEvent(new CustomEvent('calculator-completed', {
        detail: {
          calculatorId: 'invest-vs-payoff-debt',
          result,
          formData: input,
        },
      }));
      
      if (typeof gtag !== 'undefined') {
        gtag('event', 'invest_vs_debt_calculated', {
          debt_type: input.debtType,
          recommended_strategy: result.recommendation.riskAdjustedWinner,
        });
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Calculation failed');
      console.error('Invest vs Debt error:', error);
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
  document.addEventListener('DOMContentLoaded', initializeInvestVsDebt);
} else {
  initializeInvestVsDebt();
}

export { initializeInvestVsDebt as initializeInvestVsPayoffCalculator };
