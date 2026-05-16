/**
 * Cash Flow Forecasting Calculator
 *
 * 12-month cash flow projection including AR/AP, working capital,
 * burn rate, and cash runway analysis.
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

export interface CashFlowInput {
  startingCash: number;
  monthlyRevenue: number;
  revenueGrowthRate: number;
  averageCollectionDays: number; // Days Sales Outstanding (DSO)
  monthlyExpenses: number;
  expenseGrowthRate: number;
  averagePaymentDays: number; // Days Payable Outstanding (DPO)
  seasonalityMonths?: number[]; // Months with higher/lower sales
  seasonalityFactor?: number; // % above/below average
  oneTimeExpenses?: Array<{ month: number; amount: number; description: string }>;
  oneTimeRevenue?: Array<{ month: number; amount: number; description: string }>;
}

export interface MonthlyProjection {
  month: number;
  monthName: string;
  revenue: number;
  cashCollected: number;
  expenses: number;
  cashPaid: number;
  netCashFlow: number;
  endingCash: number;
  burnRate: number;
  runwayMonths: number;
}

export interface CashFlowResult {
  projections: MonthlyProjection[];
  summary: {
    totalRevenue: number;
    totalCashCollected: number;
    totalExpenses: number;
    totalCashPaid: number;
    netCashFlow: number;
    endingCash: number;
    lowestCash: { month: number; amount: number; monthName: string };
    highestCash: { month: number; amount: number; monthName: string };
    averageBurnRate: number;
    cashRunway: number;
    workingCapitalNeeds: number;
  };
  warnings: string[];
  recommendations: string[];
}

// ============================================================================
// CALCULATIONS
// ============================================================================

function calculateCashFlow(input: CashFlowInput): CashFlowResult {
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const projections: MonthlyProjection[] = [];

  let cashBalance = input.startingCash;
  let accumulatedAR = 0; // Accounts Receivable
  let accumulatedAP = 0; // Accounts Payable

  const collectionDelay = Math.floor(input.averageCollectionDays / 30);
  const paymentDelay = Math.floor(input.averagePaymentDays / 30);

  const revenueByMonth: number[] = [];
  const expensesByMonth: number[] = [];

  for (let month = 0; month < 12; month++) {
    // Calculate revenue for this month with growth
    let monthlyRevenue =
      input.monthlyRevenue * Math.pow(1 + input.revenueGrowthRate / 100 / 12, month);

    // Apply seasonality if applicable
    if (
      input.seasonalityMonths &&
      input.seasonalityMonths.includes(month) &&
      input.seasonalityFactor
    ) {
      monthlyRevenue *= 1 + input.seasonalityFactor / 100;
    }

    // Add one-time revenue
    const oneTimeRev = input.oneTimeRevenue?.find((r) => r.month === month);
    if (oneTimeRev) {
      monthlyRevenue += oneTimeRev.amount;
    }

    revenueByMonth.push(monthlyRevenue);

    // Calculate expenses for this month with growth
    let monthlyExpenses =
      input.monthlyExpenses * Math.pow(1 + input.expenseGrowthRate / 100 / 12, month);

    // Add one-time expenses
    const oneTimeExp = input.oneTimeExpenses?.find((e) => e.month === month);
    if (oneTimeExp) {
      monthlyExpenses += oneTimeExp.amount;
    }

    expensesByMonth.push(monthlyExpenses);

    // Cash collected this month (from revenue N months ago)
    const collectionMonth = month - collectionDelay;
    const cashCollected = collectionMonth >= 0 ? revenueByMonth[collectionMonth] : 0;

    // Cash paid this month (for expenses N months ago)
    const paymentMonth = month - paymentDelay;
    const cashPaid = paymentMonth >= 0 ? expensesByMonth[paymentMonth] : monthlyExpenses;

    // Net cash flow
    const netCashFlow = cashCollected - cashPaid;
    cashBalance += netCashFlow;

    // Burn rate (if negative)
    const burnRate = netCashFlow < 0 ? Math.abs(netCashFlow) : 0;

    // Runway (months until cash runs out)
    const runwayMonths = burnRate > 0 ? cashBalance / burnRate : Infinity;

    projections.push({
      month: month + 1,
      monthName: monthNames[month],
      revenue: monthlyRevenue,
      cashCollected,
      expenses: monthlyExpenses,
      cashPaid,
      netCashFlow,
      endingCash: cashBalance,
      burnRate,
      runwayMonths,
    });

    accumulatedAR += monthlyRevenue - cashCollected;
    accumulatedAP += monthlyExpenses - cashPaid;
  }

  // Summary calculations
  const totalRevenue = revenueByMonth.reduce((sum, r) => sum + r, 0);
  const totalCashCollected = projections.reduce((sum, p) => sum + p.cashCollected, 0);
  const totalExpenses = expensesByMonth.reduce((sum, e) => sum + e, 0);
  const totalCashPaid = projections.reduce((sum, p) => sum + p.cashPaid, 0);
  const netCashFlow = totalCashCollected - totalCashPaid;
  const endingCash = projections[11].endingCash;

  // Find lowest and highest cash months
  const lowestCashMonth = projections.reduce((min, p) => (p.endingCash < min.endingCash ? p : min));
  const highestCashMonth = projections.reduce((max, p) =>
    p.endingCash > max.endingCash ? p : max
  );

  const lowestCash = {
    month: lowestCashMonth.month,
    amount: lowestCashMonth.endingCash,
    monthName: lowestCashMonth.monthName,
  };

  const highestCash = {
    month: highestCashMonth.month,
    amount: highestCashMonth.endingCash,
    monthName: highestCashMonth.monthName,
  };

  // Average burn rate
  const negativeCashFlowMonths = projections.filter((p) => p.netCashFlow < 0);
  const averageBurnRate =
    negativeCashFlowMonths.length > 0
      ? negativeCashFlowMonths.reduce((sum, p) => sum + Math.abs(p.netCashFlow), 0) /
        negativeCashFlowMonths.length
      : 0;

  // Cash runway
  const cashRunway = averageBurnRate > 0 ? endingCash / averageBurnRate : Infinity;

  // Working capital needs (AR + inventory - AP)
  const workingCapitalNeeds = accumulatedAR - accumulatedAP;

  // Generate warnings
  const warnings: string[] = [];

  if (lowestCash.amount < 0) {
    warnings.push(
      `🚨 Cash runs out in ${lowestCash.monthName}! You'll be ${formatCurrency(Math.abs(lowestCash.amount))} short.`
    );
  } else if (lowestCash.amount < input.monthlyExpenses) {
    warnings.push(
      `⚠️ Cash drops to ${formatCurrency(lowestCash.amount)} in ${lowestCash.monthName} - less than 1 month of expenses.`
    );
  }

  if (cashRunway < 3 && cashRunway !== Infinity) {
    warnings.push(
      `⚠️ Only ${cashRunway.toFixed(1)} months of runway remaining. Raise capital or cut costs immediately.`
    );
  }

  if (input.averageCollectionDays > 60) {
    warnings.push(
      `⚠️ ${input.averageCollectionDays} days to collect payment is slow. Aim for <45 days to improve cash flow.`
    );
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (input.averageCollectionDays > input.averagePaymentDays + 15) {
    recommendations.push(
      '💡 You collect slower than you pay. Negotiate faster payment terms with customers or slower terms with vendors.'
    );
  }

  const reserveTarget = input.monthlyExpenses * 3;
  if (lowestCash.amount > reserveTarget) {
    recommendations.push(
      '✓ Strong cash position. You have over 3 months of operating expenses in reserves.'
    );
  }

  if (averageBurnRate > 0) {
    recommendations.push(
      `💸 Average burn rate: ${formatCurrency(averageBurnRate)}/month. Focus on reaching profitability or extending runway.`
    );
  }

  if (endingCash > input.startingCash * 1.5) {
    recommendations.push(
      '✓ Cash is accumulating. Consider investing excess cash or expanding operations.'
    );
  }

  recommendations.push(
    `📊 Working capital tied up: ${formatCurrency(workingCapitalNeeds)}. This is cash you've earned but haven't collected yet.`
  );

  return {
    projections,
    summary: {
      totalRevenue,
      totalCashCollected,
      totalExpenses,
      totalCashPaid,
      netCashFlow,
      endingCash,
      lowestCash,
      highestCash,
      averageBurnRate,
      cashRunway,
      workingCapitalNeeds,
    },
    warnings,
    recommendations,
  };
}

// ============================================================================
// DISPLAY
// ============================================================================

function displayResults(result: CashFlowResult, input: CashFlowInput): void {
  const resultsContainer = document.getElementById('results-container');
  const summaryCards = document.getElementById('summary-cards');
  const resultsSection = document.getElementById('results-section');

  if (!resultsContainer || !summaryCards || !resultsSection) return;

  summaryCards.innerHTML = `
    <div class="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-violet-900 dark:text-violet-100">Starting Cash</h5>
      <p class="text-2xl font-bold text-violet-600 dark:text-violet-400">${formatCurrency(input.startingCash)}</p>
      <p class="text-xs text-violet-700 dark:text-violet-300 mt-1">Beginning balance</p>
    </div>
    <div class="bg-${result.summary.endingCash > input.startingCash ? 'green' : result.summary.endingCash > 0 ? 'yellow' : 'red'}-50 dark:bg-${result.summary.endingCash > input.startingCash ? 'green' : result.summary.endingCash > 0 ? 'yellow' : 'red'}-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-${result.summary.endingCash > input.startingCash ? 'green' : result.summary.endingCash > 0 ? 'yellow' : 'red'}-900 dark:text-${result.summary.endingCash > input.startingCash ? 'green' : result.summary.endingCash > 0 ? 'yellow' : 'red'}-100">Ending Cash (12 mo)</h5>
      <p class="text-2xl font-bold text-${result.summary.endingCash > input.startingCash ? 'green' : result.summary.endingCash > 0 ? 'yellow' : 'red'}-600 dark:text-${result.summary.endingCash > input.startingCash ? 'green' : result.summary.endingCash > 0 ? 'yellow' : 'red'}-400">${formatCurrency(result.summary.endingCash)}</p>
      <p class="text-xs text-${result.summary.endingCash > input.startingCash ? 'green' : result.summary.endingCash > 0 ? 'yellow' : 'red'}-700 dark:text-${result.summary.endingCash > input.startingCash ? 'green' : result.summary.endingCash > 0 ? 'yellow' : 'red'}-300 mt-1">${result.summary.endingCash > input.startingCash ? '✓ Growing' : result.summary.endingCash > 0 ? 'Declining' : '🚨 Negative!'}</p>
    </div>
    <div class="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-violet-900 dark:text-violet-100">Lowest Cash Month</h5>
      <p class="text-2xl font-bold ${result.summary.lowestCash.amount < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-violet-600 dark:text-violet-400'}">${formatCurrency(result.summary.lowestCash.amount)}</p>
      <p class="text-xs text-violet-700 dark:text-violet-300 mt-1">${result.summary.lowestCash.monthName}</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-orange-900 dark:text-orange-100">Cash Runway</h5>
      <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">${result.summary.cashRunway === Infinity ? '∞' : result.summary.cashRunway.toFixed(1)} mo</p>
      <p class="text-xs text-orange-700 dark:text-orange-300 mt-1">${result.summary.averageBurnRate > 0 ? formatCurrency(result.summary.averageBurnRate) + '/mo burn' : 'Profitable'}</p>
    </div>
  `;

  resultsContainer.innerHTML = `
    ${
      result.warnings.length > 0
        ? `
    <!-- Warnings -->
    <div class="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-6 mb-6 border-l-4 border-rose-500">
      <h2 class="text-xl font-semibold mb-3 text-rose-900 dark:text-rose-100 flex items-center gap-2">
        <span>⚠️</span> Cash Flow Warnings
      </h2>
      <div class="space-y-2">
        ${result.warnings.map((w) => `<p class="text-sm text-rose-800 dark:text-rose-200">${w}</p>`).join('')}
      </div>
    </div>
    `
        : ''
    }
    
    <!-- 12-Month Cash Flow Table -->
    <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg shadow-md p-6 mb-6 overflow-x-auto">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>📅</span> 12-Month Cash Flow Projection
      </h2>
      
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b-2 border-slate-300 dark:border-slate-700">
            <th class="text-left py-2 px-2">Month</th>
            <th class="text-right py-2 px-2">Revenue</th>
            <th class="text-right py-2 px-2">Cash In</th>
            <th class="text-right py-2 px-2">Expenses</th>
            <th class="text-right py-2 px-2">Cash Out</th>
            <th class="text-right py-2 px-2">Net Flow</th>
            <th class="text-right py-2 px-2">Ending Cash</th>
          </tr>
        </thead>
        <tbody>
          ${result.projections
            .map(
              (p) => `
            <tr class="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
              <td class="py-2 px-2 font-medium">${p.monthName}</td>
              <td class="text-right py-2 px-2 text-slate-600 dark:text-slate-400">${formatCurrency(p.revenue)}</td>
              <td class="text-right py-2 px-2 text-emerald-600 dark:text-emerald-400">${formatCurrency(p.cashCollected)}</td>
              <td class="text-right py-2 px-2 text-slate-600 dark:text-slate-400">${formatCurrency(p.expenses)}</td>
              <td class="text-right py-2 px-2 text-rose-600 dark:text-rose-400">${formatCurrency(p.cashPaid)}</td>
              <td class="text-right py-2 px-2 font-semibold ${p.netCashFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}">${formatCurrency(p.netCashFlow)}</td>
              <td class="text-right py-2 px-2 font-bold ${p.endingCash >= 0 ? 'text-violet-600 dark:text-violet-400' : 'text-rose-600 dark:text-rose-400'}">${formatCurrency(p.endingCash)}</td>
            </tr>
          `
            )
            .join('')}
          <tr class="border-t-2 border-slate-300 dark:border-slate-700 font-bold">
            <td class="py-3 px-2">TOTAL</td>
            <td class="text-right py-3 px-2">${formatCurrency(result.summary.totalRevenue)}</td>
            <td class="text-right py-3 px-2 text-emerald-600 dark:text-emerald-400">${formatCurrency(result.summary.totalCashCollected)}</td>
            <td class="text-right py-3 px-2">${formatCurrency(result.summary.totalExpenses)}</td>
            <td class="text-right py-3 px-2 text-rose-600 dark:text-rose-400">${formatCurrency(result.summary.totalCashPaid)}</td>
            <td class="text-right py-3 px-2 ${result.summary.netCashFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}">${formatCurrency(result.summary.netCashFlow)}</td>
            <td class="text-right py-3 px-2 text-violet-600 dark:text-violet-400">${formatCurrency(result.summary.endingCash)}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Key Metrics -->
    <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>📊</span> Key Cash Flow Metrics
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-3">
          <div class="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800">
            <span class="text-slate-700 dark:text-slate-300">Days Sales Outstanding (DSO)</span>
            <span class="font-semibold">${input.averageCollectionDays} days</span>
          </div>
          <div class="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800">
            <span class="text-slate-700 dark:text-slate-300">Days Payable Outstanding (DPO)</span>
            <span class="font-semibold">${input.averagePaymentDays} days</span>
          </div>
          <div class="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800">
            <span class="text-slate-700 dark:text-slate-300">Working Capital Needs</span>
            <span class="font-semibold">${formatCurrency(result.summary.workingCapitalNeeds)}</span>
          </div>
        </div>
        
        <div class="space-y-3">
          <div class="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800">
            <span class="text-slate-700 dark:text-slate-300">Average Burn Rate</span>
            <span class="font-semibold ${result.summary.averageBurnRate > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}">${result.summary.averageBurnRate > 0 ? formatCurrency(result.summary.averageBurnRate) : 'Profitable'}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800">
            <span class="text-slate-700 dark:text-slate-300">Cash Runway</span>
            <span class="font-semibold ${result.summary.cashRunway < 6 && result.summary.cashRunway !== Infinity ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}">${result.summary.cashRunway === Infinity ? 'Infinite' : result.summary.cashRunway.toFixed(1) + ' months'}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800">
            <span class="text-slate-700 dark:text-slate-300">Net Cash Flow (12 mo)</span>
            <span class="font-bold ${result.summary.netCashFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}">${formatCurrency(result.summary.netCashFlow)}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Recommendations -->
    <div class="bg-gradient-to-br from-violet-50 to-violet-50 dark:from-violet-900/20 dark:to-violet-900/20 rounded-lg p-6 border border-violet-200 dark:border-violet-700">
      <h2 class="text-xl font-semibold mb-3 flex items-center gap-2">
        <span>💡</span> Cash Flow Improvement Tips
      </h2>
      
      <div class="space-y-3">
        ${result.recommendations
          .map(
            (rec) => `
          <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg p-3 fa-script-copy-strong">
            ${rec}
          </div>
        `
          )
          .join('')}
        
        <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg p-4 mt-4">
          <h4 class="font-semibold text-slate-900 dark:text-white mb-2">Cash Flow Best Practices</h4>
          <ul class="space-y-2 fa-script-copy-strong">
            <li>• Invoice immediately (don't wait to bill)</li>
            <li>• Offer discounts for early payment (2% net 10)</li>
            <li>• Use payment terms that match your collection to payment gap</li>
            <li>• Maintain 3-6 months of operating expenses in cash reserves</li>
            <li>• Monitor cash flow weekly, not monthly</li>
            <li>• Have a line of credit in place before you need it</li>
          </ul>
        </div>
      </div>
    </div>
  `;

  resultsSection.classList.remove('hidden');
}

// ============================================================================
// FORM HANDLING
// ============================================================================

function parseFormInput(form: HTMLFormElement): CashFlowInput {
  const formData = new FormData(form);
  return {
    startingCash: coerceNumber(formData.get('startingCash'), 0),
    monthlyRevenue: coerceNumber(formData.get('monthlyRevenue'), 0),
    revenueGrowthRate: coerceNumber(formData.get('revenueGrowthRate'), 0),
    averageCollectionDays: coerceNumber(formData.get('averageCollectionDays'), 30),
    monthlyExpenses: coerceNumber(formData.get('monthlyExpenses'), 0),
    expenseGrowthRate: coerceNumber(formData.get('expenseGrowthRate'), 0),
    averagePaymentDays: coerceNumber(formData.get('averagePaymentDays'), 30),
  };
}

function validateInput(input: CashFlowInput): void {
  if (input.monthlyRevenue < 0) throw new Error('Monthly revenue cannot be negative');
  if (input.monthlyExpenses < 0) throw new Error('Monthly expenses cannot be negative');
  if (input.averageCollectionDays < 0) throw new Error('Collection days cannot be negative');
  if (input.averagePaymentDays < 0) throw new Error('Payment days cannot be negative');
}

// ============================================================================
// INITIALIZATION
// ============================================================================

function initializeCashFlowForecast(): void {
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

      const result = calculateCashFlow(input);
      displayResults(result, input);

      window.dispatchEvent(
        new CustomEvent('calculator-completed', {
          detail: { calculatorId: 'cash-flow-forecast', result, formData: input },
        })
      );

      if (typeof gtag !== 'undefined') {
        gtag('event', 'cash_flow_calculated', {
          ending_cash: result.summary.endingCash,
          runway_months: result.summary.cashRunway,
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
  document.addEventListener('DOMContentLoaded', initializeCashFlowForecast);
} else {
  initializeCashFlowForecast();
}
