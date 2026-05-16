/**
 * Mortgage Scenario Planning Calculator
 * Main entry point and initialization
 */

// Re-export all types and functions for external use
export * from './types';
export * from './constants';
export * from './utils';
export * from './calculations';
export * from './form-handling';
export * from './cache';
export * from './charts';
export * from './display';
export * from './chatbot';

// Import what we need for initialization
import type { Scenario, MortgageScenarioPlanningInput } from './types';
import { MIN_SCENARIOS } from './constants';
import { calculateScenario, calculateRefinanceScenario } from './calculations';
import { parseFormInput, validateInput, injectDynamicScenarioUI, setupFormEventListeners } from './form-handling';
import { loadCachedResults, cacheResults, storeRecentCalculation } from './cache';
import { displayResults } from './display';
import { setupChatbotContext, updateChatbotWithResults } from './chatbot';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Dispatch event when calculation is complete (for journey and analytics)
 */
function dispatchCalculatorCompletedEvent(scenarios: Scenario[], formData: MortgageScenarioPlanningInput): void {
  // Find best scenario (lowest total cost)
  const bestScenario = scenarios.reduce((best, current) => 
    current.totalCost < best.totalCost ? current : best
  );

  // Dispatch for journey tracking
  window.dispatchEvent(new CustomEvent('calculator-completed', {
    detail: {
      calculatorType: 'mortgage-scenario-planning',
      result: {
        bestScenario: bestScenario.name,
        monthlyPayment: bestScenario.monthlyPayment,
        totalCost: bestScenario.totalCost,
        totalInterest: bestScenario.totalInterest,
        payoffMonths: bestScenario.payoffMonths,
        homePrice: formData.homePrice,
        loanTerm: formData.loanTermYears,
        scenarioCount: scenarios.length,
      },
    },
  }));

  // Google Analytics event
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'mortgage_scenario_calculated', {
      event_category: 'calculator',
      event_label: 'mortgage_scenario_planning',
      home_price: formData.homePrice,
      loan_term: formData.loanTermYears,
      scenario_count: scenarios.length,
      best_scenario: bestScenario.name,
      best_monthly_payment: bestScenario.monthlyPayment,
      best_total_cost: bestScenario.totalCost,
    });
  }
}

/**
 * Handle form submission and run calculations
 */
async function handleCalculate(
  form: HTMLFormElement,
  resultsDiv: HTMLElement,
  chartContainer: HTMLElement,
  calculateButton: HTMLButtonElement,
  resultsSection: HTMLElement
): Promise<void> {
  const formData = parseFormInput(form);
  const validationError = validateInput(formData);

  if (validationError) {
    resultsDiv.innerHTML = `
      <div class="p-4 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-lg">
        <p class="font-medium">Validation Error</p>
        <p class="text-sm">${validationError}</p>
      </div>
    `;
    chartContainer.innerHTML = '';
    // Show results section even for errors
    resultsSection.classList.remove('hidden');
    return;
  }

  // Show loading state
  calculateButton.disabled = true;
  calculateButton.innerHTML = `
    <span class="inline-flex items-center gap-2">
      <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Analyzing Scenarios...
    </span>
  `;
  resultsDiv.innerHTML = `
    <div class="p-8 text-center">
      <div class="animate-pulse">
        <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mx-auto mb-4"></div>
        <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mx-auto mb-4"></div>
        <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mx-auto"></div>
      </div>
      <p class="fa-meta-copy mt-4">Running CFP-level analysis...</p>
    </div>
  `;

  try {
    // Collect all scenario inputs
    const scenarioInputs = formData.scenarios;
    const termMonths = formData.loanTermYears * 12;
    
    // Calculate all base scenarios in parallel
    const baseScenarioPromises = scenarioInputs.map((scenarioInput, index) => {
      const principal = formData.homePrice - scenarioInput.downPayment;
      const scenarioName = scenarioInput.label 
        ? `Scenario ${scenarioInput.label}` 
        : `Scenario ${String.fromCharCode(65 + index)}`;
      
      return calculateScenario(
        scenarioName,
        principal,
        scenarioInput.rate / 100,  // Convert to decimal
        termMonths,
        scenarioInput.extraPayment,
        scenarioInput.downPayment,
        scenarioInput.rate,
        formData.homePrice,
        scenarioInput.closingCosts || 0,
        index
      );
    });

    const baseScenarios = await Promise.all(baseScenarioPromises);

    // Calculate refinance scenarios if a rate is provided
    const scenarios: Scenario[] = [...baseScenarios];
    
    if (formData.refinanceRate && formData.refinanceRate > 0) {
      const refiRate = formData.refinanceRate / 100;  // Convert to decimal (safe after truthiness check)
      const refinancePromises = baseScenarios.map(scenario =>
        calculateRefinanceScenario(
          `${scenario.name} (Refinanced)`,
          scenario,
          60, // Refinance at month 60 (5 years)
          refiRate,
          termMonths
        )
      );
      const refinanceScenarios = await Promise.all(refinancePromises);
      scenarios.push(...refinanceScenarios);
    }

    // Display results
    displayResults(scenarios, resultsDiv, chartContainer, formData);
    
    // Show the results section
    resultsSection.classList.remove('hidden');
    
    // Also show the results indicator (success banner)
    const resultsIndicator = document.getElementById('results');
    if (resultsIndicator) {
      resultsIndicator.classList.remove('hidden');
    }
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Cache results
    cacheResults(formData, scenarios);
    
    // Store in recent calculations
    storeRecentCalculation(formData, scenarios);
    
    // Update chatbot context with results
    updateChatbotWithResults(scenarios, formData);
    
    // Dispatch completion event for journey tracking
    dispatchCalculatorCompletedEvent(scenarios, formData);

  } catch (error) {
    console.error('Calculation error:', error);
    resultsDiv.innerHTML = `
      <div class="p-4 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-lg">
        <p class="font-medium">Calculation Error</p>
        <p class="text-sm">${error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
        <p class="text-xs mt-2">Please check your inputs and try again.</p>
      </div>
    `;
    chartContainer.innerHTML = '';
    // Show results section even for errors so user sees the message
    resultsSection.classList.remove('hidden');
  } finally {
    calculateButton.disabled = false;
    calculateButton.innerHTML = 'Calculate &amp; Compare';
  }
}

