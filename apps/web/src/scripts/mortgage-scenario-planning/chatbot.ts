/**
 * Chatbot integration for Mortgage Scenario Planning Calculator
 */

import type {
  Scenario,
  MortgageScenarioPlanningInput,
  MortgageScenarioChatContext,
  ScenarioFormSlice,
} from './types';
import { parseFormInput } from './form-handling';

/**
 * Set up chatbot context for the mortgage scenario planner
 */
export function setupChatbotContext(form: HTMLFormElement): void {
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

    // Build scenarios array for chat context
    const scenarios: ScenarioFormSlice[] = input.scenarios.map((s) => ({
      downPayment: s.downPayment || null,
      rate: s.rate || null,
      extraPayment: s.extraPayment || null,
      closingCosts: s.closingCosts || null,
    }));

    contextData.currentFormData = {
      homePrice: input.homePrice || null,
      loanTerm: input.loanTermYears || null,
      scenarios,
      refinanceRate: input.refinanceRate || null,
    };

    // Dispatch context update
    window.dispatchEvent(
      new CustomEvent('chat-context-update', {
        detail: {
          context: 'mortgage-scenario-planning',
          contextLabel: 'Mortgage Scenario Planner',
          contextData,
        },
      })
    );
  });

  // Set initial context
  window.dispatchEvent(
    new CustomEvent('chat-context-update', {
      detail: {
        context: 'mortgage-scenario-planning',
        contextLabel: 'Mortgage Scenario Planner - CFP Assistant',
        contextData,
      },
    })
  );
}

/**
 * Update chatbot with calculation results
 */
export function updateChatbotWithResults(
  scenarios: Scenario[],
  formData: MortgageScenarioPlanningInput
): void {
  const bestScenario = scenarios.reduce((best, current) =>
    current.totalCost < best.totalCost ? current : best
  );

  const baseScenarios = scenarios.filter((s) => !s.name.includes('Refinanced'));
  const refinanceScenarios = scenarios.filter((s) => s.name.includes('Refinanced'));

  const analysisContext = {
    calculatorType: 'mortgage-scenario-planning',
    calculatorName: 'Mortgage Scenario Planner',
    results: {
      scenarios: scenarios.map((s) => ({
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
        savings: Math.max(...scenarios.map((s) => s.totalCost)) - bestScenario.totalCost,
      },
      comparison:
        baseScenarios.length === 2
          ? {
              monthlyDiff: Math.abs(
                baseScenarios[0].monthlyPayment - baseScenarios[1].monthlyPayment
              ),
              interestDiff: Math.abs(
                baseScenarios[0].totalInterest - baseScenarios[1].totalInterest
              ),
              totalCostDiff: Math.abs(baseScenarios[0].totalCost - baseScenarios[1].totalCost),
            }
          : null,
      refinancing:
        refinanceScenarios.length > 0
          ? {
              available: true,
              savings:
                baseScenarios[0] && refinanceScenarios[0]
                  ? baseScenarios[0].totalCost - refinanceScenarios[0].totalCost
                  : 0,
              roi:
                baseScenarios[0] && refinanceScenarios[0]
                  ? (
                      (1 - refinanceScenarios[0].totalCost / baseScenarios[0].totalCost) *
                      100
                    ).toFixed(1)
                  : '0',
            }
          : { available: false },
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
  window.dispatchEvent(
    new CustomEvent('chat-context-update', {
      detail: {
        context: 'mortgage-scenario-planning',
        contextLabel: 'Mortgage Analysis - CFP Assistant',
        contextData: analysisContext,
      },
    })
  );
}
