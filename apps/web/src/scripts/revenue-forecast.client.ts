/**
 * Revenue Forecast Calculator - Client Side
 * 
 * Projects future revenue using growth rates, seasonality, and customer-based models
 */

import type { RevenueForecastInput, RevenueForecastResult, RevenueStream } from '@financial-analysis/analysis';
import { RevenueForecastEngine } from '@financial-analysis/analysis';
import { formatCurrency, parseNumber } from '../utils/calculator-utilities';
import { storeAnalysisResult } from './analysis-results';
import { registerChatButton } from './chat-actions';

/**
 * Collect revenue streams from form
 */
export const collectRevenueStreams = (formData: FormData, maxStreams: number): RevenueStream[] => {
  const streams: RevenueStream[] = [];
  
  for (let i = 0; i < maxStreams; i++) {
    const name = formData.get(`stream-name-${i}`) as string;
    const currentMonthlyRevenue = parseNumber(formData.get(`stream-revenue-${i}`));
    const growthRate = parseNumber(formData.get(`stream-growth-${i}`));
    const seasonality = formData.get(`stream-seasonality-${i}`) as 'none' | 'retail' | 'b2b' | 'custom';
    
    if (name && currentMonthlyRevenue !== null && currentMonthlyRevenue > 0 && growthRate !== null) {
      streams.push({
        name,
        currentMonthlyRevenue,
        growthRate,
        seasonalityPattern: seasonality || 'none',
      });
    }
  }
  
  return streams;
};

/**
 * Parse form data into RevenueForecastInput
 */
export const parseRevenueForecastInput = (formData: FormData): RevenueForecastInput => {
  const forecastMonths = parseNumber(formData.get('forecastMonths')) || 12;
  const revenueStreams = collectRevenueStreams(formData, 10);
  
  // Optional customer-based inputs
  const existingCustomers = parseNumber(formData.get('existingCustomers')) || undefined;
  const averageRevenuePerCustomer = parseNumber(formData.get('averageRevenuePerCustomer')) || undefined;
  const monthlyChurnRate = parseNumber(formData.get('monthlyChurnRate')) || undefined;
  const newCustomersPerMonth = parseNumber(formData.get('newCustomersPerMonth')) || undefined;
  
  // Validation
  if (revenueStreams.length === 0) {
    throw new Error('Please add at least one revenue stream');
  }
  
  if (forecastMonths < 1 || forecastMonths > 36) {
    throw new Error('Forecast period must be between 1 and 36 months');
  }
  
  return {
    revenueStreams,
    forecastMonths,
    existingCustomers,
    averageRevenuePerCustomer,
    monthlyChurnRate,
    newCustomersPerMonth,
  };
};

/**
 * Display revenue forecast results
 */
