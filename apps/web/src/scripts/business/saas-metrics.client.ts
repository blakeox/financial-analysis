/**
 * SaaS Metrics Dashboard Calculator
 * MRR, ARR, Churn, CAC, LTV, LTV:CAC, Payback Period, Rule of 40
 */

import { coerceNumber, formatCurrency, showLoading, hideLoading, showError, hideError } from '../../utils/calculator-utilities';

export interface SaaSInput {
  activeCustomers: number;
  averageMonthlyRevenue: number;
  newCustomersLastMonth: number;
  churnedCustomersLastMonth: number;
  salesMarketingSpend: number;
  averageCustomerLifetimeMonths: number;
  grossMargin: number; // %
  revenueGrowthRate: number; // % annual
}

export interface SaaSResult {
  mrr: number;
  arr: number;
  churnRate: number;
  cac: number;
  ltv: number;
  ltvCacRatio: number;
  paybackPeriod: number;
  nrr: number; // Net Revenue Retention
  ruleOf40: number;
  profitMargin: number;
  health: { score: number; grade: string; status: string };
  recommendations: string[];
}

function calculateSaaSMetrics(input: SaaSInput): SaaSResult {
  // MRR (Monthly Recurring Revenue)
  const mrr = input.averageMonthlyRevenue * input.activeCustomers;
  
  // ARR (Annual Recurring Revenue)
  const arr = mrr * 12;
  
  // Churn Rate (% of customers lost per month)
  const churnRate = (input.churnedCustomersLastMonth / input.activeCustomers) * 100;
  
  // CAC (Customer Acquisition Cost)
  const cac = input.newCustomersLastMonth > 0 ? input.salesMarketingSpend / input.newCustomersLastMonth : 0;
  
  // LTV (Customer Lifetime Value)
  const avgLifetimeMonths = input.averageCustomerLifetimeMonths || (churnRate > 0 ? 1 / (churnRate / 100) : 36);
  const ltv = input.averageMonthlyRevenue * avgLifetimeMonths * (input.grossMargin / 100);
  
  // LTV:CAC Ratio
  const ltvCacRatio = cac > 0 ? ltv / cac : 0;
  
  // CAC Payback Period (months to recover acquisition cost)
  const monthlyGrossProfit = input.averageMonthlyRevenue * (input.grossMargin / 100);
  const paybackPeriod = cac > 0 && monthlyGrossProfit > 0 ? cac / monthlyGrossProfit : 0;
  
  // Net Revenue Retention (assuming no expansion for simplicity)
  const nrr = 100 - churnRate;
  
  // Rule of 40 (Growth Rate + Profit Margin should be ≥ 40%)
  const profitMargin = input.grossMargin - 50; // Rough estimate: gross margin - typical SaaS opex
  const ruleOf40 = input.revenueGrowthRate + profitMargin;
  
  // Health Score
  let healthScore = 0;
  if (ltvCacRatio >= 3) healthScore += 25;
  else if (ltvCacRatio >= 1) healthScore += 10;
  
  if (churnRate <= 2) healthScore += 25;
  else if (churnRate <= 5) healthScore += 15;
  else if (churnRate <= 10) healthScore += 5;
  
  if (paybackPeriod <= 12) healthScore += 25;
  else if (paybackPeriod <= 18) healthScore += 15;
  else if (paybackPeriod <= 24) healthScore += 5;
  
  if (ruleOf40 >= 40) healthScore += 25;
  else if (ruleOf40 >= 20) healthScore += 10;
  
  const grade = healthScore >= 80 ? 'A' : healthScore >= 60 ? 'B' : healthScore >= 40 ? 'C' : healthScore >= 20 ? 'D' : 'F';
  const status = healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : healthScore >= 20 ? 'Poor' : 'Critical';
  
  // Recommendations
  const recommendations: string[] = [];
  
  if (ltvCacRatio < 3) {
    if (ltvCacRatio < 1) {
      recommendations.push('🚨 LTV:CAC < 1 means you lose money on every customer! Reduce CAC or increase LTV immediately.');
    } else {
      recommendations.push('⚠️ LTV:CAC below 3:1. Target is 3:1 or higher. Focus on reducing churn or improving monetization.');
    }
  } else {
    recommendations.push('✓ Excellent LTV:CAC ratio (≥3:1). Strong unit economics.');
  }
  
  if (churnRate > 5) {
    recommendations.push(`⚠️ Monthly churn of ${churnRate.toFixed(1)}% is high. Target <5% (annual <50%). Improve product, support, or onboarding.`);
  } else if (churnRate > 2) {
    recommendations.push(`📊 Churn of ${churnRate.toFixed(1)}% is moderate. Best-in-class SaaS companies achieve <2% monthly.`);
  } else {
    recommendations.push('✓ Excellent churn rate (<2%). Strong product-market fit.');
  }
  
  if (paybackPeriod > 18) {
    recommendations.push(`💰 CAC payback period of ${paybackPeriod.toFixed(1)} months is long. Target <12 months for healthy cash flow.`);
  } else if (paybackPeriod <= 12) {
    recommendations.push('✓ Great CAC payback period (≤12 months). Efficient sales & marketing.');
  }
  
  if (ruleOf40 < 40) {
    recommendations.push(`📈 Rule of 40 score: ${ruleOf40.toFixed(1)}%. Target ≥40% (growth + profit margin). Balance growth and profitability.`);
  } else {
    recommendations.push('✓ Exceeding Rule of 40 - excellent balance of growth and efficiency.');
  }
  
  if (nrr < 100) {
    recommendations.push('💡 Focus on expansion revenue (upsells, cross-sells) to achieve >100% NRR.');
  }
  
  recommendations.push(`💵 With ${formatCurrency(mrr)} MRR growing at ${input.revenueGrowthRate}% annually, you'll reach ${formatCurrency(mrr * Math.pow(1 + input.revenueGrowthRate / 100, 1))} MRR in 12 months.`);
  
  return {
    mrr,
    arr,
    churnRate,
    cac,
    ltv,
    ltvCacRatio,
    paybackPeriod,
    nrr,
    ruleOf40,
    profitMargin,
    health: { score: healthScore, grade, status },
    recommendations,
  };
}

