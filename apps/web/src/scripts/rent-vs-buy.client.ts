/**
 * Rent vs Buy Calculator Client Script
 * 
 * Compares the financial impact of renting vs buying a home over a specified timeframe.
 * Includes property appreciation, tax benefits, opportunity costs, and maintenance.
 */

import {
  coerceNumber,
  formatCurrency,
  showLoading,
  hideLoading,
  showError,
  hideError,
} from '../utils/calculator-utilities';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface RentVsBuyInput {
  homePrice: number;
  downPayment: number;
  interestRate: number;
  loanTermYears: number;
  propertyTaxRate: number;
  homeInsurance: number;
  hoaFees: number;
  maintenanceRate: number;
  appreciationRate: number;
  closingCostRate: number;
  sellingCostRate: number;
  monthlyRent: number;
  rentIncreaseRate: number;
  rentersInsurance: number;
  yearsToAnalyze: number;
  marginalTaxRate: number;
  investmentReturnRate: number;
}

export interface ScenarioResult {
  name: string;
  totalCost: number;
  monthlyPayment: number;
  equity: number;
  netPosition: number;
  breakdown: {
    housingCosts: number;
    taxBenefits: number;
    opportunityCost: number;
    appreciation: number;
  };
  yearByYear: Array<{
    year: number;
    housingCost: number;
    equity: number;
    cumulativeCost: number;
  }>;
}

export interface RentVsBuyResult {
  buy: ScenarioResult;
  rent: ScenarioResult;
  comparison: {
    difference: number;
    breakEvenYear: number | null;
    recommendation: string;
    factors: {
      costAdvantage: string;
      equityBuilding: number;
      flexibility: string;
      taxBenefits: number;
    };
  };
}

// ============================================================================
// CALCULATIONS
// ============================================================================

function calculateBuyingScenario(input: RentVsBuyInput): ScenarioResult {
  const principal = input.homePrice - input.downPayment;
  const monthlyRate = input.interestRate / 100 / 12;
  const termMonths = input.loanTermYears * 12;
  const analysisMonths = input.yearsToAnalyze * 12;
  
  // Monthly mortgage payment (P&I only)
  const monthlyMortgage = (principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);
  
  // Property tax and insurance (monthly)
  const monthlyPropertyTax = (input.homePrice * (input.propertyTaxRate / 100)) / 12;
  const monthlyInsurance = input.homeInsurance;
  const monthlyHOA = input.hoaFees;
  const monthlyMaintenance = (input.homePrice * (input.maintenanceRate / 100)) / 12;
  
  const totalMonthlyPayment = monthlyMortgage + monthlyPropertyTax + monthlyInsurance + monthlyHOA + monthlyMaintenance;
  
  // Track year-by-year
  const yearByYear: ScenarioResult['yearByYear'] = [];
  let remainingPrincipal = principal;
  let totalHousingCosts = input.downPayment + (input.homePrice * (input.closingCostRate / 100)); // Include closing costs
  let totalInterestPaid = 0;
  let totalPropertyTaxPaid = 0;
  
  for (let year = 1; year <= input.yearsToAnalyze; year++) {
    let yearHousingCost = 0;
    let yearInterest = 0;
    let yearPropertyTax = 0;
    
    for (let month = 1; month <= 12 && ((year - 1) * 12 + month) <= analysisMonths; month++) {
      const monthNum = (year - 1) * 12 + month;
      
      if (monthNum <= termMonths && remainingPrincipal > 0) {
        const interestPayment = remainingPrincipal * monthlyRate;
        const principalPayment = monthlyMortgage - interestPayment;
        
        remainingPrincipal = Math.max(0, remainingPrincipal - principalPayment);
        yearInterest += interestPayment;
      }
      
      yearPropertyTax += monthlyPropertyTax;
      yearHousingCost += totalMonthlyPayment;
    }
    
    totalHousingCosts += yearHousingCost;
    totalInterestPaid += yearInterest;
    totalPropertyTaxPaid += yearPropertyTax;
    
    const equityBuilt = principal - remainingPrincipal;
    
    yearByYear.push({
      year,
      housingCost: yearHousingCost,
      equity: equityBuilt,
      cumulativeCost: totalHousingCosts,
    });
  }
  
  // Home value after appreciation
  const futureHomeValue = input.homePrice * Math.pow(1 + (input.appreciationRate / 100), input.yearsToAnalyze);
  
  // Equity = home value - remaining loan + down payment (already paid)
  const homeEquity = futureHomeValue - remainingPrincipal;
  
  // Selling costs
  const sellingCosts = futureHomeValue * (input.sellingCostRate / 100);
  const netProceeds = homeEquity - sellingCosts;
  
  // Tax benefits (mortgage interest + property tax deduction)
  const taxRate = input.marginalTaxRate / 100;
  const taxBenefits = (totalInterestPaid + totalPropertyTaxPaid) * taxRate;
  
  // Net position = net proceeds from sale - total costs paid + tax benefits
  const netPosition = netProceeds - input.downPayment + taxBenefits;
  
  return {
    name: 'Buying',
    totalCost: totalHousingCosts,
    monthlyPayment: totalMonthlyPayment,
    equity: homeEquity,
    netPosition,
    breakdown: {
      housingCosts: totalHousingCosts,
      taxBenefits,
      opportunityCost: 0, // Calculated separately
      appreciation: futureHomeValue - input.homePrice,
    },
    yearByYear,
  };
}

