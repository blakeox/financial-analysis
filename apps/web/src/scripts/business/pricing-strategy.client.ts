/**
 * Pricing Strategy Calculator
 * Cost-plus, value-based, competitive pricing optimization
 */

import { coerceNumber, formatCurrency, showLoading, hideLoading, showError, hideError } from '../../utils/calculator-utilities';

export interface PricingInput {
  costPerUnit: number;
  targetMargin: number;
  marketPrice: number;
  valueToCustomer: number;
  unitsSoldMonthly: number;
  priceElasticity: number; // % change in demand per % change in price
}

export interface PricingResult {
  costPlus: { price: number; margin: number; monthlyProfit: number };
  valueBase: { price: number; margin: number; monthlyProfit: number };
  competitive: { price: number; margin: number; monthlyProfit: number };
  optimal: { price: number; estimatedUnits: number; revenue: number; profit: number };
  sensitivity: Array<{ price: number; units: number; revenue: number; profit: number }>;
  recommendations: string[];
}

function calculatePricing(input: PricingInput): PricingResult {
  // Cost-Plus Pricing
  const costPlusPrice = input.costPerUnit * (1 + input.targetMargin / 100);
  const costPlusMargin = ((costPlusPrice - input.costPerUnit) / costPlusPrice) * 100;
  const costPlusProfit = (costPlusPrice - input.costPerUnit) * input.unitsSoldMonthly;
  
  // Value-Based Pricing (30-40% of value delivered)
  const valueBasePrice = input.valueToCustomer * 0.35;
  const valueBaseMargin = ((valueBasePrice - input.costPerUnit) / valueBasePrice) * 100;
  const valueBaseUnits = input.unitsSoldMonthly * (1 - (valueBasePrice - costPlusPrice) / costPlusPrice * (input.priceElasticity / 100));
  const valueBaseProfit = (valueBasePrice - input.costPerUnit) * Math.max(valueBaseUnits, 0);
  
  // Competitive Pricing (match market)
  const competitivePrice = input.marketPrice;
  const competitiveMargin = ((competitivePrice - input.costPerUnit) / competitivePrice) * 100;
  const competitiveProfit = (competitivePrice - input.costPerUnit) * input.unitsSoldMonthly;
  
  // Optimal Price (maximize profit with elasticity)
  let optimalPrice = costPlusPrice;
  let maxProfit = costPlusProfit;
  
  for (let price = input.costPerUnit * 1.2; price <= Math.min(valueBasePrice, input.marketPrice * 1.5); price += input.costPerUnit * 0.05) {
    const priceChange = (price - costPlusPrice) / costPlusPrice;
    const demandChange = -priceChange * (input.priceElasticity / 100);
    const estimatedUnits = input.unitsSoldMonthly * (1 + demandChange);
    const profit = (price - input.costPerUnit) * Math.max(estimatedUnits, 0);
    
    if (profit > maxProfit) {
      maxProfit = profit;
      optimalPrice = price;
    }
  }
  
  const optimalDemandChange = -((optimalPrice - costPlusPrice) / costPlusPrice) * (input.priceElasticity / 100);
  const optimalUnits = input.unitsSoldMonthly * (1 + optimalDemandChange);
  const optimalRevenue = optimalPrice * optimalUnits;
  
  // Sensitivity Analysis
  const sensitivity: PricingResult['sensitivity'] = [];
  for (let i = -20; i <= 20; i += 5) {
    const price = costPlusPrice * (1 + i / 100);
    const demandChange = -(i / 100) * (input.priceElasticity / 100);
    const units = input.unitsSoldMonthly * (1 + demandChange);
    const revenue = price * units;
    const profit = (price - input.costPerUnit) * units;
    sensitivity.push({ price, units, revenue, profit });
  }
  
  const recommendations: string[] = [];
  
  if (valueBasePrice > costPlusPrice * 1.3) {
    recommendations.push(`💰 You're leaving money on the table! Customers value this at ${formatCurrency(input.valueToCustomer)} but you're pricing based on cost.`);
  }
  
  if (competitiveMargin < 20) {
    recommendations.push('⚠️ Market price gives you low margins (<20%). Consider differentiation or cost reduction.');
  }
  
  if (Math.abs(optimalPrice - costPlusPrice) / costPlusPrice > 0.15) {
    recommendations.push(`📊 Optimal price is ${((optimalPrice - costPlusPrice) / costPlusPrice * 100).toFixed(0)}% different from cost-plus. Test gradually.`);
  }
  
  recommendations.push('💡 Tip: Test $X.99 pricing (e.g., $49.99 vs $50) - psychological pricing can boost conversion 10-20%.');
  
  return {
    costPlus: { price: costPlusPrice, margin: costPlusMargin, monthlyProfit: costPlusProfit },
    valueBase: { price: valueBasePrice, margin: valueBaseMargin, monthlyProfit: valueBaseProfit },
    competitive: { price: competitivePrice, margin: competitiveMargin, monthlyProfit: competitiveProfit },
    optimal: { price: optimalPrice, estimatedUnits: optimalUnits, revenue: optimalRevenue, profit: maxProfit },
    sensitivity,
    recommendations,
  };
}

