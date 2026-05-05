/**
 * Credit Card Payoff Calculator
 * 
 * Specialized credit card debt calculator with balance transfer analysis,
 * 0% APR offers, utilization impact, and optimization strategies.
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

export interface CreditCardInput {
  balance: number;
  interestRate: number;
  minimumPaymentPercent: number;
  monthlyPayment: number;
  creditLimit: number;
  balanceTransferOffer: boolean;
  transferAPR: number;
  transferFee: number;
  transferPromoPeriod: number;
}

export interface PayoffStrategy {
  name: string;
  monthsToPayoff: number;
  totalInterest: number;
  totalPaid: number;
  monthlyPayment: number;
  creditScoreImpact: number;
  utilizationReduction: number;
}

export interface CreditCardResult {
  currentStrategy: PayoffStrategy;
  aggressiveStrategy: PayoffStrategy;
  balanceTransfer?: PayoffStrategy;
  minimumOnly: PayoffStrategy;
  utilization: {
    current: number;
    after6Months: number;
    afterPayoff: number;
    creditScoreImpact: string;
  };
  recommendation: {
    bestStrategy: string;
    reasoning: string;
    savings: number;
    timeSaved: number;
  };
}

// ============================================================================
// CALCULATIONS
// ============================================================================

function calculatePayoffStrategy(
  balance: number,
  annualRate: number,
  monthlyPayment: number,
  strategyName: string
): PayoffStrategy {
  const monthlyRate = annualRate / 12;
  let remainingBalance = balance;
  let totalInterest = 0;
  let months = 0;
  const maxMonths = 600; // 50 years cap
  
  while (remainingBalance > 0.01 && months < maxMonths) {
    const interestCharge = remainingBalance * monthlyRate;
    const principalPayment = Math.min(monthlyPayment - interestCharge, remainingBalance);
    
    if (principalPayment <= 0) {
      // Payment doesn't cover interest - debt grows
      months = maxMonths;
      break;
    }
    
    totalInterest += interestCharge;
    remainingBalance -= principalPayment;
    months++;
  }
  
  const utilizationReduction = (balance / balance) * 100; // Will calculate properly with credit limit
  const creditScoreImpact = Math.min(100, months < 24 ? 50 : months < 48 ? 30 : 10);
  
  return {
    name: strategyName,
    monthsToPayoff: months,
    totalInterest,
    totalPaid: balance + totalInterest,
    monthlyPayment,
    creditScoreImpact,
    utilizationReduction,
  };
}

function calculateBalanceTransferStrategy(
  balance: number,
  transferAPR: number,
  transferFee: number,
  promoPeriod: number,
  monthlyPayment: number,
  originalRate: number
): PayoffStrategy {
  // Add transfer fee to balance
  const transferBalance = balance + (balance * (transferFee / 100));
  const promoMonths = promoPeriod;
  const monthlyPromoRate = (transferAPR / 100) / 12;
  
  let remainingBalance = transferBalance;
  let totalInterest = 0;
  let months = 0;
  
  // During promo period
  for (let month = 0; month < promoMonths && remainingBalance > 0; month++) {
    const interestCharge = remainingBalance * monthlyPromoRate;
    const principalPayment = Math.min(monthlyPayment - interestCharge, remainingBalance);
    
    totalInterest += interestCharge;
    remainingBalance -= principalPayment;
    months++;
  }
  
  // After promo period (reverts to regular rate, typically high)
  const postPromoRate = Math.max(originalRate, 0.20); // Often 20%+ after promo
  const monthlyPostPromoRate = postPromoRate / 12;
  
  while (remainingBalance > 0.01 && months < 600) {
    const interestCharge = remainingBalance * monthlyPostPromoRate;
    const principalPayment = Math.min(monthlyPayment - interestCharge, remainingBalance);
    
    if (principalPayment <= 0) break;
    
    totalInterest += interestCharge;
    remainingBalance -= principalPayment;
    months++;
  }
  
  return {
    name: 'Balance Transfer',
    monthsToPayoff: months,
    totalInterest,
    totalPaid: transferBalance + totalInterest,
    monthlyPayment,
    creditScoreImpact: 40,
    utilizationReduction: 100,
  };
}

function analyzeCreditCard(input: CreditCardInput): CreditCardResult {
  const annualRate = input.interestRate / 100;
  
  // Minimum payment (typically 2-3% of balance or $25, whichever is greater)
  const minimumPayment = Math.max(
    input.balance * (input.minimumPaymentPercent / 100),
    25
  );
  
  // Strategy 1: Minimum payments only
  const minimumOnly = calculatePayoffStrategy(
    input.balance,
    annualRate,
    minimumPayment,
    'Minimum Payments Only'
  );
  
  // Strategy 2: User's monthly payment
  const currentStrategy = calculatePayoffStrategy(
    input.balance,
    annualRate,
    input.monthlyPayment,
    'Your Current Plan'
  );
  
  // Strategy 3: Aggressive (2x minimum or user payment + 50%)
  const aggressivePayment = Math.max(minimumPayment * 2, input.monthlyPayment * 1.5);
  const aggressiveStrategy = calculatePayoffStrategy(
    input.balance,
    annualRate,
    aggressivePayment,
    'Aggressive Payoff'
  );
  
  // Strategy 4: Balance transfer (if offered)
  let balanceTransfer: PayoffStrategy | undefined;
  if (input.balanceTransferOffer) {
    balanceTransfer = calculateBalanceTransferStrategy(
      input.balance,
      input.transferAPR,
      input.transferFee,
      input.transferPromoPeriod,
      input.monthlyPayment,
      annualRate
    );
  }
  
  // Credit utilization analysis
  const currentUtilization = (input.balance / input.creditLimit) * 100;
  const balanceAfter6Months = Math.max(0, input.balance - (input.monthlyPayment * 6 - (input.balance * annualRate / 12 * 6)));
  const utilizationAfter6 = (balanceAfter6Months / input.creditLimit) * 100;
  
  let creditScoreImpact = '';
  if (currentUtilization > 70) {
    creditScoreImpact = 'CRITICAL: >70% utilization severely hurts your score. Pay down ASAP.';
  } else if (currentUtilization > 50) {
    creditScoreImpact = 'HIGH: >50% utilization significantly lowers your score. Prioritize payoff.';
  } else if (currentUtilization > 30) {
    creditScoreImpact = 'MODERATE: >30% utilization impacts your score. Aim to get below 30%.';
  } else {
    creditScoreImpact = 'GOOD: <30% utilization is healthy for your credit score.';
  }
  
  // Determine best strategy
  const strategies = [currentStrategy, aggressiveStrategy, balanceTransfer].filter(Boolean) as PayoffStrategy[];
  const bestStrategy = strategies.reduce((best, current) => 
    current.totalInterest < best.totalInterest ? current : best
  );
  
  const savings = currentStrategy.totalInterest - bestStrategy.totalInterest;
  const timeSaved = currentStrategy.monthsToPayoff - bestStrategy.monthsToPayoff;
  
  let recommendation = '';
  if (balanceTransfer && bestStrategy.name === 'Balance Transfer') {
    recommendation = `Transfer to 0% APR card and pay off during promo period (${input.transferPromoPeriod} months). Save ${formatCurrency(savings)} in interest! Critical: Pay off before promo ends.`;
  } else if (bestStrategy.name === 'Aggressive Payoff') {
    recommendation = `Increase payments to ${formatCurrency(aggressivePayment)}/month. You'll save ${formatCurrency(savings)} and be debt-free ${timeSaved} months sooner.`;
  } else {
    recommendation = `Maintain current payments of ${formatCurrency(input.monthlyPayment)}/month. This is already an aggressive strategy.`;
  }
  
  return {
    currentStrategy,
    aggressiveStrategy,
    balanceTransfer,
    minimumOnly,
    utilization: {
      current: currentUtilization,
      after6Months: utilizationAfter6,
      afterPayoff: 0,
      creditScoreImpact,
    },
    recommendation: {
      bestStrategy: bestStrategy.name,
      reasoning: recommendation,
      savings,
      timeSaved,
    },
  };
}

// ============================================================================
// DISPLAY
// ============================================================================

function displayResults(result: CreditCardResult, input: CreditCardInput): void {
  const resultsContainer = document.getElementById('results-container');
  const summaryCards = document.getElementById('summary-cards');
  const resultsSection = document.getElementById('results-section');

  if (!resultsContainer || !summaryCards || !resultsSection) {
    console.error('Required DOM elements not found');
    return;
  }

  const strategies = [result.currentStrategy, result.aggressiveStrategy, result.balanceTransfer, result.minimumOnly].filter(Boolean) as PayoffStrategy[];
  const bestStrategy = strategies.reduce((best, current) => current.totalInterest < best.totalInterest ? current : best);

  summaryCards.innerHTML = `
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-blue-900 dark:text-blue-100">Your Plan</h5>
      <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${result.currentStrategy.monthsToPayoff} mo</p>
      <p class="text-xs text-blue-700 dark:text-blue-300 mt-1">${formatCurrency(result.currentStrategy.totalInterest)} interest</p>
    </div>
    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-green-900 dark:text-green-100">Best Strategy</h5>
      <p class="text-lg font-bold text-green-600 dark:text-green-400">${bestStrategy.name}</p>
      <p class="text-xs text-green-700 dark:text-green-300 mt-1">Save ${formatCurrency(result.recommendation.savings)}</p>
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-purple-900 dark:text-purple-100">Utilization</h5>
      <p class="text-2xl font-bold ${result.utilization.current > 50 ? 'text-red-600 dark:text-red-400' : result.utilization.current > 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}">${result.utilization.current.toFixed(0)}%</p>
      <p class="text-xs text-purple-700 dark:text-purple-300 mt-1">→ ${result.utilization.after6Months.toFixed(0)}% in 6mo</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-orange-900 dark:text-orange-100">Min Payment Trap</h5>
      <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">${result.minimumOnly.monthsToPayoff} mo</p>
      <p class="text-xs text-orange-700 dark:text-orange-300 mt-1">${formatCurrency(result.minimumOnly.totalInterest)} interest!</p>
    </div>
  `;

  resultsContainer.innerHTML = `
    <!-- Recommendation -->
    <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 mb-6 border border-green-200 dark:border-green-700">
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <span>🎯</span> Recommended Strategy
      </h2>
      <p class="text-lg font-semibold text-gray-900 dark:text-white mb-2">${result.recommendation.bestStrategy}</p>
      <p class="fa-script-copy-strong">${result.recommendation.reasoning}</p>
    </div>
    
    <!-- Credit Utilization Impact -->
    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 mb-6 border border-blue-200 dark:border-blue-700">
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <span>📊</span> Credit Utilization Impact
      </h2>
      <p class="fa-script-copy-muted mb-4">${result.utilization.creditScoreImpact}</p>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
          <p class="fa-script-copy-muted mb-1">Current</p>
          <p class="text-3xl font-bold ${result.utilization.current > 50 ? 'text-red-600 dark:text-red-400' : result.utilization.current > 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}">${result.utilization.current.toFixed(0)}%</p>
          <p class="fa-script-note mt-1">${formatCurrency(input.balance)} / ${formatCurrency(input.creditLimit)}</p>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
          <p class="fa-script-copy-muted mb-1">After 6 Months</p>
          <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">${result.utilization.after6Months.toFixed(0)}%</p>
          <p class="fa-script-note mt-1">With current payments</p>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
          <p class="fa-script-copy-muted mb-1">After Payoff</p>
          <p class="text-3xl font-bold text-green-600 dark:text-green-400">0%</p>
          <p class="fa-script-note mt-1">+50-100 point boost</p>
        </div>
      </div>
      
      <div class="mt-4 bg-white dark:bg-gray-800 rounded-lg p-4">
        <div class="flex justify-between text-sm mb-2">
          <span class="fa-script-copy-muted">Utilization Progress</span>
          <span class="font-semibold">${result.utilization.current.toFixed(0)}% → 0%</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div class="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-3 rounded-full" style="width: ${result.utilization.current}%"></div>
        </div>
        <p class="fa-script-note mt-2">
          🎯 Goal: Get below 30% for optimal credit score. Below 10% is excellent.
        </p>
      </div>
    </div>
    
    <!-- Strategy Comparison -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>⚖️</span> Payoff Strategy Comparison
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-${strategies.length} gap-4">
        ${strategies.map(strategy => {
          const isBest = strategy.name === bestStrategy.name;
          const isMinimum = strategy.name === 'Minimum Payments Only';
          return `
            <div class="border-2 ${isBest ? 'border-green-500' : isMinimum ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-lg p-4">
              ${isBest ? '<div class="fa-chip fa-chip-success mb-3">✓ BEST</div>' : ''}
              ${isMinimum ? '<div class="fa-chip fa-chip-danger mb-3">⚠️ WORST</div>' : ''}
              <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">${strategy.name}</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="fa-script-copy-muted">Monthly Payment</span>
                  <span class="font-semibold">${formatCurrency(strategy.monthlyPayment)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="fa-script-copy-muted">Time to Payoff</span>
                  <span class="font-semibold">${strategy.monthsToPayoff} mo</span>
                </div>
                <div class="flex justify-between">
                  <span class="fa-script-copy-muted">Total Interest</span>
                  <span class="font-semibold text-red-600 dark:text-red-400">${formatCurrency(strategy.totalInterest)}</span>
                </div>
                <div class="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span class="text-gray-900 dark:text-white font-medium">Total Paid</span>
                  <span class="font-bold">${formatCurrency(strategy.totalPaid)}</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    
    ${input.balanceTransferOffer && result.balanceTransfer ? `
    <!-- Balance Transfer Analysis -->
    <div class="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 mb-6 border border-purple-200 dark:border-purple-700">
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <span>🔄</span> Balance Transfer Analysis
      </h2>
      <p class="fa-script-copy-muted mb-4">${input.transferAPR === 0 ? '0% APR' : `${input.transferAPR}% APR`} for ${input.transferPromoPeriod} months</p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Transfer Details</h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="fa-script-copy-muted">Original Balance</span>
              <span>${formatCurrency(input.balance)}</span>
            </div>
            <div class="flex justify-between">
              <span class="fa-script-copy-muted">Transfer Fee (${input.transferFee}%)</span>
              <span class="text-red-600 dark:text-red-400">+${formatCurrency(input.balance * (input.transferFee / 100))}</span>
            </div>
            <div class="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
              <span class="font-medium">New Balance</span>
              <span class="font-semibold">${formatCurrency(input.balance * (1 + input.transferFee / 100))}</span>
            </div>
          </div>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Savings vs Current</h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="fa-script-copy-muted">Interest Saved</span>
              <span class="font-bold text-green-600 dark:text-green-400">${formatCurrency(result.currentStrategy.totalInterest - result.balanceTransfer.totalInterest)}</span>
            </div>
            <div class="flex justify-between">
              <span class="fa-script-copy-muted">Months Saved</span>
              <span class="font-semibold">${result.currentStrategy.monthsToPayoff - result.balanceTransfer.monthsToPayoff} mo</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border-l-4 border-red-500">
        <h5 class="font-semibold text-red-900 dark:text-red-100 mb-2">⚠️ Critical: Pay Off During Promo Period!</h5>
        <p class="text-sm text-red-800 dark:text-red-200">
          You MUST pay off the balance within ${input.transferPromoPeriod} months or the rate jumps to ~20%+ APR. 
          Required monthly payment: ${formatCurrency((input.balance * (1 + input.transferFee / 100)) / input.transferPromoPeriod)} to pay off in time.
        </p>
      </div>
    </div>
    ` : ''}
    
    <!-- Minimum Payment Warning -->
    <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border-l-4 border-red-500">
      <h2 class="text-xl font-semibold mb-3 flex items-center gap-2 text-red-900 dark:text-red-100">
        <span>⚠️</span> The Minimum Payment Trap
      </h2>
      <div class="space-y-3 text-sm text-red-800 dark:text-red-200">
        <p>
          If you only pay the minimum (${formatCurrency(result.minimumOnly.monthlyPayment)}/month), it will take <strong>${result.minimumOnly.monthsToPayoff} months (${(result.minimumOnly.monthsToPayoff / 12).toFixed(1)} years)</strong> to pay off.
        </p>
        <p class="text-lg font-bold">
          You'll pay ${formatCurrency(result.minimumOnly.totalInterest)} in interest - that's ${((result.minimumOnly.totalInterest / input.balance) * 100).toFixed(0)}% of your original balance!
        </p>
        <p>
          By paying just ${formatCurrency(input.monthlyPayment)} instead, you save ${formatCurrency(result.minimumOnly.totalInterest - result.currentStrategy.totalInterest)} and finish ${result.minimumOnly.monthsToPayoff - result.currentStrategy.monthsToPayoff} months sooner.
        </p>
      </div>
    </div>
  `;
  
  resultsSection.classList.remove('hidden');
}

// ============================================================================
// INITIALIZATION
// ============================================================================

function parseFormInput(form: HTMLFormElement): CreditCardInput {
  const formData = new FormData(form);
  return {
    balance: coerceNumber(formData.get('balance'), 0),
    interestRate: coerceNumber(formData.get('interestRate'), 0),
    minimumPaymentPercent: coerceNumber(formData.get('minimumPaymentPercent'), 2),
    monthlyPayment: coerceNumber(formData.get('monthlyPayment'), 0),
    creditLimit: coerceNumber(formData.get('creditLimit'), 0),
    balanceTransferOffer: formData.get('balanceTransferOffer') === 'yes',
    transferAPR: coerceNumber(formData.get('transferAPR'), 0),
    transferFee: coerceNumber(formData.get('transferFee'), 3),
    transferPromoPeriod: coerceNumber(formData.get('transferPromoPeriod'), 12),
  };
}

function validateInput(input: CreditCardInput): void {
  if (input.balance <= 0) throw new Error('Please enter card balance');
  if (input.interestRate <= 0) throw new Error('Please enter interest rate');
  if (input.monthlyPayment <= 0) throw new Error('Please enter monthly payment');
  if (input.creditLimit <= 0) throw new Error('Please enter credit limit');
  if (input.monthlyPayment < input.balance * (input.minimumPaymentPercent / 100)) {
    throw new Error('Monthly payment must be at least the minimum');
  }
}

function initializeCreditCardPayoff(): void {
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
      
      const result = analyzeCreditCard(input);
      displayResults(result, input);
      
      window.dispatchEvent(new CustomEvent('calculator-completed', {
        detail: { calculatorId: 'credit-card-payoff', result, formData: input },
      }));
      
      if (typeof gtag !== 'undefined') {
        gtag('event', 'credit_card_calculated', {
          utilization: result.utilization.current,
          best_strategy: result.recommendation.bestStrategy,
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
  document.addEventListener('DOMContentLoaded', initializeCreditCardPayoff);
} else {
  initializeCreditCardPayoff();
}
