/**
 * Business Valuation Calculator - Client Side
 * 
 * Simple business valuation using industry multiples and rule-of-thumb methods
 */

import type { BusinessValuationInput, BusinessValuationResult } from '@financial-analysis/analysis';
import { BusinessValuationEngine } from '@financial-analysis/analysis';
import { formatCurrency, parseNumber } from '../../utils/calculator-utilities';
import { storeAnalysisResult } from '../analysis/analysis-results';
import { registerChatButton } from '../chat/chat-actions';

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
  const ownerDependency = (formData.get('ownerDependency') as 'low' | 'medium' | 'high') || undefined;
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
  summaryCards.innerHTML = `
    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 col-span-2">
      <h5 class="text-sm font-medium text-blue-900 dark:text-blue-100">Estimated Business Value</h5>
      <p class="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">${formatCurrency(result.valuationMid)}</p>
      <p class="text-xs text-blue-700 dark:text-blue-300 mt-2">Range: ${result.summary.valuationRange}</p>
      <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">Confidence: ${result.summary.confidenceLevel.toUpperCase()}</p>
    </div>
    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-green-900 dark:text-green-100">Low Estimate</h5>
      <p class="text-2xl font-bold text-green-600 dark:text-green-400">${formatCurrency(result.valuationLow)}</p>
      <p class="text-xs text-green-700 dark:text-green-300 mt-1">Conservative scenario</p>
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-purple-900 dark:text-purple-100">High Estimate</h5>
      <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">${formatCurrency(result.valuationHigh)}</p>
      <p class="text-xs text-purple-700 dark:text-purple-300 mt-1">Optimistic scenario</p>
    </div>
  `;
  
  // Build detailed results
  resultsContainer.innerHTML = `
    <!-- Valuation Methods -->
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
      <h4 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Valuation Methods Used</h4>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Primary method: <strong>${result.summary.mostRelevantMethod}</strong>
      </p>
      <div class="space-y-4">
        ${result.methods.map(method => `
          <div class="border-l-4 ${method.confidence === 'high' ? 'border-green-500' : method.confidence === 'medium' ? 'border-yellow-500' : 'border-gray-400'} pl-4">
            <div class="flex justify-between items-start mb-1">
              <h5 class="font-semibold text-gray-900 dark:text-white">${method.name}</h5>
              <span class="text-lg font-bold text-gray-900 dark:text-white">${formatCurrency(method.value)}</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">${method.explanation}</p>
            <div class="flex items-center gap-4 mt-2">
              <span class="text-xs text-gray-500 dark:text-gray-400">Weight: ${(method.weight * 100).toFixed(0)}%</span>
              <span class="text-xs px-2 py-0.5 rounded ${
                method.confidence === 'high' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                method.confidence === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }">
                ${method.confidence.toUpperCase()} confidence
              </span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    
    <!-- Multiples Applied -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      ${result.ebitdaMultiple > 0 ? `
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">EBITDA Multiple</h5>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">${result.ebitdaMultiple.toFixed(2)}x</p>
        </div>
      ` : ''}
      ${result.revenueMultiple > 0 ? `
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Revenue Multiple</h5>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">${result.revenueMultiple.toFixed(2)}x</p>
        </div>
      ` : ''}
      ${result.sdeMultiple > 0 ? `
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SDE Multiple</h5>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">${result.sdeMultiple.toFixed(2)}x</p>
        </div>
      ` : ''}
    </div>
    
    <!-- Adjustment Factors -->
    ${result.adjustments.length > 0 ? `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <h4 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Valuation Adjustments</h4>
        <div class="space-y-3">
          ${result.adjustments.map(adj => `
            <div class="flex items-start justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <div class="flex-1">
                <h5 class="font-medium text-gray-900 dark:text-white ${
                  adj.impact === 'positive' ? 'text-green-700 dark:text-green-300' :
                  adj.impact === 'negative' ? 'text-red-700 dark:text-red-300' :
                  'text-gray-700 dark:text-gray-300'
                }">
                  ${adj.impact === 'positive' ? '✅' : adj.impact === 'negative' ? '⚠️' : 'ℹ️'} ${adj.name}
                </h5>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${adj.description}</p>
              </div>
              <span class="ml-4 px-3 py-1 rounded-full text-sm font-semibold ${
                adj.impact === 'positive' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                adj.impact === 'negative' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }">
                ${adj.adjustmentPercent > 0 ? '+' : ''}${adj.adjustmentPercent.toFixed(0)}%
              </span>
            </div>
          `).join('')}
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
    
    <!-- Warnings -->
    ${result.warnings.length > 0 ? `
      <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 mb-6 border-l-4 border-red-500">
        <h4 class="text-lg font-semibold mb-4 text-red-900 dark:text-red-100">⚠️ Important Considerations</h4>
        <ul class="space-y-2">
          ${result.warnings.map(warning => `
            <li class="text-red-700 dark:text-red-300">${warning}</li>
          `).join('')}
        </ul>
      </div>
    ` : ''}
    
    <!-- Recommendations -->
    ${result.recommendations.length > 0 ? `
      <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 mb-6">
        <h4 class="text-lg font-semibold mb-4 text-green-900 dark:text-green-100">💡 Ways to Increase Value</h4>
        <ul class="space-y-2">
          ${result.recommendations.map(rec => `
            <li class="text-gray-700 dark:text-gray-300">${rec}</li>
          `).join('')}
        </ul>
      </div>
    ` : ''}
    
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
      storeAnalysisResult('business-valuation', result);
      
      // Display results
      displayResults(result);
      
    } catch (error) {
      console.error('Business valuation calculation error:', error);
      if (errorState && errorMessage) {
        errorState.classList.remove('hidden');
        errorMessage.textContent = error instanceof Error ? error.message : 'An error occurred during calculation';
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
    if (window.location.pathname.includes('/business-valuation') || 
        window.location.pathname.includes('/calculator/business-valuation')) {
      initBusinessValuationCalculator();
    }
  });
}

