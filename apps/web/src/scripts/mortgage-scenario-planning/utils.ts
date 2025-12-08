/**
 * Utility functions for Mortgage Scenario Planning Calculator
 */

import type { TimeDisplay, Scenario } from './types';

/**
 * Format time in months to years and months display
 */
export function formatTimeDisplay(months: number): TimeDisplay {
  const years = Math.floor(months / 12);
  const monthsRemainder = months % 12;
  return {
    years,
    months: monthsRemainder,
    display: `${years}y ${monthsRemainder}m`,
  };
}

/**
 * Calculate down payment percentage from scenario
 */
export function calculateDownPaymentPercent(scenario: Scenario): string {
  const homePrice = scenario.principal + scenario.downPayment;
  return ((scenario.downPayment / homePrice) * 100).toFixed(1);
}

/**
 * Generate a descriptive name for a scenario
 */
export function generateScenarioName(
  downPayment: number, 
  homePrice: number, 
  rate: number, 
  extraPayment: number, 
  label: string = ''
): string {
  const downPercent = Math.round((downPayment / homePrice) * 100);
  const rateFormatted = rate.toFixed(2);
  
  // Build descriptive name based on characteristics
  let name = label ? `Option ${label}: ` : '';
  
  // Down payment descriptor
  if (downPercent >= 20) {
    name += `${downPercent}% Down`;
  } else if (downPercent >= 10) {
    name += `${downPercent}% Down (PMI)`;
  } else if (downPercent >= 5) {
    name += `${downPercent}% Down (High PMI)`;
  } else {
    name += `${downPercent}% Down (FHA)`;
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

/**
 * Find refinance savings description
 */
export function findRefinanceSavings(baseScenario: Scenario, refinanceScenario: Scenario): string {
  const savings = baseScenario.totalCost - refinanceScenario.totalCost;
  
  if (savings > 10000) {
    return `could save you significant money`;
  } else if (savings > 0) {
    return `could provide modest savings`;
  } else {
    return `may not be beneficial in this case`;
  }
}

/**
 * Generate detailed comparison text between two scenarios
 */
export function generateDetailedComparison(scenarioA: Scenario, scenarioB: Scenario): string {
  const monthlyDiff = Math.abs(scenarioA.monthlyPayment - scenarioB.monthlyPayment);
  const interestDiff = Math.abs(scenarioA.totalInterest - scenarioB.totalInterest);
  
  const lowerMonthly = scenarioA.monthlyPayment < scenarioB.monthlyPayment ? scenarioA : scenarioB;
  
  let comparison = '';
  
  // Monthly payment comparison
  if (monthlyDiff > 100) {
    comparison += `<p><strong>${lowerMonthly.name}</strong> has a lower monthly payment, which improves cash flow.</p>`;
  }
  
  // Interest comparison
  if (interestDiff > 5000) {
    const lessInterest = scenarioA.totalInterest < scenarioB.totalInterest ? scenarioA : scenarioB;
    comparison += `<p><strong>${lessInterest.name}</strong> pays significantly less interest over the loan term.</p>`;
  }
  
  // Payoff time
  if (Math.abs(scenarioA.payoffMonths - scenarioB.payoffMonths) > 12) {
    const fasterPayoff = scenarioA.payoffMonths < scenarioB.payoffMonths ? scenarioA : scenarioB;
    comparison += `<p><strong>${fasterPayoff.name}</strong> pays off the mortgage faster.</p>`;
  }
  
  return comparison || '<p>Both scenarios are relatively similar in terms of cost structure.</p>';
}

/**
 * Generate comparison insight text
 */
export function generateComparisonInsight(scenarioA: Scenario, scenarioB: Scenario): string {
  const cheaper = scenarioA.totalCost < scenarioB.totalCost ? scenarioA : scenarioB;
  const lowerMonthly = scenarioA.monthlyPayment < scenarioB.monthlyPayment ? scenarioA : scenarioB;
  
  if (cheaper === lowerMonthly) {
    return `${cheaper.name} is the clear winner with both lower monthly payments and lower total cost.`;
  }
  
  return `Consider your priorities: ${lowerMonthly.name} offers better monthly cash flow, while ${cheaper.name} minimizes your total cost over time.`;
}

/**
 * Generate financial recommendations based on scenarios
 */
export function generateRecommendations(
  baseScenarios: Scenario[], 
  refinanceScenarios: Scenario[], 
  bestScenario: Scenario
): string {
  const recommendations: string[] = [];
  
  // Check for PMI scenarios
  const pmiScenarios = baseScenarios.filter(s => s.hasPMI);
  if (pmiScenarios.length > 0) {
    recommendations.push(`
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-yellow-500">
        <h4 class="font-semibold text-yellow-600 dark:text-yellow-400 mb-2">💰 PMI Consideration</h4>
        <p class="text-sm text-gray-700 dark:text-gray-300">
          ${pmiScenarios.length} scenario(s) require PMI due to less than 20% down payment. 
          Consider if you can increase your down payment to avoid this extra cost.
        </p>
      </div>
    `);
  }
  
  // Check for extra payments impact
  const extraPaymentScenarios = baseScenarios.filter(s => s.extraPayment > 0);
  if (extraPaymentScenarios.length > 0) {
    const bestExtra = extraPaymentScenarios.reduce((a, b) => 
      a.payoffMonths < b.payoffMonths ? a : b
    );
    const worstWithoutExtra = baseScenarios
      .filter(s => s.extraPayment === 0)
      .reduce((a, b) => a.payoffMonths > b.payoffMonths ? a : b, baseScenarios[0]);
    
    if (bestExtra.payoffMonths < worstWithoutExtra.payoffMonths) {
      const monthsSaved = worstWithoutExtra.payoffMonths - bestExtra.payoffMonths;
      recommendations.push(`
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
          <h4 class="font-semibold text-blue-600 dark:text-blue-400 mb-2">⏱️ Time Savings</h4>
          <p class="text-sm text-gray-700 dark:text-gray-300">
            Extra monthly payments in ${bestExtra.name} could help you pay off your mortgage 
            ${Math.floor(monthsSaved / 12)} years and ${monthsSaved % 12} months sooner.
          </p>
        </div>
      `);
    }
  }
  
  // Refinancing recommendation
  if (refinanceScenarios.length > 0) {
    const bestRefinance = refinanceScenarios.reduce((a, b) => 
      a.totalCost < b.totalCost ? a : b
    );
    const bestBase = baseScenarios.reduce((a, b) => 
      a.totalCost < b.totalCost ? a : b
    );
    
    if (bestRefinance.totalCost < bestBase.totalCost) {
      recommendations.push(`
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-purple-500">
          <h4 class="font-semibold text-purple-600 dark:text-purple-400 mb-2">🔄 Refinancing Opportunity</h4>
          <p class="text-sm text-gray-700 dark:text-gray-300">
            If rates drop, refinancing could be beneficial. Monitor market conditions 
            and consider refinancing when rates are 0.5-1% lower than your current rate.
          </p>
        </div>
      `);
    }
  }
  
  // Best overall recommendation
  recommendations.push(`
    <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
      <h4 class="font-semibold text-green-600 dark:text-green-400 mb-2">✅ Overall Recommendation</h4>
      <p class="text-sm text-gray-700 dark:text-gray-300">
        Based on total cost analysis, <strong>${bestScenario.name}</strong> appears to be the most 
        cost-effective option. However, consider your personal cash flow needs and financial goals 
        when making your final decision.
      </p>
    </div>
  `);
  
  return recommendations.join('');
}

/**
 * Create cache key from input
 */
export function createCacheKey(input: Record<string, unknown>): string {
  return JSON.stringify(input);
}

/**
 * Check if cached data is still valid
 */
export function isCacheValid(timestamp: number, duration: number): boolean {
  return Date.now() - timestamp < duration;
}
