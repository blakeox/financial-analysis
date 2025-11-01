/**
 * Mortgage Scenario Planner Client Script
 * 
 * Compares multiple mortgage scenarios including different down payments,
 * interest rates, extra payments, and refinancing options.
 * 
 * Features:
 * - Multi-scenario comparison
 * - Refinancing analysis
 * - Result caching
 * - Save/load scenarios
 * - Journey integration
 * - Analytics tracking
 */

import type { AmortizationAnalysisResult } from '@financial-analysis/analysis';
import {
  coerceNumber,
  formatCurrency,
  isFiniteNumber,
  showLoading,
  hideLoading,
  showError,
  hideError,
} from '../utils/calculator-utilities';
import { postAnalysisRequest } from './analysis-api';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type Scenario = {
  name: string;
  downPayment: number;
  rate: number;
  extraPayment: number;
  principal: number;
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number;
  payoffMonths: number;
};

export interface MortgageScenarioPlanningInput {
  homePrice: number;
  loanTermYears: number;
  scenario1Down: number;
  scenario1Rate: number;
  scenario1Extra: number;
  scenario2Down: number;
  scenario2Rate: number;
  scenario2Extra: number;
  refinanceRate?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_KEY = 'mortgage-scenario-results';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const SAVED_SCENARIOS_KEY = 'saved-mortgage-scenarios';
const RECENT_CALCULATIONS_KEY = 'fanalyx-recent-calculations';
const REFINANCE_MONTH = 60; // 5 years

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize calculator
function initializeMortgageScenarioPlanning() {
  const form = document.getElementById('calculator-form');
  const calculateBtn = document.getElementById('calculate-btn');
  const resetBtn = document.getElementById('reset-btn');
  const saveBtn = document.getElementById('save-btn');
  
  if (!(form instanceof HTMLFormElement)) {
    console.error('Mortgage scenario planning form not found');
    return;
  }

  // Set up event listeners
  setupFormEventListeners(form, calculateBtn, resetBtn, saveBtn);
  
  // Load cached results if available
  loadCachedResults();
  
  // Load saved scenario if available
  loadSavedScenario(form);
}

function setupFormEventListeners(
  form: HTMLFormElement,
  calculateBtn: HTMLElement | null,
  resetBtn: HTMLElement | null,
  saveBtn: HTMLElement | null
) {
  // Calculate button
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleCalculate(form, calculateBtn);
  });
  
  if (calculateBtn instanceof HTMLButtonElement) {
    calculateBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await handleCalculate(form, calculateBtn);
    });
  }
  
  // Reset button
  if (resetBtn instanceof HTMLButtonElement) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      const resultsSection = document.getElementById('results-section');
      if (resultsSection) resultsSection.classList.add('hidden');
      clearCache();
    });
  }
  
  // Save button
  if (saveBtn instanceof HTMLButtonElement) {
    saveBtn.addEventListener('click', () => {
      saveScenario(form);
    });
  }
}

// ============================================================================
// FORM HANDLING
// ============================================================================

async function handleCalculate(form: HTMLFormElement, calculateBtn: HTMLElement | null) {
  if (calculateBtn instanceof HTMLButtonElement) {
    calculateBtn.disabled = true;
    calculateBtn.textContent = '📊 Calculating...';
  }
  
  hideError();
  showLoading();
  
  try {
    const input = parseFormInput(form);
    validateInput(input);
    
    // Check cache first
    const cached = getCachedResults(input);
    if (cached) {
      displayResults(cached);
      hideLoading();
      if (calculateBtn instanceof HTMLButtonElement) {
        calculateBtn.disabled = false;
        calculateBtn.textContent = '📊 Calculate Scenarios';
      }
      return;
    }
    
    // Calculate scenarios with descriptive names
    const termMonths = input.loanTermYears * 12;
    const scenario1Principal = input.homePrice - input.scenario1Down;
    const scenario2Principal = input.homePrice - input.scenario2Down;
    
    // Generate descriptive names
    const scenario1Name = generateScenarioName(input.scenario1Down, input.homePrice, input.scenario1Rate, input.scenario1Extra);
    const scenario2Name = generateScenarioName(input.scenario2Down, input.homePrice, input.scenario2Rate, input.scenario2Extra);
    
    const scenario1 = await calculateScenario(
      scenario1Name,
      scenario1Principal,
      input.scenario1Rate / 100,
      termMonths,
      input.scenario1Extra,
      input.scenario1Down,
      input.scenario1Rate
    );
    
    const scenario2 = await calculateScenario(
      scenario2Name,
      scenario2Principal,
      input.scenario2Rate / 100,
      termMonths,
      input.scenario2Extra,
      input.scenario2Down,
      input.scenario2Rate
    );
    
    const scenarios = [scenario1, scenario2];
    
    // Add refinance comparison if provided
    if (input.refinanceRate && input.refinanceRate > 0) {
        const refi1 = await calculateRefinanceScenario(
          `${scenario1Name} (Refinanced)`,
          scenario1,
          REFINANCE_MONTH,
          input.refinanceRate / 100,
          termMonths
        );
        
        const refi2 = await calculateRefinanceScenario(
          `${scenario2Name} (Refinanced)`,
          scenario2,
          REFINANCE_MONTH,
          input.refinanceRate / 100,
          termMonths
        );
      
      scenarios.push(refi1, refi2);
    }
    
    // Cache results
    cacheResults(input, scenarios);
    
    // Display results
    displayResults(scenarios);
    
    // Store in recent calculations for dashboard
    storeRecentCalculation(input, scenarios);
    
    // Dispatch completion event for journey integration
    dispatchCalculatorCompletedEvent(input, scenarios);
    
  } catch (error) {
    console.error('Mortgage scenario planning error:', error);
    const message = error instanceof Error ? error.message : 'Failed to calculate scenarios. Please try again.';
    showError(message);
  } finally {
    hideLoading();
    if (calculateBtn instanceof HTMLButtonElement) {
      calculateBtn.disabled = false;
      calculateBtn.textContent = '📊 Calculate Scenarios';
    }
  }
}