function calculateRentingScenario(input: RentVsBuyInput): ScenarioResult {
  const yearByYear: ScenarioResult['yearByYear'] = [];
  let monthlyRent = input.monthlyRent;
  let totalHousingCosts = 0;
  
  // Calculate opportunity cost: invest down payment + monthly difference
  const downPayment = input.downPayment;
  const closingCosts = input.homePrice * (input.closingCostRate / 100);
  const upfrontCapital = downPayment + closingCosts;
  
  // Investment returns on saved capital
  const monthlyInvestmentReturn = input.investmentReturnRate / 100 / 12;
  let investmentBalance = upfrontCapital;
  
  for (let year = 1; year <= input.yearsToAnalyze; year++) {
    let yearHousingCost = 0;
    
    for (let month = 1; month <= 12; month++) {
      yearHousingCost += monthlyRent + input.rentersInsurance;
      
      // Invest any savings (if rent is cheaper than buying)
      const buyingMonthlyPayment = calculateBuyingScenario(input).monthlyPayment;
      const monthlySavings = Math.max(0, buyingMonthlyPayment - (monthlyRent + input.rentersInsurance));
      
      investmentBalance = investmentBalance * (1 + monthlyInvestmentReturn) + monthlySavings;
    }
    
    totalHousingCosts += yearHousingCost;
    
    // Increase rent annually
    monthlyRent = monthlyRent * (1 + (input.rentIncreaseRate / 100));
    
    yearByYear.push({
      year,
      housingCost: yearHousingCost,
      equity: investmentBalance,
      cumulativeCost: totalHousingCosts,
    });
  }
  
  return {
    name: 'Renting',
    totalCost: totalHousingCosts,
    monthlyPayment: input.monthlyRent + input.rentersInsurance,
    equity: investmentBalance,
    netPosition: investmentBalance - totalHousingCosts,
    breakdown: {
      housingCosts: totalHousingCosts,
      taxBenefits: 0,
      opportunityCost: investmentBalance,
      appreciation: 0,
    },
    yearByYear,
  };
}

function compareRentVsBuy(input: RentVsBuyInput): RentVsBuyResult {
  const buy = calculateBuyingScenario(input);
  const rent = calculateRentingScenario(input);
  
  const difference = buy.netPosition - rent.netPosition;
  
  // Find break-even year (when buying becomes cheaper)
  let breakEvenYear: number | null = null;
  for (let year = 1; year <= input.yearsToAnalyze; year++) {
    const buyCost = buy.yearByYear[year - 1]?.cumulativeCost || 0;
    const rentCost = rent.yearByYear[year - 1]?.cumulativeCost || 0;
    const buyEquity = buy.yearByYear[year - 1]?.equity || 0;
    
    if (buyCost - buyEquity < rentCost) {
      breakEvenYear = year;
      break;
    }
  }
  
  // Generate recommendation
  let recommendation = '';
  if (difference > 50000) {
    recommendation = `Strong Buy: You'll be ${formatCurrency(difference)} better off buying over ${input.yearsToAnalyze} years. You're building equity and benefiting from appreciation.`;
  } else if (difference > 0) {
    recommendation = `Slight Buy Advantage: Buying comes out ${formatCurrency(difference)} ahead, but consider non-financial factors like flexibility and maintenance burden.`;
  } else if (difference > -50000) {
    recommendation = `Slight Rent Advantage: Renting comes out ${formatCurrency(Math.abs(difference))} ahead. You're investing savings and maintaining flexibility.`;
  } else {
    recommendation = `Strong Rent: You'll be ${formatCurrency(Math.abs(difference))} better off renting. Investing your savings outpaces home equity growth.`;
  }
  
  return {
    buy,
    rent,
    comparison: {
      difference,
      breakEvenYear,
      recommendation,
      factors: {
        costAdvantage: difference > 0 ? 'Buying' : 'Renting',
        equityBuilding: buy.equity,
        flexibility: 'Renting offers more mobility, buying offers stability',
        taxBenefits: buy.breakdown.taxBenefits,
      },
    },
  };
}

