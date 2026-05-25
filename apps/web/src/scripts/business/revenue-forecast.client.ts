/**
 * Revenue Forecast Calculator - Client Side
 *
 * Projects future revenue using growth rates, seasonality, and customer-based models
 */

import type {
  RevenueForecastInput,
  RevenueForecastResult,
  RevenueStream,
} from '@financial-analysis/analysis';
import { RevenueForecastEngine } from '@financial-analysis/analysis';
import { formatCurrency, parseNumber } from '../../utils/calculator-utilities';
import { storeAnalysisResult } from '../analysis/analysis-results';
import { renderMetricCards } from '../_shared/metric-card-html';
import { registerChatButton } from '../chat/chat-actions';

type RevenueForecastMonth = RevenueForecastResult['monthlyForecasts'][number];
type RevenueForecastStreamSummary = RevenueForecastResult['streamBreakdown'][number];

/**
 * Collect revenue streams from form
 */
export const collectRevenueStreams = (formData: FormData, maxStreams: number): RevenueStream[] => {
  const streams: RevenueStream[] = [];

  for (let i = 0; i < maxStreams; i++) {
    const name = formData.get(`stream-name-${i}`) as string;
    const currentMonthlyRevenue = parseNumber(formData.get(`stream-revenue-${i}`));
    const growthRate = parseNumber(formData.get(`stream-growth-${i}`));
    const seasonality = formData.get(`stream-seasonality-${i}`) as
      | 'none'
      | 'retail'
      | 'b2b'
      | 'custom';

    if (
      name &&
      currentMonthlyRevenue !== null &&
      currentMonthlyRevenue > 0 &&
      growthRate !== null
    ) {
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
  const averageRevenuePerCustomer =
    parseNumber(formData.get('averageRevenuePerCustomer')) || undefined;
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
  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Total Forecast Revenue',
      value: formatCurrency(result.summary.totalForecastRevenue),
      meta: `Next ${result.monthlyForecasts.length} months`,
      tone: 'primary',
      spanCols: 2,
    },
    {
      title: 'Avg Monthly Revenue',
      value: formatCurrency(result.summary.averageMonthlyRevenue),
      meta: 'Mean per month',
      tone: 'emerald',
    },
    {
      title: 'Total Growth',
      value: `${result.summary.totalGrowth.toFixed(1)}%`,
      meta: `CMGR: ${result.summary.compoundMonthlyGrowthRate.toFixed(2)}%`,
      tone: 'violet',
    },
  ]);

  // Build detailed results
  resultsContainer.innerHTML = `
    <!-- Monthly Forecast Table -->
    <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg p-6 border border-slate-200 dark:border-slate-800 mb-6">
      <h4 class="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Monthly Revenue Forecast</h4>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b-2 border-slate-300 dark:border-slate-700">
              <th class="text-left py-2 px-3 text-slate-700 dark:text-slate-300">Month</th>
              ${Object.keys(result.monthlyForecasts[0].revenueByStream)
                .map(
                  (stream) => `
                <th class="text-right py-2 px-3 text-slate-700 dark:text-slate-300">${stream}</th>
              `
                )
                .join('')}
              <th class="text-right py-2 px-3 text-slate-900 dark:text-white font-semibold">Total</th>
              ${result.customerMetrics ? '<th class="text-right py-2 px-3 text-slate-700 dark:text-slate-300">Customers</th>' : ''}
              <th class="text-right py-2 px-3 text-slate-700 dark:text-slate-300">Growth</th>
            </tr>
          </thead>
          <tbody>
            ${result.monthlyForecasts
              .map(
                (month: RevenueForecastMonth) => `
              <tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td class="py-2 px-3 text-slate-900 dark:text-white font-medium">${month.month}. ${month.monthName}</td>
                ${Object.values(month.revenueByStream)
                  .map(
                    (rev) => `
                  <td class="text-right py-2 px-3 text-slate-700 dark:text-slate-300">${formatCurrency(typeof rev === 'number' ? rev : 0)}</td>
                `
                  )
                  .join('')}
                <td class="text-right py-2 px-3 text-slate-900 dark:text-white font-semibold">${formatCurrency(month.totalRevenue)}</td>
                ${month.customers !== undefined ? `<td class="text-right py-2 px-3 text-slate-700 dark:text-slate-300">${month.customers.toFixed(0)}</td>` : ''}
                <td class="text-right py-2 px-3 ${month.growthVsPreviousMonth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}">
                  ${month.growthVsPreviousMonth >= 0 ? '+' : ''}${month.growthVsPreviousMonth.toFixed(1)}%
                </td>
              </tr>
            `
              )
              .join('')}
            <tr class="border-t-2 border-slate-300 dark:border-slate-700 font-semibold">
              <td class="py-3 px-3 text-slate-900 dark:text-white">TOTAL</td>
              ${result.streamBreakdown
                .map(
                  (stream: RevenueForecastStreamSummary) => `
                <td class="text-right py-3 px-3 text-slate-900 dark:text-white">${formatCurrency(stream.totalRevenue)}</td>
              `
                )
                .join('')}
              <td class="text-right py-3 px-3 text-slate-900 dark:text-white text-lg">${formatCurrency(result.summary.totalForecastRevenue)}</td>
              ${result.customerMetrics ? `<td class="text-right py-3 px-3 text-slate-900 dark:text-white">${result.customerMetrics.endingCustomers.toFixed(0)}</td>` : ''}
              <td class="text-right py-3 px-3 text-slate-900 dark:text-white">${result.summary.totalGrowth.toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="fa-script-note mt-4">
        💡 Peak: ${result.summary.peakMonth.revenue.toFixed(0)} in month ${result.summary.peakMonth.month} | 
        Lowest: ${formatCurrency(result.summary.lowestMonth.revenue)} in month ${result.summary.lowestMonth.month}
      </p>
    </div>
    
    <!-- Stream Breakdown -->
    <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg p-6 border border-slate-200 dark:border-slate-800 mb-6">
      <h4 class="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Revenue Stream Breakdown</h4>
      <div class="space-y-4">
        ${result.streamBreakdown
          .map((stream: RevenueForecastStreamSummary) => {
            const widthPercent = Math.min(100, Math.max(10, stream.percentOfTotal));
            return `
            <div>
              <div class="flex justify-between mb-2">
                <span class="font-medium text-slate-900 dark:text-white">${stream.name}</span>
                <span class="text-slate-700 dark:text-slate-300">${formatCurrency(stream.totalRevenue)} (${stream.percentOfTotal.toFixed(1)}%)</span>
              </div>
              <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                <div class="bg-gradient-to-r from-violet-500 to-violet-500 h-3 rounded-full transition-all duration-500" style="width: ${widthPercent}%"></div>
              </div>
              <div class="flex justify-between mt-1 fa-script-note">
                <span>Avg: ${formatCurrency(stream.avgMonthlyRevenue)}/mo</span>
                <span class="${stream.growth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}">
                  ${stream.growth >= 0 ? '+' : ''}${stream.growth.toFixed(1)}% growth
                </span>
              </div>
            </div>
          `;
          })
          .join('')}
      </div>
    </div>
    
    <!-- Customer Metrics -->
    ${
      result.customerMetrics
        ? `
      <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg p-6 border border-slate-200 dark:border-slate-800 mb-6">
        <h4 class="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Customer Growth Analysis</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p class="fa-script-copy-muted">Ending Customers</p>
            <p class="text-2xl font-bold text-slate-900 dark:text-white">${result.customerMetrics.endingCustomers.toFixed(0)}</p>
          </div>
          <div>
            <p class="fa-script-copy-muted">Net Growth</p>
            <p class="text-2xl font-bold ${result.customerMetrics.netCustomerGrowth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}">
              ${result.customerMetrics.netCustomerGrowth >= 0 ? '+' : ''}${result.customerMetrics.netCustomerGrowth.toFixed(0)}
            </p>
          </div>
          <div>
            <p class="fa-script-copy-muted">Total Acquired</p>
            <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">+${result.customerMetrics.totalAcquired.toFixed(0)}</p>
          </div>
          <div>
            <p class="fa-script-copy-muted">Total Churned</p>
            <p class="text-2xl font-bold text-rose-600 dark:text-rose-400">-${result.customerMetrics.totalChurned.toFixed(0)}</p>
          </div>
        </div>
      </div>
    `
        : ''
    }
    
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
    
    <!-- Risks -->
    ${
      result.risks.length > 0
        ? `
      <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 mb-6 border-l-4 border-yellow-500">
        <h4 class="text-lg font-semibold mb-4 text-yellow-900 dark:text-yellow-100">⚠️ Risks & Considerations</h4>
        <ul class="space-y-2">
          ${result.risks
            .map(
              (risk: string) => `
            <li class="text-yellow-800 dark:text-yellow-200">${risk}</li>
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
        <h4 class="text-lg font-semibold mb-4 text-emerald-900 dark:text-emerald-100">💡 Growth Recommendations</h4>
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
      storeAnalysisResult('analyze_revenue_forecast', result);

      // Display results
      displayResults(result);
    } catch (error) {
      console.error('Revenue forecast calculation error:', error);
      if (errorState && errorMessage) {
        errorState.classList.remove('hidden');
        errorMessage.textContent =
          error instanceof Error ? error.message : 'An error occurred during calculation';
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

function renderRevenueStreamFields(streamIndex: number): string {
  return `
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-900/60/50 rounded-lg" id="stream-${streamIndex}">
      <div>
        <label class="fa-field-label mb-1">Stream Name</label>
        <input type="text" name="stream-name-${streamIndex}"
          class="fa-input-surface w-full"
          placeholder="e.g., Subscriptions" required>
      </div>
      <div>
        <label class="fa-field-label mb-1">Monthly Revenue</label>
        <input type="number" name="stream-revenue-${streamIndex}"
          class="fa-input-surface w-full"
          placeholder="10000" step="100" required>
      </div>
      <div>
        <label class="fa-field-label mb-1">Growth Rate (%)</label>
        <input type="number" name="stream-growth-${streamIndex}"
          class="fa-input-surface w-full"
          placeholder="15" step="1" value="10" required>
      </div>
      <div>
        <label class="fa-field-label mb-1">Seasonality</label>
        <select name="stream-seasonality-${streamIndex}" class="fa-input-surface w-full">
          <option value="none">None</option>
          <option value="retail">Retail (Q4 peak)</option>
          <option value="b2b">B2B (Summer low)</option>
        </select>
      </div>
    </div>
  `;
}

/**
 * Inject revenue stream UI when using the template calculator form.
 */
function ensureRevenueStreamsDom(): void {
  const form = document.getElementById('calculator-form');
  if (!form || document.getElementById('revenue-streams-container')) return;

  const buttonRow = form.querySelector('#calculate-btn')?.closest('.flex');
  const block = document.createElement('div');
  block.className = 'mb-6 space-y-4';
  block.innerHTML = `
    <div>
      <h2 class="fa-scenario-title mb-2">Revenue Streams</h2>
      <p class="fa-help-copy mb-4">Add at least one stream. You can model up to ten.</p>
      <div id="revenue-streams-container" class="space-y-4">
        ${renderRevenueStreamFields(0)}
      </div>
      <button type="button" id="add-stream-btn" class="fa-button-secondary mt-4">
        + Add Revenue Stream
      </button>
    </div>
  `;

  if (buttonRow) {
    form.insertBefore(block, buttonRow);
  } else {
    form.appendChild(block);
  }
}

/**
 * Setup dynamic revenue stream addition
 */
function setupDynamicStreams(): void {
  ensureRevenueStreamsDom();

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
    streamDiv.innerHTML = `${renderRevenueStreamFields(streamCount)}
      <div class="flex justify-end -mt-2 mb-2">
        <button type="button" data-remove-stream="stream-${streamCount}"
          class="text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300">
          Remove Stream
        </button>
      </div>`;
    const removeBtn = streamDiv.querySelector('[data-remove-stream]');
    removeBtn?.addEventListener('click', () => {
      document.getElementById(`stream-${streamCount}`)?.remove();
    });

    streamsContainer.appendChild(streamDiv);
    streamCount++;
  });
}

// Auto-initialize if on revenue forecast page
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (
      window.location.pathname.includes('/revenue-forecast') ||
      window.location.pathname.includes('/calculator/revenue-forecast')
    ) {
      initRevenueForecastCalculator();
    }
  });
}