// ============================================================================
// INPUT PARSING & VALIDATION
// ============================================================================

function parseFormInput(form: HTMLFormElement): MortgageScenarioPlanningInput {
  const formData = new FormData(form);
  return {
    homePrice: coerceNumber(formData.get('homePrice'), 0),
    loanTermYears: parseInt(String(formData.get('loanTerm') || '30')),
    scenario1Down: coerceNumber(formData.get('scenario1Down'), 0),
    scenario1Rate: coerceNumber(formData.get('scenario1Rate'), 0),
    scenario1Extra: coerceNumber(formData.get('scenario1Extra'), 0),
    scenario2Down: coerceNumber(formData.get('scenario2Down'), 0),
    scenario2Rate: coerceNumber(formData.get('scenario2Rate'), 0),
    scenario2Extra: coerceNumber(formData.get('scenario2Extra'), 0),
    refinanceRate: coerceNumber(formData.get('refinanceRate'), undefined),
  };
}

// Validate input
function validateInput(input: MortgageScenarioPlanningInput): void {
  if (input.homePrice <= 0) {
    throw new Error('Please enter a valid home price');
  }
  
  if (input.scenario1Rate <= 0) {
    throw new Error('Please enter a valid interest rate for Scenario 1');
  }
  
  if (input.scenario1Down >= input.homePrice) {
    throw new Error('Scenario 1: Down payment must be less than home price');
  }
  
  if (input.scenario2Rate <= 0) {
    throw new Error('Please enter a valid interest rate for Scenario 2');
  }
  
  if (input.scenario2Down >= input.homePrice) {
    throw new Error('Scenario 2: Down payment must be less than home price');
  }
}

// ============================================================================
// SCENARIO CALCULATIONS
// ============================================================================

async function calculateScenario(
  name: string,
  principal: number,
  annualRate: number,
  termMonths: number,
  extraPayment: number,
  downPayment: number,
  ratePercent: number
): Promise<Scenario> {
  const result = await postAnalysisRequest<AmortizationAnalysisResult>(
    '/v1/api/analysis/amortization',
    {
      principal,
      annualRate,
      termMonths,
      extraMonthlyPayment: extraPayment > 0 ? extraPayment : undefined,
    }
  );
  
  const monthlyPayment = result.monthlyPayment;
  const totalInterest = getTotalInterest(result);
  const totalCost = monthlyPayment * result.totalPayments;
  const payoffMonths = result.totalPayments;
  
  return {
    name,
    downPayment,
    rate: ratePercent,
    extraPayment,
    principal,
    monthlyPayment,
    totalInterest,
    totalCost,
    payoffMonths,
  };
}

function getTotalInterest(result: AmortizationAnalysisResult): number {
  if (isFiniteNumber((result as any).totalInterest)) return Number((result as any).totalInterest);
  if (isFiniteNumber((result as any).interestPaid)) return Number((result as any).interestPaid);
  return 0;
}