function displayResults(result: PricingResult, input: PricingInput): void {
  const resultsContainer = document.getElementById('results-container');
  const summaryCards = document.getElementById('summary-cards');
  const resultsSection = document.getElementById('results-section');

  if (!resultsContainer || !summaryCards || !resultsSection) return;

  const strategies = [
    { name: 'Cost-Plus', data: result.costPlus, icon: '📊' },
    { name: 'Value-Based', data: result.valueBase, icon: '💎' },
    { name: 'Competitive', data: result.competitive, icon: '🎯' },
  ];

  summaryCards.innerHTML = strategies.map(s => `
    <div class="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-violet-900 dark:text-violet-100">${s.icon} ${s.name}</h5>
      <p class="text-2xl font-bold text-violet-600 dark:text-violet-400">${formatCurrency(s.data.price)}</p>
      <p class="text-xs text-violet-700 dark:text-violet-300 mt-1">${s.data.margin.toFixed(1)}% margin</p>
    </div>
  `).join('') + `
    <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-emerald-900 dark:text-emerald-100">⭐ Optimal Price</h5>
      <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${formatCurrency(result.optimal.price)}</p>
      <p class="text-xs text-emerald-700 dark:text-emerald-300 mt-1">${formatCurrency(result.optimal.profit)}/mo profit</p>
    </div>
  `;

  resultsContainer.innerHTML = `
    <div class="fa-card p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Pricing Strategy Comparison</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="fa-panel-divider">
              <th class="text-left py-2 px-2">Strategy</th>
              <th class="text-right py-2 px-2">Price</th>
              <th class="text-right py-2 px-2">Margin %</th>
              <th class="text-right py-2 px-2">Monthly Profit</th>
            </tr>
          </thead>
          <tbody>
            ${strategies.map(s => `
              <tr class="fa-panel-divider-soft">
                <td class="py-2 px-2 font-medium">${s.icon} ${s.name}</td>
                <td class="text-right py-2 px-2">${formatCurrency(s.data.price)}</td>
                <td class="text-right py-2 px-2">${s.data.margin.toFixed(1)}%</td>
                <td class="text-right py-2 px-2 font-semibold text-emerald-600 dark:text-emerald-400">${formatCurrency(s.data.monthlyProfit)}</td>
              </tr>
            `).join('')}
            <tr class="fa-panel-divider-top font-bold bg-emerald-50 dark:bg-emerald-900/20">
              <td class="py-3 px-2">⭐ Optimal (Math-Based)</td>
              <td class="text-right py-3 px-2">${formatCurrency(result.optimal.price)}</td>
              <td class="text-right py-3 px-2">${(((result.optimal.price - input.costPerUnit) / result.optimal.price) * 100).toFixed(1)}%</td>
              <td class="text-right py-3 px-2 text-emerald-600 dark:text-emerald-400">${formatCurrency(result.optimal.profit)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div class="bg-gradient-to-br from-violet-50 to-violet-50 dark:from-violet-900/20 dark:to-violet-900/20 rounded-lg p-6 mb-6 border border-violet-200 dark:border-violet-700">
      <h2 class="text-xl font-semibold mb-4">📈 Price Sensitivity Analysis</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="border-b border-slate-200/80 dark:border-slate-800">
              <th class="text-left py-2">Price</th>
              <th class="text-right py-2">Est. Units</th>
              <th class="text-right py-2">Revenue</th>
              <th class="text-right py-2">Profit</th>
            </tr>
          </thead>
          <tbody>
            ${result.sensitivity.map(s => `
              <tr class="fa-panel-divider-soft">
                <td class="py-2">${formatCurrency(s.price)}</td>
                <td class="text-right py-2">${Math.round(s.units)}</td>
                <td class="text-right py-2">${formatCurrency(s.revenue)}</td>
                <td class="text-right py-2 ${s.profit > result.optimal.profit * 0.95 ? 'font-bold text-emerald-600 dark:text-emerald-400' : ''}">${formatCurrency(s.profit)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    
    <div class="bg-gradient-to-br from-violet-50 to-violet-50 dark:from-violet-900/20 dark:to-violet-900/20 rounded-lg p-6 border border-violet-200 dark:border-violet-700">
      <h2 class="text-xl font-semibold mb-3">💡 Pricing Recommendations</h2>
      <div class="space-y-3">
        ${result.recommendations.map(rec => `
          <div class="fa-subcard p-3 text-sm">${rec}</div>
        `).join('')}
      </div>
    </div>
  `;
  
  resultsSection.classList.remove('hidden');
}

function parseFormInput(form: HTMLFormElement): PricingInput {
  const formData = new FormData(form);
  return {
    costPerUnit: coerceNumber(formData.get('costPerUnit'), 0),
    targetMargin: coerceNumber(formData.get('targetMargin'), 30),
    marketPrice: coerceNumber(formData.get('marketPrice'), 0),
    valueToCustomer: coerceNumber(formData.get('valueToCustomer'), 0),
    unitsSoldMonthly: coerceNumber(formData.get('unitsSoldMonthly'), 0),
    priceElasticity: coerceNumber(formData.get('priceElasticity'), 1.0),
  };
}

function initializePricingStrategy(): void {
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
      if (input.costPerUnit <= 0) throw new Error('Cost per unit must be positive');
      if (input.unitsSoldMonthly <= 0) throw new Error('Units sold must be positive');
      
      const result = calculatePricing(input);
      displayResults(result, input);
      
      window.dispatchEvent(new CustomEvent('calculator-completed', {
        detail: { calculatorId: 'pricing-strategy', result, formData: input },
      }));
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
  document.addEventListener('DOMContentLoaded', initializePricingStrategy);
} else {
  initializePricingStrategy();
}
