/**
 * Break-Even Analysis Calculator
 * 
 * Calculates break-even point in units and revenue, contribution margin,
 * margin of safety, and target profit scenarios.
 */

import {
  coerceNumber,
  formatCurrency,
  showLoading,
  hideLoading,
  showError,
  hideError,
} from '../utils/calculator-utilities';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface BreakEvenInput {
  fixedCosts: number;
  variableCostPerUnit: number;
  sellingPricePerUnit: number;
  currentSalesUnits?: number;
  targetProfit?: number;
  expectedGrowthRate?: number;
}

export interface BreakEvenResult {
  breakEven: {
    units: number;
    revenue: number;
    contributionMargin: number;
    contributionMarginRatio: number;
  };
  marginOfSafety: {
    units: number;
    percentage: number;
    revenue: number;
  };
  targetProfit?: {
    unitsNeeded: number;
    revenueNeeded: number;
    additionalUnits: number;
  };
  sensitivity: {
    price10PercentIncrease: { units: number; revenue: number; improvement: string };
    price10PercentDecrease: { units: number; revenue: number; impact: string };
    costs10PercentIncrease: { units: number; revenue: number; impact: string };
  };
  recommendations: string[];
}

// ============================================================================
// CALCULATIONS
// ============================================================================

function calculateBreakEven(input: BreakEvenInput): BreakEvenResult {
  const { fixedCosts, variableCostPerUnit, sellingPricePerUnit, currentSalesUnits, targetProfit, expectedGrowthRate } = input;
  
  // Contribution margin per unit
  const contributionMargin = sellingPricePerUnit - variableCostPerUnit;
  
  // Contribution margin ratio
  const contributionMarginRatio = (contributionMargin / sellingPricePerUnit) * 100;
  
  // Break-even point in units
  const breakEvenUnits = Math.ceil(fixedCosts / contributionMargin);
  
  // Break-even revenue
  const breakEvenRevenue = breakEvenUnits * sellingPricePerUnit;
  
  // Margin of safety (if current sales provided)
  let marginOfSafety = {
    units: 0,
    percentage: 0,
    revenue: 0,
  };
  
  if (currentSalesUnits && currentSalesUnits > 0) {
    marginOfSafety.units = currentSalesUnits - breakEvenUnits;
    marginOfSafety.percentage = ((currentSalesUnits - breakEvenUnits) / currentSalesUnits) * 100;
    marginOfSafety.revenue = marginOfSafety.units * sellingPricePerUnit;
  }
  
  // Target profit analysis
  let targetProfitAnalysis;
  if (targetProfit && targetProfit > 0) {
    const unitsNeeded = Math.ceil((fixedCosts + targetProfit) / contributionMargin);
    const revenueNeeded = unitsNeeded * sellingPricePerUnit;
    const additionalUnits = unitsNeeded - breakEvenUnits;
    
    targetProfitAnalysis = {
      unitsNeeded,
      revenueNeeded,
      additionalUnits,
    };
  }
  
  // Sensitivity analysis
  const sensitivity = {
    price10PercentIncrease: {
      units: Math.ceil(fixedCosts / (contributionMargin * 1.1)),
      revenue: 0,
      improvement: '',
    },
    price10PercentDecrease: {
      units: Math.ceil(fixedCosts / (contributionMargin * 0.9)),
      revenue: 0,
      impact: '',
    },
    costs10PercentIncrease: {
      units: Math.ceil((fixedCosts * 1.1) / contributionMargin),
      revenue: 0,
      impact: '',
    },
  };
  
  // Calculate revenues
  sensitivity.price10PercentIncrease.revenue = sensitivity.price10PercentIncrease.units * (sellingPricePerUnit * 1.1);
  sensitivity.price10PercentDecrease.revenue = sensitivity.price10PercentDecrease.units * (sellingPricePerUnit * 0.9);
  sensitivity.costs10PercentIncrease.revenue = sensitivity.costs10PercentIncrease.units * sellingPricePerUnit;
  
  const unitsReduction = breakEvenUnits - sensitivity.price10PercentIncrease.units;
  sensitivity.price10PercentIncrease.improvement = `${unitsReduction} fewer units needed (${((unitsReduction / breakEvenUnits) * 100).toFixed(1)}% reduction)`;
  
  const unitsIncrease = sensitivity.price10PercentDecrease.units - breakEvenUnits;
  sensitivity.price10PercentDecrease.impact = `${unitsIncrease} more units needed (${((unitsIncrease / breakEvenUnits) * 100).toFixed(1)}% increase)`;
  
  const costsUnitsIncrease = sensitivity.costs10PercentIncrease.units - breakEvenUnits;
  sensitivity.costs10PercentIncrease.impact = `${costsUnitsIncrease} more units needed`;
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (contributionMarginRatio < 30) {
    recommendations.push('⚠️ Low contribution margin (<30%). Consider raising prices or reducing variable costs.');
  } else if (contributionMarginRatio > 60) {
    recommendations.push('✓ Excellent contribution margin (>60%). You have strong pricing power.');
  }
  
  if (currentSalesUnits && marginOfSafety.percentage < 20) {
    recommendations.push('⚠️ Low margin of safety (<20%). You\'re operating close to break-even - risky!');
  } else if (currentSalesUnits && marginOfSafety.percentage > 40) {
    recommendations.push('✓ Healthy margin of safety (>40%). You can withstand sales fluctuations.');
  }
  
  if (variableCostPerUnit / sellingPricePerUnit > 0.7) {
    recommendations.push('⚠️ Variable costs are 70%+ of price. Look for ways to reduce COGS or increase prices.');
  }
  
  recommendations.push('💡 A 10% price increase reduces break-even by ' + ((unitsReduction / breakEvenUnits) * 100).toFixed(0) + '% - often easier than cutting costs.');
  
  if (targetProfit && targetProfitAnalysis) {
    const profitPerUnit = contributionMargin;
    recommendations.push(`💰 Each unit sold above break-even adds $${profitPerUnit.toFixed(2)} in profit.`);
  }
  
  return {
    breakEven: {
      units: breakEvenUnits,
      revenue: breakEvenRevenue,
      contributionMargin,
      contributionMarginRatio,
    },
    marginOfSafety,
    targetProfit: targetProfitAnalysis,
    sensitivity,
    recommendations,
  };
}