function displayResults(result: SaaSResult, input: SaaSInput): void {
  const resultsContainer = document.getElementById('results-container');
  const summaryCards = document.getElementById('summary-cards');
  const resultsSection = document.getElementById('results-section');

  if (!resultsContainer || !summaryCards || !resultsSection) return;

  summaryCards.innerHTML = `
    <div class="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-violet-900 dark:text-violet-100">MRR</h5>
      <p class="text-2xl font-bold text-violet-600 dark:text-violet-400">${formatCurrency(result.mrr)}</p>
      <p class="text-xs text-violet-700 dark:text-violet-300 mt-1">${formatCurrency(result.arr)} ARR</p>
    </div>
    <div class="bg-${result.ltvCacRatio >= 3 ? 'green' : result.ltvCacRatio >= 1 ? 'yellow' : 'red'}-50 dark:bg-${result.ltvCacRatio >= 3 ? 'green' : result.ltvCacRatio >= 1 ? 'yellow' : 'red'}-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-${result.ltvCacRatio >= 3 ? 'green' : result.ltvCacRatio >= 1 ? 'yellow' : 'red'}-900 dark:text-${result.ltvCacRatio >= 3 ? 'green' : result.ltvCacRatio >= 1 ? 'yellow' : 'red'}-100">LTV:CAC Ratio</h5>
      <p class="text-2xl font-bold text-${result.ltvCacRatio >= 3 ? 'green' : result.ltvCacRatio >= 1 ? 'yellow' : 'red'}-600 dark:text-${result.ltvCacRatio >= 3 ? 'green' : result.ltvCacRatio >= 1 ? 'yellow' : 'red'}-400">${result.ltvCacRatio.toFixed(1)}:1</p>
      <p class="text-xs text-${result.ltvCacRatio >= 3 ? 'green' : result.ltvCacRatio >= 1 ? 'yellow' : 'red'}-700 dark:text-${result.ltvCacRatio >= 3 ? 'green' : result.ltvCacRatio >= 1 ? 'yellow' : 'red'}-300 mt-1">${result.ltvCacRatio >= 3 ? '✓ Excellent' : result.ltvCacRatio >= 1 ? '⚠️ Needs work' : '🚨 Losing money'}</p>
    </div>
    <div class="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-violet-900 dark:text-violet-100">Monthly Churn</h5>
      <p class="text-2xl font-bold ${result.churnRate <= 2 ? 'text-emerald-600 dark:text-emerald-400' : result.churnRate <= 5 ? 'text-yellow-600 dark:text-yellow-400' : 'text-rose-600 dark:text-rose-400'}">${result.churnRate.toFixed(1)}%</p>
      <p class="text-xs text-violet-700 dark:text-violet-300 mt-1">${(result.churnRate * 12).toFixed(0)}% annual</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-orange-900 dark:text-orange-100">Health Grade</h5>
      <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">${result.health.grade}</p>
      <p class="text-xs text-orange-700 dark:text-orange-300 mt-1">${result.health.status} (${result.health.score}/100)</p>
    </div>
  `;

  resultsContainer.innerHTML = `
    <div class="fa-card p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">📊 Core SaaS Metrics</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <h3 class="fa-list-copy-strong">Revenue Metrics</h3>
          <div class="space-y-3">
            <div class="flex justify-between py-2 fa-panel-divider-soft">
              <span class="text-slate-700 dark:text-slate-300">MRR (Monthly Recurring)</span>
              <span class="font-bold text-violet-600 dark:text-violet-400">${formatCurrency(result.mrr)}</span>
            </div>
            <div class="flex justify-between py-2 fa-panel-divider-soft">
              <span class="text-slate-700 dark:text-slate-300">ARR (Annual Recurring)</span>
              <span class="font-bold text-emerald-600 dark:text-emerald-400">${formatCurrency(result.arr)}</span>
            </div>
            <div class="flex justify-between py-2 fa-panel-divider-soft">
              <span class="text-slate-700 dark:text-slate-300">Revenue per Customer</span>
              <span class="font-semibold">${formatCurrency(input.averageMonthlyRevenue)}/mo</span>
            </div>
          </div>
        </div>
        
        <div class="space-y-4">
          <h3 class="fa-list-copy-strong">Unit Economics</h3>
          <div class="space-y-3">
            <div class="flex justify-between py-2 fa-panel-divider-soft">
              <span class="text-slate-700 dark:text-slate-300">CAC (Customer Acquisition Cost)</span>
              <span class="font-semibold">${formatCurrency(result.cac)}</span>
            </div>
            <div class="flex justify-between py-2 fa-panel-divider-soft">
              <span class="text-slate-700 dark:text-slate-300">LTV (Lifetime Value)</span>
              <span class="font-semibold">${formatCurrency(result.ltv)}</span>
            </div>
            <div class="flex justify-between py-2 fa-panel-divider-soft">
              <span class="text-slate-700 dark:text-slate-300">LTV:CAC Ratio</span>
              <span class="font-bold ${result.ltvCacRatio >= 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}">${result.ltvCacRatio.toFixed(1)}:1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="bg-gradient-to-br from-violet-50 to-violet-50 dark:from-violet-900/20 dark:to-violet-900/20 rounded-lg p-6 mb-6 border border-violet-200 dark:border-violet-700">
      <h2 class="text-xl font-semibold mb-4">📈 Growth & Efficiency Metrics</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="fa-subcard">
          <h4 class="fa-script-copy-muted font-semibold mb-2">Monthly Churn Rate</h4>
          <p class="text-3xl font-bold ${result.churnRate <= 2 ? 'text-emerald-600 dark:text-emerald-400' : result.churnRate <= 5 ? 'text-yellow-600 dark:text-yellow-400' : 'text-rose-600 dark:text-rose-400'}">${result.churnRate.toFixed(1)}%</p>
          <p class="fa-script-note mt-2">Target: <2% (excellent)</p>
        </div>
        
        <div class="fa-subcard">
          <h4 class="fa-script-copy-muted font-semibold mb-2">CAC Payback Period</h4>
          <p class="text-3xl font-bold ${result.paybackPeriod <= 12 ? 'text-emerald-600 dark:text-emerald-400' : result.paybackPeriod <= 18 ? 'text-yellow-600 dark:text-yellow-400' : 'text-rose-600 dark:text-rose-400'}">${result.paybackPeriod.toFixed(1)}</p>
          <p class="fa-script-note mt-2">Target: <12 months</p>
        </div>
        
        <div class="fa-subcard">
          <h4 class="fa-script-copy-muted font-semibold mb-2">Net Revenue Retention</h4>
          <p class="text-3xl font-bold ${result.nrr >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-yellow-600 dark:text-yellow-400'}">${result.nrr.toFixed(0)}%</p>
          <p class="fa-script-note mt-2">Target: >100% (with expansion)</p>
        </div>
      </div>
      
      <div class="mt-4 fa-subcard">
          <h4 class="fa-script-copy-muted font-semibold mb-2">Rule of 40</h4>
        <div class="flex items-center gap-4">
          <p class="text-4xl font-bold ${result.ruleOf40 >= 40 ? 'text-emerald-600 dark:text-emerald-400' : 'text-yellow-600 dark:text-yellow-400'}">${result.ruleOf40.toFixed(1)}%</p>
          <div class="fa-script-copy-muted">
            <p>Growth Rate: {input.revenueGrowthRate}%</p>
            <p>+ Profit Margin: ${result.profitMargin.toFixed(1)}%</p>
            <p class="font-semibold mt-1">${result.ruleOf40 >= 40 ? '✓ Target achieved (≥40%)' : '⚠️ Below target 40%'}</p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="bg-gradient-to-br from-${result.health.score >= 80 ? 'green' : result.health.score >= 60 ? 'blue' : result.health.score >= 40 ? 'yellow' : 'red'}-50 to-${result.health.score >= 80 ? 'emerald' : result.health.score >= 60 ? 'indigo' : result.health.score >= 40 ? 'orange' : 'rose'}-50 dark:from-${result.health.score >= 80 ? 'green' : result.health.score >= 60 ? 'blue' : result.health.score >= 40 ? 'yellow' : 'red'}-900/20 dark:to-${result.health.score >= 80 ? 'emerald' : result.health.score >= 60 ? 'indigo' : result.health.score >= 40 ? 'orange' : 'rose'}-900/20 rounded-lg p-6 mb-6 border border-${result.health.score >= 80 ? 'green' : result.health.score >= 60 ? 'blue' : result.health.score >= 40 ? 'yellow' : 'red'}-200 dark:border-${result.health.score >= 80 ? 'green' : result.health.score >= 60 ? 'blue' : result.health.score >= 40 ? 'yellow' : 'red'}-700">
      <h2 class="text-xl font-semibold mb-4">🏥 SaaS Health Score</h2>
      
      <div class="flex items-center gap-6 mb-4">
        <div class="text-center">
          <div class="text-6xl font-bold ${result.health.score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : result.health.score >= 60 ? 'text-violet-600 dark:text-violet-400' : result.health.score >= 40 ? 'text-yellow-600 dark:text-yellow-400' : 'text-rose-600 dark:text-rose-400'}">${result.health.grade}</div>
          <p class="fa-script-copy-muted mt-2">${result.health.status}</p>
        </div>
        <div class="flex-1">
          <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-6">
            <div class="bg-gradient-to-r from-${result.health.score >= 80 ? 'green' : result.health.score >= 60 ? 'blue' : result.health.score >= 40 ? 'yellow' : 'red'}-500 to-${result.health.score >= 80 ? 'green' : result.health.score >= 60 ? 'blue' : result.health.score >= 40 ? 'yellow' : 'red'}-600 h-6 rounded-full flex items-center justify-center text-white text-sm font-semibold" style="width: ${result.health.score}%">
              ${result.health.score}/100
            </div>
          </div>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-2">
            Based on LTV:CAC (25 pts), Churn (25 pts), Payback Period (25 pts), Rule of 40 (25 pts)
          </p>
        </div>
      </div>
    </div>
    
    <div class="bg-gradient-to-br from-violet-50 to-violet-50 dark:from-violet-900/20 dark:to-violet-900/20 rounded-lg p-6 border border-violet-200 dark:border-violet-700">
      <h2 class="text-xl font-semibold mb-3">💡 Recommendations & Insights</h2>
      <div class="space-y-3">
        ${result.recommendations.map(rec => `
          <div class="fa-subcard p-3 text-sm">${rec}</div>
        `).join('')}
      </div>
    </div>
  `;
  
  resultsSection.classList.remove('hidden');
}