async function calculateRefinanceScenario(
  name: string,
  original: Scenario,
  refiMonth: number,
  refiRate: number,
  originalTermMonths: number
): Promise<Scenario> {
  // Calculate remaining balance at refinance time
  const result = await postAnalysisRequest<AmortizationAnalysisResult>(
    '/v1/api/analysis/amortization',
    {
      principal: original.principal,
      annualRate: original.rate,
      termMonths: originalTermMonths,
      extraMonthlyPayment: original.extraPayment > 0 ? original.extraPayment : undefined,
    }
  );
  
  // Find the balance at the refinance month
  const schedule = result.schedule;
  const refiEntry = schedule?.[refiMonth - 1];
  const remainingBalance = refiEntry ? coerceNumber(refiEntry.balance, 0) : original.principal;
  
  // Calculate new loan with refinance rate
  const remainingTerm = originalTermMonths - refiMonth;
  const refiResult = await postAnalysisRequest<AmortizationAnalysisResult>(
    '/v1/api/analysis/amortization',
    {
      principal: remainingBalance,
      annualRate: refiRate,
      termMonths: remainingTerm,
      extraMonthlyPayment: original.extraPayment > 0 ? original.extraPayment : undefined,
    }
  );
  
  // Total costs = payments before refinance + payments after refinance
  const beforeRefiTotal = original.monthlyPayment * refiMonth;
  const afterRefiMonthly = refiResult.monthlyPayment;
  const afterRefiTotal = afterRefiMonthly * refiResult.totalPayments;
  const totalCost = beforeRefiTotal + afterRefiTotal;
  
  // Total interest = interest before refi + interest after refi
  const beforeRefiInterest = beforeRefiTotal - (original.principal - remainingBalance);
  const afterRefiInterest = getTotalInterest(refiResult);
  const totalInterest = beforeRefiInterest + afterRefiInterest;
  
  return {
    name,
    downPayment: 0,
    rate: refiRate,
    extraPayment: original.extraPayment,
    principal: original.principal,
    monthlyPayment: afterRefiMonthly, // New monthly payment
    totalInterest,
    totalCost,
    payoffMonths: refiMonth + refiResult.totalPayments,
  };
}

// ============================================================================
// RESULTS DISPLAY
// ============================================================================