// ============================================================================
// DISPLAY
// ============================================================================

function displayResults(result: BreakEvenResult, input: BreakEvenInput): void {
  const resultsContainer = document.getElementById('results-container');
  const summaryCards = document.getElementById('summary-cards');
  const resultsSection = document.getElementById('results-section');

  if (!resultsContainer || !summaryCards || !resultsSection) {
    console.error('Required DOM elements not found');
    return;
  }

  summaryCards.innerHTML = `
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-blue-900 dark:text-blue-100">Break-Even Units</h5>
      <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${result.breakEven.units.toLocaleString()}</p>
      <p class="text-xs text-blue-700 dark:text-blue-300 mt-1">units to cover costs</p>
    </div>
    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-green-900 dark:text-green-100">Break-Even Revenue</h5>
      <p class="text-2xl font-bold text-green-600 dark:text-green-400">${formatCurrency(result.breakEven.revenue)}</p>
      <p class="text-xs text-green-700 dark:text-green-300 mt-1">minimum revenue</p>
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-purple-900 dark:text-purple-100">Contribution Margin</h5>
      <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">${result.breakEven.contributionMarginRatio.toFixed(1)}%</p>
      <p class="text-xs text-purple-700 dark:text-purple-300 mt-1">${formatCurrency(result.breakEven.contributionMargin)}/unit</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-orange-900 dark:text-orange-100">Margin of Safety</h5>
      <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">${input.currentSalesUnits ? result.marginOfSafety.percentage.toFixed(1) + '%' : 'N/A'}</p>
      <p class="text-xs text-orange-700 dark:text-orange-300 mt-1">${input.currentSalesUnits ? result.marginOfSafety.units.toLocaleString() + ' units buffer' : 'Enter current sales'}</p>
    </div>
  `;

  resultsContainer.innerHTML = `
    <!-- Break-Even Chart -->
    ${renderBreakEvenChart(result, input)}
    
    <!-- Core Metrics -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>📊</span> Break-Even Analysis
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <h3 class="font-semibold text-gray-900 dark:text-white">Cost Structure</h3>
          <div class="space-y-3">
            <div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span class="text-gray-700 dark:text-gray-300">Fixed Costs (monthly)</span>
              <span class="font-semibold">${formatCurrency(input.fixedCosts)}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span class="text-gray-700 dark:text-gray-300">Variable Cost per Unit</span>
              <span class="font-semibold">${formatCurrency(input.variableCostPerUnit)}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span class="text-gray-700 dark:text-gray-300">Selling Price per Unit</span>
              <span class="font-semibold">${formatCurrency(input.sellingPricePerUnit)}</span>
            </div>
            <div class="flex justify-between py-2 border-t-2 border-gray-300 dark:border-gray-600 pt-2">
              <span class="text-gray-900 dark:text-white font-semibold">Contribution Margin</span>
              <span class="font-bold text-green-600 dark:text-green-400">${formatCurrency(result.breakEven.contributionMargin)}</span>
            </div>
          </div>
        </div>
        
        <div class="space-y-4">
          <h3 class="font-semibold text-gray-900 dark:text-white">Break-Even Point</h3>
          <div class="space-y-3">
            <div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span class="text-gray-700 dark:text-gray-300">Units to Break Even</span>
              <span class="font-bold text-blue-600 dark:text-blue-400">${result.breakEven.units.toLocaleString()}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span class="text-gray-700 dark:text-gray-300">Revenue to Break Even</span>
              <span class="font-bold text-green-600 dark:text-green-400">${formatCurrency(result.breakEven.revenue)}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span class="text-gray-700 dark:text-gray-300">Contribution Margin %</span>
              <span class="font-semibold">${result.breakEven.contributionMarginRatio.toFixed(1)}%</span>
            </div>
          </div>
          
          <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p class="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>What this means:</strong> You need to sell ${result.breakEven.units.toLocaleString()} units at ${formatCurrency(input.sellingPricePerUnit)} each to cover your ${formatCurrency(input.fixedCosts)} in fixed costs.
            </p>
          </div>
        </div>
      </div>
    </div>
    
    ${input.currentSalesUnits && input.currentSalesUnits > 0 ? `
    <!-- Margin of Safety -->
    <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 mb-6 border border-green-200 dark:border-green-700">
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <span>🛡️</span> Margin of Safety
      </h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">How much cushion you have above break-even</p>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Sales</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">${input.currentSalesUnits.toLocaleString()}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">units/month</p>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Safety Buffer</p>
          <p class="text-2xl font-bold ${result.marginOfSafety.percentage > 30 ? 'text-green-600 dark:text-green-400' : result.marginOfSafety.percentage > 15 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}">${result.marginOfSafety.units.toLocaleString()}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">units above break-even</p>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Safety Percentage</p>
          <p class="text-2xl font-bold ${result.marginOfSafety.percentage > 30 ? 'text-green-600 dark:text-green-400' : result.marginOfSafety.percentage > 15 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}">${result.marginOfSafety.percentage.toFixed(1)}%</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${result.marginOfSafety.percentage > 30 ? 'Healthy' : result.marginOfSafety.percentage > 15 ? 'Moderate' : 'Risky'}</p>
        </div>
      </div>
      
      <div class="mt-4 bg-white dark:bg-gray-800 rounded-lg p-4">
        <p class="text-sm text-gray-700 dark:text-gray-300">
          ${result.marginOfSafety.percentage > 30 
            ? '✓ Strong position: Sales could drop ' + result.marginOfSafety.percentage.toFixed(0) + '% before losing money.' 
            : result.marginOfSafety.percentage > 15
            ? '⚠️ Moderate risk: Limited cushion for sales fluctuations. Consider ways to increase sales or reduce costs.'
            : '🚨 High risk: Very close to break-even. Any sales decline results in losses. Immediate action needed.'}
        </p>
      </div>
    </div>
    ` : ''}
    
    ${result.targetProfit ? `
    <!-- Target Profit Analysis -->
    <div class="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 mb-6 border border-purple-200 dark:border-purple-700">
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <span>🎯</span> Target Profit: ${formatCurrency(input.targetProfit || 0)}
      </h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Units and revenue needed to achieve your profit goal</p>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Units Needed</p>
          <p class="text-3xl font-bold text-purple-600 dark:text-purple-400">${result.targetProfit.unitsNeeded.toLocaleString()}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">to reach profit goal</p>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Revenue Needed</p>
          <p class="text-3xl font-bold text-green-600 dark:text-green-400">${formatCurrency(result.targetProfit.revenueNeeded)}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">total sales required</p>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Beyond Break-Even</p>
          <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">${result.targetProfit.additionalUnits.toLocaleString()}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">extra units for profit</p>
        </div>
      </div>
    </div>
    ` : ''}
    
    <!-- Sensitivity Analysis -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>🔬</span> Sensitivity Analysis
      </h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">How changes in price or costs affect your break-even point</p>
      
      <div class="space-y-4">
        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <h4 class="font-semibold text-green-900 dark:text-green-100 mb-2">+10% Price Increase</h4>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">New Break-Even</p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">${result.sensitivity.price10PercentIncrease.units.toLocaleString()}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Impact</p>
              <p class="text-sm font-semibold text-green-700 dark:text-green-300">${result.sensitivity.price10PercentIncrease.improvement}</p>
            </div>
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">
            💡 Raising prices is often the fastest way to improve profitability
          </p>
        </div>
        
        <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <h4 class="font-semibold text-red-900 dark:text-red-100 mb-2">-10% Price Decrease</h4>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">New Break-Even</p>
              <p class="text-2xl font-bold text-red-600 dark:text-red-400">${result.sensitivity.price10PercentDecrease.units.toLocaleString()}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Impact</p>
              <p class="text-sm font-semibold text-red-700 dark:text-red-300">${result.sensitivity.price10PercentDecrease.impact}</p>
            </div>
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">
            ⚠️ Price cuts require significant volume increases to maintain profitability
          </p>
        </div>
        
        <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <h4 class="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">+10% Fixed Cost Increase</h4>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">New Break-Even</p>
              <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">${result.sensitivity.costs10PercentIncrease.units.toLocaleString()}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Impact</p>
              <p class="text-sm font-semibold text-yellow-700 dark:text-yellow-300">${result.sensitivity.costs10PercentIncrease.impact}</p>
            </div>
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">
            💡 Control fixed costs - they affect every unit you sell
          </p>
        </div>
      </div>
    </div>
    
    <!-- Recommendations -->
    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
      <h2 class="text-xl font-semibold mb-3 flex items-center gap-2">
        <span>💡</span> Key Insights & Recommendations
      </h2>
      
      <div class="space-y-3">
        ${result.recommendations.map(rec => `
          <div class="bg-white dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300">
            ${rec}
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  resultsSection.classList.remove('hidden');
}

