import type { AmortizationAnalysisResult } from '@financial-analysis/analysis';
import { coerceNumber, formatCurrency, isFiniteNumber } from '../utils/calculator-utilities';
import { postAnalysisRequest } from './analysis-api';

type Scenario = {
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

// Initialize calculator
function initializeMortgageScenarioPlanning() {
  const form = document.getElementById('calculator-form');
  const calculateBtn = document.getElementById('calculate-btn');
  
  if (!(form instanceof HTMLFormElement && calculateBtn instanceof HTMLButtonElement)) {
    console.error('Mortgage scenario planning form not found');
    return;
  }

  calculateBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    calculateBtn.disabled = true;
    calculateBtn.textContent = 'Calculating...';
    
    try {
      const formData = new FormData(form);
      const homePrice = coerceNumber(formData.get('homePrice'), 0);
      const loanTermYears = parseInt(formData.get('loanTerm') || '30');
      const termMonths = loanTermYears * 12;
      
      // Scenario 1
      const scenario1Down = coerceNumber(formData.get('scenario1Down'), 0);
      const scenario1Rate = coerceNumber(formData.get('scenario1Rate'), 0) / 100;
      const scenario1Extra = coerceNumber(formData.get('scenario1Extra'), 0);
      const scenario1Principal = homePrice - scenario1Down;
      
      // Scenario 2
      const scenario2Down = coerceNumber(formData.get('scenario2Down'), 0);
      const scenario2Rate = coerceNumber(formData.get('scenario2Rate'), 0) / 100;
      const scenario2Extra = coerceNumber(formData.get('scenario2Extra'), 0);
      const scenario2Principal = homePrice - scenario2Down;
      
      // Optional refinance scenario (comparing refinance after 5 years)
      const refinanceRate = coerceNumber(formData.get('refinanceRate'), 0);
      
      // Calculate scenarios
      const scenario1 = await calculateScenario('Scenario 1', scenario1Principal, scenario1Rate, termMonths, scenario1Extra);
      const scenario2 = await calculateScenario('Scenario 2', scenario2Principal, scenario2Rate, termMonths, scenario2Extra);
      
      const scenarios = [scenario1, scenario2];
      
      // Add refinance comparison if provided
      if (refinanceRate > 0) {
        // Scenario 1 with refinance after 5 years
        const refi1 = await calculateRefinanceScenario(
          'Scenario 1 + Refinance',
          scenario1,
          60, // 5 years = 60 months
          refinanceRate / 100,
          termMonths
        );
        
        // Scenario 2 with refinance after 5 years
        const refi2 = await calculateRefinanceScenario(
          'Scenario 2 + Refinance',
          scenario2,
          60, // 5 years = 60 months
          refinanceRate / 100,
          termMonths
        );
        
        scenarios.push(refi1, refi2);
      }
      
      // Display results
      displayResults(scenarios);
      
      // Dispatch completion event for journey integration
      window.dispatchEvent(
        new CustomEvent('calculator-completed', {
          detail: {
            calculatorId: 'mortgage-scenario-planning',
            result: { scenarios },
            formData: {
              homePrice,
              loanTermYears,
              scenario1,
              scenario2,
            },
          },
        })
      );
    } catch (error) {
      console.error('Mortgage scenario planning error:', error);
      alert('Failed to calculate scenarios. Please try again.');
    } finally {
      calculateBtn.disabled = false;
      calculateBtn.textContent = 'Calculate';
    }
  });

  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn instanceof HTMLButtonElement) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      document.getElementById('results-section')?.classList.add('hidden');
    });
  }
}

async function calculateScenario(
  name: string,
  principal: number,
  annualRate: number,
  termMonths: number,
  extraPayment: number
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
    downPayment: 0, // Will be set by caller
    rate: annualRate,
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

function displayResults(scenarios: Scenario[]): void {
  const resultsSection = document.getElementById('results-section');
  const summaryCards = document.getElementById('summary-cards');
  const resultsContent = document.getElementById('results-container');
  
  if (!resultsSection || !summaryCards || !resultsContent) return;
  
  // Find best scenario (lowest total cost)
  const bestScenario = scenarios.reduce((best, current) => 
    current.totalCost < best.totalCost ? current : best
  );
  
  // Render summary cards (top 3 scenarios)
  const topScenarios = [...scenarios].sort((a, b) => a.totalCost - b.totalCost).slice(0, 3);
  
  summaryCards.innerHTML = topScenarios.map((scenario, idx) => {
    const isBest = scenario.name === bestScenario.name;
    const bgColor = idx === 0 ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800';
    const borderClass = isBest ? 'border-4 border-green-500' : 'border border-gray-300 dark:border-gray-600';
    
    return `
      <div class="${bgColor} rounded-lg p-6 shadow ${borderClass}">
        ${isBest ? '<span class="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold mb-2">BEST VALUE</span>' : ''}
        <p class="text-sm ${idx === 0 ? 'opacity-90' : 'text-gray-500 dark:text-gray-400'} mb-2">${scenario.name}</p>
        <p class="${idx === 0 ? 'text-3xl' : 'text-2xl'} font-bold">${formatCurrency(scenario.totalCost)}</p>
        <p class="text-xs ${idx === 0 ? 'opacity-90' : 'text-gray-500 dark:text-gray-400'} mt-2">${formatCurrency(scenario.monthlyPayment)}/mo</p>
      </div>
    `;
  }).join('');
  
  // Render detailed comparison table
  resultsContent.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Detailed Comparison</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Scenario</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Monthly Payment</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total Interest</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total Cost</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Payoff Time</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            ${scenarios.map(scenario => {
              const isBest = scenario.name === bestScenario.name;
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
    
    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
      <h3 class="text-lg font-semibold mb-4">📊 Key Insights</h3>
      <div class="space-y-3">
        <p class="text-sm">
          <strong>Best Value:</strong> <span class="font-semibold text-green-600 dark:text-green-400">${bestScenario.name}</span> 
          saves ${formatCurrency(scenarios[0].totalCost - bestScenario.totalCost)} compared to the most expensive option.
        </p>
        ${scenarios.length > 2 ? `
          <p class="text-sm">
            <strong>Refinancing Analysis:</strong> Compare the "Refinance" scenarios to see if refinancing after 5 years 
            makes financial sense for your situation.
          </p>
        ` : ''}
      </div>
    </div>
  `;
  
  resultsSection.classList.remove('hidden');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMortgageScenarioPlanning);
} else {
  initializeMortgageScenarioPlanning();
}
