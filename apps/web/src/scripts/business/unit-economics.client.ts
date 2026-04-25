/**
 * Unit Economics Calculator - Client Side
 * 
 * Analyzes customer-level profitability for SaaS, subscription, and e-commerce businesses
 */

import type { UnitEconomicsInput, UnitEconomicsResult } from '@financial-analysis/analysis';
import { UnitEconomicsEngine } from '@financial-analysis/analysis';
import { formatCurrency, parseNumber } from '../../utils/calculator-utilities';
import { storeAnalysisResult } from '../analysis/analysis-results';
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
  const variableServicingCostPerCustomer = parseNumber(formData.get('variableServicingCostPerCustomer'));
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
  if (costOfGoodsSoldPercent === null || costOfGoodsSoldPercent < 0 || costOfGoodsSoldPercent > 100) {
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
  summaryCards.innerHTML = `
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-blue-900 dark:text-blue-100">LTV:CAC Ratio</h5>
      <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${result.ltvToCacRatio.toFixed(2)}:1</p>
      <p class="text-xs text-blue-700 dark:text-blue-300 mt-1">Target: 3:1 or better</p>
    </div>
    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-green-900 dark:text-green-100">Customer LTV</h5>
      <p class="text-2xl font-bold text-green-600 dark:text-green-400">${formatCurrency(result.ltv)}</p>
      <p class="text-xs text-green-700 dark:text-green-300 mt-1">Lifetime value per customer</p>
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-purple-900 dark:text-purple-100">CAC</h5>
      <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">${formatCurrency(result.cac)}</p>
      <p class="text-xs text-purple-700 dark:text-purple-300 mt-1">Customer acquisition cost</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-orange-900 dark:text-orange-100">Payback Period</h5>
      <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">${result.paybackPeriodMonths.toFixed(1)} mo</p>
      <p class="text-xs text-orange-700 dark:text-orange-300 mt-1">Months to recover CAC</p>
    </div>
    <div class="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-pink-900 dark:text-pink-100">Monthly Churn</h5>
      <p class="text-2xl font-bold text-pink-600 dark:text-pink-400">${result.churnRate.toFixed(1)}%</p>
      <p class="text-xs text-pink-700 dark:text-pink-300 mt-1">Target: <5%</p>
    </div>
    <div class="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-indigo-900 dark:text-indigo-100">Gross Margin</h5>
      <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">${result.grossMarginPercent.toFixed(1)}%</p>
      <p class="text-xs text-indigo-700 dark:text-indigo-300 mt-1">Target: 70%+</p>
    </div>
  `;
  
  // Overall health indicator
  const healthColors = {
    excellent: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700',
    good: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700',
    'needs-improvement': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700',
    critical: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700',
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
        ${result.summary.monthsToPositiveCashFlow < 999 
          ? `Break-even occurs at month ${result.summary.monthsToPositiveCashFlow}.`
          : 'Current metrics do not reach break-even in 24 months.'}
      </p>
    </div>
    
    <!-- Key Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <!-- LTV Details -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h4 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Lifetime Value (LTV)</h4>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Customer Lifetime Value</span>
            <strong class="text-gray-900 dark:text-white">${formatCurrency(result.ltv)}</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Customer Lifespan</span>
            <strong class="text-gray-900 dark:text-white">${result.customerLifespanMonths.toFixed(1)} months</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Contribution Margin/Month</span>
            <strong class="text-gray-900 dark:text-white">${formatCurrency(result.contributionMarginPerCustomer)}</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Annualized Value</span>
            <strong class="text-gray-900 dark:text-white">${formatCurrency(result.summary.annualizedCustomerValue)}</strong>
          </div>
        </div>
      </div>
      
      <!-- CAC & Efficiency -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h4 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Acquisition Efficiency</h4>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Customer Acquisition Cost</span>
            <strong class="text-gray-900 dark:text-white">${formatCurrency(result.cac)}</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">LTV:CAC Ratio</span>
            <strong class="text-gray-900 dark:text-white">${result.ltvToCacRatio.toFixed(2)}:1</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Payback Period</span>
            <strong class="text-gray-900 dark:text-white">${result.paybackPeriodMonths.toFixed(1)} months</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Profit Per Customer</span>
            <strong class="${result.summary.profitPerCustomer >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">${formatCurrency(result.summary.profitPerCustomer)}</strong>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Retention Metrics -->
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
      <h4 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Retention & Revenue</h4>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Retention Rate</p>
          <p class="text-xl font-bold text-gray-900 dark:text-white">${result.retentionRate.toFixed(1)}%</p>
        </div>
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Monthly Churn</p>
          <p class="text-xl font-bold text-gray-900 dark:text-white">${result.churnRate.toFixed(1)}%</p>
        </div>
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">MRR</p>
          <p class="text-xl font-bold text-gray-900 dark:text-white">${formatCurrency(result.monthlyRecurringRevenue)}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">ARR</p>
          <p class="text-xl font-bold text-gray-900 dark:text-white">${formatCurrency(result.annualRecurringRevenue)}</p>
        </div>
      </div>
    </div>
    
    <!-- Benchmarks -->
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
      <h4 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Benchmark Comparison</h4>
      <div class="space-y-4">
        ${renderBenchmark('LTV:CAC Ratio', result.benchmarks.ltvCacRatio)}
        ${renderBenchmark('Payback Period (months)', result.benchmarks.payback)}
        ${renderBenchmark('Monthly Churn %', result.benchmarks.churn)}
        ${renderBenchmark('Gross Margin %', result.benchmarks.grossMargin)}
      </div>
    </div>
    
    <!-- Cohort Analysis -->
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
      <h4 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Cohort Analysis (24 Months)</h4>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th class="text-left py-2 px-3 text-gray-700 dark:text-gray-300">Month</th>
              <th class="text-right py-2 px-3 text-gray-700 dark:text-gray-300">Customers</th>
              <th class="text-right py-2 px-3 text-gray-700 dark:text-gray-300">Cum. Revenue</th>
              <th class="text-right py-2 px-3 text-gray-700 dark:text-gray-300">Cum. Costs</th>
              <th class="text-right py-2 px-3 text-gray-700 dark:text-gray-300">Cum. Profit</th>
              <th class="text-right py-2 px-3 text-gray-700 dark:text-gray-300">LTV</th>
            </tr>
          </thead>
          <tbody>
            ${result.cohortAnalysis.slice(0, 24).map((cohort: CohortAnalysisRow) => `
              <tr class="border-b border-gray-100 dark:border-gray-800 ${cohort.cumulativeProfit >= 0 ? 'bg-green-50 dark:bg-green-900/10' : ''}">
                <td class="py-2 px-3 text-gray-900 dark:text-white">${cohort.month}</td>
                <td class="text-right py-2 px-3 text-gray-700 dark:text-gray-300">${cohort.customersRemaining.toFixed(1)}</td>
                <td class="text-right py-2 px-3 text-gray-700 dark:text-gray-300">${formatCurrency(cohort.cumulativeRevenue)}</td>
                <td class="text-right py-2 px-3 text-gray-700 dark:text-gray-300">${formatCurrency(cohort.cumulativeCosts)}</td>
                <td class="text-right py-2 px-3 ${cohort.cumulativeProfit >= 0 ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-600 dark:text-red-400'}">${formatCurrency(cohort.cumulativeProfit)}</td>
                <td class="text-right py-2 px-3 text-gray-700 dark:text-gray-300">${formatCurrency(cohort.lifetimeValue)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-4">
        💡 Cohort starts with 100 customers. Green rows indicate cumulative profitability.
      </p>
    </div>
    
    <!-- Insights -->
    ${result.insights.length > 0 ? `
      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-6">
        <h4 class="text-lg font-semibold mb-4 text-blue-900 dark:text-blue-100">📊 Key Insights</h4>
        <ul class="space-y-2">
          ${result.insights.map((insight: string) => `
            <li class="text-gray-700 dark:text-gray-300">${insight}</li>
          `).join('')}
        </ul>
      </div>
    ` : ''}
    
    <!-- Warnings -->
    ${result.warnings.length > 0 ? `
      <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 mb-6 border-l-4 border-red-500">
        <h4 class="text-lg font-semibold mb-4 text-red-900 dark:text-red-100">⚠️ Warnings</h4>
        <ul class="space-y-2">
          ${result.warnings.map((warning: string) => `
            <li class="text-red-700 dark:text-red-300">${warning}</li>
          `).join('')}
        </ul>
      </div>
    ` : ''}
    
    <!-- Recommendations -->
    ${result.recommendations.length > 0 ? `
      <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
        <h4 class="text-lg font-semibold mb-4 text-green-900 dark:text-green-100">💡 Recommendations</h4>
        <ul class="space-y-2">
          ${result.recommendations.map((rec: string) => `
            <li class="text-gray-700 dark:text-gray-300">${rec}</li>
          `).join('')}
        </ul>
      </div>
    ` : ''}
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
    good: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
    poor: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
  };
  
  const statusIcons = {
    good: '✅',
    warning: '⚠️',
    poor: '🚨',
  };
  
  return `
    <div class="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <span class="text-gray-700 dark:text-gray-300">${label}</span>
      <div class="flex items-center gap-4">
        <div class="text-right">
          <p class="text-sm text-gray-600 dark:text-gray-400">Your: ${benchmark.your.toFixed(1)}</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">Target: ${benchmark.target.toFixed(1)}</p>
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
      storeAnalysisResult('unit-economics', result);
      
      // Display results
      displayResults(result);
      
    } catch (error) {
      console.error('Unit economics calculation error:', error);
      if (errorState && errorMessage) {
        errorState.classList.remove('hidden');
        errorMessage.textContent = error instanceof Error ? error.message : 'An error occurred during calculation';
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
    if (window.location.pathname.includes('/unit-economics') || 
        window.location.pathname.includes('/calculator/unit-economics')) {
      initUnitEconomicsCalculator();
    }
  });
}
