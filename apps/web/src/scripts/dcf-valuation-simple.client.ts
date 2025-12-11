/**
 * Simplified DCF Valuation Calculator Client Script
 *
 * This is a simplified version that works with the generic IndividualCalculatorPage.astro structure
 */

import { storeAnalysisResult } from './analysis-results';
import { registerChatButton } from './chat-actions';
import {
  formatCurrencyWhole as formatCurrency,
  formatPercentSimple as formatPercent,
} from '../utils/calculator-utilities';

interface DCFInputs {
  revenue: number;
  revenueGrowth: number;
  ebitdaMargin: number;
  taxRate: number;
  capex: number;
  workingCapitalChange: number;
  terminalGrowthRate: number;
  discountRate: number;
  projectionYears: number;
  sharesOutstanding: number;
}

interface DCFResults {
  enterpriseValue: number;
  equityValue: number;
  sharePrice: number;
  sharesOutstanding: number;
  wacc: number;
  terminalValue: number;
  presentValue: number;
  cashFlowProjections: Array<{
    year: number;
    revenue: number;
    ebitda: number;
    freeCashFlow: number;
    presentValue: number;
  }>;
}

class SimpleDCFCalculator {
  calculate(inputs: DCFInputs): DCFResults {
    const {
      revenue,
      revenueGrowth,
      ebitdaMargin,
      taxRate,
      capex,
      workingCapitalChange,
      terminalGrowthRate,
      discountRate,
      projectionYears,
      sharesOutstanding,
    } = inputs;

    // Calculate cash flow projections
    const cashFlowProjections = [];
    let cumulativePresentValue = 0;

    for (let year = 1; year <= projectionYears; year++) {
      const projectedRevenue = revenue * Math.pow(1 + revenueGrowth / 100, year);
      const ebitda = projectedRevenue * (ebitdaMargin / 100);
      const ebit = ebitda; // Simplified - assuming no depreciation/amortization
      const taxes = ebit * (taxRate / 100);
      const nopat = ebit - taxes;
      const freeCashFlow = nopat - capex - workingCapitalChange;

      const presentValue = freeCashFlow / Math.pow(1 + discountRate / 100, year);
      cumulativePresentValue += presentValue;

      cashFlowProjections.push({
        year,
        revenue: projectedRevenue,
        ebitda,
        freeCashFlow,
        presentValue,
      });
    }

    // Calculate terminal value
    const finalYearCashFlow = cashFlowProjections[cashFlowProjections.length - 1].freeCashFlow;
    const terminalValue =
      (finalYearCashFlow * (1 + terminalGrowthRate / 100)) /
      (discountRate / 100 - terminalGrowthRate / 100);
    const terminalPresentValue = terminalValue / Math.pow(1 + discountRate / 100, projectionYears);

    // Calculate enterprise value
    const enterpriseValue = cumulativePresentValue + terminalPresentValue;
    const equityValue = enterpriseValue; // Simplified - assuming no debt
    const sharePrice = equityValue / sharesOutstanding;

    return {
      enterpriseValue,
      equityValue,
      sharePrice,
      sharesOutstanding,
      wacc: discountRate,
      terminalValue,
      presentValue: cumulativePresentValue,
      cashFlowProjections,
    };
  }
}