// ============================================================================
// DISPLAY
// ============================================================================

function displayResults(result: RentVsBuyResult, input: RentVsBuyInput): void {
  const resultsContainer = document.getElementById('results-container');
  const summaryCards = document.getElementById('summary-cards');
  const resultsSection = document.getElementById('results-section');

  if (!resultsContainer || !summaryCards || !resultsSection) {
    console.error('Required DOM elements not found');
    return;
  }

  // Summary cards
  summaryCards.innerHTML = `
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-blue-900 dark:text-blue-100">Net Position (Buy)</h5>
      <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${formatCurrency(result.buy.netPosition)}</p>
      <p class="text-xs text-blue-700 dark:text-blue-300 mt-1">${formatCurrency(result.buy.equity)} equity</p>
    </div>
    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-green-900 dark:text-green-100">Net Position (Rent)</h5>
      <p class="text-2xl font-bold text-green-600 dark:text-green-400">${formatCurrency(result.rent.netPosition)}</p>
      <p class="text-xs text-green-700 dark:text-green-300 mt-1">${formatCurrency(result.rent.equity)} invested</p>
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-purple-900 dark:text-purple-100">Difference</h5>
      <p class="text-2xl font-bold ${result.comparison.difference > 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}">${formatCurrency(Math.abs(result.comparison.difference))}</p>
      <p class="text-xs ${result.comparison.difference > 0 ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'} mt-1">${result.comparison.factors.costAdvantage} wins</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-orange-900 dark:text-orange-100">Break-Even</h5>
      <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">${result.comparison.breakEvenYear ? `Year ${result.comparison.breakEvenYear}` : 'Never'}</p>
      <p class="text-xs text-orange-700 dark:text-orange-300 mt-1">in ${input.yearsToAnalyze} years</p>
    </div>
  `;

  resultsContainer.innerHTML = `
    <!-- Recommendation -->
    <div class="bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 mb-6 border border-blue-200 dark:border-blue-700">
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <span>🎯</span> Recommendation
      </h2>
      <p class="text-gray-700 dark:text-gray-300">${result.comparison.recommendation}</p>
    </div>
    
    <!-- Side-by-Side Comparison -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>📊</span> ${input.yearsToAnalyze}-Year Comparison
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Buying -->
        <div class="border-2 border-blue-300 dark:border-blue-700 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
            <span>🏠</span> Buying
          </h3>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Monthly Payment</span>
              <span class="font-semibold">${formatCurrency(result.buy.monthlyPayment)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Total Costs</span>
              <span class="font-semibold">${formatCurrency(result.buy.totalCost)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Home Equity</span>
              <span class="font-semibold text-green-600 dark:text-green-400">${formatCurrency(result.buy.equity)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Tax Benefits</span>
              <span class="font-semibold text-blue-600 dark:text-blue-400">${formatCurrency(result.buy.breakdown.taxBenefits)}</span>
            </div>
            <div class="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
              <span class="text-sm font-semibold text-gray-900 dark:text-white">Net Position</span>
              <span class="font-bold text-blue-600 dark:text-blue-400">${formatCurrency(result.buy.netPosition)}</span>
            </div>
          </div>
        </div>
        
        <!-- Renting -->
        <div class="border-2 border-green-300 dark:border-green-700 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-green-900 dark:text-green-100 mb-4 flex items-center gap-2">
            <span>🏢</span> Renting
          </h3>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Monthly Payment</span>
              <span class="font-semibold">${formatCurrency(result.rent.monthlyPayment)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Total Costs</span>
              <span class="font-semibold">${formatCurrency(result.rent.totalCost)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Investments</span>
              <span class="font-semibold text-green-600 dark:text-green-400">${formatCurrency(result.rent.equity)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Tax Benefits</span>
              <span class="font-semibold">$0</span>
            </div>
            <div class="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
              <span class="text-sm font-semibold text-gray-900 dark:text-white">Net Position</span>
              <span class="font-bold text-green-600 dark:text-green-400">${formatCurrency(result.rent.netPosition)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Key Factors -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>💡</span> Key Considerations
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 class="font-semibold text-blue-900 dark:text-blue-100 mb-2">Financial Factors</h4>
          <ul class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>✓ Home appreciation: ${formatCurrency(result.buy.breakdown.appreciation)}</li>
            <li>✓ Tax savings: ${formatCurrency(result.buy.breakdown.taxBenefits)}</li>
            <li>✓ Equity built: ${formatCurrency(result.buy.equity)}</li>
            ${result.comparison.breakEvenYear ? `<li>✓ Break-even in year ${result.comparison.breakEvenYear}</li>` : '<li>⚠️ No break-even in analysis period</li>'}
          </ul>
        </div>
        
        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <h4 class="font-semibold text-green-900 dark:text-green-100 mb-2">Lifestyle Factors</h4>
          <ul class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li><strong>Flexibility:</strong> Renting = easy to move</li>
            <li><strong>Stability:</strong> Buying = predictable costs</li>
            <li><strong>Maintenance:</strong> Renting = landlord handles</li>
            <li><strong>Customization:</strong> Buying = full control</li>
          </ul>
        </div>
      </div>
    </div>
    
    <!-- Important Notes -->
    <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border-l-4 border-yellow-500">
      <h4 class="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">📌 Important Notes</h4>
      <ul class="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
        <li>• Assumes ${input.appreciationRate}% annual home appreciation (historical avg: 3-4%)</li>
        <li>• Assumes ${input.investmentReturnRate}% annual investment returns (historical avg: 7-10%)</li>
        <li>• Does not include moving costs, furniture, or one-time expenses</li>
        <li>• Tax benefits assume itemized deductions exceed standard deduction</li>
        <li>• Results depend heavily on local market conditions</li>
      </ul>
    </div>
  `;
  
  resultsSection.classList.remove('hidden');
}

