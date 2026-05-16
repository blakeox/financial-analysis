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
} from '../../utils/calculator-utilities';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface RentVsBuyInput {
  homePrice: number;
  downPayment: number;
  interestRate: number;
  loanTermYears: number;
  propertyTaxRate: number;
  propertyTaxIncreaseRate: number; // Annual property tax increase (separate from appreciation)
  homeInsurance: number;
  hoaFees: number;
  maintenanceRate: number;
  appreciationRate: number;
  closingCostRate: number;
  sellingCostRate: number;
  monthlyRent: number;
  rentIncreaseRate: number;
  rentersInsurance: number;
  securityDepositMonths: number; // Security deposit (1-2 months rent)
  yearsToAnalyze: number;
  marginalTaxRate: number;
  investmentReturnRate: number;
  inflationRate: number;
  filingStatus: 'single' | 'married' | 'head';
  otherItemizedDeductions: number;
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
    shouldItemize?: boolean;
    potentialItemized?: number;
    standardDeduction?: number;
    pmiCost?: number; // Total PMI paid
    capitalGains?: number; // Capital gains on home sale
    capitalGainsTax?: number; // Tax on capital gains (after exclusion)
    securityDeposit?: number; // Security deposit opportunity cost (renting)
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

/**
 * Calculate PMI (Private Mortgage Insurance) details
 */
function calculatePMI(
  principal: number,
  downPayment: number,
  homePrice: number
): {
  hasPMI: boolean;
  pmiMonthly: number;
  pmiRate: number;
} {
  const downPaymentPercent = (downPayment / homePrice) * 100;

  // No PMI if down payment >= 20%
  if (downPaymentPercent >= 20) {
    return { hasPMI: false, pmiMonthly: 0, pmiRate: 0 };
  }

  // Calculate PMI rate based on down payment amount
  let pmiRate = 0.01; // 1% annual default
  if (downPaymentPercent >= 15) {
    pmiRate = 0.005; // 0.5% for 15-19.99% down
  } else if (downPaymentPercent >= 10) {
    pmiRate = 0.0075; // 0.75% for 10-14.99% down
  } else if (downPaymentPercent >= 5) {
    pmiRate = 0.01; // 1% for 5-9.99% down
  } else {
    pmiRate = 0.012; // 1.2% for <5% down (FHA territory)
  }

  const pmiAnnual = principal * pmiRate;
  const pmiMonthly = pmiAnnual / 12;

  return {
    hasPMI: true,
    pmiMonthly,
    pmiRate,
  };
}

function calculateBuyingScenario(
  input: RentVsBuyInput,
  rentScenarioMonthlyPayment?: number
): ScenarioResult {
  const principal = input.homePrice - input.downPayment;
  const monthlyRate = input.interestRate / 100 / 12;
  const termMonths = input.loanTermYears * 12;
  const analysisMonths = input.yearsToAnalyze * 12;

  // Monthly mortgage payment (P&I only)
  const monthlyMortgage =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);

  // PMI calculation (for down payment < 20%)
  const pmiInfo = calculatePMI(principal, input.downPayment, input.homePrice);

  // Initial property tax and insurance (monthly) - these may increase over time
  const initialMonthlyPropertyTax = (input.homePrice * (input.propertyTaxRate / 100)) / 12;
  const monthlyInsurance = input.homeInsurance;
  const monthlyHOA = input.hoaFees;
  const monthlyMaintenance = (input.homePrice * (input.maintenanceRate / 100)) / 12;

  // Property tax increase rate (separate from appreciation)
  const propertyTaxIncreaseRate = (input.propertyTaxIncreaseRate || 0) / 100;

  // Initial monthly payment (for display purposes, without PMI since it may drop)
  const initialTotalMonthlyPayment =
    monthlyMortgage +
    initialMonthlyPropertyTax +
    monthlyInsurance +
    monthlyHOA +
    monthlyMaintenance +
    pmiInfo.pmiMonthly;

  // Investment returns rate for monthly savings (when buying is cheaper than renting)
  const monthlyInvestmentReturn = input.investmentReturnRate / 100 / 12;

  // Track year-by-year
  const yearByYear: ScenarioResult['yearByYear'] = [];
  let remainingPrincipal = principal;
  let totalHousingCosts = input.downPayment + input.homePrice * (input.closingCostRate / 100); // Include closing costs
  let totalInterestPaid = 0;
  let totalPropertyTaxPaid = 0;
  let totalPMIPaid = 0;

  // Track invested savings when buying is cheaper than renting
  let investmentBalance = 0;
  let currentRentPayment = input.monthlyRent + input.rentersInsurance;

  // Current home value for equity tracking (grows with appreciation)
  let currentHomeValue = input.homePrice;

  for (let year = 1; year <= input.yearsToAnalyze; year++) {
    let yearHousingCost = 0;
    let yearInterest = 0;
    let yearPropertyTax = 0;
    let yearPMI = 0;

    // Property tax for this year (increases annually)
    const yearlyPropertyTaxRate =
      initialMonthlyPropertyTax * 12 * Math.pow(1 + propertyTaxIncreaseRate, year - 1);
    const currentMonthlyPropertyTax = yearlyPropertyTaxRate / 12;

    for (let month = 1; month <= 12 && (year - 1) * 12 + month <= analysisMonths; month++) {
      const monthNum = (year - 1) * 12 + month;

      if (monthNum <= termMonths && remainingPrincipal > 0) {
        const interestPayment = remainingPrincipal * monthlyRate;
        const principalPayment = monthlyMortgage - interestPayment;

        remainingPrincipal = Math.max(0, remainingPrincipal - principalPayment);
        yearInterest += interestPayment;
      }

      // Calculate current LTV to determine if PMI still applies
      // PMI drops when equity reaches 20% (LTV <= 80%)
      const equityBuilt = input.downPayment + (principal - remainingPrincipal);
      const ltv = (currentHomeValue - equityBuilt) / currentHomeValue;
      const pmiThisMonth = ltv > 0.8 ? pmiInfo.pmiMonthly : 0;
      yearPMI += pmiThisMonth;

      yearPropertyTax += currentMonthlyPropertyTax;
      const totalMonthlyPaymentThisMonth =
        monthlyMortgage +
        currentMonthlyPropertyTax +
        monthlyInsurance +
        monthlyHOA +
        monthlyMaintenance +
        pmiThisMonth;
      yearHousingCost += totalMonthlyPaymentThisMonth;

      // Calculate what rent would cost at this point (rent increases annually)
      // and invest the difference if buying is cheaper
      const effectiveRentPayment =
        rentScenarioMonthlyPayment !== undefined
          ? currentRentPayment
          : input.monthlyRent + input.rentersInsurance;

      const monthlySavings = Math.max(0, effectiveRentPayment - totalMonthlyPaymentThisMonth);
      investmentBalance = investmentBalance * (1 + monthlyInvestmentReturn) + monthlySavings;
    }

    totalHousingCosts += yearHousingCost;
    totalInterestPaid += yearInterest;
    totalPropertyTaxPaid += yearPropertyTax;
    totalPMIPaid += yearPMI;

    // Increase the rent comparison for next year (rent rises annually)
    currentRentPayment = currentRentPayment * (1 + input.rentIncreaseRate / 100);

    // Update home value for next year (appreciation)
    currentHomeValue = currentHomeValue * (1 + input.appreciationRate / 100);

    const currentEquityBuilt = principal - remainingPrincipal;

    yearByYear.push({
      year,
      housingCost: yearHousingCost,
      equity: currentEquityBuilt,
      cumulativeCost: totalHousingCosts,
    });
  }

  // Home value after appreciation
  const futureHomeValue =
    input.homePrice * Math.pow(1 + input.appreciationRate / 100, input.yearsToAnalyze);

  // Equity = home value - remaining loan + down payment (already paid)
  const homeEquity = futureHomeValue - remainingPrincipal;

  // Calculate capital gains and exclusion
  const capitalGains = Math.max(0, futureHomeValue - input.homePrice);
  // Primary residence exclusion: $250K for single, $500K for married (requires 2+ years ownership)
  const capitalGainsExclusion =
    input.yearsToAnalyze >= 2 ? (input.filingStatus === 'married' ? 500000 : 250000) : 0;
  const taxableGains = Math.max(0, capitalGains - capitalGainsExclusion);
  // Long-term capital gains rate (simplified: 15% for most filers)
  const capitalGainsTax = taxableGains * 0.15;

  // Selling costs
  const sellingCosts = futureHomeValue * (input.sellingCostRate / 100);
  const netProceeds = homeEquity - sellingCosts - capitalGainsTax;

  // Calculate tax benefits considering standard deduction and SALT cap
  // 2024 standard deductions (approximate, should be updated annually)
  const standardDeductions: Record<string, number> = {
    single: 14600,
    married: 29200,
    head: 21900,
  };
  const standardDeduction = standardDeductions[input.filingStatus] || 14600;

  const taxRate = input.marginalTaxRate / 100;

  // Average annual itemized deductions from mortgage interest + property taxes + other
  const avgAnnualInterest = totalInterestPaid / input.yearsToAnalyze;
  const avgAnnualPropertyTax = totalPropertyTaxPaid / input.yearsToAnalyze;

  // SALT cap: $10,000 limit on state and local tax deductions (property taxes + state income taxes)
  // This applies to the property tax portion plus any state taxes included in otherItemizedDeductions
  const SALT_CAP = 10000;
  const saltDeduction = Math.min(avgAnnualPropertyTax, SALT_CAP);

  // Mortgage interest is NOT subject to SALT cap (it's a separate deduction)
  const potentialItemized =
    avgAnnualInterest +
    saltDeduction +
    Math.max(0, input.otherItemizedDeductions - Math.max(0, avgAnnualPropertyTax - SALT_CAP));

  // Only get benefit for amount exceeding standard deduction
  const excessItemized = Math.max(0, potentialItemized - standardDeduction);
  const annualTaxBenefit = excessItemized * taxRate;
  const taxBenefits = annualTaxBenefit * input.yearsToAnalyze;

  // Track whether itemizing makes sense
  const shouldItemize = potentialItemized > standardDeduction;

  // Net position = net proceeds from sale - total costs paid + tax benefits + investment balance
  const netPosition = netProceeds - input.downPayment + taxBenefits + investmentBalance;

  return {
    name: 'Buying',
    totalCost: totalHousingCosts,
    monthlyPayment: initialTotalMonthlyPayment,
    equity: homeEquity,
    netPosition,
    breakdown: {
      housingCosts: totalHousingCosts,
      taxBenefits,
      opportunityCost: investmentBalance, // Now tracks invested savings
      appreciation: futureHomeValue - input.homePrice,
      shouldItemize,
      potentialItemized,
      standardDeduction,
      pmiCost: totalPMIPaid,
      capitalGains,
      capitalGainsTax,
    },
    yearByYear,
  };
}

