/**
 * Display/rendering functions for Mortgage Scenario Planning Calculator
 */

import type { Scenario, MortgageScenarioPlanningInput } from './types';
import { SCENARIO_COLORS } from './constants';
import { formatTimeDisplay, calculateDownPaymentPercent } from './utils';
import { 
  renderPaymentBreakdownChart, 
  renderTotalCostComparisonChart,
  renderPayoffTimelineChart,
  renderEquityGrowthChart,
  renderMonthlyBreakdownCharts
} from './charts';
import { parseFormInput } from './form-handling';
import { formatCurrency } from '../../utils/calculator-utilities';

/**
 * Display calculation results
 * @param scenarios - Array of calculated scenarios
 * @param resultsDiv - Optional results container element (for initialization)
 * @param chartContainer - Optional chart container element (for initialization)  
 * @param formData - Optional form data (for loading cached results)
 */
export function displayResults(
  scenarios: Scenario[],
  resultsDiv?: HTMLElement | null,
  _chartContainer?: HTMLElement | null,
  formData?: MortgageScenarioPlanningInput
): void {
  const resultsSection = document.getElementById('results-section');
  const summaryCards = document.getElementById('summary-cards');
  const resultsContent = resultsDiv || document.getElementById('results-container');
  
  if (!resultsSection || !summaryCards || !resultsContent) return;
  
  // Separate base scenarios from refinance scenarios
  const baseScenarios = scenarios.filter(s => !s.name.includes('Refinance'));
  const refinanceScenarios = scenarios.filter(s => s.name.includes('Refinance'));
  
  // Find best scenario (lowest total cost)
  const bestScenario = scenarios.reduce((best, current) => 
    current.totalCost < best.totalCost ? current : best
  );
  
  // Render summary cards - show all base scenarios
  summaryCards.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 ${baseScenarios.length > 2 ? 'lg:grid-cols-3' : ''} ${baseScenarios.length > 3 ? 'xl:grid-cols-4' : ''} gap-4">
      ${baseScenarios.map((scenario, idx) => 
        renderSummaryCard(scenario, idx, scenario.name === bestScenario.name)
      ).join('')}
    </div>
  `;
  
  // Get affordability data if income provided - use passed formData or parse from form
  let parsedFormData = formData;
  if (!parsedFormData) {
    const input = document.getElementById('calculator-form') as HTMLFormElement;
    parsedFormData = input ? parseFormInput(input) : undefined;
  }
  const hasIncome = parsedFormData?.grossMonthlyIncome && parsedFormData.grossMonthlyIncome > 0;
  
  // Render detailed comparison with separate sections for base vs refinance
  resultsContent.innerHTML = `
    ${hasIncome && parsedFormData ? renderAffordabilityAnalysis(baseScenarios, parsedFormData) : ''}
    
    <!-- Visual Charts Section -->
    <div class="space-y-6 mb-6">
      ${renderTotalCostComparisonChart(baseScenarios)}
      ${renderMonthlyBreakdownCharts(baseScenarios)}
      ${renderPayoffTimelineChart(baseScenarios)}
      ${renderPaymentBreakdownChart(baseScenarios)}
      ${renderEquityGrowthChart(baseScenarios)}
    </div>
    
    <!-- All Scenarios Detailed Comparison -->
    <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <span>📋</span> All Scenarios Comparison
      </h2>
      <p class="fa-script-copy-muted mb-4">
        Comparing ${baseScenarios.length} mortgage scenarios side-by-side
      </p>
      
      <!-- Comparison Table for Many Scenarios -->
      ${baseScenarios.length > 2 ? renderComparisonTable(baseScenarios, bestScenario) : ''}
      
      <!-- Card Grid -->
      <div class="grid grid-cols-1 ${baseScenarios.length === 2 ? 'md:grid-cols-2' : baseScenarios.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3'} gap-6 ${baseScenarios.length > 2 ? 'mt-6' : ''}">
        ${baseScenarios.map(scenario => 
          renderDetailedScenarioCard(scenario, scenario.name === bestScenario.name && baseScenarios.includes(bestScenario))
        ).join('')}
      </div>
    </div>
    
    ${refinanceScenarios.length > 0 ? renderRefinanceSection(refinanceScenarios, bestScenario) : ''}
    
    <!-- Comprehensive Analysis Section -->
    <div class="space-y-6">
      ${renderKeyInsights(baseScenarios, refinanceScenarios, bestScenario, scenarios)}
      ${renderFinancialRecommendations(baseScenarios, refinanceScenarios, bestScenario)}
      ${renderImportantConsiderations(baseScenarios)}
    </div>
  `;
  
  resultsSection.classList.remove('hidden');
}

/**
 * Render summary card for a scenario
 */
export function renderSummaryCard(scenario: Scenario, idx: number, isBest: boolean): string {
  const colorSet = SCENARIO_COLORS[scenario.index ?? idx];
  const bgColor = isBest 
    ? 'bg-gradient-to-br from-emerald-600 to-emerald-600' 
    : idx === 0 
      ? `bg-gradient-to-br from-${colorSet.bg}-600 to-${colorSet.bg}-700` 
      : 'bg-white/90 dark:bg-slate-950/40';
  const textColor = (isBest || idx === 0) ? 'text-white' : 'text-slate-900 dark:text-white';
  const borderClass = isBest 
    ? 'border-4 border-emerald-400 shadow-2xl' 
    : 'border border-slate-300 dark:border-slate-700 shadow-lg';
  const time = formatTimeDisplay(scenario.payoffMonths);
  
  return `
    <div class="${bgColor} rounded-xl p-6 ${borderClass} transform hover:scale-105 transition-all duration-200">
      ${isBest ? '<div class="flex items-center gap-2 mb-3"><span class="bg-white text-emerald-600 px-3 py-1 rounded-full text-xs font-bold">✓ BEST VALUE</span></div>' : ''}
      <h3 class="text-lg font-bold ${textColor} mb-4">${scenario.name}</h3>
      
      <div class="space-y-3">
        <div>
          <p class="text-xs ${isBest || idx === 0 ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'} mb-1">Monthly Payment${scenario.hasPMI ? ' + PMI' : ''}</p>
          <p class="text-2xl font-bold ${textColor}">${formatCurrency(scenario.monthlyPaymentWithPMI)}</p>
          ${scenario.hasPMI ? `<p class="text-xs ${isBest || idx === 0 ? 'text-white/60' : 'text-slate-500 dark:text-slate-400'}">${formatCurrency(scenario.monthlyPayment)} + ${formatCurrency(scenario.pmiMonthly)} PMI</p>` : ''}
        </div>
        
        <div class="grid grid-cols-2 gap-3 pt-3 border-t ${isBest || idx === 0 ? 'border-white/20' : 'border-slate-200 dark:border-slate-800'}">
          <div>
            <p class="text-xs ${isBest || idx === 0 ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'} mb-1">Total Interest</p>
            <p class="text-sm font-semibold ${textColor}">${formatCurrency(scenario.totalInterest)}</p>
          </div>
          <div>
            <p class="text-xs ${isBest || idx === 0 ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'} mb-1">Payoff Time</p>
            <p class="text-sm font-semibold ${textColor}">${time.display}</p>
          </div>
        </div>
        
        <div class="pt-3 border-t ${isBest || idx === 0 ? 'border-white/20' : 'border-slate-200 dark:border-slate-800'}">
          <p class="text-xs ${isBest || idx === 0 ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'} mb-1">Total Cost</p>
          <p class="text-xl font-bold ${textColor}">${formatCurrency(scenario.totalCost)}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render detailed scenario card
 */
export function renderDetailedScenarioCard(scenario: Scenario, isBest: boolean): string {
  const time = formatTimeDisplay(scenario.payoffMonths);
  const downPercent = calculateDownPaymentPercent(scenario);
  
  return `
    <div class="border-2 ${isBest ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-800'} rounded-lg p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white">${scenario.name}</h3>
        ${isBest ? '<span class="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold">✓ BEST</span>' : ''}
      </div>
      
      <div class="space-y-4">
        <!-- Loan Details -->
        <div class="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
          <h4 class="fa-script-note font-semibold uppercase mb-3">Loan Details</h4>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="fa-script-copy-muted">Loan Amount</span>
              <span class="text-sm font-semibold">${formatCurrency(scenario.principal)}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="fa-script-copy-muted">Down Payment</span>
              <span class="text-sm font-semibold">${formatCurrency(scenario.downPayment)} (${downPercent}%)</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="fa-script-copy-muted">Interest Rate</span>
              <span class="text-sm font-semibold">${scenario.rate.toFixed(2)}%</span>
            </div>
            ${scenario.closingCosts > 0 ? `
              <div class="flex justify-between items-center text-violet-600 dark:text-violet-400">
                <span class="text-sm">Closing Costs</span>
                <span class="text-sm font-semibold">${formatCurrency(scenario.closingCosts)}</span>
              </div>
            ` : ''}
            ${scenario.extraPayment > 0 ? `
              <div class="flex justify-between items-center text-violet-600 dark:text-violet-400">
                <span class="text-sm">Extra Payment</span>
                <span class="text-sm font-semibold">+${formatCurrency(scenario.extraPayment)}/mo</span>
              </div>
            ` : ''}
          </div>
        </div>
        
        <!-- Payment Information -->
        <div>
          <h4 class="fa-script-note font-semibold uppercase mb-3">Monthly Payment</h4>
          <p class="text-3xl font-bold text-slate-900 dark:text-white mb-1">${formatCurrency(scenario.monthlyPaymentWithPMI)}</p>
          ${scenario.hasPMI ? `
            <p class="fa-script-note mb-1">
              P&I: ${formatCurrency(scenario.monthlyPayment)} + PMI: ${formatCurrency(scenario.pmiMonthly)}
            </p>
            <p class="text-xs text-orange-600 dark:text-orange-400">
              ⚠️ PMI until month ${scenario.pmiDropMonth} (${Math.round(scenario.pmiDropMonth / 12)}y) - Total: ${formatCurrency(scenario.pmiTotalCost)}
            </p>
          ` : `
            <p class="fa-script-note">Base: ${formatCurrency(scenario.monthlyPayment - scenario.extraPayment)} + Extra: ${formatCurrency(scenario.extraPayment)}</p>
          `}
        </div>
        
        <!-- Cost Breakdown -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-3">
            <p class="fa-script-note mb-1">Total Interest</p>
            <p class="text-lg font-bold text-violet-600 dark:text-violet-400">${formatCurrency(scenario.totalInterest)}</p>
          </div>
          <div class="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-3">
            <p class="fa-script-note mb-1">Total Cost</p>
            <p class="text-lg font-bold text-violet-600 dark:text-violet-400">${formatCurrency(scenario.totalCost)}</p>
          </div>
        </div>
        
        <!-- Timeline -->
        <div class="bg-linear-to-r from-violet-50 to-violet-50 dark:from-violet-900/20 dark:to-violet-900/20 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="fa-script-note mb-1">Payoff Timeline</p>
              <p class="text-xl font-bold text-slate-900 dark:text-white">${time.years} years ${time.months} months</p>
              <p class="fa-script-note mt-1">${scenario.payoffMonths} total payments</p>
            </div>
            <div class="text-4xl">⏱️</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render affordability analysis section
 */
export function renderAffordabilityAnalysis(baseScenarios: Scenario[], formData: MortgageScenarioPlanningInput): string {
  if (!formData.grossMonthlyIncome || formData.grossMonthlyIncome <= 0) return '';
  
  return `
    <!-- Affordability Analysis -->
    <div class="bg-linear-to-br from-emerald-50 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-900/20 rounded-lg p-6 mb-6 border border-emerald-200 dark:border-emerald-700">
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <span>💵</span> Affordability Analysis
      </h2>
      <p class="fa-script-copy-muted mb-4">Based on your gross monthly income of ${formatCurrency(formData.grossMonthlyIncome)}</p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 ${baseScenarios.length > 2 ? 'lg:grid-cols-3' : ''} gap-4">
        ${baseScenarios.map(scenario => {
          const grossMonthlyIncome = formData?.grossMonthlyIncome ?? 0;
          const dtiRatio = grossMonthlyIncome > 0
            ? (scenario.monthlyPaymentWithPMI / grossMonthlyIncome) * 100
            : 0;
          const isAffordable = dtiRatio <= 28;
          const comfortLevel = dtiRatio <= 20 ? 'Excellent' : dtiRatio <= 28 ? 'Good' : dtiRatio <= 35 ? 'Tight' : 'Risky';
          const colorClass = dtiRatio <= 28 ? 'text-emerald-600 dark:text-emerald-400' : dtiRatio <= 35 ? 'text-yellow-600 dark:text-yellow-400' : 'text-rose-600 dark:text-rose-400';
          
          return `
            <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg p-4 border-2 ${isAffordable ? 'border-emerald-300 dark:border-emerald-700' : 'border-yellow-300 dark:border-yellow-700'}">
              <h4 class="font-semibold text-slate-900 dark:text-white mb-3 truncate" title="${scenario.name}">${scenario.name}</h4>
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="fa-script-copy-muted">Monthly Payment</span>
                  <span class="font-semibold">${formatCurrency(scenario.monthlyPaymentWithPMI)}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="fa-script-copy-muted">DTI Ratio</span>
                  <span class="font-bold ${colorClass}">${dtiRatio.toFixed(1)}%</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="fa-script-copy-muted">Comfort Level</span>
                  <span class="font-semibold ${colorClass}">${comfortLevel}</span>
                </div>
                <div class="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <p class="fa-script-note">
                    ${isAffordable ? 
                      '✓ Within recommended 28% limit' : 
                      '⚠️ Exceeds 28% DTI limit'}
                  </p>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Render comparison table for many scenarios
 */
export function renderComparisonTable(scenarios: Scenario[], bestScenario: Scenario): string {
  return `
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
        <thead class="bg-slate-50 dark:bg-slate-900/60">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Scenario</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Down Payment</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Rate</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Monthly</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Total Interest</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Total Cost</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Payoff</th>
          </tr>
        </thead>
        <tbody class="bg-white/90 dark:bg-slate-950/40 divide-y divide-slate-200 dark:divide-slate-800">
          ${scenarios.map(scenario => {
            const isBest = scenario.name === bestScenario.name;
            const rowClass = isBest ? 'bg-emerald-50 dark:bg-emerald-900/20 font-semibold' : '';
            const time = formatTimeDisplay(scenario.payoffMonths);
            const downPercent = calculateDownPaymentPercent(scenario);
            
            return `
              <tr class="${rowClass}">
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                  ${scenario.name}
                  ${isBest ? '<span class="fa-badge-success ml-2">BEST</span>' : ''}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right">
                  ${formatCurrency(scenario.downPayment)} (${downPercent}%)
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right">
                  ${scenario.rate.toFixed(2)}%
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                  ${formatCurrency(scenario.monthlyPaymentWithPMI)}
                  ${scenario.hasPMI ? '<span class="text-orange-500 text-xs">+PMI</span>' : ''}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right">
                  ${formatCurrency(scenario.totalInterest)}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                  ${formatCurrency(scenario.totalCost)}
                  ${scenario.closingCosts > 0 ? `<span class="text-xs text-slate-500">(+${formatCurrency(scenario.closingCosts)} closing)</span>` : ''}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right">
                  ${time.display}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Render refinance section
 */
export function renderRefinanceSection(refinanceScenarios: Scenario[], bestScenario: Scenario): string {
  return `
    <!-- Refinance Scenarios Comparison -->
    <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Updated Scenarios with Refinancing</h2>
      <p class="fa-script-copy-muted mb-4">
        These scenarios assume you refinance after 5 years at the new rate.
      </p>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead class="bg-slate-50 dark:bg-slate-900/60">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Scenario</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">New Monthly Payment</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Total Interest</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Total Cost</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Payoff Time</th>
            </tr>
          </thead>
          <tbody class="bg-white/90 dark:bg-slate-950/40 divide-y divide-slate-200 dark:divide-slate-800">
            ${refinanceScenarios.map(scenario => {
              const isBest = scenario.name === bestScenario.name && refinanceScenarios.includes(bestScenario);
              const rowClass = isBest ? 'bg-emerald-50 dark:bg-emerald-900/20 font-semibold' : '';
              const time = formatTimeDisplay(scenario.payoffMonths);
              
              return `
                <tr class="${rowClass}">
                  <td class="px-4 py-3 whitespace-nowrap text-sm">
                    ${scenario.name}
                    ${isBest ? '<span class="fa-badge-success ml-2">BEST</span>' : ''}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                    ${formatCurrency(scenario.monthlyPayment)}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-right">
                    ${formatCurrency(scenario.totalInterest)}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                    ${formatCurrency(scenario.totalCost)}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-right">
                    ${time.display}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * Render key insights section
 */
export function renderKeyInsights(
  baseScenarios: Scenario[], 
  refinanceScenarios: Scenario[], 
  bestScenario: Scenario, 
  allScenarios: Scenario[]
): string {
  return `
    <!-- Key Insights -->
    <div class="bg-linear-to-br from-violet-50 to-violet-50 dark:from-violet-900/20 dark:to-violet-900/20 rounded-lg p-6 border border-violet-200 dark:border-violet-700">
      <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
        <span>📊</span> Key Insights & Analysis
      </h3>
      
      <div class="space-y-4">
        ${baseScenarios.length === 2 ? renderTwoScenarioComparison(baseScenarios) : renderMultiScenarioComparison(baseScenarios, bestScenario)}
        
        <!-- Best Value Analysis -->
        <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg p-4 border-l-4 border-emerald-500">
          <h4 class="font-semibold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
            <span>✓</span> Recommended Option
          </h4>
          <p class="fa-script-copy-strong">
            Based on total cost analysis, <strong>${bestScenario.name}</strong> provides the best overall value
            ${Math.max(...allScenarios.map(s => s.totalCost)) - bestScenario.totalCost > 0 ? 
              `, saving you <span class="font-bold text-emerald-600 dark:text-emerald-400">${formatCurrency(Math.max(...allScenarios.map(s => s.totalCost)) - bestScenario.totalCost)}</span> compared to the most expensive option` : ''}.
          </p>
          ${baseScenarios.length > 1 ? `
            <p class="fa-script-note mt-2">
              💡 Savings represent ${((1 - bestScenario.totalCost / Math.max(...baseScenarios.map(s => s.totalCost))) * 100).toFixed(1)}% reduction in total cost.
            </p>
          ` : ''}
        </div>
        
        ${refinanceScenarios.length > 0 && baseScenarios.length > 0 ? `
          <!-- Refinancing Analysis -->
          <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg p-4 border-l-4 border-violet-500">
            <h4 class="font-semibold text-violet-600 dark:text-violet-400 mb-2 flex items-center gap-2">
              <span>🔄</span> Refinancing Analysis
            </h4>
            <p class="fa-script-copy-strong mb-3">
              Refinancing after 5 years ${findRefinanceSavings(baseScenarios[0], refinanceScenarios[0])}.
            </p>
            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 bg-violet-50 dark:bg-violet-900/20 rounded">
                <p class="fa-script-note mb-1">Potential Savings</p>
                <p class="text-lg font-bold text-violet-600 dark:text-violet-400">
                  ${formatCurrency(Math.max(0, baseScenarios[0].totalCost - refinanceScenarios[0].totalCost))}
                </p>
              </div>
              <div class="p-3 bg-violet-50 dark:bg-violet-900/20 rounded">
                <p class="fa-script-note mb-1">ROI from Refinancing</p>
                <p class="text-lg font-bold text-violet-600 dark:text-violet-400">
                  ${((1 - refinanceScenarios[0].totalCost / baseScenarios[0].totalCost) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            <p class="fa-script-note mt-3">
              ⚠️ Note: This doesn't include refinancing closing costs, which typically range from 2-5% of the loan amount.
            </p>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Render two-scenario comparison
 */
function renderTwoScenarioComparison(baseScenarios: Scenario[]): string {
  if (baseScenarios.length !== 2) return '';
  
  return `
    <!-- Options Comparison - Lead with this -->
    <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg p-5 border-2 border-violet-300 dark:border-violet-600">
      <h4 class="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <span>⚖️</span> Comparing Your Options
      </h4>
      
      <!-- Cost Difference Summary -->
      <div class="bg-linear-to-r from-violet-50 to-violet-50 dark:from-violet-900/20 dark:to-violet-900/20 rounded-lg p-5 mb-4">
        <div class="flex items-center justify-between mb-3">
          <h5 class="font-semibold text-slate-900 dark:text-white">Total Cost Over Loan Life</h5>
          <span class="text-2xl font-bold ${baseScenarios[0].totalCost < baseScenarios[1].totalCost ? 'text-emerald-600' : 'text-rose-600'}">
            ${baseScenarios[0].totalCost < baseScenarios[1].totalCost ? '▼' : '▲'} ${formatCurrency(Math.abs(baseScenarios[0].totalCost - baseScenarios[1].totalCost))}
          </span>
        </div>
        <p class="fa-script-copy-strong">
          <strong>${baseScenarios[0].totalCost < baseScenarios[1].totalCost ? baseScenarios[0].name : baseScenarios[1].name}</strong> 
          costs less than 
          <strong>${baseScenarios[0].totalCost < baseScenarios[1].totalCost ? baseScenarios[1].name : baseScenarios[0].name}</strong> 
          by this amount over the full loan term.
        </p>
      </div>
      
      <!-- Detailed Comparison Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="text-center p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-700">
          <p class="fa-script-note font-medium uppercase mb-2">Monthly Payment</p>
          <p class="text-2xl font-bold text-slate-900 dark:text-white mb-1">${formatCurrency(Math.abs(baseScenarios[0].monthlyPayment - baseScenarios[1].monthlyPayment))}</p>
          <p class="fa-script-note">
            ${baseScenarios[0].monthlyPayment < baseScenarios[1].monthlyPayment ? 
              `${baseScenarios[0].name} pays less per month` : 
              `${baseScenarios[1].name} pays less per month`}
          </p>
        </div>
        <div class="text-center p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-700">
          <p class="fa-script-note font-medium uppercase mb-2">Total Interest</p>
          <p class="text-2xl font-bold text-slate-900 dark:text-white mb-1">${formatCurrency(Math.abs(baseScenarios[0].totalInterest - baseScenarios[1].totalInterest))}</p>
          <p class="fa-script-note">
            ${baseScenarios[0].totalInterest < baseScenarios[1].totalInterest ? 
              `${baseScenarios[0].name} pays less interest` : 
              `${baseScenarios[1].name} pays less interest`}
          </p>
        </div>
        <div class="text-center p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-700">
          <p class="fa-script-note font-medium uppercase mb-2">Payoff Timeline</p>
          <p class="text-2xl font-bold text-slate-900 dark:text-white mb-1">${Math.abs(baseScenarios[0].payoffMonths - baseScenarios[1].payoffMonths)} mo</p>
          <p class="fa-script-note">
            ${baseScenarios[0].payoffMonths < baseScenarios[1].payoffMonths ? 
              `${baseScenarios[0].name} pays off faster` : 
              `${baseScenarios[1].name} pays off faster`}
          </p>
        </div>
      </div>
      
      <!-- Detailed Comparison Write-up -->
      <div class="bg-linear-to-r from-slate-50 to-slate-50 dark:from-slate-900 dark:to-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
        <h5 class="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <span>📝</span> Understanding the Tradeoffs
        </h5>
        <div class="space-y-3 fa-script-copy-strong">
          ${generateDetailedComparison(baseScenarios[0], baseScenarios[1])}
          <p class="fa-script-copy-muted leading-relaxed">
            ${generateComparisonInsight(baseScenarios[0], baseScenarios[1])}
          </p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render multi-scenario comparison
 */
function renderMultiScenarioComparison(baseScenarios: Scenario[], _bestScenario: Scenario): string {
  if (baseScenarios.length <= 2) return '';
  
  // Find cheapest and most expensive
  const sortedByTotalCost = [...baseScenarios].sort((a, b) => a.totalCost - b.totalCost);
  const cheapest = sortedByTotalCost[0];
  const mostExpensive = sortedByTotalCost[sortedByTotalCost.length - 1];
  
  // Find lowest monthly and highest monthly
  const sortedByMonthly = [...baseScenarios].sort((a, b) => a.monthlyPaymentWithPMI - b.monthlyPaymentWithPMI);
  const lowestMonthly = sortedByMonthly[0];
  const highestMonthly = sortedByMonthly[sortedByMonthly.length - 1];
  
  return `
    <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg p-5 border-2 border-violet-300 dark:border-violet-600">
      <h4 class="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <span>⚖️</span> Comparing ${baseScenarios.length} Scenarios
      </h4>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <!-- Best Total Cost -->
        <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-700">
          <p class="fa-script-note font-medium uppercase mb-2">🏆 Lowest Total Cost</p>
          <p class="font-bold text-emerald-600 dark:text-emerald-400">${cheapest.name}</p>
          <p class="text-xl font-bold text-slate-900 dark:text-white">${formatCurrency(cheapest.totalCost)}</p>
          <p class="fa-script-note mt-1">
            Saves ${formatCurrency(mostExpensive.totalCost - cheapest.totalCost)} vs most expensive
          </p>
        </div>
        
        <!-- Lowest Monthly Payment -->
        <div class="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4 border border-violet-200 dark:border-violet-700">
          <p class="fa-script-note font-medium uppercase mb-2">💵 Lowest Monthly</p>
          <p class="font-bold text-violet-600 dark:text-violet-400">${lowestMonthly.name}</p>
          <p class="text-xl font-bold text-slate-900 dark:text-white">${formatCurrency(lowestMonthly.monthlyPaymentWithPMI)}/mo</p>
          <p class="fa-script-note mt-1">
            ${formatCurrency(highestMonthly.monthlyPaymentWithPMI - lowestMonthly.monthlyPaymentWithPMI)} less than highest
          </p>
        </div>
      </div>
      
      <!-- Range Summary -->
      <div class="bg-slate-50 dark:bg-slate-900/60/50 rounded-lg p-4">
        <h5 class="font-semibold text-slate-900 dark:text-white mb-3">📊 Range Analysis</h5>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="fa-script-copy-muted">Monthly Payment Range:</span>
            <span class="font-medium">${formatCurrency(lowestMonthly.monthlyPaymentWithPMI)} - ${formatCurrency(highestMonthly.monthlyPaymentWithPMI)}</span>
          </div>
          <div class="flex justify-between">
            <span class="fa-script-copy-muted">Total Cost Range:</span>
            <span class="font-medium">${formatCurrency(cheapest.totalCost)} - ${formatCurrency(mostExpensive.totalCost)}</span>
          </div>
          <div class="flex justify-between">
            <span class="fa-script-copy-muted">Potential Savings:</span>
            <span class="font-bold text-emerald-600 dark:text-emerald-400">${formatCurrency(mostExpensive.totalCost - cheapest.totalCost)}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render financial recommendations
 */
export function renderFinancialRecommendations(
  baseScenarios: Scenario[], 
  refinanceScenarios: Scenario[], 
  bestScenario: Scenario
): string {
  return `
    <!-- Financial Recommendations -->
    <div class="bg-linear-to-br from-emerald-50 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-900/20 rounded-lg p-6 border border-emerald-200 dark:border-emerald-700">
      <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
        <span>💡</span> Financial Recommendations
      </h3>
      
      <div class="space-y-3">
        ${generateRecommendations(baseScenarios, refinanceScenarios, bestScenario)}
      </div>
    </div>
  `;
}

/**
 * Render important considerations
 */
export function renderImportantConsiderations(baseScenarios: Scenario[]): string {
  const hasClosingCosts = baseScenarios.some(s => s.closingCosts > 0);
  
  return `
    <!-- Important Considerations -->
    <div class="bg-linear-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-700">
      <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
        <span>⚠️</span> Important Considerations
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-2">
          <h4 class="font-semibold text-sm text-slate-900 dark:text-white">✓ Factors Included</h4>
          <ul class="space-y-1 list-disc list-inside fa-script-note">
            <li>Principal and interest payments</li>
            <li>Total interest over loan term</li>
            <li>Impact of extra payments</li>
            ${hasClosingCosts ? '<li>Closing costs</li>' : ''}
            <li>PMI (if down payment < 20%)</li>
            <li>Refinancing scenarios (if selected)</li>
          </ul>
        </div>
        
        <div class="space-y-2">
          <h4 class="font-semibold text-sm text-slate-900 dark:text-white">⚠️ Not Included</h4>
          <ul class="space-y-1 list-disc list-inside fa-script-note">
            <li>Property taxes and insurance (PITI)</li>
            ${!hasClosingCosts ? '<li>Closing costs and origination fees</li>' : ''}
            <li>HOA fees or maintenance costs</li>
            <li>Home appreciation or depreciation</li>
            <li>Tax benefits from mortgage interest</li>
          </ul>
        </div>
      </div>
      
      <div class="mt-4 p-3 bg-white/90 dark:bg-slate-950/40 rounded-lg">
        <p class="fa-script-note">
          <strong>Pro Tip:</strong> Your actual monthly housing payment will be higher when including taxes, insurance, and other costs. 
          Budget for 20-30% more than the mortgage payment shown here.
        </p>
      </div>
    </div>
  `;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateDetailedComparison(optionA: Scenario, optionB: Scenario): string {
  const monthlyDiff = Math.abs(optionA.monthlyPayment - optionB.monthlyPayment);
  const interestDiff = Math.abs(optionA.totalInterest - optionB.totalInterest);
  const totalDiff = Math.abs(optionA.totalCost - optionB.totalCost);
  const timeDiff = Math.abs(optionA.payoffMonths - optionB.payoffMonths);
  
  const lowerMonthly = optionA.monthlyPayment < optionB.monthlyPayment ? optionA.name : optionB.name;
  const lowerInterest = optionA.totalInterest < optionB.totalInterest ? optionA.name : optionB.name;
  const lowerTotal = optionA.totalCost < optionB.totalCost ? optionA.name : optionB.name;
  const fasterPayoff = optionA.payoffMonths < optionB.payoffMonths ? optionA.name : optionB.name;
  
  const downPaymentA = calculateDownPaymentPercent(optionA);
  const downPaymentB = calculateDownPaymentPercent(optionB);
  
  let analysis = '<ul class="list-disc list-inside space-y-2">';
  
  // Down payment comparison
  analysis += `
    <li><strong>Down Payment:</strong> ${optionA.name} puts down ${downPaymentA}% (${formatCurrency(optionA.downPayment)}) vs 
    ${optionB.name} at ${downPaymentB}% (${formatCurrency(optionB.downPayment)}). 
    ${parseFloat(downPaymentA) >= 20 && parseFloat(downPaymentB) < 20 ? `${optionA.name} avoids PMI, while ${optionB.name} will require it.` : 
      parseFloat(downPaymentB) >= 20 && parseFloat(downPaymentA) < 20 ? `${optionB.name} avoids PMI, while ${optionA.name} will require it.` : 
      parseFloat(downPaymentA) < 20 && parseFloat(downPaymentB) < 20 ? 'Both options require PMI since down payments are under 20%.' : 
      'Both options avoid PMI with 20%+ down payments.'}</li>
  `;
  
  // Interest rate comparison
  const rateDiff = Math.abs(optionA.rate - optionB.rate);
  if (rateDiff >= 0.1) {
    analysis += `
      <li><strong>Interest Rate:</strong> ${rateDiff.toFixed(2)}% rate difference translates to ${formatCurrency(interestDiff)} in total interest. 
      ${lowerInterest} has the ${Math.min(optionA.rate, optionB.rate).toFixed(2)}% rate, 
      resulting in significant long-term savings.</li>
    `;
  }
  
  // Monthly payment tradeoff
  if (monthlyDiff >= 100) {
    const monthlyPerYear = monthlyDiff * 12;
    analysis += `
      <li><strong>Monthly Budget Impact:</strong> ${lowerMonthly} has ${formatCurrency(monthlyDiff)} lower monthly payments, 
      which equals ${formatCurrency(monthlyPerYear)} annually. This could improve monthly cash flow but may cost more over time.</li>
    `;
  }
  
  // Long-term cost analysis
  if (totalDiff >= 10000) {
    const monthsToBreakEven = monthlyDiff > 0 ? Math.round(totalDiff / monthlyDiff) : 0;
    const yearsOfPayments = monthsToBreakEven > 0 ? (monthsToBreakEven / 12).toFixed(1) : '0';
    analysis += `
      <li><strong>Long-term Cost:</strong> While ${lowerTotal} costs ${formatCurrency(totalDiff)} less overall, 
      the ${lowerTotal === lowerMonthly ? 'lower monthly payment' : 'higher monthly payment'} means 
      ${lowerTotal === lowerMonthly ? 'more affordable near-term' : 'you\'re paying more upfront for long-term savings'}. 
      Expect roughly ${yearsOfPayments} years of payments for the higher-cost option to break even.</li>
    `;
  }
  
  if (timeDiff >= 6) {
    const yearsSaved = (timeDiff / 12).toFixed(1);
    analysis += `
      <li><strong>Payoff Speed:</strong> ${fasterPayoff} finishes about ${yearsSaved} years faster, 
      which affects how quickly you build equity.</li>
    `;
  }
  
  // Extra payments impact
  if (optionA.extraPayment > 0 || optionB.extraPayment > 0) {
    const hasExtra = optionA.extraPayment > 0 ? optionA.name : optionB.name;
    const extraAmount = Math.max(optionA.extraPayment, optionB.extraPayment);
    analysis += `
      <li><strong>Early Payoff Strategy:</strong> ${hasExtra} includes ${formatCurrency(extraAmount)} extra monthly payment, 
      accelerating payoff by approximately ${Math.round(timeDiff / 12)} years and reducing total interest paid.</li>
    `;
  }
  
  analysis += '</ul>';
  
  return analysis;
}

function generateComparisonInsight(scenario1: Scenario, scenario2: Scenario): string {
  const totalDiff = scenario2.totalCost - scenario1.totalCost;
  const monthlyDiff = scenario2.monthlyPayment - scenario1.monthlyPayment;
  const interestDiff = scenario2.totalInterest - scenario1.totalInterest;
  const timeDiff = scenario2.payoffMonths - scenario1.payoffMonths;
  
  const betterScenario = totalDiff > 0 ? scenario1 : scenario2;
  const worseScenario = totalDiff > 0 ? scenario2 : scenario1;
  
  return `<strong>${betterScenario.name}</strong> saves you ${formatCurrency(Math.abs(totalDiff))} over the life of the loan compared to <strong>${worseScenario.name}</strong>. 
          ${Math.abs(monthlyDiff) > 50 ? `The monthly payment differs by ${formatCurrency(Math.abs(monthlyDiff))}, ` : ''}
          ${Math.abs(interestDiff) > 10000 ? `saving ${formatCurrency(Math.abs(interestDiff))} in interest ` : ''}
          ${Math.abs(timeDiff) >= 12 ? `and paying off ${Math.abs(timeDiff)} months ${timeDiff < 0 ? 'faster' : 'slower'}` : ''}.`;
}

function generateRecommendations(
  baseScenarios: Scenario[], 
  refinanceScenarios: Scenario[], 
  bestScenario: Scenario
): string {
  const recommendations: string[] = [];
  
  // Down payment recommendation - check all scenarios
  const hasLowDownPayment = baseScenarios.some(s => {
    const downPercent = (s.downPayment / (s.principal + s.downPayment)) * 100;
    return downPercent < 20;
  });
  
  if (hasLowDownPayment) {
    recommendations.push(`
      <div class="flex gap-3 p-3 bg-white/90 dark:bg-slate-950/40 rounded-lg">
        <div class="text-2xl">🏦</div>
        <div>
          <p class="font-semibold text-sm text-slate-900 dark:text-white mb-1">Consider 20% Down Payment</p>
          <p class="fa-script-note">
            Putting down at least 20% helps you avoid PMI (Private Mortgage Insurance), which can add $50-$200+ to your monthly payment.
          </p>
        </div>
      </div>
    `);
  }
  
  // Extra payment recommendation
  const hasExtraPayments = baseScenarios.some(s => s.extraPayment > 0);
  if (!hasExtraPayments) {
    recommendations.push(`
      <div class="flex gap-3 p-3 bg-white/90 dark:bg-slate-950/40 rounded-lg">
        <div class="text-2xl">💰</div>
        <div>
          <p class="font-semibold text-sm text-slate-900 dark:text-white mb-1">Make Extra Payments</p>
          <p class="fa-script-note">
            Even small extra payments (like $100/month) can save tens of thousands in interest and shave years off your mortgage.
          </p>
        </div>
      </div>
    `);
  }
  
  // Interest rate shopping
  const rateRange = Math.max(...baseScenarios.map(s => s.rate)) - Math.min(...baseScenarios.map(s => s.rate));
  if (rateRange >= 0.25) {
    recommendations.push(`
      <div class="flex gap-3 p-3 bg-white/90 dark:bg-slate-950/40 rounded-lg">
        <div class="text-2xl">📉</div>
        <div>
          <p class="font-semibold text-sm text-slate-900 dark:text-white mb-1">Shop Around for Rates</p>
          <p class="fa-script-note">
            Even a 0.25% difference in rates can save you thousands. Compare rates from at least 3-5 different lenders.
          </p>
        </div>
      </div>
    `);
  }
  
  // Emergency fund
  recommendations.push(`
    <div class="flex gap-3 p-3 bg-white/90 dark:bg-slate-950/40 rounded-lg">
      <div class="text-2xl">🛡️</div>
      <div>
        <p class="font-semibold text-sm text-slate-900 dark:text-white mb-1">Maintain Emergency Fund</p>
        <p class="fa-script-note">
          Keep 3-6 months of expenses in savings before and after buying. Homeownership comes with unexpected costs.
        </p>
      </div>
    </div>
  `);
  
  // Refinancing recommendation
  if (refinanceScenarios.length > 0 && baseScenarios.length > 0) {
    const savings = baseScenarios[0].totalCost - refinanceScenarios[0].totalCost;
    if (savings > 10000) {
      recommendations.push(`
        <div class="flex gap-3 p-3 bg-white/90 dark:bg-slate-950/40 rounded-lg">
          <div class="text-2xl">🔄</div>
          <div>
            <p class="font-semibold text-sm text-slate-900 dark:text-white mb-1">Monitor Refinancing Opportunities</p>
            <p class="fa-script-note">
              If rates drop by 0.5%+, refinancing could save you ${formatCurrency(savings)}. Watch the market closely.
            </p>
          </div>
        </div>
      `);
    }
  }
  
  if (bestScenario) {
    const bestYears = Math.floor(bestScenario.payoffMonths / 12);
    const remainingMonths = bestScenario.payoffMonths % 12;
    recommendations.push(`
      <div class="flex gap-3 p-3 bg-white/90 dark:bg-slate-950/40 rounded-lg border border-emerald-200 dark:border-emerald-700">
        <div class="text-2xl">✅</div>
        <div>
          <p class="font-semibold text-sm text-slate-900 dark:text-white mb-1">Lean Into ${bestScenario.name}</p>
          <p class="fa-script-note">
            This option pairs a ${formatCurrency(bestScenario.monthlyPayment)} monthly payment with a total cost of ${formatCurrency(bestScenario.totalCost)}
            and pays off in about ${bestYears} years${remainingMonths ? ` ${remainingMonths} months` : ''}. Build your plan around these numbers.
          </p>
        </div>
      </div>
    `);
  }
  
  return recommendations.join('');
}

function findRefinanceSavings(base: Scenario, refi: Scenario): string {
  const savings = base.totalCost - refi.totalCost;
  if (savings > 0) {
    return `could save you ${formatCurrency(savings)} compared to no refinancing`;
  } else if (savings < 0) {
    return `would cost ${formatCurrency(Math.abs(savings))} more than no refinancing`;
  } else {
    return 'has the same total cost';
  }
}
