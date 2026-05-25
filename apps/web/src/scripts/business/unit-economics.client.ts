/**
 * Unit Economics Calculator - Client Side
 *
 * Analyzes customer-level profitability for SaaS, subscription, and e-commerce businesses
 */

import type { UnitEconomicsInput, UnitEconomicsResult } from '@financial-analysis/analysis';
import { UnitEconomicsEngine } from '@financial-analysis/analysis';
import { formatCurrency, parseNumber } from '../../utils/calculator-utilities';
import { storeAnalysisResult } from '../analysis/analysis-results';
import { renderMetricCards } from '../_shared/metric-card-html';
import { registerChatButton } from '../chat/chat-actions';

type CohortAnalysisRow = UnitEconomicsResult['cohortAnalysis'][number];

const isHealthKey = (
  value: string
): value is 'excellent' | 'good' | 'needs-improvement' | 'critical' =>
  value === 'excellent' ||
  value === 'good' ||
  value === 'needs-improvement' ||
  value === 'critical';

/**
 * Parse form data into UnitEconomicsInput
 */
export const parseUnitEconomicsInput = (formData: FormData): UnitEconomicsInput => {
  const monthlyMarketingSpend = parseNumber(formData.get('monthlyMarketingSpend'));
  const newCustomersPerMonth = parseNumber(formData.get('newCustomersPerMonth'));
  const averageMonthlyRevenue = parseNumber(formData.get('averageMonthlyRevenue'));
  const averageCustomerLifespanMonths = parseNumber(formData.get('averageCustomerLifespanMonths'));
  const costOfGoodsSoldPercent = parseNumber(formData.get('costOfGoodsSoldPercent'));
  const variableServicingCostPerCustomer = parseNumber(
    formData.get('variableServicingCostPerCustomer')
  );
  const monthlyChurnRate = parseNumber(formData.get('monthlyChurnRate'));

  // Optional fields
  const organicGrowthPercent = parseNumber(formData.get('organicGrowthPercent')) || undefined;
  const referralRate = parseNumber(formData.get('referralRate')) || undefined;
  const discountRate = parseNumber(formData.get('discountRate')) || undefined;
  const revenueGrowthRate = parseNumber(formData.get('revenueGrowthRate')) || undefined;

  // Validation
  if (monthlyMarketingSpend === null || monthlyMarketingSpend < 0) {
    throw new Error('Please enter a valid monthly marketing spend');
  }
  if (newCustomersPerMonth === null || newCustomersPerMonth <= 0) {
    throw new Error('Please enter a valid number of new customers per month');
  }
  if (averageMonthlyRevenue === null || averageMonthlyRevenue <= 0) {
    throw new Error('Please enter a valid average monthly revenue per customer');
  }
  if (averageCustomerLifespanMonths === null || averageCustomerLifespanMonths <= 0) {
    throw new Error('Please enter a valid average customer lifespan');
  }
  if (
    costOfGoodsSoldPercent === null ||
    costOfGoodsSoldPercent < 0 ||
    costOfGoodsSoldPercent > 100
  ) {
    throw new Error('Please enter a valid COGS percentage (0-100)');
  }
  if (variableServicingCostPerCustomer === null || variableServicingCostPerCustomer < 0) {
    throw new Error('Please enter a valid variable servicing cost');
  }
  if (monthlyChurnRate === null || monthlyChurnRate < 0 || monthlyChurnRate > 100) {
    throw new Error('Please enter a valid monthly churn rate (0-100)');
  }

  return {
    monthlyMarketingSpend,
    newCustomersPerMonth,
    averageMonthlyRevenue,
    averageCustomerLifespanMonths,
    costOfGoodsSoldPercent,
    variableServicingCostPerCustomer,
    monthlyChurnRate,
    organicGrowthPercent,
    referralRate,
    discountRate,
    revenueGrowthRate,
  };
};

/**
 * Display unit economics results in the UI
 */