function calculateRentingScenario(
  input: RentVsBuyInput,
  buyingScenarioMonthlyPayment: number
): ScenarioResult {
  const yearByYear: ScenarioResult['yearByYear'] = [];
  let monthlyRent = input.monthlyRent;
  let totalHousingCosts = 0;

  // Security deposit (tied-up capital that can't be invested)
  const securityDepositMonths = input.securityDepositMonths || 1;
  const securityDeposit = input.monthlyRent * securityDepositMonths;

  // Calculate opportunity cost: invest down payment + closing costs - security deposit
  const downPayment = input.downPayment;
  const closingCosts = input.homePrice * (input.closingCostRate / 100);
  const upfrontCapital = downPayment + closingCosts - securityDeposit; // Renter also pays security deposit

  // Add security deposit to housing costs (will get it back, but can't invest it)
  totalHousingCosts += securityDeposit;

  // Investment returns on saved capital
  const monthlyInvestmentReturn = input.investmentReturnRate / 100 / 12;
  let investmentBalance = upfrontCapital;

  for (let year = 1; year <= input.yearsToAnalyze; year++) {
    let yearHousingCost = 0;

    for (let month = 1; month <= 12; month++) {
      const currentRentTotal = monthlyRent + input.rentersInsurance;
      yearHousingCost += currentRentTotal;

      // Invest any savings (if rent is cheaper than buying)
      // Use the pre-calculated buying monthly payment to avoid recalculating
      const monthlySavings = Math.max(0, buyingScenarioMonthlyPayment - currentRentTotal);

      investmentBalance = investmentBalance * (1 + monthlyInvestmentReturn) + monthlySavings;
    }

    totalHousingCosts += yearHousingCost;

    // Increase rent annually
    monthlyRent = monthlyRent * (1 + input.rentIncreaseRate / 100);

    yearByYear.push({
      year,
      housingCost: yearHousingCost,
      equity: investmentBalance,
      cumulativeCost: totalHousingCosts,
    });
  }

  // Add security deposit back (returned at end of lease)
  const finalInvestmentBalance = investmentBalance + securityDeposit;

  // Calculate opportunity cost of security deposit (what it could have earned)
  const securityDepositOpportunityCost =
    securityDeposit * Math.pow(1 + input.investmentReturnRate / 100, input.yearsToAnalyze) -
    securityDeposit;

  return {
    name: 'Renting',
    totalCost: totalHousingCosts - securityDeposit, // Don't count security deposit as cost (it's returned)
    monthlyPayment: input.monthlyRent + input.rentersInsurance,
    equity: finalInvestmentBalance,
    netPosition: finalInvestmentBalance - (totalHousingCosts - securityDeposit),
    breakdown: {
      housingCosts: totalHousingCosts - securityDeposit,
      taxBenefits: 0,
      opportunityCost: finalInvestmentBalance,
      appreciation: 0,
      securityDeposit: securityDepositOpportunityCost, // Lost investment opportunity
    },
    yearByYear,
  };
}