function displayResults(scenarios: Scenario[]): void {
  const resultsSection = document.getElementById('results-section');
  const summaryCards = document.getElementById('summary-cards');
  const resultsContent = document.getElementById('results-container');
  
  if (!resultsSection || !summaryCards || !resultsContent) return;
  
  // Separate base scenarios from refinance scenarios
  const baseScenarios = scenarios.filter(s => !s.name.includes('Refinance'));
  const refinanceScenarios = scenarios.filter(s => s.name.includes('Refinance'));
  
  // Find best scenario (lowest total cost)
  const bestScenario = scenarios.reduce((best, current) => 
    current.totalCost < best.totalCost ? current : best
  );
  
  // Render summary cards (showing base scenarios first, then refinance if available)
  const displayScenarios = baseScenarios.length > 0 
    ? [...baseScenarios, ...refinanceScenarios] 
    : scenarios;
  const topScenarios = displayScenarios.slice(0, 3);
  
  summaryCards.innerHTML = topScenarios
    .map((scenario, idx) => renderSummaryCard(scenario, idx, scenario.name === bestScenario.name))
    .join('');
  
  // Render detailed comparison with separate sections for base vs refinance
  resultsContent.innerHTML = `
    <!-- Base Scenarios Detailed Comparison -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <span>📋</span> Original Scenarios Comparison
      </h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Side-by-side comparison of your mortgage options</p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        ${baseScenarios.map(scenario => 
          renderDetailedScenarioCard(scenario, scenario.name === bestScenario.name && baseScenarios.includes(bestScenario))
        ).join('')}
      </div>
    </div>
    
    ${refinanceScenarios.length > 0 ? `
      <!-- Refinance Scenarios Comparison -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Updated Scenarios with Refinancing</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          These scenarios assume you refinance after 5 years at the new rate.
        </p>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Scenario</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">New Monthly Payment</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total Interest</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total Cost</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Payoff Time</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              ${refinanceScenarios.map(scenario => {
                const isBest = scenario.name === bestScenario.name && refinanceScenarios.includes(bestScenario);
                const rowClass = isBest ? 'bg-green-50 dark:bg-green-900/20 font-semibold' : '';
                const months = scenario.payoffMonths;
                const years = Math.floor(months / 12);
                const monthsRemainder = months % 12;
                const timeDisplay = years > 0 ? `${years}yr ${monthsRemainder}mo` : `${monthsRemainder}mo`;
                
                return `
                  <tr class="${rowClass}">
                    <td class="px-4 py-3 whitespace-nowrap text-sm">
                      ${scenario.name}
                      ${isBest ? '<span class="ml-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs">BEST</span>' : ''}
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
                      ${timeDisplay}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}
    
    <!-- Comprehensive Analysis Section -->
    <div class="space-y-6">
      <!-- Key Insights -->
      <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
        <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
          <span>📊</span> Key Insights & Analysis
        </h3>
        
        <div class="space-y-4">
          <!-- Best Value Analysis -->
          <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
            <h4 class="font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
              <span>✓</span> Best Value Recommendation
            </h4>
            <p class="text-sm text-gray-700 dark:text-gray-300">
              <strong>${bestScenario.name}</strong> offers the best overall value, saving you 
              <span class="font-bold text-green-600 dark:text-green-400">${formatCurrency(Math.max(...scenarios.map(s => s.totalCost)) - bestScenario.totalCost)}</span> 
              compared to the most expensive option over the life of the loan.
            </p>
            ${baseScenarios.length === 2 && bestScenario === baseScenarios[0] ? `
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">
                💡 This represents a ${((1 - bestScenario.totalCost / baseScenarios[1].totalCost) * 100).toFixed(1)}% reduction in total cost.
              </p>
            ` : baseScenarios.length === 2 ? `
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">
                💡 This represents a ${((1 - bestScenario.totalCost / baseScenarios[0].totalCost) * 100).toFixed(1)}% reduction in total cost.
              </p>
            ` : ''}
          </div>
          
          ${baseScenarios.length === 2 ? `
            <!-- Scenario Comparison -->
            <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Scenario Comparison</h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Monthly Payment Difference</p>
                  <p class="text-lg font-bold ${baseScenarios[0].monthlyPayment < baseScenarios[1].monthlyPayment ? 'text-green-600' : 'text-red-600'}">${formatCurrency(Math.abs(baseScenarios[0].monthlyPayment - baseScenarios[1].monthlyPayment))}/mo</p>
                </div>
                <div class="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Interest Saved/Lost</p>
                  <p class="text-lg font-bold ${baseScenarios[0].totalInterest < baseScenarios[1].totalInterest ? 'text-green-600' : 'text-red-600'}">${formatCurrency(Math.abs(baseScenarios[0].totalInterest - baseScenarios[1].totalInterest))}</p>
                </div>
                <div class="text-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Cost Difference</p>
                  <p class="text-lg font-bold ${baseScenarios[0].totalCost < baseScenarios[1].totalCost ? 'text-green-600' : 'text-red-600'}">${formatCurrency(Math.abs(baseScenarios[0].totalCost - baseScenarios[1].totalCost))}</p>
                </div>
              </div>
              
              <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p class="text-sm text-gray-700 dark:text-gray-300">
                  ${generateComparisonInsight(baseScenarios[0], baseScenarios[1])}
                </p>
              </div>
            </div>
          ` : ''}
          
          ${refinanceScenarios.length > 0 ? `
            <!-- Refinancing Analysis -->
            <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-purple-500">
              <h4 class="font-semibold text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-2">
                <span>🔄</span> Refinancing Analysis
              </h4>
              <p class="text-sm text-gray-700 dark:text-gray-300 mb-3">
                Refinancing after 5 years ${findRefinanceSavings(baseScenarios[0], refinanceScenarios[0])}.
              </p>
              <div class="grid grid-cols-2 gap-3">
                <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Potential Savings</p>
                  <p class="text-lg font-bold text-purple-600 dark:text-purple-400">
                    ${formatCurrency(Math.max(0, baseScenarios[0].totalCost - refinanceScenarios[0].totalCost))}
                  </p>
                </div>
                <div class="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded">
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">ROI from Refinancing</p>
                  <p class="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    ${((1 - refinanceScenarios[0].totalCost / baseScenarios[0].totalCost) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-3">
                ⚠️ Note: This doesn't include refinancing closing costs, which typically range from 2-5% of the loan amount.
              </p>
            </div>
          ` : ''}
        </div>
      </div>
      
      <!-- Financial Recommendations -->
      <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 border border-green-200 dark:border-green-700">
        <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
          <span>💡</span> Financial Recommendations
        </h3>
        
        <div class="space-y-3">
          ${generateRecommendations(baseScenarios, refinanceScenarios, bestScenario)}
        </div>
      </div>
      
      <!-- Important Considerations -->
      <div class="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-700">
        <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
          <span>⚠️</span> Important Considerations
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <h4 class="font-semibold text-sm text-gray-900 dark:text-white">✓ Factors Included</h4>
            <ul class="text-xs text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
              <li>Principal and interest payments</li>
              <li>Total interest over loan term</li>
              <li>Impact of extra payments</li>
              <li>Refinancing scenarios (if selected)</li>
            </ul>
          </div>
          
          <div class="space-y-2">
            <h4 class="font-semibold text-sm text-gray-900 dark:text-white">⚠️ Not Included</h4>
            <ul class="text-xs text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
              <li>Property taxes and insurance (PITI)</li>
              <li>PMI (if down payment < 20%)</li>
              <li>HOA fees or maintenance costs</li>
              <li>Closing costs and origination fees</li>
            </ul>
          </div>
        </div>
        
        <div class="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
          <p class="text-xs text-gray-600 dark:text-gray-400">
            <strong>Pro Tip:</strong> Your actual monthly housing payment will be higher when including taxes, insurance, and other costs. 
            Budget for 20-30% more than the mortgage payment shown here.
          </p>
        </div>
      </div>
    </div>
  `;
  
  resultsSection.classList.remove('hidden');
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

function generateScenarioName(downPayment: number, homePrice: number, rate: number, extraPayment: number): string {
  const downPercent = Math.round((downPayment / homePrice) * 100);
  const rateFormatted = rate.toFixed(2);
  
  // Build descriptive name based on characteristics
  let name = '';
  
  // Down payment descriptor
  if (downPercent >= 20) {
    name = `${downPercent}% Down`;
  } else if (downPercent >= 10) {
    name = `${downPercent}% Down (PMI)`;
  } else if (downPercent >= 5) {
    name = `${downPercent}% Down (High PMI)`;
  } else {
    name = `${downPercent}% Down (FHA)`;
  }
  
  // Rate descriptor
  if (rate < 5.0) {
    name += ` @ ${rateFormatted}% (Low)`;
  } else if (rate < 7.0) {
    name += ` @ ${rateFormatted}%`;
  } else {
    name += ` @ ${rateFormatted}% (High)`;
  }
  
  // Extra payment descriptor
  if (extraPayment >= 500) {
    name += ` + $${Math.round(extraPayment / 100) * 100} extra`;
  } else if (extraPayment > 0) {
    name += ` + extra payments`;
  }
  
  return name;
}

function formatTimeDisplay(months: number): { years: number; months: number; display: string } {
  const years = Math.floor(months / 12);
  const monthsRemainder = months % 12;
  return {
    years,
    months: monthsRemainder,
    display: `${years}y ${monthsRemainder}m`,
  };
}

function calculateDownPaymentPercent(scenario: Scenario): string {
  return ((scenario.downPayment / (scenario.principal + scenario.downPayment)) * 100).toFixed(1);
}

function renderSummaryCard(scenario: Scenario, idx: number, isBest: boolean): string {
  const bgColor = isBest 
    ? 'bg-gradient-to-br from-green-600 to-emerald-600' 
    : idx === 0 
      ? 'bg-gradient-to-br from-blue-600 to-indigo-600' 
      : 'bg-white dark:bg-gray-800';
  const textColor = (isBest || idx === 0) ? 'text-white' : 'text-gray-900 dark:text-white';
  const borderClass = isBest 
    ? 'border-4 border-green-400 shadow-2xl' 
    : 'border border-gray-300 dark:border-gray-600 shadow-lg';
  const time = formatTimeDisplay(scenario.payoffMonths);
  
  return `
    <div class="${bgColor} rounded-xl p-6 ${borderClass} transform hover:scale-105 transition-all duration-200">
      ${isBest ? '<div class="flex items-center gap-2 mb-3"><span class="bg-white text-green-600 px-3 py-1 rounded-full text-xs font-bold">✓ BEST VALUE</span></div>' : ''}
      <h3 class="text-lg font-bold ${textColor} mb-4">${scenario.name}</h3>
      
      <div class="space-y-3">
        <div>
          <p class="text-xs ${isBest || idx === 0 ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'} mb-1">Monthly Payment</p>
          <p class="text-2xl font-bold ${textColor}">${formatCurrency(scenario.monthlyPayment)}</p>
        </div>
        
        <div class="grid grid-cols-2 gap-3 pt-3 border-t ${isBest || idx === 0 ? 'border-white/20' : 'border-gray-200 dark:border-gray-700'}">
          <div>
            <p class="text-xs ${isBest || idx === 0 ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'} mb-1">Total Interest</p>
            <p class="text-sm font-semibold ${textColor}">${formatCurrency(scenario.totalInterest)}</p>
          </div>
          <div>
            <p class="text-xs ${isBest || idx === 0 ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'} mb-1">Payoff Time</p>
            <p class="text-sm font-semibold ${textColor}">${time.display}</p>
          </div>
        </div>
        
        <div class="pt-3 border-t ${isBest || idx === 0 ? 'border-white/20' : 'border-gray-200 dark:border-gray-700'}">
          <p class="text-xs ${isBest || idx === 0 ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'} mb-1">Total Cost</p>
          <p class="text-xl font-bold ${textColor}">${formatCurrency(scenario.totalCost)}</p>
        </div>
      </div>
    </div>
  `;
}

function renderDetailedScenarioCard(scenario: Scenario, isBest: boolean): string {
  const time = formatTimeDisplay(scenario.payoffMonths);
  const downPercent = calculateDownPaymentPercent(scenario);
  
  return `
    <div class="border-2 ${isBest ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-700'} rounded-lg p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white">${scenario.name}</h3>
        ${isBest ? '<span class="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">✓ BEST</span>' : ''}
      </div>
      
      <div class="space-y-4">
        <!-- Loan Details -->
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Loan Details</h4>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600 dark:text-gray-400">Loan Amount</span>
              <span class="text-sm font-semibold">${formatCurrency(scenario.principal)}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600 dark:text-gray-400">Down Payment</span>
              <span class="text-sm font-semibold">${formatCurrency(scenario.downPayment)} (${downPercent}%)</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600 dark:text-gray-400">Interest Rate</span>
              <span class="text-sm font-semibold">${scenario.rate.toFixed(2)}%</span>
            </div>
            ${scenario.extraPayment > 0 ? `
              <div class="flex justify-between items-center text-blue-600 dark:text-blue-400">
                <span class="text-sm">Extra Payment</span>
                <span class="text-sm font-semibold">+${formatCurrency(scenario.extraPayment)}/mo</span>
              </div>
            ` : ''}
          </div>
        </div>
        
        <!-- Payment Information -->
        <div>
          <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Monthly Payment</h4>
          <p class="text-3xl font-bold text-gray-900 dark:text-white mb-1">${formatCurrency(scenario.monthlyPayment)}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Base: ${formatCurrency(scenario.monthlyPayment - scenario.extraPayment)} + Extra: ${formatCurrency(scenario.extraPayment)}</p>
        </div>
        
        <!-- Cost Breakdown -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Interest</p>
            <p class="text-lg font-bold text-blue-600 dark:text-blue-400">${formatCurrency(scenario.totalInterest)}</p>
          </div>
          <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
            <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Cost</p>
            <p class="text-lg font-bold text-purple-600 dark:text-purple-400">${formatCurrency(scenario.totalCost)}</p>
          </div>
        </div>
        
        <!-- Timeline -->
        <div class="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Payoff Timeline</p>
              <p class="text-xl font-bold text-gray-900 dark:text-white">${time.years} years ${time.months} months</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${scenario.payoffMonths} total payments</p>
            </div>
            <div class="text-4xl">⏱️</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function generateComparisonInsight(scenario1: Scenario, scenario2: Scenario): string {
  const monthlyDiff = scenario2.monthlyPayment - scenario1.monthlyPayment;
  const totalDiff = scenario2.totalCost - scenario1.totalCost;
  const interestDiff = scenario2.totalInterest - scenario1.totalInterest;
  const timeDiff = scenario2.payoffMonths - scenario1.payoffMonths;
  
  const betterScenario = totalDiff > 0 ? scenario1 : scenario2;
  const worseScenario = totalDiff > 0 ? scenario2 : scenario1;
  
  return `<strong>${betterScenario.name}</strong> saves you ${formatCurrency(Math.abs(totalDiff))} over the life of the loan compared to <strong>${worseScenario.name}</strong>. 
          ${Math.abs(monthlyDiff) > 50 ? `The monthly payment differs by ${formatCurrency(Math.abs(monthlyDiff))}, ` : ''}
          ${Math.abs(interestDiff) > 10000 ? `saving ${formatCurrency(Math.abs(interestDiff))} in interest ` : ''}
          ${Math.abs(timeDiff) >= 12 ? `and paying off ${Math.abs(timeDiff)} months ${timeDiff < 0 ? 'faster' : 'slower'}` : ''}.`;
}

function generateRecommendations(baseScenarios: Scenario[], refinanceScenarios: Scenario[], bestScenario: Scenario): string {
  const recommendations: string[] = [];
  
  // Down payment recommendation
  if (baseScenarios.length === 2) {
    const s1DownPercent = (baseScenarios[0].downPayment / (baseScenarios[0].principal + baseScenarios[0].downPayment)) * 100;
    const s2DownPercent = (baseScenarios[1].downPayment / (baseScenarios[1].principal + baseScenarios[1].downPayment)) * 100;
    
    if (s1DownPercent < 20 || s2DownPercent < 20) {
      recommendations.push(`
        <div class="flex gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
          <div class="text-2xl">🏦</div>
          <div>
            <p class="font-semibold text-sm text-gray-900 dark:text-white mb-1">Consider 20% Down Payment</p>
            <p class="text-xs text-gray-600 dark:text-gray-400">
              Putting down at least 20% helps you avoid PMI (Private Mortgage Insurance), which can add $50-$200+ to your monthly payment.
            </p>
          </div>
        </div>
      `);
    }
  }
  
  // Extra payment recommendation
  const hasExtraPayments = baseScenarios.some(s => s.extraPayment > 0);
  if (!hasExtraPayments) {
    recommendations.push(`
      <div class="flex gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
        <div class="text-2xl">💰</div>
        <div>
          <p class="font-semibold text-sm text-gray-900 dark:text-white mb-1">Make Extra Payments</p>
          <p class="text-xs text-gray-600 dark:text-gray-400">
            Even small extra payments (like $100/month) can save tens of thousands in interest and shave years off your mortgage.
          </p>
        </div>
      </div>
    `);
  }
  
  // Interest rate shopping
  if (baseScenarios.length === 2 && Math.abs(baseScenarios[0].rate - baseScenarios[1].rate) >= 0.25) {
    recommendations.push(`
      <div class="flex gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
        <div class="text-2xl">📉</div>
        <div>
          <p class="font-semibold text-sm text-gray-900 dark:text-white mb-1">Shop Around for Rates</p>
          <p class="text-xs text-gray-600 dark:text-gray-400">
            Even a 0.25% difference in rates can save you thousands. Compare rates from at least 3-5 different lenders.
          </p>
        </div>
      </div>
    `);
  }
  
  // Emergency fund
  recommendations.push(`
    <div class="flex gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
      <div class="text-2xl">🛡️</div>
      <div>
        <p class="font-semibold text-sm text-gray-900 dark:text-white mb-1">Maintain Emergency Fund</p>
        <p class="text-xs text-gray-600 dark:text-gray-400">
          Keep 3-6 months of expenses in savings before and after buying. Homeownership comes with unexpected costs.
        </p>
      </div>
    </div>
  `);
  
  // Refinancing recommendation
  if (refinanceScenarios.length > 0) {
    const savings = baseScenarios[0].totalCost - refinanceScenarios[0].totalCost;
    if (savings > 10000) {
      recommendations.push(`
        <div class="flex gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
          <div class="text-2xl">🔄</div>
          <div>
            <p class="font-semibold text-sm text-gray-900 dark:text-white mb-1">Monitor Refinancing Opportunities</p>
            <p class="text-xs text-gray-600 dark:text-gray-400">
              If rates drop by 0.5%+, refinancing could save you ${formatCurrency(savings)}. Watch the market closely.
            </p>
          </div>
        </div>
      `);
    }
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

// ============================================================================
// CACHING & PERSISTENCE
// ============================================================================

function getCachedResults(input: MortgageScenarioPlanningInput): Scenario[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { timestamp, input: cachedInput, scenarios } = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    // Check if input matches
    if (JSON.stringify(input) === JSON.stringify(cachedInput)) {
      return scenarios;
    }
    
    return null;
  } catch {
    return null;
  }
}

function cacheResults(input: MortgageScenarioPlanningInput, scenarios: Scenario[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      input,
      scenarios,
    }));
  } catch (error) {
    console.warn('Failed to cache results:', error);
  }
}

function clearCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
}

function loadCachedResults(): void {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return;
    
    const { timestamp, scenarios } = JSON.parse(cached);
    const now = Date.now();
    
    // Only load if recent
    if (now - timestamp <= CACHE_DURATION) {
      displayResults(scenarios);
    }
  } catch {
    // Ignore errors
  }
}

// ============================================================================
// SCENARIO SAVE/LOAD
// ============================================================================

function saveScenario(form: HTMLFormElement): void {
  try {
    const input = parseFormInput(form);
    const name = prompt('Enter a name for this scenario:', 'My Mortgage Comparison');
    
    if (!name) return;
    
    const saved = JSON.parse(localStorage.getItem(SAVED_SCENARIOS_KEY) || '[]');
    saved.push({
      id: Date.now(),
      name,
      input,
      savedAt: new Date().toISOString(),
    });
    
    localStorage.setItem(SAVED_SCENARIOS_KEY, JSON.stringify(saved));
    alert(`Scenario "${name}" saved successfully!`);
  } catch (error) {
    console.error('Failed to save scenario:', error);
    alert('Failed to save scenario. Please try again.');
  }
}

function loadSavedScenario(form: HTMLFormElement): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const scenarioId = params.get('scenario');
    
    if (!scenarioId) return;
    
    const saved = JSON.parse(localStorage.getItem(SAVED_SCENARIOS_KEY) || '[]');
    const scenario = saved.find((s: any) => s.id === parseInt(scenarioId));
    
    if (!scenario) return;
    
    // Populate form with saved values
    const { input } = scenario;
    (form.elements.namedItem('homePrice') as HTMLInputElement).value = String(input.homePrice);
    (form.elements.namedItem('loanTerm') as HTMLSelectElement).value = String(input.loanTermYears);
    (form.elements.namedItem('scenario1Down') as HTMLInputElement).value = String(input.scenario1Down);
    (form.elements.namedItem('scenario1Rate') as HTMLInputElement).value = String(input.scenario1Rate);
    (form.elements.namedItem('scenario1Extra') as HTMLInputElement).value = String(input.scenario1Extra || '');
    (form.elements.namedItem('scenario2Down') as HTMLInputElement).value = String(input.scenario2Down);
    (form.elements.namedItem('scenario2Rate') as HTMLInputElement).value = String(input.scenario2Rate);
    (form.elements.namedItem('scenario2Extra') as HTMLInputElement).value = String(input.scenario2Extra || '');
    if (input.refinanceRate) {
      (form.elements.namedItem('refinanceRate') as HTMLInputElement).value = String(input.refinanceRate);
    }
  } catch {
    // Ignore errors
  }
}

// ============================================================================
// INTEGRATION & TRACKING
// ============================================================================

function storeRecentCalculation(input: MortgageScenarioPlanningInput, scenarios: Scenario[]): void {
  try {
    const bestScenario = scenarios.reduce((best, current) => 
      current.totalCost < best.totalCost ? current : best
    );
    
    const recentCalculations = JSON.parse(localStorage.getItem(RECENT_CALCULATIONS_KEY) || '[]');
    
    recentCalculations.unshift({
      id: 'mortgage-scenario-planning',
      title: 'Mortgage Scenario Planner',
      icon: '🏡',
      url: '/calculator/mortgage-scenario-planning',
      timestamp: new Date().toISOString(),
      summary: `${scenarios.length} scenarios compared, best: ${bestScenario.name}`,
      result: {
        homePrice: input.homePrice,
        bestMonthlyPayment: bestScenario.monthlyPayment,
        totalSavings: Math.max(...scenarios.map(s => s.totalCost)) - bestScenario.totalCost,
      },
    });
    
    // Keep only last 10 calculations
    localStorage.setItem(RECENT_CALCULATIONS_KEY, JSON.stringify(recentCalculations.slice(0, 10)));
  } catch (error) {
    console.warn('Failed to store recent calculation:', error);
  }
}

// Event dispatching for journey integration
function dispatchCalculatorCompletedEvent(input: MortgageScenarioPlanningInput, scenarios: Scenario[]): void {
  const bestScenario = scenarios.reduce((best, current) => 
    current.totalCost < best.totalCost ? current : best
  );
  
  // Dispatch event for journey integration
  window.dispatchEvent(
    new CustomEvent('calculator-completed', {
      detail: {
        calculatorId: 'mortgage-scenario-planning',
        timestamp: new Date().toISOString(),
        result: { scenarios },
        formData: {
          homePrice: input.homePrice,
          loanTermYears: input.loanTermYears,
          bestScenario: bestScenario.name,
          totalSavings: Math.max(...scenarios.map(s => s.totalCost)) - bestScenario.totalCost,
          scenarios: scenarios.map(s => ({
            name: s.name,
            monthlyPayment: s.monthlyPayment,
            totalCost: s.totalCost,
          })),
        },
      },
    })
  );
  
  // Track analytics if available
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'mortgage_scenario_calculated', {
      event_category: 'calculator',
      event_label: 'mortgage_scenario_planning',
      value: Math.round(bestScenario.totalCost),
      home_price: input.homePrice,
      loan_term: input.loanTermYears,
      num_scenarios: scenarios.length,
      has_refinance: scenarios.some(s => s.name.includes('Refinance')),
      has_extra_payments: input.scenario1Extra > 0 || input.scenario2Extra > 0,
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMortgageScenarioPlanning);
} else {
  initializeMortgageScenarioPlanning();
}
