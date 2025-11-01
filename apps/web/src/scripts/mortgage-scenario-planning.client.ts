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
    
    <!-- Comprehensive Analysis Section -->
    <div class="space-y-6">
      <!-- Key Insights -->
      <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
        <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
          <span>📊</span> Key Insights & Analysis
        </h3>
        
        <div class="space-y-4">
          <!-- Best Value Analysis -->
          <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
            <h4 class="font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
              <span>✓</span> Best Value Recommendation
            </h4>
            <p class="text-sm text-gray-700 dark:text-gray-300">
              <strong>${bestScenario.name}</strong> offers the best overall value, saving you 
              <span class="font-bold text-green-600 dark:text-green-400">${formatCurrency(Math.max(...scenarios.map(s => s.totalCost)) - bestScenario.totalCost)}</span> 
              compared to the most expensive option over the life of the loan.
            </p>
            ${baseScenarios.length === 2 && bestScenario === baseScenarios[0] ? `
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">
                💡 This represents a ${((1 - bestScenario.totalCost / baseScenarios[1].totalCost) * 100).toFixed(1)}% reduction in total cost.
              </p>
            ` : baseScenarios.length === 2 ? `
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">
                💡 This represents a ${((1 - bestScenario.totalCost / baseScenarios[0].totalCost) * 100).toFixed(1)}% reduction in total cost.
              </p>
            ` : ''}
          </div>
          
          ${baseScenarios.length === 2 ? `
            <!-- Scenario Comparison -->
            <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Scenario Comparison</h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Monthly Payment Difference</p>
                  <p class="text-lg font-bold ${baseScenarios[0].monthlyPayment < baseScenarios[1].monthlyPayment ? 'text-green-600' : 'text-red-600'}">${formatCurrency(Math.abs(baseScenarios[0].monthlyPayment - baseScenarios[1].monthlyPayment))}/mo</p>
                </div>
                <div class="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Interest Saved/Lost</p>
                  <p class="text-lg font-bold ${baseScenarios[0].totalInterest < baseScenarios[1].totalInterest ? 'text-green-600' : 'text-red-600'}">${formatCurrency(Math.abs(baseScenarios[0].totalInterest - baseScenarios[1].totalInterest))}</p>
                </div>
                <div class="text-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Cost Difference</p>
                  <p class="text-lg font-bold ${baseScenarios[0].totalCost < baseScenarios[1].totalCost ? 'text-green-600' : 'text-red-600'}">${formatCurrency(Math.abs(baseScenarios[0].totalCost - baseScenarios[1].totalCost))}</p>
                </div>
              </div>
              
              <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p class="text-sm text-gray-700 dark:text-gray-300">
                  ${generateComparisonInsight(baseScenarios[0], baseScenarios[1])}
                </p>
              </div>
            </div>
          ` : ''}
          
          ${refinanceScenarios.length > 0 ? `
            <!-- Refinancing Analysis -->
            <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-purple-500">
              <h4 class="font-semibold text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-2">
                <span>🔄</span> Refinancing Analysis
              </h4>
              <p class="text-sm text-gray-700 dark:text-gray-300 mb-3">
                Refinancing after 5 years ${findRefinanceSavings(baseScenarios[0], refinanceScenarios[0])}.
              </p>
              <div class="grid grid-cols-2 gap-3">
                <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Potential Savings</p>
                  <p class="text-lg font-bold text-purple-600 dark:text-purple-400">
                    ${formatCurrency(Math.max(0, baseScenarios[0].totalCost - refinanceScenarios[0].totalCost))}
                  </p>
                </div>
                <div class="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded">
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">ROI from Refinancing</p>
                  <p class="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    ${((1 - refinanceScenarios[0].totalCost / baseScenarios[0].totalCost) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-3">
                ⚠️ Note: This doesn't include refinancing closing costs, which typically range from 2-5% of the loan amount.
              </p>
            </div>
          ` : ''}
        </div>
      </div>
      
      <!-- Financial Recommendations -->
      <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 border border-green-200 dark:border-green-700">
        <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
          <span>💡</span> Financial Recommendations
        </h3>
        
        <div class="space-y-3">
          ${generateRecommendations(baseScenarios, refinanceScenarios, bestScenario)}
        </div>
      </div>
      
      <!-- Important Considerations -->
      <div class="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-700">
        <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
          <span>⚠️</span> Important Considerations
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <h4 class="font-semibold text-sm text-gray-900 dark:text-white">✓ Factors Included</h4>
            <ul class="text-xs text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
              <li>Principal and interest payments</li>
              <li>Total interest over loan term</li>
              <li>Impact of extra payments</li>
              <li>Refinancing scenarios (if selected)</li>
            </ul>
          </div>
          
          <div class="space-y-2">
            <h4 class="font-semibold text-sm text-gray-900 dark:text-white">⚠️ Not Included</h4>
            <ul class="text-xs text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
              <li>Property taxes and insurance (PITI)</li>
              <li>PMI (if down payment < 20%)</li>
              <li>HOA fees or maintenance costs</li>
              <li>Closing costs and origination fees</li>
            </ul>
          </div>
        </div>
        
        <div class="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
          <p class="text-xs text-gray-600 dark:text-gray-400">
            <strong>Pro Tip:</strong> Your actual monthly housing payment will be higher when including taxes, insurance, and other costs. 
            Budget for 20-30% more than the mortgage payment shown here.
          </p>
        </div>
      </div>
    </div>
  `;
  
  resultsSection.classList.remove('hidden');
}

function generateComparisonInsight(scenario1: Scenario, scenario2: Scenario): string {
  const monthlyDiff = scenario2.monthlyPayment - scenario1.monthlyPayment;
  const totalDiff = scenario2.totalCost - scenario1.totalCost;
  const interestDiff = scenario2.totalInterest - scenario1.totalInterest;
  const timeDiff = scenario2.payoffMonths - scenario1.payoffMonths;
  
  if (totalDiff > 0) {
    // Scenario 1 is cheaper
    return `<strong>Scenario 1</strong> saves you ${formatCurrency(Math.abs(totalDiff))} over the life of the loan. 
            While ${monthlyDiff > 0 ? 'the monthly payment is lower' : 'you pay more monthly'}, 
            you'll pay ${formatCurrency(Math.abs(interestDiff))} ${interestDiff < 0 ? 'less' : 'more'} in interest 
            and pay off the loan ${Math.abs(timeDiff)} months ${timeDiff < 0 ? 'faster' : 'slower'}.`;
  } else {
    // Scenario 2 is cheaper
    return `<strong>Scenario 2</strong> saves you ${formatCurrency(Math.abs(totalDiff))} over the life of the loan. 
            While ${monthlyDiff < 0 ? 'the monthly payment is lower' : 'you pay more monthly'}, 
            you'll pay ${formatCurrency(Math.abs(interestDiff))} ${interestDiff > 0 ? 'less' : 'more'} in interest 
            and pay off the loan ${Math.abs(timeDiff)} months ${timeDiff > 0 ? 'faster' : 'slower'}.`;
  }
}

function generateRecommendations(baseScenarios: Scenario[], refinanceScenarios: Scenario[], bestScenario: Scenario): string {
  const recommendations: string[] = [];
  
  // Down payment recommendation
  if (baseScenarios.length === 2) {
    const s1DownPercent = (baseScenarios[0].downPayment / (baseScenarios[0].principal + baseScenarios[0].downPayment)) * 100;
    const s2DownPercent = (baseScenarios[1].downPayment / (baseScenarios[1].principal + baseScenarios[1].downPayment)) * 100;
    
    if (s1DownPercent < 20 || s2DownPercent < 20) {
      recommendations.push(`
        <div class="flex gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
          <div class="text-2xl">🏦</div>
          <div>
            <p class="font-semibold text-sm text-gray-900 dark:text-white mb-1">Consider 20% Down Payment</p>
            <p class="text-xs text-gray-600 dark:text-gray-400">
              Putting down at least 20% helps you avoid PMI (Private Mortgage Insurance), which can add $50-$200+ to your monthly payment.
            </p>
          </div>
        </div>
      `);
    }
  }
  
  // Extra payment recommendation
  const hasExtraPayments = baseScenarios.some(s => s.extraPayment > 0);
  if (!hasExtraPayments) {
    recommendations.push(`
      <div class="flex gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
        <div class="text-2xl">💰</div>
        <div>
          <p class="font-semibold text-sm text-gray-900 dark:text-white mb-1">Make Extra Payments</p>
          <p class="text-xs text-gray-600 dark:text-gray-400">
            Even small extra payments (like $100/month) can save tens of thousands in interest and shave years off your mortgage.
          </p>
        </div>
      </div>
    `);
  }
  
  // Interest rate shopping
  if (baseScenarios.length === 2 && Math.abs(baseScenarios[0].rate - baseScenarios[1].rate) >= 0.25) {
    recommendations.push(`
      <div class="flex gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
        <div class="text-2xl">📉</div>
        <div>
          <p class="font-semibold text-sm text-gray-900 dark:text-white mb-1">Shop Around for Rates</p>
          <p class="text-xs text-gray-600 dark:text-gray-400">
            Even a 0.25% difference in rates can save you thousands. Compare rates from at least 3-5 different lenders.
          </p>
        </div>
      </div>
    `);
  }
  
  // Emergency fund
  recommendations.push(`
    <div class="flex gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
      <div class="text-2xl">🛡️</div>
      <div>
        <p class="font-semibold text-sm text-gray-900 dark:text-white mb-1">Maintain Emergency Fund</p>
        <p class="text-xs text-gray-600 dark:text-gray-400">
          Keep 3-6 months of expenses in savings before and after buying. Homeownership comes with unexpected costs.
        </p>
      </div>
    </div>
  `);
  
  // Refinancing recommendation
  if (refinanceScenarios.length > 0) {
    const savings = baseScenarios[0].totalCost - refinanceScenarios[0].totalCost;
    if (savings > 10000) {
      recommendations.push(`
        <div class="flex gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
          <div class="text-2xl">🔄</div>
          <div>
            <p class="font-semibold text-sm text-gray-900 dark:text-white mb-1">Monitor Refinancing Opportunities</p>
            <p class="text-xs text-gray-600 dark:text-gray-400">
              If rates drop by 0.5%+, refinancing could save you ${formatCurrency(savings)}. Watch the market closely.
            </p>
          </div>
        </div>
      `);
    }
  }
  
  return recommendations.join('');
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
