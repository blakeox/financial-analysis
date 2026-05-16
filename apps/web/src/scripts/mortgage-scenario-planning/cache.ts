/**
 * Caching and storage for Mortgage Scenario Planning Calculator
 */

import type { MortgageScenarioPlanningInput, Scenario, SavedScenarioRecord } from './types';
import { CACHE_KEY, CACHE_DURATION, SAVED_SCENARIOS_KEY } from './constants';
import { parseFormInput } from './form-handling';

/**
 * Get cached calculation results
 */
export function getCachedResults(input: MortgageScenarioPlanningInput): Scenario[] | null {
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

/**
 * Cache calculation results
 */
export function cacheResults(input: MortgageScenarioPlanningInput, scenarios: Scenario[]): void {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        input,
        scenarios,
      })
    );
  } catch (error) {
    console.warn('Failed to cache results:', error);
  }
}

/**
 * Clear the calculation cache
 */
export function clearCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
}

interface CachedData {
  formData: MortgageScenarioPlanningInput;
  scenarios: Scenario[];
  timestamp: number;
}

/**
 * Load cached results if recent and return both scenarios and form data
 */
export function loadCachedResults(): CachedData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { timestamp, input, scenarios } = JSON.parse(cached);
    const now = Date.now();

    // Only load if recent
    if (now - timestamp <= CACHE_DURATION) {
      return {
        formData: input as MortgageScenarioPlanningInput,
        scenarios: scenarios as Scenario[],
        timestamp,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================================================
// RECENT CALCULATIONS TRACKING
// ============================================================================

const RECENT_CALCULATIONS_KEY = 'fanalyx-recent-calculations';

/**
 * Store a calculation in recent calculations list for dashboard
 */
export function storeRecentCalculation(
  _input: MortgageScenarioPlanningInput,
  scenarios: Scenario[]
): void {
  try {
    const recent = JSON.parse(localStorage.getItem(RECENT_CALCULATIONS_KEY) || '[]');
    const bestScenario = scenarios.reduce((best, current) =>
      current.totalCost < best.totalCost ? current : best
    );

    recent.unshift({
      type: 'mortgage-scenario',
      timestamp: Date.now(),
      summary: `Compared ${scenarios.length} scenarios`,
      result: bestScenario.name,
    });

    // Keep only last 10
    localStorage.setItem(RECENT_CALCULATIONS_KEY, JSON.stringify(recent.slice(0, 10)));
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// SCENARIO SAVE/LOAD
// ============================================================================

/**
 * Save the current scenario to local storage
 */
export function saveScenario(form: HTMLFormElement): void {
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

/**
 * Load a saved scenario from URL params or storage
 */
export function loadSavedScenario(form: HTMLFormElement): void {
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
    (form.elements.namedItem('scenario1Down') as HTMLInputElement).value = String(
      input.scenario1Down
    );
    (form.elements.namedItem('scenario1Rate') as HTMLInputElement).value = String(
      input.scenario1Rate
    );
    (form.elements.namedItem('scenario1Extra') as HTMLInputElement).value = String(
      input.scenario1Extra || ''
    );
    (form.elements.namedItem('scenario2Down') as HTMLInputElement).value = String(
      input.scenario2Down
    );
    (form.elements.namedItem('scenario2Rate') as HTMLInputElement).value = String(
      input.scenario2Rate
    );
    (form.elements.namedItem('scenario2Extra') as HTMLInputElement).value = String(
      input.scenario2Extra || ''
    );
    if (input.refinanceRate) {
      (form.elements.namedItem('refinanceRate') as HTMLInputElement).value = String(
        input.refinanceRate
      );
    }

    // Also try to populate dynamic scenarios
    if (input.scenarios && input.scenarios.length > 0) {
      input.scenarios.forEach((scenario, index) => {
        const downInput = form.elements.namedItem(`scenario${index}Down`) as HTMLInputElement;
        const rateInput = form.elements.namedItem(`scenario${index}Rate`) as HTMLInputElement;
        const extraInput = form.elements.namedItem(`scenario${index}Extra`) as HTMLInputElement;
        const closingInput = form.elements.namedItem(`scenario${index}Closing`) as HTMLInputElement;

        if (downInput) downInput.value = String(scenario.downPayment || '');
        if (rateInput) rateInput.value = String(scenario.rate || '');
        if (extraInput) extraInput.value = String(scenario.extraPayment || '');
        if (closingInput) closingInput.value = String(scenario.closingCosts || '');
      });
    }
  } catch {
    // Ignore errors
  }
}

/**
 * Get all saved scenarios
 */
export function getSavedScenarios(): SavedScenarioRecord[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_SCENARIOS_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Delete a saved scenario by ID
 */
export function deleteSavedScenario(id: number): boolean {
  try {
    const saved: SavedScenarioRecord[] = JSON.parse(
      localStorage.getItem(SAVED_SCENARIOS_KEY) || '[]'
    );
    const filtered = saved.filter((s) => s.id !== id);
    localStorage.setItem(SAVED_SCENARIOS_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
}