/**
 * Initialize the Mortgage Scenario Planning Calculator
 */
export function initializeMortgageScenarioPlanning(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  const resultsDiv = document.getElementById('results-content') as HTMLElement | null;
  const resultsSection = document.getElementById('results-section') as HTMLElement | null;
  const calculateButton = document.getElementById('calculate-btn') as HTMLButtonElement | null;

  if (!form || !resultsDiv || !resultsSection || !calculateButton) {
    console.error('Mortgage Scenario Planning: Required elements not found', {
      form: !!form,
      resultsDiv: !!resultsDiv,
      resultsSection: !!resultsSection,
      calculateButton: !!calculateButton
    });
    return;
  }
  
  // Create a chart container dynamically if needed
  let chartContainer = document.getElementById('chart-container') as HTMLElement | null;
  if (!chartContainer) {
    chartContainer = document.createElement('div');
    chartContainer.id = 'chart-container';
    chartContainer.className = 'mt-6';
    resultsDiv.appendChild(chartContainer);
  }

  // Inject dynamic scenario UI (replaces static scenario 1/2 cards)
  injectDynamicScenarioUI(form, MIN_SCENARIOS);

  // Set up form event listeners (sync loan term, add/remove scenarios, save/load)
  setupFormEventListeners(form);

  // Set up chatbot context
  setupChatbotContext(form);

  // Handle form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleCalculate(form, resultsDiv, chartContainer, calculateButton, resultsSection);
  });

  // Try to load cached results on page load
  const cachedData = loadCachedResults();
  if (cachedData) {
    // Re-inject dynamic UI with correct scenario count if needed
    const scenarioCount = cachedData.formData.scenarios?.length || MIN_SCENARIOS;
    if (scenarioCount !== MIN_SCENARIOS) {
      injectDynamicScenarioUI(form, scenarioCount);
    }
    
    // Populate form with cached data
    const homePriceInput = form.querySelector<HTMLInputElement>('[name="homePrice"]');
    const loanTermInput = form.querySelector<HTMLInputElement>('[name="loanTermYears"]');
    const refinanceRateInput = form.querySelector<HTMLInputElement>('[name="refinanceRate"]');

    if (homePriceInput) homePriceInput.value = cachedData.formData.homePrice.toString();
    if (loanTermInput) loanTermInput.value = cachedData.formData.loanTermYears.toString();
    if (refinanceRateInput && cachedData.formData.refinanceRate) {
      refinanceRateInput.value = cachedData.formData.refinanceRate.toString();
    }

    // Populate scenario fields
    cachedData.formData.scenarios?.forEach((scenario, index) => {
      const downInput = form.querySelector<HTMLInputElement>(`[name="scenario${index}Down"]`);
      const rateInput = form.querySelector<HTMLInputElement>(`[name="scenario${index}Rate"]`);
      const extraInput = form.querySelector<HTMLInputElement>(`[name="scenario${index}Extra"]`);
      const closingInput = form.querySelector<HTMLInputElement>(`[name="scenario${index}Closing"]`);

      if (downInput) downInput.value = scenario.downPayment.toString();
      if (rateInput) rateInput.value = scenario.rate.toString();
      if (extraInput && scenario.extraPayment) extraInput.value = scenario.extraPayment.toString();
      if (closingInput && scenario.closingCosts) closingInput.value = scenario.closingCosts.toString();
    });

    // Display cached results
    displayResults(cachedData.scenarios, resultsDiv, chartContainer, cachedData.formData);
    
    // Show the results section for cached results
    resultsSection.classList.remove('hidden');
    const resultsIndicator = document.getElementById('results');
    if (resultsIndicator) {
      resultsIndicator.classList.remove('hidden');
    }
    
    // Update chatbot with cached results
    updateChatbotWithResults(cachedData.scenarios, cachedData.formData);
  }
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMortgageScenarioPlanning);
  } else {
    initializeMortgageScenarioPlanning();
  }
}
