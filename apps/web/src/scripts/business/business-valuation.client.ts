/**
 * Business Valuation Calculator - Client Side
 *
 * Simple business valuation using industry multiples and rule-of-thumb methods
 */

import type { BusinessValuationInput, BusinessValuationResult } from '@financial-analysis/analysis';
import { BusinessValuationEngine } from '@financial-analysis/analysis';
import { formatCurrency, parseNumber } from '../../utils/calculator-utilities';
import { storeAnalysisResult } from '../analysis/analysis-results';
import { renderMetricCards } from '../_shared/metric-card-html';
import { registerChatButton } from '../chat/chat-actions';

type BusinessValuationMethod = BusinessValuationResult['methods'][number];
type BusinessValuationAdjustment = BusinessValuationResult['adjustments'][number];

/**
 * Parse form data into BusinessValuationInput
 */
export const parseBusinessValuationInput = (formData: FormData): BusinessValuationInput => {
  const industry = (formData.get('industry') as string) || 'other';
  const businessAge = parseNumber(formData.get('businessAge'));
  const annualRevenue = parseNumber(formData.get('annualRevenue'));
  const annualEbitda = parseNumber(formData.get('annualEbitda'));
  const annualNetIncome = parseNumber(formData.get('annualNetIncome'));
  const totalAssets = parseNumber(formData.get('totalAssets'));
  const totalLiabilities = parseNumber(formData.get('totalLiabilities'));
  const revenueGrowthRate = parseNumber(formData.get('revenueGrowthRate'));

  // Optional fields
  const inventoryValue = parseNumber(formData.get('inventoryValue')) || undefined;
  const equipmentValue = parseNumber(formData.get('equipmentValue')) || undefined;
  const customerCount = parseNumber(formData.get('customerCount')) || undefined;
  const customerConcentration = parseNumber(formData.get('customerConcentration')) || undefined;
  const ownerDependency =
    (formData.get('ownerDependency') as 'low' | 'medium' | 'high') || undefined;
  const hasRecurringRevenue = formData.get('hasRecurringRevenue') === 'on';
  const hasDocumentedProcesses = formData.get('hasDocumentedProcesses') === 'on';

  // Validation
  if (businessAge === null || businessAge < 0) {
    throw new Error('Please enter a valid business age');
  }
  if (annualRevenue === null || annualRevenue < 0) {
    throw new Error('Please enter a valid annual revenue');
  }
  if (annualEbitda === null) {
    throw new Error('Please enter annual EBITDA (can be negative)');
  }
  if (annualNetIncome === null) {
    throw new Error('Please enter annual net income (can be negative)');
  }
  if (totalAssets === null || totalAssets < 0) {
    throw new Error('Please enter valid total assets');
  }
  if (totalLiabilities === null || totalLiabilities < 0) {
    throw new Error('Please enter valid total liabilities');
  }
  if (revenueGrowthRate === null) {
    throw new Error('Please enter revenue growth rate (can be negative)');
  }

  return {
    industry,
    businessAge,
    annualRevenue,
    annualEbitda,
    annualNetIncome,
    totalAssets,
    totalLiabilities,
    revenueGrowthRate,
    inventoryValue,
    equipmentValue,
    customerCount,
    customerConcentration,
    ownerDependency,
    hasRecurringRevenue,
    hasDocumentedProcesses,
  };
};

/**
 * Display business valuation results
 */