const displayResults = (result: DCFResults): void => {
  const resultsContainer = document.getElementById('results-container');
  const summaryCards = document.getElementById('summary-cards');

  if (!resultsContainer || !summaryCards) {
    console.error('Required DOM elements not found for DCF results');
    return;
  }

  // Render summary cards
  summaryCards.innerHTML = `
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-blue-900 dark:text-blue-100">Enterprise Value</h5>
      <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${formatCurrency(result.enterpriseValue)}</p>
    </div>
    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-green-900 dark:text-green-100">Equity Value</h5>
      <p class="text-2xl font-bold text-green-600 dark:text-green-400">${formatCurrency(result.equityValue)}</p>
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-purple-900 dark:text-purple-100">Share Price</h5>
      <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">${formatCurrency(result.sharePrice)}</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-orange-900 dark:text-orange-100">Terminal Value</h5>
      <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">${formatCurrency(result.terminalValue)}</p>
    </div>
  `;

  // Render detailed breakdown
  resultsContainer.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Valuation Summary</h3>
      
      <div class="space-y-4">
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Present Value of Cash Flows</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Discounted projected cash flows</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-gray-900 dark:text-white">${formatCurrency(result.presentValue)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Terminal Value</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Perpetual growth value</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-gray-900 dark:text-white">${formatCurrency(result.terminalValue)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Discount Rate (WACC)</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Weighted average cost of capital</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-gray-900 dark:text-white">${formatPercent(result.wacc)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Shares Outstanding</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Total number of shares</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-gray-900 dark:text-white">${result.sharesOutstanding.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Cash Flow Projections</h3>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Year</th>
              <th class="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Revenue</th>
              <th class="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">EBITDA</th>
              <th class="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Free Cash Flow</th>
              <th class="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Present Value</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            ${result.cashFlowProjections
              .map(
                (projection) => `
              <tr>
                <td class="px-3 py-3 text-sm text-gray-900 dark:text-white">${projection.year}</td>
                <td class="px-3 py-3 text-sm text-gray-900 dark:text-white text-right">${formatCurrency(projection.revenue)}</td>
                <td class="px-3 py-3 text-sm text-gray-900 dark:text-white text-right">${formatCurrency(projection.ebitda)}</td>
                <td class="px-3 py-3 text-sm text-gray-900 dark:text-white text-right">${formatCurrency(projection.freeCashFlow)}</td>
                <td class="px-3 py-3 text-sm text-gray-900 dark:text-white text-right">${formatCurrency(projection.presentValue)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Key Insights</h3>
      
      <div class="space-y-4">
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 class="font-semibold text-blue-900 dark:text-blue-100 mb-2">Valuation Analysis</h4>
          <p class="text-blue-800 dark:text-blue-200">The DCF model suggests a fair value of ${formatCurrency(result.sharePrice)} per share based on projected cash flows and terminal value.</p>
        </div>
        
        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <h4 class="font-semibold text-green-900 dark:text-green-100 mb-2">Growth Assumptions</h4>
          <p class="text-green-800 dark:text-green-200">Revenue growth assumptions significantly impact the valuation. Consider sensitivity analysis for different growth scenarios.</p>
        </div>
        
        <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <h4 class="font-semibold text-purple-900 dark:text-purple-100 mb-2">Risk Factors</h4>
          <p class="text-purple-800 dark:text-purple-200">The discount rate reflects the risk profile. Higher risk businesses require higher discount rates, reducing valuation.</p>
        </div>
      </div>
    </div>
  `;
};

const parseNumber = (value: FormDataEntryValue | null): number => {
  if (value === null) return Number.NaN;
  const numericValue = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isFinite(numericValue) ? numericValue : Number.NaN;
};

const initDCFPage = (): void => {
  registerChatButton('#dcf-chat-button', 'DCF Valuation Calculator', {
    tool: 'analyze_dcf_valuation',
  });

  const form = document.getElementById('calculator-form');

  if (!(form instanceof HTMLFormElement)) {
    console.error('DCF form not found');
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Show loading state
    const calculateBtn = document.querySelector<HTMLButtonElement>('#calculate-btn');
    if (calculateBtn) {
      calculateBtn.disabled = true;
      calculateBtn.textContent = 'Calculating...';
    }

    // Hide previous results
    const resultsSection = document.getElementById('results-section');
    const resultsContainer = document.getElementById('results-container');
    const summaryCards = document.getElementById('summary-cards');
    resultsSection?.classList.add('hidden');
    resultsContainer?.classList.add('hidden');
    summaryCards?.classList.add('hidden');

    try {
      const formData = new FormData(form);

      // Parse form data
      const revenue = parseNumber(formData.get('revenue'));
      const revenueGrowth = parseNumber(formData.get('revenueGrowth'));
      const ebitdaMargin = parseNumber(formData.get('ebitdaMargin'));
      const taxRate = parseNumber(formData.get('taxRate'));
      const capex = parseNumber(formData.get('capex'));
      const workingCapitalChange = parseNumber(formData.get('workingCapitalChange'));
      const terminalGrowthRate = parseNumber(formData.get('terminalGrowthRate'));
      const discountRate = parseNumber(formData.get('discountRate'));
      const projectionYears = parseNumber(formData.get('projectionYears'));
      const sharesOutstanding = parseNumber(formData.get('sharesOutstanding'));

      // Validate required fields
      if (Number.isNaN(revenue) || revenue <= 0) {
        throw new Error('Please enter a valid current revenue');
      }
      if (Number.isNaN(revenueGrowth) || revenueGrowth < 0) {
        throw new Error('Please enter a valid revenue growth rate');
      }
      if (Number.isNaN(ebitdaMargin) || ebitdaMargin < 0 || ebitdaMargin > 100) {
        throw new Error('Please enter a valid EBITDA margin (0-100%)');
      }
      if (Number.isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
        throw new Error('Please enter a valid tax rate (0-100%)');
      }
      if (Number.isNaN(discountRate) || discountRate <= 0) {
        throw new Error('Please enter a valid discount rate');
      }
      if (Number.isNaN(projectionYears) || projectionYears < 1 || projectionYears > 20) {
        throw new Error('Please enter a valid projection period (1-20 years)');
      }
      if (Number.isNaN(sharesOutstanding) || sharesOutstanding <= 0) {
        throw new Error('Please enter a valid number of shares outstanding');
      }

      const inputs: DCFInputs = {
        revenue,
        revenueGrowth,
        ebitdaMargin,
        taxRate,
        capex: Number.isNaN(capex) ? 0 : capex,
        workingCapitalChange: Number.isNaN(workingCapitalChange) ? 0 : workingCapitalChange,
        terminalGrowthRate: Number.isNaN(terminalGrowthRate) ? 2 : terminalGrowthRate,
        discountRate,
        projectionYears,
        sharesOutstanding,
      };

      const calculator = new SimpleDCFCalculator();
      const result = calculator.calculate(inputs);

      // Store result for chatbot integration
      storeAnalysisResult('analyze_dcf_valuation', result);

      // Display results
      displayResults(result);

      // Show results
      resultsSection?.classList.remove('hidden');
      resultsContainer?.classList.remove('hidden');
      summaryCards?.classList.remove('hidden');

      // Dispatch calculator completion event for journey integration
      window.dispatchEvent(
        new CustomEvent('calculator-completed', {
          detail: {
            calculatorId: 'dcf-valuation',
            result: result,
            formData: inputs,
          },
        })
      );
    } catch (error) {
      console.error('DCF calculation error:', error);
      alert(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      // Reset button state
      if (calculateBtn) {
        calculateBtn.disabled = false;
        calculateBtn.textContent = 'Calculate';
      }
    }
  });

  // Add reset handler
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn instanceof HTMLButtonElement) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      const resultsSection = document.getElementById('results-section');
      const resultsContainer = document.getElementById('results-container');
      const summaryCards = document.getElementById('summary-cards');
      resultsSection?.classList.add('hidden');
      resultsContainer?.classList.add('hidden');
      summaryCards?.classList.add('hidden');
    });
  }
};

initDCFPage();
