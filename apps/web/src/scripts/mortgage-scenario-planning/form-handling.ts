/**
 * Form handling for Mortgage Scenario Planning Calculator
 */

import type { 
  MortgageScenarioPlanningInput, 
  ScenarioInput, 
} from './types';
import { 
  MIN_SCENARIOS, 
  MAX_SCENARIOS, 
  SCENARIO_COLORS,
} from './constants';
// generateScenarioName moved to calculations module
import {
  coerceNumber,
  showError,
} from '../../utils/calculator-utilities';

// Track dynamic scenarios
let scenarioCount = 2;

/**
 * Get current scenario count (for external access)
 */
export function getScenarioCount(): number {
  return scenarioCount;
}

/**
 * Set scenario count (for external updates)
 */
export function setScenarioCount(count: number): void {
  scenarioCount = Math.max(MIN_SCENARIOS, Math.min(MAX_SCENARIOS, count));
}

/**
 * Inject dynamic scenario UI into the form
 */
export function injectDynamicScenarioUI(form: HTMLFormElement, initialCount?: number): void {
  // Set initial scenario count if provided
  if (initialCount !== undefined && initialCount >= MIN_SCENARIOS && initialCount <= MAX_SCENARIOS) {
    scenarioCount = initialCount;
  }
  
  // Find existing scenario containers and wrap them
  const optionAGroup = form.querySelector('[data-group-name*="Option A"]') || 
    form.querySelector('.form-group:has(#scenario1Down)');
  const optionBGroup = form.querySelector('[data-group-name*="Option B"]') ||
    form.querySelector('.form-group:has(#scenario2Down)');
  
  // Create dynamic scenarios container if it doesn't exist
  let dynamicContainer = document.getElementById('dynamic-scenarios');
  if (!dynamicContainer) {
    dynamicContainer = document.createElement('div');
    dynamicContainer.id = 'dynamic-scenarios';
    dynamicContainer.className = 'space-y-4';
    
    // Find where to insert - after loan basics, before refinancing
    const refinanceGroup = form.querySelector('[data-group-name*="Refinancing"]');
    const loanBasicsGroup = form.querySelector('[data-group-name*="Loan Basics"]');
    
    if (refinanceGroup && refinanceGroup.parentNode) {
      refinanceGroup.parentNode.insertBefore(dynamicContainer, refinanceGroup);
    } else if (loanBasicsGroup && loanBasicsGroup.nextSibling) {
      loanBasicsGroup.parentNode?.insertBefore(dynamicContainer, loanBasicsGroup.nextSibling);
    }
  }
  
  // Hide original static groups if they exist
  if (optionAGroup) (optionAGroup as HTMLElement).style.display = 'none';
  if (optionBGroup) (optionBGroup as HTMLElement).style.display = 'none';
  
  // Add initial scenarios
  renderScenarioCards(dynamicContainer);
  
  // Add "Add Scenario" button
  addScenarioButton(form, dynamicContainer);
}

/**
 * Render all scenario cards
 */
export function renderScenarioCards(container: HTMLElement): void {
  container.innerHTML = '';
  
  for (let i = 0; i < scenarioCount; i++) {
    const scenarioCard = createScenarioCard(i);
    container.appendChild(scenarioCard);
  }
}

/**
 * Create a single scenario card
 */