export const displayResults = (result: BusinessValuationResult): void => {
  const resultsContainer = document.getElementById('results-container');
  const summaryCards = document.getElementById('summary-cards');

  if (!resultsContainer || !summaryCards) return;

  // Show results
  const resultsSection = document.getElementById('results-section');
  resultsSection?.classList.remove('hidden');

  // Populate summary cards
  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Estimated Business Value',
      value: formatCurrency(result.valuationMid),
      meta: `Range: ${result.summary.valuationRange} · ${result.summary.confidenceLevel.toUpperCase()} confidence`,
      tone: 'primary',
      spanCols: 2,
    },
    {
      title: 'Low Estimate',
      value: formatCurrency(result.valuationLow),
      meta: 'Conservative scenario',
      tone: 'emerald',
    },
    {
      title: 'High Estimate',
      value: formatCurrency(result.valuationHigh),
      meta: 'Optimistic scenario',
      tone: 'violet',
    },
  ]);

  // Build detailed results
  resultsContainer.innerHTML = `
    <!-- Valuation Methods -->
    <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg p-6 border border-slate-200 dark:border-slate-800 mb-6">
      <h4 class="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Valuation Methods Used</h4>
      <p class="fa-script-copy-muted mb-4">
        Primary method: <strong>${result.summary.mostRelevantMethod}</strong>
      </p>
      <div class="space-y-4">
        ${result.methods
          .map(
            (method: BusinessValuationMethod) => `
          <div class="border-l-4 ${method.confidence === 'high' ? 'border-emerald-500' : method.confidence === 'medium' ? 'border-yellow-500' : 'border-slate-400'} pl-4">
            <div class="flex justify-between items-start mb-1">
              <h5 class="font-semibold text-slate-900 dark:text-white">${method.name}</h5>
              <span class="text-lg font-bold text-slate-900 dark:text-white">${formatCurrency(method.value)}</span>
            </div>
            <p class="fa-script-copy-muted">${method.explanation}</p>
            <div class="flex items-center gap-4 mt-2">
              <span class="fa-script-note">Weight: ${(method.weight * 100).toFixed(0)}%</span>
              <span class="text-xs px-2 py-0.5 rounded ${
                method.confidence === 'high'
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  : method.confidence === 'medium'
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                    : 'bg-slate-100 dark:bg-slate-700 fa-copy-muted'
              }">
                ${method.confidence.toUpperCase()} confidence
              </span>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
    
    <!-- Multiples Applied -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      ${
        result.ebitdaMultiple > 0
          ? `
        <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
          <h5 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">EBITDA Multiple</h5>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">${result.ebitdaMultiple.toFixed(2)}x</p>
        </div>
      `
          : ''
      }
      ${
        result.revenueMultiple > 0
          ? `
        <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
          <h5 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Revenue Multiple</h5>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">${result.revenueMultiple.toFixed(2)}x</p>
        </div>
      `
          : ''
      }
      ${
        result.sdeMultiple > 0
          ? `
        <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
          <h5 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">SDE Multiple</h5>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">${result.sdeMultiple.toFixed(2)}x</p>
        </div>
      `
          : ''
      }
    </div>
    
    <!-- Adjustment Factors -->
    ${
      result.adjustments.length > 0
        ? `
      <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg p-6 border border-slate-200 dark:border-slate-800 mb-6">
        <h4 class="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Valuation Adjustments</h4>
        <div class="space-y-3">
          ${result.adjustments
            .map(
              (adj: BusinessValuationAdjustment) => `
            <div class="flex items-start justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
              <div class="flex-1">
                <h5 class="font-medium text-slate-900 dark:text-white ${
                  adj.impact === 'positive'
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : adj.impact === 'negative'
                      ? 'text-rose-700 dark:text-rose-300'
                      : 'text-slate-700 dark:text-slate-300'
                }">
                  ${adj.impact === 'positive' ? '✅' : adj.impact === 'negative' ? '⚠️' : 'ℹ️'} ${adj.name}
                </h5>
                <p class="fa-script-copy-muted mt-1">${adj.description}</p>
              </div>
              <span class="ml-4 px-3 py-1 rounded-full text-sm font-semibold ${
                adj.impact === 'positive'
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  : adj.impact === 'negative'
                    ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
                    : 'bg-slate-100 dark:bg-slate-700 fa-copy-muted'
              }">
                ${adj.adjustmentPercent > 0 ? '+' : ''}${adj.adjustmentPercent.toFixed(0)}%
              </span>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `
        : ''
    }
    
    <!-- Insights -->
    ${
      result.insights.length > 0
        ? `
      <div class="fa-highlight-card mb-6">
        <h4 class="fa-script-title text-lg mb-4">📊 Key Insights</h4>
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
        <h4 class="text-lg font-semibold mb-4 text-rose-900 dark:text-rose-100">⚠️ Important Considerations</h4>
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
      <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-6 mb-6">
        <h4 class="text-lg font-semibold mb-4 text-emerald-900 dark:text-emerald-100">💡 Ways to Increase Value</h4>
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
    
    <!-- Disclaimer -->
    <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
      <p class="text-sm text-yellow-800 dark:text-yellow-200">
        <strong>Important:</strong> This is a rough estimate based on industry multiples and rule-of-thumb methods. 
        Actual business value depends on many factors including market conditions, buyer motivations, due diligence findings, 
        and negotiation. Consult with a professional business appraiser or M&A advisor for a formal valuation.
      </p>
    </div>
  `;

  // Scroll to results
  resultsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/**
 * Initialize the calculator
 */
export const initBusinessValuationCalculator = (): void => {
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
      const input = parseBusinessValuationInput(formData);
      const result = BusinessValuationEngine.analyze(input);

      // Store result for AI assistant
      storeAnalysisResult('analyze_business_valuation', result);

      // Display results
      displayResults(result);
    } catch (error) {
      console.error('Business valuation calculation error:', error);
      if (errorState && errorMessage) {
        errorState.classList.remove('hidden');
        errorMessage.textContent =
          error instanceof Error ? error.message : 'An error occurred during calculation';
      }
    } finally {
      // Re-enable button
      if (calculateBtn) {
        calculateBtn.disabled = false;
        calculateBtn.textContent = 'Calculate Value';
      }
    }
  });

  // Register chat button for AI analysis
  registerChatButton('#business-valuation-chat-button', 'Business Valuation Calculator');
};

// Auto-initialize if on business valuation page
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (
      window.location.pathname.includes('/business-valuation') ||
      window.location.pathname.includes('/calculator/business-valuation')
    ) {
      initBusinessValuationCalculator();
    }
  });
}
