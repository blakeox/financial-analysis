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
      const loanTermYears = parseInt(String(formData.get('loanTerm') || '30'));
      const termMonths = loanTermYears * 12;
      
      // Validate home price
      if (homePrice <= 0) {
        alert('Please enter a valid home price');
        return;
      }
      
      // Scenario 1
      const scenario1Down = coerceNumber(formData.get('scenario1Down'), 0);
      const scenario1Rate = coerceNumber(formData.get('scenario1Rate'), 0);
      const scenario1Extra = coerceNumber(formData.get('scenario1Extra'), 0);
      
      // Validate scenario 1
      if (scenario1Rate <= 0) {
        alert('Please enter a valid interest rate for Scenario 1');
        return;
      }
      if (scenario1Down >= homePrice) {
        alert('Scenario 1: Down payment must be less than home price');
        return;
      }
      
      const scenario1Principal = homePrice - scenario1Down;
      const scenario1RateDecimal = scenario1Rate / 100;
      
      // Scenario 2
      const scenario2Down = coerceNumber(formData.get('scenario2Down'), 0);
      const scenario2Rate = coerceNumber(formData.get('scenario2Rate'), 0);
      const scenario2Extra = coerceNumber(formData.get('scenario2Extra'), 0);
      
      // Validate scenario 2
      if (scenario2Rate <= 0) {
        alert('Please enter a valid interest rate for Scenario 2');
        return;
      }
      if (scenario2Down >= homePrice) {
        alert('Scenario 2: Down payment must be less than home price');
        return;
      }
      
      const scenario2Principal = homePrice - scenario2Down;
      const scenario2RateDecimal = scenario2Rate / 100;
      
      // Optional refinance scenario (comparing refinance after 5 years)
      const refinanceRate = coerceNumber(formData.get('refinanceRate'), 0);
      
      // Calculate scenarios
      const scenario1 = await calculateScenario('Scenario 1', scenario1Principal, scenario1RateDecimal, termMonths, scenario1Extra, scenario1Down, scenario1Rate);
      const scenario2 = await calculateScenario('Scenario 2', scenario2Principal, scenario2RateDecimal, termMonths, scenario2Extra, scenario2Down, scenario2Rate);
      
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
  extraPayment: number,
  downPayment: number,
  ratePercent: number
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
    downPayment,
    rate: ratePercent,
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
  
  summaryCards.innerHTML = topScenarios.map((scenario, idx) => {
    const isBest = scenario.name === bestScenario.name;
    const bgColor = isBest ? 'bg-gradient-to-br from-green-600 to-emerald-600' : idx === 0 ? 'bg-gradient-to-br from-blue-600 to-indigo-600' : 'bg-white dark:bg-gray-800';
    const textColor = (isBest || idx === 0) ? 'text-white' : 'text-gray-900 dark:text-white';
    const borderClass = isBest ? 'border-4 border-green-400 shadow-2xl' : 'border border-gray-300 dark:border-gray-600 shadow-lg';
    const years = Math.floor(scenario.payoffMonths / 12);
    const months = scenario.payoffMonths % 12;
    
    return `
      <div class="${bgColor} rounded-xl p-6 ${borderClass} transform hover:scale-105 transition-all duration-200">
        ${isBest ? '<div class="flex items-center gap-2 mb-3"><span class="bg-white text-green-600 px-3 py-1 rounded-full text-xs font-bold">✓ BEST VALUE</span></div>' : ''}
        <h3 class="text-lg font-bold ${textColor} mb-4">${scenario.name}</h3>
        
        <div class="space-y-3">
          <div>
            <p class="text-xs ${isBest || idx === 0 ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'} mb-1">Monthly Payment</p>
            <p class="text-2xl font-bold ${textColor}">${formatCurrency(scenario.monthlyPayment)}</p>
          </div>
          
          <div class="grid grid-cols-2 gap-3 pt-3 border-t ${isBest || idx === 0 ? 'border-white/20' : 'border-gray-200 dark:border-gray-700'}">
            <div>
              <p class="text-xs ${isBest || idx === 0 ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'} mb-1">Total Interest</p>
              <p class="text-sm font-semibold ${textColor}">${formatCurrency(scenario.totalInterest)}</p>
            </div>
            <div>
              <p class="text-xs ${isBest || idx === 0 ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'} mb-1">Payoff Time</p>
              <p class="text-sm font-semibold ${textColor}">${years}y ${months}m</p>
            </div>
          </div>
          
          <div class="pt-3 border-t ${isBest || idx === 0 ? 'border-white/20' : 'border-gray-200 dark:border-gray-700'}">
            <p class="text-xs ${isBest || idx === 0 ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'} mb-1">Total Cost</p>
            <p class="text-xl font-bold ${textColor}">${formatCurrency(scenario.totalCost)}</p>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // Render detailed comparison with separate sections for base vs refinance
  resultsContent.innerHTML = `
    <!-- Base Scenarios Detailed Comparison -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <span>📋</span> Original Scenarios Comparison
      </h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Side-by-side comparison of your mortgage options</p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        ${baseScenarios.map((scenario, idx) => {
          const isBest = scenario.name === bestScenario.name && baseScenarios.includes(bestScenario);
          const years = Math.floor(scenario.payoffMonths / 12);
          const months = scenario.payoffMonths % 12;
          const loanToValuePercent = ((scenario.principal / (scenario.principal + scenario.downPayment)) * 100).toFixed(1);
          
          return `
            <div class="border-2 ${isBest ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-700'} rounded-lg p-5">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">${scenario.name}</h3>
                ${isBest ? '<span class="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">✓ BEST</span>' : ''}
              </div>
              
              <div class="space-y-4">
                <!-- Loan Details -->
                <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Loan Details</h4>
                  <div class="space-y-2">
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-gray-600 dark:text-gray-400">Loan Amount</span>
                      <span class="text-sm font-semibold">${formatCurrency(scenario.principal)}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-gray-600 dark:text-gray-400">Down Payment</span>
                      <span class="text-sm font-semibold">${formatCurrency(scenario.downPayment)} (${((scenario.downPayment / (scenario.principal + scenario.downPayment)) * 100).toFixed(1)}%)</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-gray-600 dark:text-gray-400">Interest Rate</span>
                      <span class="text-sm font-semibold">${scenario.rate.toFixed(2)}%</span>
                    </div>
                    ${scenario.extraPayment > 0 ? `
                      <div class="flex justify-between items-center text-blue-600 dark:text-blue-400">
                        <span class="text-sm">Extra Payment</span>
                        <span class="text-sm font-semibold">+${formatCurrency(scenario.extraPayment)}/mo</span>
                      </div>
                    ` : ''}
                  </div>
                </div>
                
                <!-- Payment Information -->
                <div>
                  <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Monthly Payment</h4>
                  <p class="text-3xl font-bold text-gray-900 dark:text-white mb-1">${formatCurrency(scenario.monthlyPayment)}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Base: ${formatCurrency(scenario.monthlyPayment - scenario.extraPayment)} + Extra: ${formatCurrency(scenario.extraPayment)}</p>
                </div>
                
                <!-- Cost Breakdown -->
                <div class="grid grid-cols-2 gap-3">
                  <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Interest</p>
                    <p class="text-lg font-bold text-blue-600 dark:text-blue-400">${formatCurrency(scenario.totalInterest)}</p>
                  </div>
                  <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                    <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Cost</p>
                    <p class="text-lg font-bold text-purple-600 dark:text-purple-400">${formatCurrency(scenario.totalCost)}</p>
                  </div>
                </div>
                
                <!-- Timeline -->
                <div class="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Payoff Timeline</p>
                      <p class="text-xl font-bold text-gray-900 dark:text-white">${years} years ${months} months</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${scenario.payoffMonths} total payments</p>
                    </div>
                    <div class="text-4xl">⏱️</div>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    
    ${refinanceScenarios.length > 0 ? `
      <!-- Refinance Scenarios Comparison -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Updated Scenarios with Refinancing</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          These scenarios assume you refinance after 5 years at the new rate.
        </p>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Scenario</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">New Monthly Payment</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total Interest</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total Cost</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Payoff Time</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              ${refinanceScenarios.map(scenario => {
                const isBest = scenario.name === bestScenario.name && refinanceScenarios.includes(bestScenario);
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
    ` : ''}
    
    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
      <h3 class="text-lg font-semibold mb-4">📊 Key Insights</h3>
      <div class="space-y-3">
        <p class="text-sm">
          <strong>Best Value:</strong> <span class="font-semibold text-green-600 dark:text-green-400">${bestScenario.name}</span> 
          saves ${formatCurrency(Math.max(...scenarios.map(s => s.totalCost)) - bestScenario.totalCost)} compared to the most expensive option.
        </p>
        ${refinanceScenarios.length > 0 ? `
          <p class="text-sm">
            <strong>Refinancing Analysis:</strong> Refinancing after 5 years ${findRefinanceSavings(baseScenarios[0], refinanceScenarios[0])}.
          </p>
        ` : ''}
        ${baseScenarios.length === 2 ? `
          <p class="text-sm">
            <strong>Comparison:</strong> Scenario 2 ${baseScenarios[1].totalCost < baseScenarios[0].totalCost ? 'saves' : 'costs'} 
            ${formatCurrency(Math.abs(baseScenarios[1].totalCost - baseScenarios[0].totalCost))} 
            ${baseScenarios[1].totalCost < baseScenarios[0].totalCost ? 'less' : 'more'} than Scenario 1.
          </p>
        ` : ''}
      </div>
    </div>
  `;
  
  resultsSection.classList.remove('hidden');
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

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMortgageScenarioPlanning);
} else {
  initializeMortgageScenarioPlanning();
}
