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

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

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
  // PMI fields
  hasPMI: boolean;
  pmiMonthly: number;
  pmiTotalCost: number;
  pmiDropMonth: number;
  // Affordability
  monthlyPaymentWithPMI: number;
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
  grossMonthlyIncome?: number;
}

type SavedScenarioRecord = {
  id: number;
  name: string;
  input: MortgageScenarioPlanningInput;
  savedAt: string;
};

type ScenarioFormSlice = {
  downPayment: number | null;
  rate: number | null;
  extraPayment: number | null;
};

interface MortgageScenarioChatFormData {
  homePrice: number | null;
  loanTerm: number | null;
  scenario1: ScenarioFormSlice;
  scenario2: ScenarioFormSlice;
  refinanceRate: number | null;
}

interface MortgageScenarioChatContext {
  calculatorType: string;
  calculatorName: string;
  capabilities: string[];
  currentFormData: MortgageScenarioChatFormData | null;
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
  
  // Set up chatbot context for this calculator
  setupChatbotContext(form);
  
  // Listen for calculator completion to update chatbot
  window.addEventListener('calculator-completed', (event: Event) => {
    const customEvent = event as CustomEvent;
    if (customEvent.detail.calculatorId === 'mortgage-scenario-planning') {
      updateChatbotWithResults(customEvent.detail.result.scenarios, customEvent.detail.formData);
    }
  });
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
      input.scenario1Rate,
      input.homePrice
    );
    
    const scenario2 = await calculateScenario(
      scenario2Name,
      scenario2Principal,
      input.scenario2Rate / 100,
      termMonths,
      input.scenario2Extra,
      input.scenario2Down,
      input.scenario2Rate,
      input.homePrice
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
    grossMonthlyIncome: coerceNumber(formData.get('grossMonthlyIncome'), undefined),
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

function calculatePMI(principal: number, downPayment: number, homePrice: number): {
  hasPMI: boolean;
  pmiMonthly: number;
  pmiDropMonth: number;
  pmiTotalCost: number;
} {
  const downPaymentPercent = (downPayment / homePrice) * 100;
  
  // No PMI if down payment >= 20%
  if (downPaymentPercent >= 20) {
    return { hasPMI: false, pmiMonthly: 0, pmiDropMonth: 0, pmiTotalCost: 0 };
  }
  
  // Calculate PMI rate based on down payment amount
  let pmiRate = 0.01; // 1% annual default
  if (downPaymentPercent >= 15) {
    pmiRate = 0.005; // 0.5% for 15-19.99% down
  } else if (downPaymentPercent >= 10) {
    pmiRate = 0.0075; // 0.75% for 10-14.99% down
  } else if (downPaymentPercent >= 5) {
    pmiRate = 0.01; // 1% for 5-9.99% down
  } else {
    pmiRate = 0.012; // 1.2% for <5% down (FHA territory)
  }
  
  const pmiAnnual = principal * pmiRate;
  const pmiMonthly = pmiAnnual / 12;
  
  // PMI drops off when equity reaches 20% (80% LTV)
  // Approximate: assuming principal paydown, not considering appreciation
  const equityNeeded = homePrice * 0.20;
  const equityToGain = equityNeeded - downPayment;
  
  // Rough estimate: divide equity needed by average monthly principal payment
  // For a more accurate calculation, we'd need the amortization schedule
  const avgMonthlyPrincipal = principal / 360; // Conservative estimate
  const pmiDropMonth = Math.ceil(equityToGain / avgMonthlyPrincipal);
  
  // Cap at loan term
  const actualDropMonth = Math.min(pmiDropMonth, 360);
  const pmiTotalCost = pmiMonthly * actualDropMonth;
  
  return {
    hasPMI: true,
    pmiMonthly,
    pmiDropMonth: actualDropMonth,
    pmiTotalCost,
  };
}

async function calculateScenario(
  name: string,
  principal: number,
  annualRate: number,
  termMonths: number,
  extraPayment: number,
  downPayment: number,
  ratePercent: number,
  homePrice: number
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
  const payoffMonths = result.totalPayments || termMonths;
  const totalCost = monthlyPayment * payoffMonths;
  
  // Validate payoff months is reasonable (max 30 years = 360 months)
  const validatedPayoffMonths = payoffMonths > 0 && payoffMonths <= 360 ? payoffMonths : termMonths;
  
  // Calculate PMI
  const pmi = calculatePMI(principal, downPayment, homePrice);
  const monthlyPaymentWithPMI = monthlyPayment + pmi.pmiMonthly;
  
  return {
    name,
    downPayment,
    rate: ratePercent,
    extraPayment,
    principal,
    monthlyPayment,
    totalInterest,
    totalCost,
    payoffMonths: validatedPayoffMonths,
    hasPMI: pmi.hasPMI,
    pmiMonthly: pmi.pmiMonthly,
    pmiTotalCost: pmi.pmiTotalCost,
    pmiDropMonth: pmi.pmiDropMonth,
    monthlyPaymentWithPMI,
  };
}

type InterestFields = {
  totalInterest?: unknown;
  interestPaid?: unknown;
  totalInterestPaid?: unknown;
};

function getTotalInterest(result: AmortizationAnalysisResult): number {
  const interestResult = result as AmortizationAnalysisResult & InterestFields;
  const candidates: unknown[] = [
    interestResult.totalInterest,
    interestResult.interestPaid,
    interestResult.totalInterestPaid,
  ];

  for (const value of candidates) {
    if (isFiniteNumber(value)) {
      return Number(value);
    }
  }

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
    hasPMI: false,
    pmiMonthly: 0,
    pmiTotalCost: 0,
    pmiDropMonth: 0,
    monthlyPaymentWithPMI: afterRefiMonthly,
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
  
  // Get affordability data if income provided
  const input = document.getElementById('calculator-form') as HTMLFormElement;
  const formData = input ? parseFormInput(input) : null;
  const hasIncome = formData?.grossMonthlyIncome && formData.grossMonthlyIncome > 0;
  
  // Render detailed comparison with separate sections for base vs refinance
  resultsContent.innerHTML = `
    ${hasIncome && formData ? `
      <!-- Affordability Analysis -->
      <div class="bg-linear-to-br from-emerald-50 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-900/20 rounded-lg p-6 mb-6 border border-emerald-200 dark:border-emerald-700">
        <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
          <span>💵</span> Affordability Analysis
        </h2>
        <p class="fa-script-copy-muted mb-4">Based on your gross monthly income of ${formatCurrency(formData.grossMonthlyIncome)}</p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${baseScenarios.map(scenario => {
            const grossMonthlyIncome = formData?.grossMonthlyIncome ?? 0;
            const dtiRatio = grossMonthlyIncome > 0
              ? (scenario.monthlyPaymentWithPMI / grossMonthlyIncome) * 100
              : 0;
            const isAffordable = dtiRatio <= 28;
            const comfortLevel = dtiRatio <= 20 ? 'Excellent' : dtiRatio <= 28 ? 'Good' : dtiRatio <= 35 ? 'Tight' : 'Risky';
            const colorClass = dtiRatio <= 28 ? 'text-emerald-600 dark:text-emerald-400' : dtiRatio <= 35 ? 'text-yellow-600 dark:text-yellow-400' : 'text-rose-600 dark:text-rose-400';
            
            return `
              <div class="fa-subcard border-2 ${isAffordable ? 'border-emerald-300 dark:border-emerald-700' : 'border-yellow-300 dark:border-yellow-700'}">
                <h4 class="fa-list-copy-strong mb-3">${scenario.name}</h4>
                <div class="space-y-3">
                  <div class="flex justify-between items-center">
                    <span class="fa-script-copy-muted">Monthly Payment</span>
                    <span class="font-semibold">${formatCurrency(scenario.monthlyPaymentWithPMI)}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="fa-script-copy-muted">Debt-to-Income Ratio</span>
                    <span class="font-bold ${colorClass}">${dtiRatio.toFixed(1)}%</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="fa-script-copy-muted">Comfort Level</span>
                    <span class="font-semibold ${colorClass}">${comfortLevel}</span>
                  </div>
                  <div class="pt-2 fa-panel-divider-top">
                    <p class="fa-script-note">
                      ${isAffordable ? 
                        '✓ Within recommended 28% limit' : 
                        '⚠️ Exceeds recommended 28% limit - consider lower price or higher income'}
                    </p>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : ''}
    
    ${renderPaymentBreakdownChart(baseScenarios)}
    
    <!-- Base Scenarios Detailed Comparison -->
    <div class="fa-card p-6 mb-6">
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <span>📋</span> Original Scenarios Comparison
      </h2>
      <p class="fa-script-copy-muted mb-4">Side-by-side comparison of your mortgage options</p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        ${baseScenarios.map(scenario => 
          renderDetailedScenarioCard(scenario, scenario.name === bestScenario.name && baseScenarios.includes(bestScenario))
        ).join('')}
      </div>
    </div>
    
    ${refinanceScenarios.length > 0 ? `
      <!-- Refinance Scenarios Comparison -->
      <div class="fa-card p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Updated Scenarios with Refinancing</h2>
        <p class="fa-script-copy-muted mb-4">
          These scenarios assume you refinance after 5 years at the new rate.
        </p>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead class="fa-table-head">
              <tr>
                <th class="fa-help-copy px-4 py-3 text-left uppercase">Scenario</th>
                <th class="fa-help-copy px-4 py-3 text-right uppercase">New Monthly Payment</th>
                <th class="fa-help-copy px-4 py-3 text-right uppercase">Total Interest</th>
                <th class="fa-help-copy px-4 py-3 text-right uppercase">Total Cost</th>
                <th class="fa-help-copy px-4 py-3 text-right uppercase">Payoff Time</th>
              </tr>
            </thead>
            <tbody class="fa-table-body">
              ${refinanceScenarios.map(scenario => {
                const isBest = scenario.name === bestScenario.name && refinanceScenarios.includes(bestScenario);
                const rowClass = isBest ? 'bg-emerald-50 dark:bg-emerald-900/20 font-semibold' : '';
                const months = scenario.payoffMonths;
                const years = Math.floor(months / 12);
                const monthsRemainder = months % 12;
                const timeDisplay = years > 0 ? `${years}yr ${monthsRemainder}mo` : `${monthsRemainder}mo`;
                
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
      <div class="bg-linear-to-br from-violet-50 to-violet-50 dark:from-violet-900/20 dark:to-violet-900/20 rounded-lg p-6 border border-violet-200 dark:border-violet-700">
        <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
          <span>📊</span> Key Insights & Analysis
        </h3>
        
        <div class="space-y-4">
          ${baseScenarios.length === 2 ? `
            <!-- Options Comparison - Lead with this -->
            <div class="fa-card p-5 border-2 border-violet-300 dark:border-violet-600">
              <h4 class="fa-panel-title text-lg mb-4 flex items-center gap-2">
                <span>⚖️</span> Comparing Your Options
              </h4>
              
              <!-- Cost Difference Summary -->
              <div class="bg-linear-to-r from-violet-50 to-violet-50 dark:from-violet-900/20 dark:to-violet-900/20 rounded-lg p-5 mb-4">
                <div class="flex items-center justify-between mb-3">
                  <h5 class="fa-list-copy-strong">Total Cost Over Loan Life</h5>
                  <span class="text-2xl font-bold ${baseScenarios[0].totalCost < baseScenarios[1].totalCost ? 'text-emerald-600' : 'text-rose-600'}">
                    ${baseScenarios[0].totalCost < baseScenarios[1].totalCost ? '▼' : '▲'} ${formatCurrency(Math.abs(baseScenarios[0].totalCost - baseScenarios[1].totalCost))}
                  </span>
                </div>
                <p class="fa-script-copy-strong">
                  <strong>${baseScenarios[0].totalCost < baseScenarios[1].totalCost ? baseScenarios[0].name : baseScenarios[1].name}</strong> 
                  ${baseScenarios[0].totalCost < baseScenarios[1].totalCost ? 'costs less' : 'costs more'} than 
                  <strong>${baseScenarios[0].totalCost < baseScenarios[1].totalCost ? baseScenarios[1].name : baseScenarios[0].name}</strong> 
                  by this amount over the full loan term.
                </p>
              </div>
              
              <!-- Detailed Comparison Metrics -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div class="text-center p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-700">
                  <p class="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase mb-2">Monthly Payment</p>
                  <p class="fa-panel-title text-2xl mb-1">${formatCurrency(Math.abs(baseScenarios[0].monthlyPayment - baseScenarios[1].monthlyPayment))}</p>
                  <p class="fa-script-note">
                    ${baseScenarios[0].monthlyPayment < baseScenarios[1].monthlyPayment ? 
                      `Option A pays less per month` : 
                      `Option B pays less per month`}
                  </p>
                </div>
                <div class="text-center p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-700">
                  <p class="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase mb-2">Total Interest</p>
                  <p class="fa-panel-title text-2xl mb-1">${formatCurrency(Math.abs(baseScenarios[0].totalInterest - baseScenarios[1].totalInterest))}</p>
                  <p class="fa-script-note">
                    ${baseScenarios[0].totalInterest < baseScenarios[1].totalInterest ? 
                      `Option A pays less interest` : 
                      `Option B pays less interest`}
                  </p>
                </div>
                <div class="text-center p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-700">
                  <p class="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase mb-2">Payoff Timeline</p>
                  <p class="fa-panel-title text-2xl mb-1">${Math.abs(baseScenarios[0].payoffMonths - baseScenarios[1].payoffMonths)} mo</p>
                  <p class="fa-script-note">
                    ${baseScenarios[0].payoffMonths < baseScenarios[1].payoffMonths ? 
                      `Option A pays off faster` : 
                      `Option B pays off faster`}
                  </p>
                </div>
              </div>
              
              <!-- Detailed Comparison Write-up -->
              <div class="fa-surface-muted rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                <h5 class="fa-list-copy-strong mb-3 flex items-center gap-2">
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
          ` : ''}
          
          <!-- Best Value Analysis -->
          <div class="fa-subcard border-l-4 border-emerald-500">
            <h4 class="font-semibold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
              <span>✓</span> Recommended Option
            </h4>
            <p class="fa-script-copy-strong">
              Based on total cost analysis, <strong>${bestScenario.name}</strong> provides the best overall value
              ${Math.max(...scenarios.map(s => s.totalCost)) - bestScenario.totalCost > 0 ? 
                `, saving you <span class="font-bold text-emerald-600 dark:text-emerald-400">${formatCurrency(Math.max(...scenarios.map(s => s.totalCost)) - bestScenario.totalCost)}</span> over the life of the loan` : ''}.
            </p>
            ${baseScenarios.length === 2 && bestScenario === baseScenarios[0] ? `
              <p class="fa-script-note mt-2">
                💡 This represents a ${((1 - bestScenario.totalCost / baseScenarios[1].totalCost) * 100).toFixed(1)}% reduction in total cost.
              </p>
            ` : baseScenarios.length === 2 ? `
              <p class="fa-script-note mt-2">
                💡 This represents a ${((1 - bestScenario.totalCost / baseScenarios[0].totalCost) * 100).toFixed(1)}% reduction in total cost.
              </p>
            ` : ''}
          </div>
          
          ${refinanceScenarios.length > 0 ? `
            <!-- Refinancing Analysis -->
            <div class="fa-subcard border-l-4 border-violet-500">
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
      
      <!-- Financial Recommendations -->
      <div class="bg-linear-to-br from-emerald-50 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-900/20 rounded-lg p-6 border border-emerald-200 dark:border-emerald-700">
        <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
          <span>💡</span> Financial Recommendations
        </h3>
        
        <div class="space-y-3">
          ${generateRecommendations(baseScenarios, refinanceScenarios, bestScenario)}
        </div>
      </div>
      
      <!-- Important Considerations -->
      <div class="bg-linear-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-700">
        <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
          <span>⚠️</span> Important Considerations
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <h4 class="font-semibold text-sm text-slate-900 dark:text-white">✓ Factors Included</h4>
            <ul class="text-xs text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside">
              <li>Principal and interest payments</li>
              <li>Total interest over loan term</li>
              <li>Impact of extra payments</li>
              <li>Refinancing scenarios (if selected)</li>
            </ul>
          </div>
          
          <div class="space-y-2">
            <h4 class="font-semibold text-sm text-slate-900 dark:text-white">⚠️ Not Included</h4>
            <ul class="text-xs text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside">
              <li>Property taxes and insurance (PITI)</li>
              <li>PMI (if down payment < 20%)</li>
              <li>HOA fees or maintenance costs</li>
              <li>Closing costs and origination fees</li>
            </ul>
          </div>
        </div>
        
        <div class="mt-4 fa-subcard p-3">
          <p class="fa-script-note">
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

// ============================================================================
// VISUAL CHART RENDERING
// ============================================================================

function renderPaymentBreakdownChart(scenarios: Scenario[]): string {
  const canvasId = `payment-chart-${Date.now()}`;
  
  // Defer canvas rendering to next tick
  setTimeout(() => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Calculate chart data for both scenarios
    const chartData = scenarios.slice(0, 2).map(scenario => {
      const years = Math.ceil(scenario.payoffMonths / 12);
      const points: { year: number; principal: number; interest: number }[] = [];
      
      const monthlyRate = scenario.rate / 100 / 12;
      let remainingPrincipal = scenario.principal;
      
      for (let year = 0; year <= Math.min(years, 30); year++) {
        const month = year * 12;
        if (month >= scenario.payoffMonths) break;
        
        let yearPrincipal = 0;
        let yearInterest = 0;
        
        for (let m = 0; m < 12 && (month + m) < scenario.payoffMonths; m++) {
          const interestPayment = remainingPrincipal * monthlyRate;
          const principalPayment = Math.min(scenario.monthlyPayment - interestPayment, remainingPrincipal);
          
          yearPrincipal += principalPayment;
          yearInterest += interestPayment;
          remainingPrincipal = Math.max(0, remainingPrincipal - principalPayment);
        }
        
        points.push({ year, principal: yearPrincipal, interest: yearInterest });
      }
      
      return { scenario, points };
    });
    
    // Set canvas dimensions
    const width = canvas.offsetWidth;
    const height = 400;
    canvas.width = width;
    canvas.height = height;
    
    // Chart settings
    const padding = { top: 50, right: 40, bottom: 60, left: 80 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Find max values for scaling
    const allPoints = chartData.flatMap(d => d.points);
    const maxPayment = Math.max(...allPoints.map(p => p.principal + p.interest));
    const maxYear = Math.max(...allPoints.map(p => p.year));
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('color-scheme') === 'dark' ? '#1f2937' : '#f9fafb';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('color-scheme') === 'dark' ? '#374151' : '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      
      // Y-axis labels
      const value = maxPayment * (1 - i / 5);
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('color-scheme') === 'dark' ? '#9ca3af' : '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`$${(value / 1000).toFixed(0)}k`, padding.left - 10, y + 4);
    }
    
    // Draw X-axis labels
    ctx.textAlign = 'center';
    const step = Math.max(1, Math.ceil(maxYear / 10));
    for (let year = 0; year <= maxYear; year += step) {
      const x = padding.left + (chartWidth * year) / maxYear;
      ctx.fillText(`Y${year}`, x, height - padding.bottom + 25);
    }
    
    // Draw bars for each scenario
    const colors = [
      { principal: '#3b82f6', interest: '#93c5fd', label: 'A' },
      { principal: '#10b981', interest: '#6ee7b7', label: 'B' }
    ];
    
    const barGroupWidth = chartWidth / maxYear;
    const barWidth = (barGroupWidth / (chartData.length + 1)) - 2;
    
    chartData.forEach((data, scenarioIdx) => {
      data.points.forEach(point => {
        const xBase = padding.left + (chartWidth * point.year) / maxYear;
        const x = xBase + (scenarioIdx * barWidth);
        const totalPayment = point.principal + point.interest;
        
        if (totalPayment === 0) return;
        
        // Draw interest (top part)
        const interestHeight = (chartHeight * point.interest) / maxPayment;
        const interestY = padding.top + chartHeight - (chartHeight * totalPayment) / maxPayment;
        ctx.fillStyle = colors[scenarioIdx].interest;
        ctx.fillRect(x, interestY, barWidth, interestHeight);
        
        // Draw principal (bottom part)
        const principalHeight = (chartHeight * point.principal) / maxPayment;
        const principalY = padding.top + chartHeight - (chartHeight * point.principal) / maxPayment;
        ctx.fillStyle = colors[scenarioIdx].principal;
        ctx.fillRect(x, principalY, barWidth, principalHeight);
      });
    });
    
    // Draw legend
    const legendY = 20;
    ctx.textAlign = 'left';
    
    chartData.forEach((_, idx) => {
      const startX = padding.left + idx * (width / 2 - padding.left);
      
      // Principal box
      ctx.fillStyle = colors[idx].principal;
      ctx.fillRect(startX, legendY, 15, 15);
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('color-scheme') === 'dark' ? '#f3f4f6' : '#1f2937';
      ctx.font = '11px sans-serif';
      ctx.fillText(`Option ${colors[idx].label} Principal`, startX + 20, legendY + 11);
      
      // Interest box (below)
      ctx.fillStyle = colors[idx].interest;
      ctx.fillRect(startX + 120, legendY, 15, 15);
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('color-scheme') === 'dark' ? '#f3f4f6' : '#1f2937';
      ctx.fillText('Interest', startX + 140, legendY + 11);
    });
  }, 100);
  
  return `
    <div class="fa-card p-6 mb-6">
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <span>📊</span> Visual Payment Breakdown
      </h2>
      <p class="fa-script-copy-muted mb-4">See how your annual payments split between principal and interest over time</p>
      <canvas id="${canvasId}" class="w-full" style="max-width: 100%; height: 400px;"></canvas>
      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 fa-script-note">
        <div class="flex gap-2">
          <span>💡</span>
          <p>Interest payments decrease and principal payments increase over time</p>
        </div>
        <div class="flex gap-2">
          <span>📈</span>
          <p>Compare side-by-side: Option A (blue) vs Option B (green)</p>
        </div>
      </div>
    </div>
  `;
}

function renderSummaryCard(scenario: Scenario, idx: number, isBest: boolean): string {
  const bgColor = isBest 
    ? 'bg-gradient-to-br from-emerald-600 to-emerald-600' 
    : idx === 0 
      ? 'bg-gradient-to-br from-violet-600 to-violet-600' 
      : 'fa-surface-muted';
  const textColor = (isBest || idx === 0) ? 'text-white' : 'text-slate-900 dark:text-white';
  const borderClass = isBest 
    ? 'border-4 border-emerald-400 shadow-2xl' 
    : 'fa-surface-muted shadow-lg';
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

function renderDetailedScenarioCard(scenario: Scenario, isBest: boolean): string {
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
          <h4 class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">Loan Details</h4>
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
          <h4 class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">Monthly Payment</h4>
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
              <p class="fa-panel-title text-xl">${time.years} years ${time.months} months</p>
              <p class="fa-script-note mt-1">${scenario.payoffMonths} total payments</p>
            </div>
            <div class="text-4xl">⏱️</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function generateDetailedComparison(optionA: Scenario, optionB: Scenario): string {
  const monthlyDiff = Math.abs(optionA.monthlyPayment - optionB.monthlyPayment);
  const interestDiff = Math.abs(optionA.totalInterest - optionB.totalInterest);
  const totalDiff = Math.abs(optionA.totalCost - optionB.totalCost);
  const timeDiff = Math.abs(optionA.payoffMonths - optionB.payoffMonths);
  
  const lowerMonthly = optionA.monthlyPayment < optionB.monthlyPayment ? 'Option A' : 'Option B';
  const lowerInterest = optionA.totalInterest < optionB.totalInterest ? 'Option A' : 'Option B';
  const lowerTotal = optionA.totalCost < optionB.totalCost ? 'Option A' : 'Option B';
  const fasterPayoff = optionA.payoffMonths < optionB.payoffMonths ? 'Option A' : 'Option B';
  
  const downPaymentA = ((optionA.downPayment / (optionA.principal + optionA.downPayment)) * 100).toFixed(1);
  const downPaymentB = ((optionB.downPayment / (optionB.principal + optionB.downPayment)) * 100).toFixed(1);
  
  let analysis = '<ul class="list-disc list-inside space-y-2">';
  
  // Down payment comparison
  analysis += `
    <li><strong>Down Payment:</strong> Option A puts down ${downPaymentA}% (${formatCurrency(optionA.downPayment)}) vs 
    Option B at ${downPaymentB}% (${formatCurrency(optionB.downPayment)}). 
    ${parseFloat(downPaymentA) >= 20 && parseFloat(downPaymentB) < 20 ? 'Option A avoids PMI, while Option B will require it.' : 
      parseFloat(downPaymentB) >= 20 && parseFloat(downPaymentA) < 20 ? 'Option B avoids PMI, while Option A will require it.' : 
      parseFloat(downPaymentA) < 20 && parseFloat(downPaymentB) < 20 ? 'Both options require PMI since down payments are under 20%.' : 
      'Both options avoid PMI with 20%+ down payments.'}</li>
  `;
  
  // Interest rate comparison
  const rateDiff = Math.abs(optionA.rate - optionB.rate);
  if (rateDiff >= 0.1) {
    analysis += `
      <li><strong>Interest Rate:</strong> ${rateDiff.toFixed(2)}% rate difference translates to ${formatCurrency(interestDiff)} in total interest. 
      ${lowerInterest} has the ${optionA.rate < optionB.rate ? optionA.rate : optionB.rate}% rate, 
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
      <li><strong>Payoff Speed:</strong> ${fasterPayoff} finishes about ${yearsSaved} years ${fasterPayoff === 'Option A' ? 'ahead' : 'behind'}, 
      which affects how quickly you build equity.</li>
    `;
  }
  
  // Extra payments impact
  if (optionA.extraPayment > 0 || optionB.extraPayment > 0) {
    const hasExtra = optionA.extraPayment > 0 ? 'Option A' : 'Option B';
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
        <div class="flex gap-3 fa-subcard p-3">
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
  }
  
  // Extra payment recommendation
  const hasExtraPayments = baseScenarios.some(s => s.extraPayment > 0);
  if (!hasExtraPayments) {
    recommendations.push(`
      <div class="flex gap-3 fa-subcard p-3">
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
  if (baseScenarios.length === 2 && Math.abs(baseScenarios[0].rate - baseScenarios[1].rate) >= 0.25) {
    recommendations.push(`
      <div class="flex gap-3 fa-subcard p-3">
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
    <div class="flex gap-3 fa-subcard p-3">
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
  if (refinanceScenarios.length > 0) {
    const savings = baseScenarios[0].totalCost - refinanceScenarios[0].totalCost;
    if (savings > 10000) {
      recommendations.push(`
        <div class="flex gap-3 fa-subcard p-3">
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
      <div class="flex gap-3 fa-subcard p-3 border border-emerald-200 dark:border-emerald-700">
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
    
    const saved: SavedScenarioRecord[] = JSON.parse(
      localStorage.getItem(SAVED_SCENARIOS_KEY) || '[]'
    );
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
    
    const saved: SavedScenarioRecord[] = JSON.parse(
      localStorage.getItem(SAVED_SCENARIOS_KEY) || '[]'
    );
    const scenario = saved.find((savedScenario) => savedScenario.id === parseInt(scenarioId, 10));
    
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
// CHATBOT INTEGRATION
// ============================================================================

function setupChatbotContext(form: HTMLFormElement): void {
  // Set calculator-specific context for the chatbot
  const contextData: MortgageScenarioChatContext = {
    calculatorType: 'mortgage-scenario-planning',
    calculatorName: 'Mortgage Scenario Planner',
    capabilities: [
      'Compare multiple mortgage scenarios with different down payments and rates',
      'Analyze early payoff strategies with extra monthly payments',
      'Evaluate refinancing options after 5 years',
      'Calculate total interest savings and payoff timelines',
      'Provide CFP-level analysis and recommendations',
    ],
    currentFormData: null,
  };
  
  // Update context data when form changes
  form.addEventListener('input', () => {
    const input = parseFormInput(form);
    contextData.currentFormData = {
      homePrice: input.homePrice || null,
      loanTerm: input.loanTermYears || null,
      scenario1: {
        downPayment: input.scenario1Down || null,
        rate: input.scenario1Rate || null,
        extraPayment: input.scenario1Extra || null,
      },
      scenario2: {
        downPayment: input.scenario2Down || null,
        rate: input.scenario2Rate || null,
        extraPayment: input.scenario2Extra || null,
      },
      refinanceRate: input.refinanceRate || null,
    };
    
    // Dispatch context update
    window.dispatchEvent(new CustomEvent('chat-context-update', {
      detail: {
        context: 'mortgage-scenario-planning',
        contextLabel: 'Mortgage Scenario Planner',
        contextData,
      },
    }));
  });
  
  // Set initial context
  window.dispatchEvent(new CustomEvent('chat-context-update', {
    detail: {
      context: 'mortgage-scenario-planning',
      contextLabel: 'Mortgage Scenario Planner - CFP Assistant',
      contextData,
    },
  }));
}

function updateChatbotWithResults(
  scenarios: Scenario[],
  formData: MortgageScenarioPlanningInput
): void {
  const bestScenario = scenarios.reduce((best, current) => 
    current.totalCost < best.totalCost ? current : best
  );
  
  const baseScenarios = scenarios.filter(s => !s.name.includes('Refinanced'));
  const refinanceScenarios = scenarios.filter(s => s.name.includes('Refinanced'));
  
  const analysisContext = {
    calculatorType: 'mortgage-scenario-planning',
    calculatorName: 'Mortgage Scenario Planner',
    results: {
      scenarios: scenarios.map(s => ({
        name: s.name,
        downPayment: s.downPayment,
        downPaymentPercent: ((s.downPayment / (s.principal + s.downPayment)) * 100).toFixed(1),
        rate: s.rate,
        principal: s.principal,
        monthlyPayment: s.monthlyPayment,
        totalInterest: s.totalInterest,
        totalCost: s.totalCost,
        payoffMonths: s.payoffMonths,
        payoffYears: (s.payoffMonths / 12).toFixed(1),
      })),
      bestScenario: {
        name: bestScenario.name,
        monthlyPayment: bestScenario.monthlyPayment,
        totalCost: bestScenario.totalCost,
        savings: Math.max(...scenarios.map(s => s.totalCost)) - bestScenario.totalCost,
      },
      comparison: baseScenarios.length === 2 ? {
        monthlyDiff: Math.abs(baseScenarios[0].monthlyPayment - baseScenarios[1].monthlyPayment),
        interestDiff: Math.abs(baseScenarios[0].totalInterest - baseScenarios[1].totalInterest),
        totalCostDiff: Math.abs(baseScenarios[0].totalCost - baseScenarios[1].totalCost),
      } : null,
      refinancing: refinanceScenarios.length > 0 ? {
        available: true,
        savings: baseScenarios[0] && refinanceScenarios[0] ? baseScenarios[0].totalCost - refinanceScenarios[0].totalCost : 0,
        roi: baseScenarios[0] && refinanceScenarios[0] ? ((1 - refinanceScenarios[0].totalCost / baseScenarios[0].totalCost) * 100).toFixed(1) : '0',
      } : { available: false },
    },
    formData,
    cfpGuidance: [
      'I can explain any of these results in detail',
      'Ask about down payment strategies or PMI avoidance',
      'Request affordability analysis based on your income',
      'Get recommendations on extra payment strategies',
      'Understand refinancing break-even points',
      'Compare scenarios based on your financial goals',
    ],
  };
  
  // Update chatbot context with results
  window.dispatchEvent(new CustomEvent('chat-context-update', {
    detail: {
      context: 'mortgage-scenario-planning',
      contextLabel: 'Mortgage Analysis - CFP Assistant',
      contextData: analysisContext,
    },
  }));
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
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'mortgage_scenario_calculated', {
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