function renderBreakEvenChart(result: BreakEvenResult, input: BreakEvenInput): string {
  const canvasId = `break-even-chart-${Date.now()}`;
  
  setTimeout(() => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.offsetWidth;
    const height = 400;
    canvas.width = width;
    canvas.height = height;
    
    const padding = { top: 40, right: 40, bottom: 60, left: 80 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Calculate chart data
    const maxUnits = Math.max(result.breakEven.units * 2, input.currentSalesUnits || 0, 100);
    const unitsRange = Array.from({ length: 50 }, (_, i) => Math.floor((maxUnits / 50) * i));
    
    const totalCostLine = unitsRange.map(units => ({
      units,
      cost: input.fixedCosts + (units * input.variableCostPerUnit),
    }));
    
    const totalRevenueLine = unitsRange.map(units => ({
      units,
      revenue: units * input.sellingPricePerUnit,
    }));
    
    const maxValue = Math.max(
      ...totalCostLine.map(d => d.cost),
      ...totalRevenueLine.map(d => d.revenue)
    );
    
    // Clear and draw background
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('color-scheme') === 'dark' ? '#1f2937' : '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      
      // Y-axis labels
      const value = maxValue * (1 - i / 5);
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`$${(value / 1000).toFixed(0)}k`, padding.left - 10, y + 4);
    }
    
    // X-axis labels
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const units = (maxUnits / 5) * i;
      const x = padding.left + (chartWidth * i) / 5;
      ctx.fillText(Math.round(units).toString(), x, height - padding.bottom + 25);
    }
    
    // Axis titles
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Units Sold', width / 2, height - 10);
    
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Revenue / Costs ($)', 0, 0);
    ctx.restore();
    
    // Draw total cost line (red)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    totalCostLine.forEach((point, i) => {
      const x = padding.left + (chartWidth * point.units) / maxUnits;
      const y = padding.top + chartHeight - (chartHeight * point.cost) / maxValue;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // Draw total revenue line (green)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    totalRevenueLine.forEach((point, i) => {
      const x = padding.left + (chartWidth * point.units) / maxUnits;
      const y = padding.top + chartHeight - (chartHeight * point.revenue) / maxValue;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // Mark break-even point
    const breakEvenX = padding.left + (chartWidth * result.breakEven.units) / maxUnits;
    const breakEvenY = padding.top + chartHeight - (chartHeight * result.breakEven.revenue) / maxValue;
    
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(breakEvenX, breakEvenY, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Break-even label
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Break-Even: ${result.breakEven.units} units`, breakEvenX + 10, breakEvenY - 10);
    
    // Legend
    const legendY = 20;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(padding.left, legendY, 20, 3);
    ctx.fillStyle = '#1f2937';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Total Costs', padding.left + 25, legendY + 3);
    
    ctx.fillStyle = '#10b981';
    ctx.fillRect(padding.left + 120, legendY, 20, 3);
    ctx.fillStyle = '#1f2937';
    ctx.fillText('Total Revenue', padding.left + 145, legendY + 3);
    
    // Profit/Loss zones
    ctx.fillStyle = '#10b98120';
    ctx.fillRect(breakEvenX, padding.top, width - padding.right - breakEvenX, chartHeight);
    ctx.fillStyle = '#1f2937';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PROFIT ZONE', (breakEvenX + width - padding.right) / 2, padding.top + 20);
    
    ctx.fillStyle = '#ef444420';
    ctx.fillRect(padding.left, padding.top, breakEvenX - padding.left, chartHeight);
    ctx.fillStyle = '#1f2937';
    ctx.fillText('LOSS ZONE', (padding.left + breakEvenX) / 2, padding.top + 20);
  }, 100);
  
  return `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <span>📈</span> Break-Even Chart
      </h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Visual representation of costs, revenue, and profit zones</p>
      <canvas id="${canvasId}" class="w-full" style="max-width: 100%; height: 400px;"></canvas>
      <div class="mt-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>• <strong>Red line</strong> = Total Costs (Fixed + Variable)</p>
        <p>• <strong>Green line</strong> = Total Revenue</p>
        <p>• <strong>Blue dot</strong> = Break-Even Point (where revenue = costs)</p>
        <p>• <strong>Left of break-even</strong> = Loss Zone (costs exceed revenue)</p>
        <p>• <strong>Right of break-even</strong> = Profit Zone (revenue exceeds costs)</p>
      </div>
    </div>
  `;
}

// ============================================================================
// FORM HANDLING
// ============================================================================

function parseFormInput(form: HTMLFormElement): BreakEvenInput {
  const formData = new FormData(form);
  return {
    fixedCosts: coerceNumber(formData.get('fixedCosts'), 0),
    variableCostPerUnit: coerceNumber(formData.get('variableCostPerUnit'), 0),
    sellingPricePerUnit: coerceNumber(formData.get('sellingPricePerUnit'), 0),
    currentSalesUnits: coerceNumber(formData.get('currentSalesUnits'), undefined),
    targetProfit: coerceNumber(formData.get('targetProfit'), undefined),
    expectedGrowthRate: coerceNumber(formData.get('expectedGrowthRate'), undefined),
  };
}

function validateInput(input: BreakEvenInput): void {
  if (input.fixedCosts < 0) throw new Error('Fixed costs cannot be negative');
  if (input.variableCostPerUnit < 0) throw new Error('Variable cost per unit cannot be negative');
  if (input.sellingPricePerUnit <= 0) throw new Error('Selling price must be positive');
  if (input.variableCostPerUnit >= input.sellingPricePerUnit) {
    throw new Error('Selling price must be greater than variable cost (otherwise you lose money on every unit!)');
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

function initializeBreakEven(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement;
  const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement;
  const resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;

  if (!form) {
    console.error('Form not found');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    hideError();
    showLoading(calculateBtn);

    try {
      const input = parseFormInput(form);
      validateInput(input);
      
      const result = calculateBreakEven(input);
      displayResults(result, input);
      
      window.dispatchEvent(new CustomEvent('calculator-completed', {
        detail: { calculatorId: 'break-even', result, formData: input },
      }));
      
      if (typeof gtag !== 'undefined') {
        gtag('event', 'break_even_calculated', {
          break_even_units: result.breakEven.units,
          contribution_margin: result.breakEven.contributionMarginRatio,
        });
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Calculation failed');
      console.error('Break-even error:', error);
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
  document.addEventListener('DOMContentLoaded', initializeBreakEven);
} else {
  initializeBreakEven();
}