function parseFormInput(form: HTMLFormElement): SaaSInput {
  const formData = new FormData(form);
  return {
    activeCustomers: coerceNumber(formData.get('activeCustomers'), 0),
    averageMonthlyRevenue: coerceNumber(formData.get('averageMonthlyRevenue'), 0),
    newCustomersLastMonth: coerceNumber(formData.get('newCustomersLastMonth'), 0),
    churnedCustomersLastMonth: coerceNumber(formData.get('churnedCustomersLastMonth'), 0),
    salesMarketingSpend: coerceNumber(formData.get('salesMarketingSpend'), 0),
    averageCustomerLifetimeMonths: coerceNumber(formData.get('averageCustomerLifetimeMonths'), 24),
    grossMargin: coerceNumber(formData.get('grossMargin'), 80),
    revenueGrowthRate: coerceNumber(formData.get('revenueGrowthRate'), 0),
  };
}

function initializeSaaSMetrics(): void {
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
      if (input.activeCustomers <= 0) throw new Error('Active customers must be positive');
      if (input.averageMonthlyRevenue <= 0) throw new Error('Average revenue must be positive');
      
      const result = calculateSaaSMetrics(input);
      displayResults(result, input);
      
      window.dispatchEvent(new CustomEvent('calculator-completed', {
        detail: { calculatorId: 'saas-metrics', result, formData: input },
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
  document.addEventListener('DOMContentLoaded', initializeSaaSMetrics);
} else {
  initializeSaaSMetrics();
}
