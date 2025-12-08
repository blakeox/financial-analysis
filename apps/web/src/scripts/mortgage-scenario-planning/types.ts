/**
 * Type definitions for Mortgage Scenario Planning Calculator
 */

import type { AmortizationAnalysisResult } from '@financial-analysis/analysis';

export type Scenario = {
  name: string;
  downPayment: number;
  rate: number;
  extraPayment: number;
  closingCosts: number;
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
  // Index for tracking
  index: number;
};

export interface ScenarioInput {
  downPayment: number;
  rate: number;
  extraPayment: number;
  closingCosts: number;
  label?: string;
}

export interface MortgageScenarioPlanningInput {
  homePrice: number;
  loanTermYears: number;
  scenarios: ScenarioInput[];
  refinanceRate?: number;
  grossMonthlyIncome?: number;
  // Legacy support
  scenario1Down?: number;
  scenario1Rate?: number;
  scenario1Extra?: number;
  scenario2Down?: number;
  scenario2Rate?: number;
  scenario2Extra?: number;
}

export type SavedScenarioRecord = {
  id: number;
  name: string;
  input: MortgageScenarioPlanningInput;
  savedAt: string;
};

export type ScenarioFormSlice = {
  downPayment: number | null;
  rate: number | null;
  extraPayment: number | null;
  closingCosts: number | null;
};

export interface MortgageScenarioChatFormData {
  homePrice: number | null;
  loanTerm: number | null;
  scenarios: ScenarioFormSlice[];
  refinanceRate: number | null;
}

export interface MortgageScenarioChatContext {
  calculatorType: string;
  calculatorName: string;
  capabilities: string[];
  currentFormData: MortgageScenarioChatFormData | null;
}

export interface CachedResult {
  scenarios: Scenario[];
  input: MortgageScenarioPlanningInput;
  timestamp: number;
}

export interface TimeDisplay {
  years: number;
  months: number;
  display: string;
}

// Re-export the analysis result type for convenience
export type { AmortizationAnalysisResult };
