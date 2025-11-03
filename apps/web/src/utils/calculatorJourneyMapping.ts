/**
 * Calculator to Journey Mapping
 * Maps individual calculators to relevant journeys for smart connections
 */

import type { JourneyScenario } from './journeyData';
import { getJourneyData } from './journeyData';

export interface CalculatorJourneySuggestion {
  journeyId: string;
  journeyName: string;
  journeyDescription: string;
  journeyIcon: string;
  relevance: 'high' | 'medium';
  why: string; // Why this calculator is relevant to the journey
}

/**
 * Get journey suggestions for a calculator
 */
export function getJourneySuggestions(calculatorId: string): CalculatorJourneySuggestion[] {
  const suggestions: CalculatorJourneySuggestion[] = [];
  const journeyData = getJourneyData();

  // Map calculators to journeys based on their purpose
  const mappings: Record<string, Array<{
    journeyId: string;
    relevance: 'high' | 'medium';
    why: string;
  }>> = {
    // Personal Finance Calculators
    'amortization': [
      { journeyId: 'home-buying', relevance: 'high', why: 'Part of the home buying process' },
    ],
    'mortgage-scenario-planning': [
      { journeyId: 'home-buying', relevance: 'high', why: 'Compare mortgage options and payoff strategies' },
    ],
    'auto-loan': [
      { journeyId: 'young-professional', relevance: 'medium', why: 'Vehicle financing considerations' },
      { journeyId: 'family-planning', relevance: 'medium', why: 'Family vehicle planning' },
    ],
    'budget': [
      { journeyId: 'young-professional', relevance: 'high', why: 'Foundational financial planning' },
      { journeyId: 'family-planning', relevance: 'high', why: 'Essential for family budgeting' },
    ],
    'debt-payoff': [
      { journeyId: 'young-professional', relevance: 'high', why: 'Core debt management strategy' },
      { journeyId: 'home-buying', relevance: 'high', why: 'Optimize debt before home purchase' },
    ],
    'student-loans': [
      { journeyId: 'young-professional', relevance: 'high', why: 'Essential for young professionals' },
    ],
    'retirement': [
      { journeyId: 'young-professional', relevance: 'high', why: 'Start retirement planning early' },
      { journeyId: 'family-planning', relevance: 'high', why: 'Plan for family retirement' },
    ],
    'savings-goal': [
      { journeyId: 'young-professional', relevance: 'high', why: 'Build emergency fund and goals' },
      { journeyId: 'family-planning', relevance: 'high', why: 'Plan family savings goals' },
      { journeyId: 'home-buying', relevance: 'high', why: 'Save for down payment' },
    ],
    'college-savings': [
      { journeyId: 'family-planning', relevance: 'high', why: 'Plan for children\'s education' },
    ],
    'tax-optimization': [
      { journeyId: 'young-professional', relevance: 'medium', why: 'Maximize tax efficiency' },
      { journeyId: 'family-planning', relevance: 'medium', why: 'Family tax strategies' },
    ],
    'insurance-needs': [
      { journeyId: 'young-professional', relevance: 'medium', why: 'Protect income and assets' },
      { journeyId: 'family-planning', relevance: 'high', why: 'Essential family protection' },
    ],
    'investment-portfolio': [
      { journeyId: 'young-professional', relevance: 'medium', why: 'Build investment strategy' },
      { journeyId: 'investment-analysis-journey', relevance: 'high', why: 'Portfolio optimization' },
    ],
    'home-buying-affordability': [
      { journeyId: 'home-buying', relevance: 'high', why: 'Core home buying analysis' },
    ],

    // Business Finance Calculators
    'dcf-valuation': [
      { journeyId: 'ma-analysis-journey', relevance: 'high', why: 'Target company valuation' },
      { journeyId: 'investment-analysis-journey', relevance: 'high', why: 'Investment valuation' },
    ],
    'ma-analysis': [
      { journeyId: 'ma-analysis-journey', relevance: 'high', why: 'Complete M&A deal analysis' },
    ],
    'ebitda': [
      { journeyId: 'startup-planning', relevance: 'high', why: 'Financial projections for funding' },
      { journeyId: 'ma-analysis-journey', relevance: 'medium', why: 'Financial analysis for deals' },
    ],
    'cash-flow': [
      { journeyId: 'startup-planning', relevance: 'high', why: 'Critical for runway planning' },
    ],
    
    // Additional business calculators
    'risk-management': [
      { journeyId: 'investment-analysis-journey', relevance: 'high', why: 'Portfolio risk assessment' },
    ],
    
    // Financial-snapshot is used in journeys, not mapped
  };

  const calculatorMappings = mappings[calculatorId];
  
  if (!calculatorMappings) {
    return suggestions;
  }

  // Build suggestions from mappings
  for (const mapping of calculatorMappings) {
    const journey = journeyData[mapping.journeyId];
    if (journey) {
      suggestions.push({
        journeyId: mapping.journeyId,
        journeyName: journey.name,
        journeyDescription: journey.description,
        journeyIcon: journey.icon,
        relevance: mapping.relevance,
        why: mapping.why,
      });
    }
  }

  return suggestions;
}

/**
 * Get journey suggestions formatted for display
 */
export function getJourneySuggestionsFormatted(calculatorId: string): Array<{
  text: string;
  href: string;
  icon: string;
  description: string;
}> {
  const suggestions = getJourneySuggestions(calculatorId);
  return suggestions.map(s => ({
    text: s.journeyName,
    href: `/journey/${s.journeyId}`,
    icon: s.journeyIcon,
    description: s.why,
  }));
}

/**
 * Get the primary journey suggestion (highest relevance)
 */
export function getPrimaryJourneySuggestion(calculatorId: string): CalculatorJourneySuggestion | null {
  const suggestions = getJourneySuggestions(calculatorId);
  const highRelevance = suggestions.filter(s => s.relevance === 'high');
  
  if (highRelevance.length > 0) {
    return highRelevance[0];
  }
  
  return suggestions.length > 0 ? suggestions[0] : null;
}