export function createScenarioCard(index: number): HTMLElement {
  const colors = SCENARIO_COLORS[index % SCENARIO_COLORS.length];
  const letter = String.fromCharCode(65 + index); // A, B, C, ...
  
  const card = document.createElement('div');
  card.className = `scenario-card border-2 border-${colors.bg}-200 dark:border-${colors.bg}-700 p-4 relative`;
  card.dataset.scenarioIndex = String(index);
  
  card.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <span class="w-8 h-8 rounded-full bg-${colors.bg}-500 text-white flex items-center justify-center font-bold text-sm">${letter}</span>
        <h3 class="fa-list-copy-strong">
          Scenario ${letter}
          <span class="fa-help-copy text-sm font-normal">${index === 0 ? '(Conservative)' : index === 1 ? '(Alternative)' : ''}</span>
        </h3>
      </div>
      ${index >= MIN_SCENARIOS ? `
        <button type="button" 
          class="remove-scenario-btn p-1.5 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500 transition-colors" 
          data-remove-index="${index}"
          title="Remove Scenario ${letter}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      ` : ''}
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="scenario${index}Down" class="fa-field-label mb-1 block">
          Down Payment
          <span class="fa-help-copy ml-1 text-xs">(20%+ avoids PMI)</span>
        </label>
        <div class="relative">
          <span class="fa-help-copy absolute left-3 top-1/2 -translate-y-1/2">$</span>
          <input type="number" 
            id="scenario${index}Down" 
            name="scenario${index}Down"
            class="fa-input-surface w-full py-2 pl-7 pr-3 focus:ring-2 focus:ring-${colors.bg}-500 focus:border-transparent"
            min="0" 
            step="1000" 
            placeholder="${index === 0 ? '100000' : index === 1 ? '75000' : '50000'}"
            required>
        </div>
      </div>
      
      <div>
        <label for="scenario${index}Rate" class="fa-field-label mb-1 block">
          Interest Rate
          <span class="fa-help-copy ml-1 text-xs">(Shop 3-5 lenders)</span>
        </label>
        <div class="relative">
          <input type="number" 
            id="scenario${index}Rate" 
            name="scenario${index}Rate"
            class="fa-input-surface w-full py-2 pl-3 pr-7 focus:ring-2 focus:ring-${colors.bg}-500 focus:border-transparent"
            min="0" 
            max="30" 
            step="0.01" 
            placeholder="${index === 0 ? '6.5' : index === 1 ? '7.0' : '6.75'}"
            required>
          <span class="fa-help-copy absolute right-3 top-1/2 -translate-y-1/2">%</span>
        </div>
      </div>
      
      <div>
        <label for="scenario${index}Extra" class="fa-field-label mb-1 block">
          Extra Monthly Payment
          <span class="fa-help-copy ml-1 text-xs">(optional)</span>
        </label>
        <div class="relative">
          <span class="fa-help-copy absolute left-3 top-1/2 -translate-y-1/2">$</span>
          <input type="number" 
            id="scenario${index}Extra" 
            name="scenario${index}Extra"
            class="fa-input-surface w-full py-2 pl-7 pr-3 focus:ring-2 focus:ring-${colors.bg}-500 focus:border-transparent"
            min="0" 
            step="50" 
            placeholder="0">
        </div>
      </div>
      
      <div>
        <label for="scenario${index}Closing" class="fa-field-label mb-1 block">
          Closing Costs
          <span class="fa-help-copy ml-1 text-xs">(typically 2-5%)</span>
        </label>
        <div class="relative">
          <span class="fa-help-copy absolute left-3 top-1/2 -translate-y-1/2">$</span>
          <input type="number" 
            id="scenario${index}Closing" 
            name="scenario${index}Closing"
            class="fa-input-surface w-full py-2 pl-7 pr-3 focus:ring-2 focus:ring-${colors.bg}-500 focus:border-transparent"
            min="0" 
            step="500" 
            placeholder="${index === 0 ? '15000' : '12000'}">
        </div>
      </div>
    </div>
    
    <div class="mt-3 flex items-center gap-2 fa-script-note">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <span>Tip: Try different down payments and rates to see the impact on total cost</span>
    </div>
  `;
  
  // Add event listener for remove button
  const removeBtn = card.querySelector('.remove-scenario-btn');
  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      removeScenario(index);
    });
  }
  
  return card;
}

/**
 * Add the "Add Scenario" button
 */
function addScenarioButton(_form: HTMLFormElement, container: HTMLElement): void {
  // Check if button already exists
  const existingBtn = document.getElementById('add-scenario-btn');
  if (existingBtn) return;
  
  const addBtn = document.createElement('button') as HTMLButtonElement;
  addBtn.type = 'button';
  addBtn.id = 'add-scenario-btn';
  addBtn.className = 'fa-subcard w-full border-2 border-dashed px-4 py-3 fa-card-copy hover:border-violet-500 hover:text-violet-500 dark:hover:border-violet-400 dark:hover:text-violet-400 transition-colors flex items-center justify-center gap-2 font-medium';
  addBtn.innerHTML = `
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
    </svg>
    <span>Add Another Scenario</span>
    <span class="text-xs text-slate-400">(${scenarioCount}/${MAX_SCENARIOS})</span>
  `;
  
  addBtn.addEventListener('click', (e) => {
    e.preventDefault();
    addScenario(container);
  });
  
  // Insert after dynamic container
  container.parentNode?.insertBefore(addBtn, container.nextSibling);
  
  updateAddButtonState();
}

/**
 * Add a new scenario
 */
export function addScenario(container: HTMLElement): void {
  if (scenarioCount >= MAX_SCENARIOS) {
    showError(`Maximum of ${MAX_SCENARIOS} scenarios allowed`);
    return;
  }
  
  scenarioCount++;
  renderScenarioCards(container);
  updateAddButtonState();
  
  // Scroll to the new scenario
  const newCard = container.lastElementChild;
  if (newCard) {
    newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/**
 * Remove a scenario
 */
export function removeScenario(_index: number): void {
  if (scenarioCount <= MIN_SCENARIOS) {
    showError(`Minimum of ${MIN_SCENARIOS} scenarios required`);
    return;
  }
  
  scenarioCount--;
  
  const container = document.getElementById('dynamic-scenarios');
  if (container) {
    renderScenarioCards(container);
  }
  
  updateAddButtonState();
}

/**
 * Update the Add button state based on current count
 */
function updateAddButtonState(): void {
  const addBtn = document.getElementById('add-scenario-btn');
  if (addBtn) {
    const disabled = scenarioCount >= MAX_SCENARIOS;
    (addBtn as HTMLButtonElement).disabled = disabled;
    addBtn.classList.toggle('opacity-50', disabled);
    addBtn.classList.toggle('cursor-not-allowed', disabled);
    
    // Update counter text
    const counterSpan = addBtn.querySelector('span.text-xs');
    if (counterSpan) {
      counterSpan.textContent = `(${scenarioCount}/${MAX_SCENARIOS})`;
    }
  }
}

/**
 * Set up form event listeners (excluding submit, which is handled by index.ts)
 */
export function setupFormEventListeners(form: HTMLFormElement): void {
  // Sync loan term across all scenarios if there's a global loan term selector
  const loanTermSelect = form.querySelector<HTMLSelectElement>('[name="loanTerm"], [name="loanTermYears"]');
  if (loanTermSelect) {
    loanTermSelect.addEventListener('change', () => {
      // Could sync to individual scenario inputs if needed in future
    });
  }
  
  // Reset button handler
  const resetBtn = form.querySelector<HTMLButtonElement>('[type="reset"], #reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      // Clear results section
      const resultsSection = document.getElementById('results-section');
      if (resultsSection) resultsSection.classList.add('hidden');
      
      // Clear cache
      try {
        localStorage.removeItem('fanalyx-mortgage-scenario-cache');
      } catch {
        // Ignore storage errors
      }
    });
  }
}

/**
 * Parse form input into structured data
 */
export function parseFormInput(form: HTMLFormElement): MortgageScenarioPlanningInput {
  const formData = new FormData(form);
  
  // Parse dynamic scenarios
  const scenarios: ScenarioInput[] = [];
  for (let i = 0; i < scenarioCount; i++) {
    const down = coerceNumber(formData.get(`scenario${i}Down`), 0);
    const rate = coerceNumber(formData.get(`scenario${i}Rate`), 0);
    const extra = coerceNumber(formData.get(`scenario${i}Extra`), 0);
    const closing = coerceNumber(formData.get(`scenario${i}Closing`), 0);
    
    // Only add if at least down payment and rate are provided
    if (down > 0 || rate > 0) {
      scenarios.push({
        downPayment: down,
        rate: rate,
        extraPayment: extra,
        closingCosts: closing,
        label: String.fromCharCode(65 + i),
      });
    }
  }
  
  // Fallback to legacy format if no dynamic scenarios found
  if (scenarios.length === 0) {
    const s1Down = coerceNumber(formData.get('scenario1Down'), 0);
    const s1Rate = coerceNumber(formData.get('scenario1Rate'), 0);
    const s2Down = coerceNumber(formData.get('scenario2Down'), 0);
    const s2Rate = coerceNumber(formData.get('scenario2Rate'), 0);
    
    if (s1Rate > 0) {
      scenarios.push({
        downPayment: s1Down,
        rate: s1Rate,
        extraPayment: coerceNumber(formData.get('scenario1Extra'), 0),
        closingCosts: 0,
        label: 'A',
      });
    }
    if (s2Rate > 0) {
      scenarios.push({
        downPayment: s2Down,
        rate: s2Rate,
        extraPayment: coerceNumber(formData.get('scenario2Extra'), 0),
        closingCosts: 0,
        label: 'B',
      });
    }
  }
  
  return {
    homePrice: coerceNumber(formData.get('homePrice'), 0),
    loanTermYears: parseInt(String(formData.get('loanTerm') || '30')),
    scenarios,
    refinanceRate: coerceNumber(formData.get('refinanceRate'), undefined),
    grossMonthlyIncome: coerceNumber(formData.get('grossMonthlyIncome'), undefined),
    // Legacy fields for backwards compatibility
    scenario1Down: scenarios[0]?.downPayment ?? 0,
    scenario1Rate: scenarios[0]?.rate ?? 0,
    scenario1Extra: scenarios[0]?.extraPayment ?? 0,
    scenario2Down: scenarios[1]?.downPayment ?? 0,
    scenario2Rate: scenarios[1]?.rate ?? 0,
    scenario2Extra: scenarios[1]?.extraPayment ?? 0,
  };
}

/**
 * Validate input data
 * @returns Error message string or null if valid
 */
export function validateInput(input: MortgageScenarioPlanningInput): string | null {
  if (input.homePrice <= 0) {
    return 'Please enter a valid home price';
  }
  
  if (!input.scenarios || input.scenarios.length < 2) {
    return 'Please configure at least 2 scenarios to compare';
  }
  
  for (let i = 0; i < input.scenarios.length; i++) {
    const scenario = input.scenarios[i];
    const label = scenario.label || String.fromCharCode(65 + i);
    
    if (scenario.rate <= 0) {
      return `Please enter a valid interest rate for Scenario ${label}`;
    }
    
    if (scenario.downPayment >= input.homePrice) {
      return `Scenario ${label}: Down payment must be less than home price`;
    }
    
    if (scenario.rate > 30) {
      return `Scenario ${label}: Interest rate seems too high (max 30%)`;
    }
  }
  
  return null;
}