export const displayResults = (result: RevenueForecastResult): void => {
  const resultsContainer = document.getElementById('results-container');
  const summaryCards = document.getElementById('summary-cards');
  
  if (!resultsContainer || !summaryCards) return;
  
  // Show results
  const resultsSection = document.getElementById('results-section');
  resultsSection?.classList.remove('hidden');
  
  // Populate summary cards
  summaryCards.innerHTML = `
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 col-span-2">
      <h5 class="text-sm font-medium text-blue-900 dark:text-blue-100">Total Forecast Revenue</h5>
      <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">${formatCurrency(result.summary.totalForecastRevenue)}</p>
      <p class="text-xs text-blue-700 dark:text-blue-300 mt-1">Next ${result.monthlyForecasts.length} months</p>
    </div>
    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-green-900 dark:text-green-100">Avg Monthly Revenue</h5>
      <p class="text-2xl font-bold text-green-600 dark:text-green-400">${formatCurrency(result.summary.averageMonthlyRevenue)}</p>
      <p class="text-xs text-green-700 dark:text-green-300 mt-1">Mean per month</p>
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-purple-900 dark:text-purple-100">Total Growth</h5>
      <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">${result.summary.totalGrowth.toFixed(1)}%</p>
      <p class="text-xs text-purple-700 dark:text-purple-300 mt-1">CMGR: ${result.summary.compoundMonthlyGrowthRate.toFixed(2)}%</p>
    </div>
  `;
  
  // Build detailed results
  resultsContainer.innerHTML = `
    <!-- Monthly Forecast Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
      <h4 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Monthly Revenue Forecast</h4>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b-2 border-gray-300 dark:border-gray-600">
              <th class="text-left py-2 px-3 text-gray-700 dark:text-gray-300">Month</th>
              ${Object.keys(result.monthlyForecasts[0].revenueByStream).map(stream => `
                <th class="text-right py-2 px-3 text-gray-700 dark:text-gray-300">${stream}</th>
              `).join('')}
              <th class="text-right py-2 px-3 text-gray-900 dark:text-white font-semibold">Total</th>
              ${result.customerMetrics ? '<th class="text-right py-2 px-3 text-gray-700 dark:text-gray-300">Customers</th>' : ''}
              <th class="text-right py-2 px-3 text-gray-700 dark:text-gray-300">Growth</th>
            </tr>
          </thead>
          <tbody>
            ${result.monthlyForecasts.map((month) => `
              <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td class="py-2 px-3 text-gray-900 dark:text-white font-medium">${month.month}. ${month.monthName}</td>
                ${Object.values(month.revenueByStream).map(rev => `
                  <td class="text-right py-2 px-3 text-gray-700 dark:text-gray-300">${formatCurrency(rev)}</td>
                `).join('')}
                <td class="text-right py-2 px-3 text-gray-900 dark:text-white font-semibold">${formatCurrency(month.totalRevenue)}</td>
                ${month.customers !== undefined ? `<td class="text-right py-2 px-3 text-gray-700 dark:text-gray-300">${month.customers.toFixed(0)}</td>` : ''}
                <td class="text-right py-2 px-3 ${month.growthVsPreviousMonth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
                  ${month.growthVsPreviousMonth >= 0 ? '+' : ''}${month.growthVsPreviousMonth.toFixed(1)}%
                </td>
              </tr>
            `).join('')}
            <tr class="border-t-2 border-gray-300 dark:border-gray-600 font-semibold">
              <td class="py-3 px-3 text-gray-900 dark:text-white">TOTAL</td>
              ${result.streamBreakdown.map(stream => `
                <td class="text-right py-3 px-3 text-gray-900 dark:text-white">${formatCurrency(stream.totalRevenue)}</td>
              `).join('')}
              <td class="text-right py-3 px-3 text-gray-900 dark:text-white text-lg">${formatCurrency(result.summary.totalForecastRevenue)}</td>
              ${result.customerMetrics ? `<td class="text-right py-3 px-3 text-gray-900 dark:text-white">${result.customerMetrics.endingCustomers.toFixed(0)}</td>` : ''}
              <td class="text-right py-3 px-3 text-gray-900 dark:text-white">${result.summary.totalGrowth.toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-4">
        💡 Peak: ${result.summary.peakMonth.revenue.toFixed(0)} in month ${result.summary.peakMonth.month} | 
        Lowest: ${formatCurrency(result.summary.lowestMonth.revenue)} in month ${result.summary.lowestMonth.month}
      </p>
    </div>
    
    <!-- Stream Breakdown -->
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
      <h4 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Revenue Stream Breakdown</h4>
      <div class="space-y-4">
        ${result.streamBreakdown.map(stream => {
          const widthPercent = Math.min(100, Math.max(10, stream.percentOfTotal));
          return `
            <div>
              <div class="flex justify-between mb-2">
                <span class="font-medium text-gray-900 dark:text-white">${stream.name}</span>
                <span class="text-gray-700 dark:text-gray-300">${formatCurrency(stream.totalRevenue)} (${stream.percentOfTotal.toFixed(1)}%)</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div class="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500" style="width: ${widthPercent}%"></div>
              </div>
              <div class="flex justify-between mt-1 text-xs text-gray-600 dark:text-gray-400">
                <span>Avg: ${formatCurrency(stream.avgMonthlyRevenue)}/mo</span>
                <span class="${stream.growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
                  ${stream.growth >= 0 ? '+' : ''}${stream.growth.toFixed(1)}% growth
                </span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    
    <!-- Customer Metrics -->
    ${result.customerMetrics ? `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <h4 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Customer Growth Analysis</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Ending Customers</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">${result.customerMetrics.endingCustomers.toFixed(0)}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Net Growth</p>
            <p class="text-2xl font-bold ${result.customerMetrics.netCustomerGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
              ${result.customerMetrics.netCustomerGrowth >= 0 ? '+' : ''}${result.customerMetrics.netCustomerGrowth.toFixed(0)}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Total Acquired</p>
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">+${result.customerMetrics.totalAcquired.toFixed(0)}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Total Churned</p>
            <p class="text-2xl font-bold text-red-600 dark:text-red-400">-${result.customerMetrics.totalChurned.toFixed(0)}</p>
          </div>
        </div>
      </div>
    ` : ''}
    
    <!-- Insights -->
    ${result.insights.length > 0 ? `
      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-6">
        <h4 class="text-lg font-semibold mb-4 text-blue-900 dark:text-blue-100">📊 Key Insights</h4>
        <ul class="space-y-2">
          ${result.insights.map(insight => `
            <li class="text-gray-700 dark:text-gray-300">${insight}</li>
          `).join('')}
        </ul>
      </div>
    ` : ''}
    
    <!-- Risks -->
    ${result.risks.length > 0 ? `
      <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 mb-6 border-l-4 border-yellow-500">
        <h4 class="text-lg font-semibold mb-4 text-yellow-900 dark:text-yellow-100">⚠️ Risks & Considerations</h4>
        <ul class="space-y-2">
          ${result.risks.map(risk => `
            <li class="text-yellow-800 dark:text-yellow-200">${risk}</li>
          `).join('')}
        </ul>
      </div>
    ` : ''}
    
    <!-- Recommendations -->
    ${result.recommendations.length > 0 ? `
      <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
        <h4 class="text-lg font-semibold mb-4 text-green-900 dark:text-green-100">💡 Growth Recommendations</h4>
        <ul class="space-y-2">
          ${result.recommendations.map(rec => `
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
 * Initialize the calculator
 */
export const initRevenueForecastCalculator = (): void => {
  const form = document.getElementById('calculator-form') as HTMLFormElement;
  if (!form) return;
  
  // Setup dynamic stream addition
  setupDynamicStreams();
  
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
        calculateBtn.textContent = 'Forecasting...';
      }
      
      const formData = new FormData(form);
      const input = parseRevenueForecastInput(formData);
      const result = RevenueForecastEngine.analyze(input);
      
      // Store result for AI assistant
      storeAnalysisResult('revenue-forecast', result);
      
      // Display results
      displayResults(result);
      
    } catch (error) {
      console.error('Revenue forecast calculation error:', error);
      if (errorState && errorMessage) {
        errorState.classList.remove('hidden');
        errorMessage.textContent = error instanceof Error ? error.message : 'An error occurred during calculation';
      }
    } finally {
      // Re-enable button
      if (calculateBtn) {
        calculateBtn.disabled = false;
        calculateBtn.textContent = 'Generate Forecast';
      }
    }
  });
  
  // Register chat button for AI analysis
  registerChatButton('#revenue-forecast-chat-button', 'Revenue Forecast Calculator');
};