function compareRentVsBuy(input: RentVsBuyInput): RentVsBuyResult {
  // First calculate buying scenario to get monthly payment for renting comparison
  const initialRentPayment = input.monthlyRent + input.rentersInsurance;
  const buy = calculateBuyingScenario(input, initialRentPayment);

  // Then calculate renting scenario with buying's monthly payment for savings comparison
  const rent = calculateRentingScenario(input, buy.monthlyPayment);

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

  // Calculate inflation-adjusted (real) values
  const inflationFactor = Math.pow(1 + input.inflationRate / 100, input.yearsToAnalyze);
  const buyRealNetPosition = result.buy.netPosition / inflationFactor;
  const rentRealNetPosition = result.rent.netPosition / inflationFactor;
  const realDifference = buyRealNetPosition - rentRealNetPosition;

  // Summary cards
  summaryCards.innerHTML = `
    <div class="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-violet-900 dark:text-violet-100">Net Position (Buy)</h5>
      <p class="text-2xl font-bold text-violet-600 dark:text-violet-400">${formatCurrency(result.buy.netPosition)}</p>
      <p class="text-xs text-violet-700 dark:text-violet-300 mt-1">${formatCurrency(result.buy.equity)} equity</p>
    </div>
    <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-emerald-900 dark:text-emerald-100">Net Position (Rent)</h5>
      <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${formatCurrency(result.rent.netPosition)}</p>
      <p class="text-xs text-emerald-700 dark:text-emerald-300 mt-1">${formatCurrency(result.rent.equity)} invested</p>
    </div>
    <div class="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-violet-900 dark:text-violet-100">Difference</h5>
      <p class="text-2xl font-bold ${result.comparison.difference > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}">${formatCurrency(Math.abs(result.comparison.difference))}</p>
      <p class="text-xs ${result.comparison.difference > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-orange-700 dark:text-orange-300'} mt-1">${result.comparison.factors.costAdvantage} wins</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-orange-900 dark:text-orange-100">Break-Even</h5>
      <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">${result.comparison.breakEvenYear ? `Year ${result.comparison.breakEvenYear}` : 'Never'}</p>
      <p class="text-xs text-orange-700 dark:text-orange-300 mt-1">in ${input.yearsToAnalyze} years</p>
    </div>
  `;

  resultsContainer.innerHTML = `
    <!-- Recommendation -->
    <div class="bg-linear-to-br from-violet-50 to-violet-50 dark:from-violet-900/20 dark:to-violet-900/20 rounded-lg p-6 mb-6 border border-violet-200 dark:border-violet-700">
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <span>🎯</span> Recommendation
      </h2>
      <p class="text-slate-700 dark:text-slate-300">${result.comparison.recommendation}</p>
    </div>
    
    <!-- Side-by-Side Comparison -->
    <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>📊</span> ${input.yearsToAnalyze}-Year Comparison
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Buying -->
        <div class="border-2 border-violet-300 dark:border-violet-700 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-violet-900 dark:text-violet-100 mb-4 flex items-center gap-2">
            <span>🏠</span> Buying
          </h3>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="fa-script-copy-muted">Monthly Payment${result.buy.breakdown.pmiCost && result.buy.breakdown.pmiCost > 0 ? ' (incl. PMI)' : ''}</span>
              <span class="font-semibold">${formatCurrency(result.buy.monthlyPayment)}</span>
            </div>
            ${
              result.buy.breakdown.pmiCost && result.buy.breakdown.pmiCost > 0
                ? `
            <div class="flex justify-between">
              <span class="fa-script-copy-muted">Total PMI Paid</span>
              <span class="font-semibold text-orange-600 dark:text-orange-400">${formatCurrency(result.buy.breakdown.pmiCost)}</span>
            </div>
            `
                : ''
            }
            <div class="flex justify-between">
              <span class="fa-script-copy-muted">Total Costs</span>
              <span class="font-semibold">${formatCurrency(result.buy.totalCost)}</span>
            </div>
            <div class="flex justify-between">
              <span class="fa-script-copy-muted">Home Equity</span>
              <span class="font-semibold text-emerald-600 dark:text-emerald-400">${formatCurrency(result.buy.equity)}</span>
            </div>
            <div class="flex justify-between">
              <span class="fa-script-copy-muted">Invested Savings</span>
              <span class="font-semibold text-emerald-600 dark:text-emerald-400">${formatCurrency(result.buy.breakdown.opportunityCost)}</span>
            </div>
            <div class="flex justify-between">
              <span class="fa-script-copy-muted">Tax Benefits</span>
              <span class="font-semibold text-violet-600 dark:text-violet-400">${formatCurrency(result.buy.breakdown.taxBenefits)}</span>
            </div>
            ${
              result.buy.breakdown.capitalGainsTax && result.buy.breakdown.capitalGainsTax > 0
                ? `
            <div class="flex justify-between">
              <span class="fa-script-copy-muted">Capital Gains Tax</span>
              <span class="font-semibold text-rose-600 dark:text-rose-400">-${formatCurrency(result.buy.breakdown.capitalGainsTax)}</span>
            </div>
            `
                : ''
            }
            <div class="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2">
              <span class="text-sm font-semibold text-slate-900 dark:text-white">Net Position</span>
              <span class="font-bold text-violet-600 dark:text-violet-400">${formatCurrency(result.buy.netPosition)}</span>
            </div>
          </div>
        </div>
        
        <!-- Renting -->
        <div class="border-2 border-emerald-300 dark:border-emerald-700 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-emerald-900 dark:text-emerald-100 mb-4 flex items-center gap-2">
            <span>🏢</span> Renting
          </h3>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="fa-script-copy-muted">Monthly Payment</span>
              <span class="font-semibold">${formatCurrency(result.rent.monthlyPayment)}</span>
            </div>
            <div class="flex justify-between">
              <span class="fa-script-copy-muted">Total Costs</span>
              <span class="font-semibold">${formatCurrency(result.rent.totalCost)}</span>
            </div>
            <div class="flex justify-between">
              <span class="fa-script-copy-muted">Investments</span>
              <span class="font-semibold text-emerald-600 dark:text-emerald-400">${formatCurrency(result.rent.equity)}</span>
            </div>
            ${
              result.rent.breakdown.securityDeposit && result.rent.breakdown.securityDeposit > 0
                ? `
            <div class="flex justify-between">
              <span class="fa-script-copy-muted">Security Deposit Opp. Cost</span>
              <span class="font-semibold text-orange-600 dark:text-orange-400">-${formatCurrency(result.rent.breakdown.securityDeposit)}</span>
            </div>
            `
                : ''
            }
            <div class="flex justify-between">
              <span class="fa-script-copy-muted">Tax Benefits</span>
              <span class="font-semibold">$0</span>
            </div>
            <div class="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2">
              <span class="text-sm font-semibold text-slate-900 dark:text-white">Net Position</span>
              <span class="font-bold text-emerald-600 dark:text-emerald-400">${formatCurrency(result.rent.netPosition)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Key Factors -->
    <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>💡</span> Key Considerations
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4">
          <h4 class="font-semibold text-violet-900 dark:text-violet-100 mb-2">Buying Advantages</h4>
          <ul class="space-y-2 fa-script-copy-strong">
            <li>✓ Home appreciation: ${formatCurrency(result.buy.breakdown.appreciation)}</li>
            <li>✓ Tax savings: ${formatCurrency(result.buy.breakdown.taxBenefits)}${!result.buy.breakdown.shouldItemize ? ' ⚠️' : ''}</li>
            <li>✓ Equity built: ${formatCurrency(result.buy.equity)}</li>
            <li>✓ Invested savings: ${formatCurrency(result.buy.breakdown.opportunityCost)}</li>
            ${result.comparison.breakEvenYear ? `<li>✓ Break-even in year ${result.comparison.breakEvenYear}</li>` : '<li>⚠️ No break-even in analysis period</li>'}
          </ul>
        </div>
        
        <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
          <h4 class="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Renting Advantages</h4>
          <ul class="space-y-2 fa-script-copy-strong">
            <li>✓ Invested capital: ${formatCurrency(result.rent.equity)}</li>
            <li>✓ Flexibility: Easy to move</li>
            <li>✓ No maintenance costs</li>
            <li>✓ No closing/selling costs</li>
          </ul>
        </div>
      </div>
    </div>
    
    ${
      !result.buy.breakdown.shouldItemize
        ? `
    <!-- Standard Deduction Alert -->
    <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 mb-6 border-l-4 border-orange-500">
      <h4 class="font-semibold text-orange-900 dark:text-orange-100 mb-2">⚠️ Standard Deduction Alert</h4>
      <p class="text-sm text-orange-800 dark:text-orange-200">
        Your itemized deductions (${formatCurrency(result.buy.breakdown.potentialItemized || 0)}) don't exceed the standard deduction 
        (${formatCurrency(result.buy.breakdown.standardDeduction || 0)}). The tax benefit shown above only accounts for amounts 
        <strong>above</strong> the standard deduction. Many homeowners don't get the full mortgage interest deduction benefit.
      </p>
    </div>
    `
        : ''
    }
    
    <!-- Important Notes -->
    <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border-l-4 border-yellow-500">
      <h4 class="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">📌 Important Notes</h4>
      <ul class="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
        <li>• Assumes ${input.appreciationRate}% annual home appreciation (historical avg: 3-4%)</li>
        <li>• Assumes ${input.investmentReturnRate}% annual investment returns (historical avg: 7-10%)</li>
        ${result.buy.breakdown.pmiCost && result.buy.breakdown.pmiCost > 0 ? `<li>• PMI included until 20% equity is reached (total: ${formatCurrency(result.buy.breakdown.pmiCost)})</li>` : ''}
        <li>• Property tax deduction limited by $10,000 SALT cap (IRS rule)</li>
        ${input.yearsToAnalyze >= 2 ? `<li>• Capital gains exclusion: $${input.filingStatus === 'married' ? '500,000' : '250,000'} for primary residence (2+ year ownership)</li>` : '<li>• No capital gains exclusion: requires 2+ years ownership</li>'}
        <li>• Does not include moving costs, furniture, or one-time expenses</li>
        <li>• Tax benefits calculated vs standard deduction (${formatCurrency(result.buy.breakdown.standardDeduction || 0)})</li>
        <li>• Results depend heavily on local market conditions</li>
      </ul>
    </div>
    
    <!-- Inflation-Adjusted Values -->
    <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg shadow-md p-6 mt-6">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>📉</span> Inflation-Adjusted Values (${input.inflationRate}% annual)
      </h2>
      <p class="fa-script-copy-muted mb-4">Real purchasing power after ${input.yearsToAnalyze} years:</p>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4">
          <h5 class="text-sm font-medium text-violet-900 dark:text-violet-100">Real Net Position (Buy)</h5>
          <p class="text-xl font-bold text-violet-600 dark:text-violet-400">${formatCurrency(buyRealNetPosition)}</p>
          <p class="text-xs text-violet-700 dark:text-violet-300 mt-1">in today's dollars</p>
        </div>
        <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
          <h5 class="text-sm font-medium text-emerald-900 dark:text-emerald-100">Real Net Position (Rent)</h5>
          <p class="text-xl font-bold text-emerald-600 dark:text-emerald-400">${formatCurrency(rentRealNetPosition)}</p>
          <p class="text-xs text-emerald-700 dark:text-emerald-300 mt-1">in today's dollars</p>
        </div>
        <div class="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4">
          <h5 class="text-sm font-medium text-violet-900 dark:text-violet-100">Real Difference</h5>
          <p class="text-xl font-bold ${realDifference > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}">${formatCurrency(Math.abs(realDifference))}</p>
          <p class="text-xs ${realDifference > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-orange-700 dark:text-orange-300'} mt-1">${realDifference > 0 ? 'Buying' : 'Renting'} wins (real terms)</p>
        </div>
      </div>
    </div>
    
    <!-- Year-by-Year Comparison Table -->
    <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg shadow-md p-6 mt-6">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>📅</span> Year-by-Year Comparison
      </h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-200 dark:border-slate-800">
              <th class="text-left py-3 px-2 font-semibold text-slate-900 dark:text-white">Year</th>
              <th class="text-right py-3 px-2 font-semibold text-violet-600 dark:text-violet-400">Buy Cost</th>
              <th class="text-right py-3 px-2 font-semibold text-violet-600 dark:text-violet-400">Buy Equity</th>
              <th class="text-right py-3 px-2 font-semibold text-emerald-600 dark:text-emerald-400">Rent Cost</th>
              <th class="text-right py-3 px-2 font-semibold text-emerald-600 dark:text-emerald-400">Investments</th>
              <th class="text-right py-3 px-2 font-semibold text-violet-600 dark:text-violet-400">Net Advantage</th>
            </tr>
          </thead>
          <tbody>
            ${result.buy.yearByYear
              .map((buyYear, index) => {
                const rentYear = result.rent.yearByYear[index];
                const buyNetAtYear = buyYear.equity - buyYear.cumulativeCost;
                const rentNetAtYear = (rentYear?.equity || 0) - (rentYear?.cumulativeCost || 0);
                const advantage = buyNetAtYear - rentNetAtYear;
                return `
                <tr class="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20">
                  <td class="py-2 px-2 text-slate-900 dark:text-white font-medium">${buyYear.year}</td>
                  <td class="py-2 px-2 text-right text-violet-600 dark:text-violet-400">${formatCurrency(buyYear.cumulativeCost)}</td>
                  <td class="py-2 px-2 text-right text-violet-600 dark:text-violet-400">${formatCurrency(buyYear.equity)}</td>
                  <td class="py-2 px-2 text-right text-emerald-600 dark:text-emerald-400">${formatCurrency(rentYear?.cumulativeCost || 0)}</td>
                  <td class="py-2 px-2 text-right text-emerald-600 dark:text-emerald-400">${formatCurrency(rentYear?.equity || 0)}</td>
                  <td class="py-2 px-2 text-right font-semibold ${advantage > 0 ? 'text-violet-600 dark:text-violet-400' : 'text-emerald-600 dark:text-emerald-400'}">
                    ${advantage > 0 ? '🏠' : '🏢'} ${formatCurrency(Math.abs(advantage))}
                  </td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
      <p class="fa-script-note mt-3">
        Net Advantage shows whether buying (🏠) or renting (🏢) is ahead at each year point.
      </p>
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
    propertyTaxIncreaseRate: coerceNumber(formData.get('propertyTaxIncreaseRate'), 2),
    homeInsurance: coerceNumber(formData.get('homeInsurance'), 100),
    hoaFees: coerceNumber(formData.get('hoaFees'), 0),
    maintenanceRate: coerceNumber(formData.get('maintenanceRate'), 1),
    appreciationRate: coerceNumber(formData.get('appreciationRate'), 3),
    closingCostRate: coerceNumber(formData.get('closingCostRate'), 3),
    sellingCostRate: coerceNumber(formData.get('sellingCostRate'), 6),
    monthlyRent: coerceNumber(formData.get('monthlyRent'), 0),
    rentIncreaseRate: coerceNumber(formData.get('rentIncreaseRate'), 3),
    rentersInsurance: coerceNumber(formData.get('rentersInsurance'), 20),
    securityDepositMonths: coerceNumber(formData.get('securityDepositMonths'), 1),
    yearsToAnalyze: coerceNumber(formData.get('yearsToAnalyze'), 5),
    marginalTaxRate: coerceNumber(formData.get('marginalTaxRate'), 22),
    investmentReturnRate: coerceNumber(formData.get('investmentReturnRate'), 7),
    inflationRate: coerceNumber(formData.get('inflationRate'), 2.5),
    filingStatus: (formData.get('filingStatus') as 'single' | 'married' | 'head') || 'single',
    otherItemizedDeductions: coerceNumber(formData.get('otherItemizedDeductions'), 0),
  };
}