export const displayResults = (result: UnitEconomicsResult): void => {
  const resultsContainer = document.getElementById('results-container');
  const summaryCards = document.getElementById('summary-cards');

  if (!resultsContainer || !summaryCards) return;

  // Show results
  const resultsSection = document.getElementById('results-section');
  resultsSection?.classList.remove('hidden');

  // Populate summary cards
  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'LTV:CAC Ratio',
      value: `${result.ltvToCacRatio.toFixed(2)}:1`,
      meta: 'Target: 3:1 or better',
      tone: result.ltvToCacRatio >= 3 ? 'emerald' : 'violet',
    },
    {
      title: 'Customer LTV',
      value: formatCurrency(result.ltv),
      meta: 'Lifetime value per customer',
      tone: 'emerald',
    },
    {
      title: 'CAC',
      value: formatCurrency(result.cac),
      meta: 'Customer acquisition cost',
      tone: 'violet',
    },
    {
      title: 'Payback Period',
      value: `${result.paybackPeriodMonths.toFixed(1)} mo`,
      meta: 'Months to recover CAC',
      tone: 'orange',
    },
    {
      title: 'Monthly Churn',
      value: `${result.churnRate.toFixed(1)}%`,
      meta: 'Target: <5%',
      tone: result.churnRate <= 5 ? 'violet' : 'amber',
    },
    {
      title: 'Gross Margin',
      value: `${result.grossMarginPercent.toFixed(1)}%`,
      meta: 'Target: 70%+',
      tone: 'violet',
    },
  ]);

  // Overall health indicator
  const healthColors = {
    excellent:
      'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
    good: 'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200 border-violet-300 dark:border-violet-700',
    'needs-improvement':
      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700',
    critical:
      'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700',
  } as const;

  const healthLabels = {
    excellent: '🌟 Excellent',
    good: '✅ Good',
    'needs-improvement': '⚠️ Needs Improvement',
    critical: '🚨 Critical',
  } as const;

  const overallHealthValue = result.summary.overallHealth;
  const overallHealth: keyof typeof healthLabels =
    typeof overallHealthValue === 'string' && isHealthKey(overallHealthValue)
      ? overallHealthValue
      : 'critical';
  const healthColor = healthColors[overallHealth];
  const healthLabel = healthLabels[overallHealth];

  // Build detailed results
  resultsContainer.innerHTML = `
    <!-- Overall Health -->
    <div class="mb-6 p-6 rounded-lg border-2 ${healthColor}">
      <h3 class="text-xl font-bold mb-2">${healthLabel} Unit Economics</h3>
      <p class="text-sm">
        Your business ${result.summary.profitPerCustomer >= 0 ? 'generates' : 'loses'} 
        <strong>${formatCurrency(Math.abs(result.summary.profitPerCustomer))}</strong> profit per customer.
        ${
          result.summary.monthsToPositiveCashFlow < 999
            ? `Break-even occurs at month ${result.summary.monthsToPositiveCashFlow}.`
            : 'Current metrics do not reach break-even in 24 months.'
        }
      </p>
    </div>
    
    <!-- Key Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <!-- LTV Details -->
      <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg p-6 border border-slate-200 dark:border-slate-800">
        <h4 class="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Lifetime Value (LTV)</h4>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="fa-script-copy-muted">Customer Lifetime Value</span>
            <strong class="text-slate-900 dark:text-white">${formatCurrency(result.ltv)}</strong>
          </div>
          <div class="flex justify-between">
            <span class="fa-script-copy-muted">Customer Lifespan</span>
            <strong class="text-slate-900 dark:text-white">${result.customerLifespanMonths.toFixed(1)} months</strong>
          </div>
          <div class="flex justify-between">
            <span class="fa-script-copy-muted">Contribution Margin/Month</span>
            <strong class="text-slate-900 dark:text-white">${formatCurrency(result.contributionMarginPerCustomer)}</strong>
          </div>
          <div class="flex justify-between">
            <span class="fa-script-copy-muted">Annualized Value</span>
            <strong class="text-slate-900 dark:text-white">${formatCurrency(result.summary.annualizedCustomerValue)}</strong>
          </div>
        </div>
      </div>
      
      <!-- CAC & Efficiency -->
      <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg p-6 border border-slate-200 dark:border-slate-800">
        <h4 class="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Acquisition Efficiency</h4>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="fa-script-copy-muted">Customer Acquisition Cost</span>
            <strong class="text-slate-900 dark:text-white">${formatCurrency(result.cac)}</strong>
          </div>
          <div class="flex justify-between">
            <span class="fa-script-copy-muted">LTV:CAC Ratio</span>
            <strong class="text-slate-900 dark:text-white">${result.ltvToCacRatio.toFixed(2)}:1</strong>
          </div>
          <div class="flex justify-between">
            <span class="fa-script-copy-muted">Payback Period</span>
            <strong class="text-slate-900 dark:text-white">${result.paybackPeriodMonths.toFixed(1)} months</strong>
          </div>
          <div class="flex justify-between">
            <span class="fa-script-copy-muted">Profit Per Customer</span>
            <strong class="${result.summary.profitPerCustomer >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}">${formatCurrency(result.summary.profitPerCustomer)}</strong>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Retention Metrics -->
    <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg p-6 border border-slate-200 dark:border-slate-800 mb-6">
      <h4 class="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Retention & Revenue</h4>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p class="fa-script-copy-muted">Retention Rate</p>
          <p class="text-xl font-bold text-slate-900 dark:text-white">${result.retentionRate.toFixed(1)}%</p>
        </div>
        <div>
          <p class="fa-script-copy-muted">Monthly Churn</p>
          <p class="text-xl font-bold text-slate-900 dark:text-white">${result.churnRate.toFixed(1)}%</p>
        </div>
        <div>
          <p class="fa-script-copy-muted">MRR</p>
          <p class="text-xl font-bold text-slate-900 dark:text-white">${formatCurrency(result.monthlyRecurringRevenue)}</p>
        </div>
        <div>
          <p class="fa-script-copy-muted">ARR</p>
          <p class="text-xl font-bold text-slate-900 dark:text-white">${formatCurrency(result.annualRecurringRevenue)}</p>
        </div>
      </div>
    </div>
    
    <!-- Benchmarks -->
    <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg p-6 border border-slate-200 dark:border-slate-800 mb-6">
      <h4 class="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Benchmark Comparison</h4>
      <div class="space-y-4">
        ${renderBenchmark('LTV:CAC Ratio', result.benchmarks.ltvCacRatio)}
        ${renderBenchmark('Payback Period (months)', result.benchmarks.payback)}
        ${renderBenchmark('Monthly Churn %', result.benchmarks.churn)}
        ${renderBenchmark('Gross Margin %', result.benchmarks.grossMargin)}
      </div>
    </div>
    
    <!-- Cohort Analysis -->
    <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg p-6 border border-slate-200 dark:border-slate-800 mb-6">
      <h4 class="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Cohort Analysis (24 Months)</h4>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-200 dark:border-slate-800">
              <th class="text-left py-2 px-3 text-slate-700 dark:text-slate-300">Month</th>
              <th class="text-right py-2 px-3 text-slate-700 dark:text-slate-300">Customers</th>
              <th class="text-right py-2 px-3 text-slate-700 dark:text-slate-300">Cum. Revenue</th>
              <th class="text-right py-2 px-3 text-slate-700 dark:text-slate-300">Cum. Costs</th>
              <th class="text-right py-2 px-3 text-slate-700 dark:text-slate-300">Cum. Profit</th>
              <th class="text-right py-2 px-3 text-slate-700 dark:text-slate-300">LTV</th>
            </tr>
          </thead>
          <tbody>
            ${result.cohortAnalysis
              .slice(0, 24)
              .map(
                (cohort: CohortAnalysisRow) => `
              <tr class="border-b border-slate-100 dark:border-slate-800 ${cohort.cumulativeProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/10' : ''}">
                <td class="py-2 px-3 text-slate-900 dark:text-white">${cohort.month}</td>
                <td class="text-right py-2 px-3 text-slate-700 dark:text-slate-300">${cohort.customersRemaining.toFixed(1)}</td>
                <td class="text-right py-2 px-3 text-slate-700 dark:text-slate-300">${formatCurrency(cohort.cumulativeRevenue)}</td>
                <td class="text-right py-2 px-3 text-slate-700 dark:text-slate-300">${formatCurrency(cohort.cumulativeCosts)}</td>
                <td class="text-right py-2 px-3 ${cohort.cumulativeProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400'}">${formatCurrency(cohort.cumulativeProfit)}</td>
                <td class="text-right py-2 px-3 text-slate-700 dark:text-slate-300">${formatCurrency(cohort.lifetimeValue)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
       <p class="fa-script-note mt-4">
         💡 Cohort starts with 100 customers. Green rows indicate cumulative profitability.
       </p>
    </div>
    
    <!-- Insights -->
    ${
      result.insights.length > 0
        ? `
      <div class="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-6 mb-6">
        <h4 class="text-lg font-semibold mb-4 text-violet-900 dark:text-violet-100">📊 Key Insights</h4>
        <ul class="space-y-2">
          ${result.insights
            .map(
              (insight: string) => `
            <li class="text-slate-700 dark:text-slate-300">${insight}</li>
          `
            )
            .join('')}
        </ul>
      </div>
    `
        : ''
    }
    
    <!-- Warnings -->
    ${
      result.warnings.length > 0
        ? `
      <div class="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-6 mb-6 border-l-4 border-rose-500">
        <h4 class="text-lg font-semibold mb-4 text-rose-900 dark:text-rose-100">⚠️ Warnings</h4>
        <ul class="space-y-2">
          ${result.warnings
            .map(
              (warning: string) => `
            <li class="text-rose-700 dark:text-rose-300">${warning}</li>
          `
            )
            .join('')}
        </ul>
      </div>
    `
        : ''
    }
    
    <!-- Recommendations -->
    ${
      result.recommendations.length > 0
        ? `
      <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-6">
        <h4 class="text-lg font-semibold mb-4 text-emerald-900 dark:text-emerald-100">💡 Recommendations</h4>
        <ul class="space-y-2">
          ${result.recommendations
            .map(
              (rec: string) => `
            <li class="text-slate-700 dark:text-slate-300">${rec}</li>
          `
            )
            .join('')}
        </ul>
      </div>
    `
        : ''
    }
  `;

  // Scroll to results
  resultsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/**
 * Render a single benchmark row
 */
function renderBenchmark(
  label: string,
  benchmark: { your: number; target: number; status: 'good' | 'warning' | 'poor' }
): string {
  const statusColors = {
    good: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
    poor: 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200',
  };

  const statusIcons = {
    good: '✅',
    warning: '⚠️',
    poor: '🚨',
  };

  return `
    <div class="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800 last:border-0">
      <span class="text-slate-700 dark:text-slate-300">${label}</span>
      <div class="flex items-center gap-4">
        <div class="text-right">
          <p class="fa-script-copy-muted">Your: ${benchmark.your.toFixed(1)}</p>
          <p class="fa-script-copy-muted">Target: ${benchmark.target.toFixed(1)}</p>
        </div>
        <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColors[benchmark.status]}">
          ${statusIcons[benchmark.status]} ${benchmark.status.charAt(0).toUpperCase() + benchmark.status.slice(1)}
        </span>
      </div>
    </div>
  `;
}

/**
 * Initialize the calculator
 */
export const initUnitEconomicsCalculator = (): void => {
  const form = document.getElementById('calculator-form') as HTMLFormElement;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement;
    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('error-message');

    try {
      // Hide previous errors
      errorState?.classList.add('hidden');

      // Disable button during calculation
      if (calculateBtn) {
        calculateBtn.disabled = true;
        calculateBtn.textContent = 'Calculating...';
      }

      const formData = new FormData(form);
      const input = parseUnitEconomicsInput(formData);
      const result = UnitEconomicsEngine.analyze(input);

      // Store result for AI assistant
      storeAnalysisResult('analyze_unit_economics', result);

      // Display results
      displayResults(result);
    } catch (error) {
      console.error('Unit economics calculation error:', error);
      if (errorState && errorMessage) {
        errorState.classList.remove('hidden');
        errorMessage.textContent =
          error instanceof Error ? error.message : 'An error occurred during calculation';
      }
    } finally {
      // Re-enable button
      if (calculateBtn) {
        calculateBtn.disabled = false;
        calculateBtn.textContent = 'Calculate';
      }
    }
  });

  // Register chat button for AI analysis
  registerChatButton('#unit-economics-chat-button', 'Unit Economics Calculator');
};

// Auto-initialize if on unit economics page
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (
      window.location.pathname.includes('/unit-economics') ||
      window.location.pathname.includes('/calculator/unit-economics')
    ) {
      initUnitEconomicsCalculator();
    }
  });
}