// ============================================================================
// FORM HANDLING
// ============================================================================

function parseFormInput(form: HTMLFormElement): RentVsBuyInput {
  const formData = new FormData(form);
  return {
    homePrice: coerceNumber(formData.get('homePrice'), 0),
    downPayment: coerceNumber(formData.get('downPayment'), 0),
    interestRate: coerceNumber(formData.get('interestRate'), 0),
    loanTermYears: coerceNumber(formData.get('loanTermYears'), 30),
    propertyTaxRate: coerceNumber(formData.get('propertyTaxRate'), 1.2),
    homeInsurance: coerceNumber(formData.get('homeInsurance'), 100),
    hoaFees: coerceNumber(formData.get('hoaFees'), 0),
    maintenanceRate: coerceNumber(formData.get('maintenanceRate'), 1),
    appreciationRate: coerceNumber(formData.get('appreciationRate'), 3),
    closingCostRate: coerceNumber(formData.get('closingCostRate'), 3),
    sellingCostRate: coerceNumber(formData.get('sellingCostRate'), 6),
    monthlyRent: coerceNumber(formData.get('monthlyRent'), 0),
    rentIncreaseRate: coerceNumber(formData.get('rentIncreaseRate'), 3),
    rentersInsurance: coerceNumber(formData.get('rentersInsurance'), 20),
    yearsToAnalyze: coerceNumber(formData.get('yearsToAnalyze'), 5),
    marginalTaxRate: coerceNumber(formData.get('marginalTaxRate'), 22),
    investmentReturnRate: coerceNumber(formData.get('investmentReturnRate'), 7),
  };
}

function validateInput(input: RentVsBuyInput): void {
  if (input.homePrice <= 0) throw new Error('Please enter a valid home price');
  if (input.downPayment >= input.homePrice) throw new Error('Down payment must be less than home price');
  if (input.interestRate <= 0) throw new Error('Please enter a valid interest rate');
  if (input.monthlyRent <= 0) throw new Error('Please enter a valid monthly rent');
  if (input.yearsToAnalyze < 1 || input.yearsToAnalyze > 30) throw new Error('Analysis period must be 1-30 years');
}

// ============================================================================
// INITIALIZATION
// ============================================================================

function initializeRentVsBuy(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement;
  const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement;
  const resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;

  if (!form) {
    console.error('Form not found');
    return;
  }

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    hideError();
    showLoading(calculateBtn);

    try {
      const input = parseFormInput(form);
      validateInput(input);
      
      const result = compareRentVsBuy(input);
      displayResults(result, input);
      
      // Dispatch completion event
      window.dispatchEvent(new CustomEvent('calculator-completed', {
        detail: {
          calculatorId: 'rent-vs-buy',
          result,
          formData: input,
        },
      }));
      
      // Track analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'rent_vs_buy_calculated', {
          years_analyzed: input.yearsToAnalyze,
          home_price: input.homePrice,
          winner: result.comparison.factors.costAdvantage,
        });
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Calculation failed');
      console.error('Rent vs Buy calculation error:', error);
    } finally {
      hideLoading(calculateBtn);
    }
  });

  // Reset button
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      const resultsSection = document.getElementById('results-section');
      resultsSection?.classList.add('hidden');
      hideError();
    });
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeRentVsBuy);
} else {
  initializeRentVsBuy();
}