function validateInput(input: RentVsBuyInput): void {
  if (input.homePrice <= 0) throw new Error('Please enter a valid home price');
  if (input.downPayment >= input.homePrice)
    throw new Error('Down payment must be less than home price');
  if (input.interestRate <= 0) throw new Error('Please enter a valid interest rate');
  if (input.monthlyRent <= 0) throw new Error('Please enter a valid monthly rent');
  if (input.yearsToAnalyze < 1 || input.yearsToAnalyze > 30)
    throw new Error('Analysis period must be 1-30 years');
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the Basic/Advanced mode toggle
 */
function initializeModeToggle(): void {
  const toggle = document.getElementById('mode-toggle') as HTMLButtonElement | null;
  const basicLabel = document.getElementById('mode-label-basic');
  const advancedLabel = document.getElementById('mode-label-advanced');
  const advancedFields = document.querySelectorAll('[data-advanced="true"]');

  if (!toggle || advancedFields.length === 0) {
    return; // No toggle or no advanced fields
  }

  // Load saved preference from localStorage
  const savedMode = localStorage.getItem('rentVsBuy-mode') || 'basic';
  let isAdvancedMode = savedMode === 'advanced';

  function updateToggleUI(): void {
    if (!toggle || !basicLabel || !advancedLabel) return;

    // Update toggle switch appearance
    const toggleKnob = toggle.querySelector('span');
    if (toggleKnob) {
      if (isAdvancedMode) {
        toggle.classList.remove('fa-switch-inactive');
        toggle.classList.add('fa-switch-active');
        toggleKnob.classList.remove('fa-switch-knob-inactive');
        toggleKnob.classList.add('fa-switch-knob-active');
      } else {
        toggle.classList.remove('fa-switch-active');
        toggle.classList.add('fa-switch-inactive');
        toggleKnob.classList.remove('fa-switch-knob-active');
        toggleKnob.classList.add('fa-switch-knob-inactive');
      }
    }

    // Update label colors
    if (isAdvancedMode) {
      basicLabel.classList.remove('fa-switch-label-active');
      basicLabel.classList.add('fa-switch-label-inactive');
      advancedLabel.classList.remove('fa-switch-label-inactive');
      advancedLabel.classList.add('fa-switch-label-active');
    } else {
      basicLabel.classList.remove('fa-switch-label-inactive');
      basicLabel.classList.add('fa-switch-label-active');
      advancedLabel.classList.remove('fa-switch-label-active');
      advancedLabel.classList.add('fa-switch-label-inactive');
    }

    // Update ARIA
    toggle.setAttribute('aria-checked', String(isAdvancedMode));
  }

  function updateFieldVisibility(): void {
    advancedFields.forEach((field) => {
      if (isAdvancedMode) {
        field.classList.remove('hidden');
      } else {
        field.classList.add('hidden');
      }
    });
  }

  // Set initial state
  updateToggleUI();
  updateFieldVisibility();

  // Handle toggle click
  toggle.addEventListener('click', () => {
    isAdvancedMode = !isAdvancedMode;
    localStorage.setItem('rentVsBuy-mode', isAdvancedMode ? 'advanced' : 'basic');
    updateToggleUI();
    updateFieldVisibility();

    // Track analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'calculator_mode_changed', {
        calculator: 'rent-vs-buy',
        mode: isAdvancedMode ? 'advanced' : 'basic',
      });
    }
  });
}

function initializeRentVsBuy(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement;
  const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement;
  const resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;

  if (!form) {
    console.error('Form not found');
    return;
  }

  // Initialize Basic/Advanced mode toggle
  initializeModeToggle();

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
      window.dispatchEvent(
        new CustomEvent('calculator-completed', {
          detail: {
            calculatorId: 'rent-vs-buy',
            result,
            formData: input,
          },
        })
      );

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
