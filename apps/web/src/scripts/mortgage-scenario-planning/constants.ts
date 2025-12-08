/**
 * Constants for Mortgage Scenario Planning Calculator
 */

export const CACHE_KEY = 'mortgage-scenario-results';
export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
export const SAVED_SCENARIOS_KEY = 'saved-mortgage-scenarios';
export const RECENT_CALCULATIONS_KEY = 'fanalyx-recent-calculations';
export const REFINANCE_MONTH = 60; // 5 years

export const MIN_SCENARIOS = 2;
export const MAX_SCENARIOS = 10;

export interface ScenarioColor {
  bg: string;
  accent: string;
  label: string;
}

export const SCENARIO_COLORS: ScenarioColor[] = [
  { bg: 'blue', accent: 'indigo', label: 'A' },
  { bg: 'green', accent: 'emerald', label: 'B' },
  { bg: 'purple', accent: 'violet', label: 'C' },
  { bg: 'orange', accent: 'amber', label: 'D' },
  { bg: 'pink', accent: 'rose', label: 'E' },
  { bg: 'cyan', accent: 'teal', label: 'F' },
  { bg: 'red', accent: 'rose', label: 'G' },
  { bg: 'yellow', accent: 'amber', label: 'H' },
  { bg: 'lime', accent: 'green', label: 'I' },
  { bg: 'sky', accent: 'blue', label: 'J' },
];

// PMI constants
export const PMI_THRESHOLD_LTV = 0.8; // 80% LTV to avoid PMI
export const PMI_RATE_ANNUAL = 0.005; // 0.5% annual PMI rate (typical)