/**
 * Setup dynamic revenue stream addition
 */
function setupDynamicStreams(): void {
  const addStreamBtn = document.getElementById('add-stream-btn');
  const streamsContainer = document.getElementById('revenue-streams-container');
  
  if (!addStreamBtn || !streamsContainer) return;
  
  let streamCount = 1;
  
  addStreamBtn.addEventListener('click', () => {
    if (streamCount >= 10) {
      alert('Maximum 10 revenue streams allowed');
      return;
    }
    
    const streamDiv = document.createElement('div');
    streamDiv.className = 'grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg';
    streamDiv.id = `stream-${streamCount}`;
    
    streamDiv.innerHTML = `
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Stream Name
        </label>
        <input type="text" name="stream-name-${streamCount}" 
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
          placeholder="e.g., Subscriptions" required>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Monthly Revenue
        </label>
        <input type="number" name="stream-revenue-${streamCount}" 
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
          placeholder="10000" step="100" required>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Growth Rate (%)
        </label>
        <input type="number" name="stream-growth-${streamCount}" 
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
          placeholder="15" step="1" value="10" required>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Seasonality
        </label>
        <select name="stream-seasonality-${streamCount}"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white">
          <option value="none">None</option>
          <option value="retail">Retail (Q4 peak)</option>
          <option value="b2b">B2B (Summer low)</option>
        </select>
      </div>
      <div class="md:col-span-4 flex justify-end">
        <button type="button" onclick="document.getElementById('stream-${streamCount}')?.remove()"
          class="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
          Remove Stream
        </button>
      </div>
    `;
    
    streamsContainer.appendChild(streamDiv);
    streamCount++;
  });
}

// Auto-initialize if on revenue forecast page
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('/revenue-forecast') || 
        window.location.pathname.includes('/calculator/revenue-forecast')) {
      initRevenueForecastCalculator();
    }
  });
}

