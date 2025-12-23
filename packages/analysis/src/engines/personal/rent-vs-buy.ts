/**
 * Rent vs Buy Calculator Engine
 *
 * Pure, deterministic engine for comparing the financial impact
 * of renting vs buying a home over a specified timeframe.
 */

import type { RentVsBuyInput } from '../../schemas/rent-vs-buy.js';
import type {
  RentVsBuyResult,
  ScenarioResult,
  ScenarioBreakdown,
  YearByYearData,
} from '../../types/rent-vs-buy-result.js';

/**
 * PMI (Private Mortgage Insurance) calculation details
 */
interface PMIInfo {
  hasPMI: boolean;
  pmiMonthly: number;
  pmiRate: number;
}

/**
 * Calculate PMI based on down payment percentage
 */
function calculatePMI(principal: number, downPayment: number, homePrice: number): PMIInfo {
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

/**
 * Format currency for recommendations
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Calculate buying scenario results
 */
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
    monthlyRate > 0
      ? (principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
        (Math.pow(1 + monthlyRate, termMonths) - 1)
      : principal / termMonths;

  // PMI calculation (for down payment < 20%)
  const pmiInfo = calculatePMI(principal, input.downPayment, input.homePrice);

  // Initial property tax and insurance (monthly)
  const initialMonthlyPropertyTax = (input.homePrice * (input.propertyTaxRate / 100)) / 12;
  const monthlyInsurance = input.homeInsurance;
  const monthlyHOA = input.hoaFees;
  const monthlyMaintenance = (input.homePrice * (input.maintenanceRate / 100)) / 12;

  // Property tax increase rate
  const propertyTaxIncreaseRate = (input.propertyTaxIncreaseRate || 0) / 100;

  // Initial monthly payment
  const initialTotalMonthlyPayment =
    monthlyMortgage +
    initialMonthlyPropertyTax +
    monthlyInsurance +
    monthlyHOA +
    monthlyMaintenance +
    pmiInfo.pmiMonthly;

  // Investment returns rate for monthly savings
  const monthlyInvestmentReturn = input.investmentReturnRate / 100 / 12;

  // Track year-by-year
  const yearByYear: YearByYearData[] = [];
  let remainingPrincipal = principal;
  let totalHousingCosts = input.downPayment + input.homePrice * (input.closingCostRate / 100);
  let totalInterestPaid = 0;
  let totalPropertyTaxPaid = 0;
  let totalPMIPaid = 0;

  // Track invested savings when buying is cheaper than renting
  let investmentBalance = 0;
  let currentRentPayment = input.monthlyRent + input.rentersInsurance;

  // Current home value for equity tracking
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

      // Calculate what rent would cost and invest the difference if buying is cheaper
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

    // Increase rent comparison for next year
    currentRentPayment = currentRentPayment * (1 + input.rentIncreaseRate / 100);

    // Update home value for next year
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

  // Equity = home value - remaining loan
  const homeEquity = futureHomeValue - remainingPrincipal;

  // Calculate capital gains and exclusion
  const capitalGains = Math.max(0, futureHomeValue - input.homePrice);
  const capitalGainsExclusion =
    input.yearsToAnalyze >= 2 ? (input.filingStatus === 'married' ? 500000 : 250000) : 0;
  const taxableGains = Math.max(0, capitalGains - capitalGainsExclusion);
  const capitalGainsTax = taxableGains * 0.15;

  // Selling costs
  const sellingCosts = futureHomeValue * (input.sellingCostRate / 100);
  const netProceeds = homeEquity - sellingCosts - capitalGainsTax;

  // Calculate tax benefits with SALT cap
  const standardDeductions: Record<string, number> = {
    single: 14600,
    married: 29200,
    head: 21900,
  };
  const standardDeduction = standardDeductions[input.filingStatus] || 14600;
  const taxRate = input.marginalTaxRate / 100;

  const avgAnnualInterest = totalInterestPaid / input.yearsToAnalyze;
  const avgAnnualPropertyTax = totalPropertyTaxPaid / input.yearsToAnalyze;

  // SALT cap: $10,000 limit
  const SALT_CAP = 10000;
  const saltDeduction = Math.min(avgAnnualPropertyTax, SALT_CAP);

  const potentialItemized =
    avgAnnualInterest +
    saltDeduction +
    Math.max(0, input.otherItemizedDeductions - Math.max(0, avgAnnualPropertyTax - SALT_CAP));

  const excessItemized = Math.max(0, potentialItemized - standardDeduction);
  const annualTaxBenefit = excessItemized * taxRate;
  const taxBenefits = annualTaxBenefit * input.yearsToAnalyze;

  const shouldItemize = potentialItemized > standardDeduction;

  // Net position
  const netPosition = netProceeds - input.downPayment + taxBenefits + investmentBalance;

  const breakdown: ScenarioBreakdown = {
    housingCosts: totalHousingCosts,
    taxBenefits,
    opportunityCost: investmentBalance,
    appreciation: futureHomeValue - input.homePrice,
    shouldItemize,
    potentialItemized,
    standardDeduction,
    pmiCost: totalPMIPaid,
    capitalGains,
    capitalGainsTax,
  };

  return {
    name: 'Buying',
    totalCost: totalHousingCosts,
    monthlyPayment: initialTotalMonthlyPayment,
    equity: homeEquity,
    netPosition,
    breakdown,
    yearByYear,
  };
}

/**
 * Calculate renting scenario results
 */
function calculateRentingScenario(
  input: RentVsBuyInput,
  buyingScenarioMonthlyPayment: number
): ScenarioResult {
  const yearByYear: YearByYearData[] = [];
  let monthlyRent = input.monthlyRent;
  let totalHousingCosts = 0;

  // Security deposit
  const securityDepositMonths = input.securityDepositMonths || 1;
  const securityDeposit = input.monthlyRent * securityDepositMonths;

  // Capital available to invest
  const downPayment = input.downPayment;
  const closingCosts = input.homePrice * (input.closingCostRate / 100);
  const upfrontCapital = downPayment + closingCosts - securityDeposit;

  totalHousingCosts += securityDeposit;

  // Investment returns
  const monthlyInvestmentReturn = input.investmentReturnRate / 100 / 12;
  let investmentBalance = upfrontCapital;

  for (let year = 1; year <= input.yearsToAnalyze; year++) {
    let yearHousingCost = 0;

    for (let month = 1; month <= 12; month++) {
      const currentRentTotal = monthlyRent + input.rentersInsurance;
      yearHousingCost += currentRentTotal;

      // Invest any savings if rent is cheaper than buying
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

  // Add security deposit back (returned at end)
  const finalInvestmentBalance = investmentBalance + securityDeposit;

  // Security deposit opportunity cost
  const securityDepositOpportunityCost =
    securityDeposit * Math.pow(1 + input.investmentReturnRate / 100, input.yearsToAnalyze) -
    securityDeposit;

  const breakdown: ScenarioBreakdown = {
    housingCosts: totalHousingCosts - securityDeposit,
    taxBenefits: 0,
    opportunityCost: finalInvestmentBalance,
    appreciation: 0,
    securityDeposit: securityDepositOpportunityCost,
  };

  return {
    name: 'Renting',
    totalCost: totalHousingCosts - securityDeposit,
    monthlyPayment: input.monthlyRent + input.rentersInsurance,
    equity: finalInvestmentBalance,
    netPosition: finalInvestmentBalance - (totalHousingCosts - securityDeposit),
    breakdown,
    yearByYear,
  };
}

/**
 * RentVsBuyCalculator - Main analysis engine
 */
export class RentVsBuyCalculator {
  /**
   * Analyze rent vs buy decision
   */
  static analyze(input: RentVsBuyInput): RentVsBuyResult {
    // Calculate buying scenario first
    const initialRentPayment = input.monthlyRent + input.rentersInsurance;
    const buy = calculateBuyingScenario(input, initialRentPayment);

    // Calculate renting scenario with buying's monthly payment
    const rent = calculateRentingScenario(input, buy.monthlyPayment);

    const difference = buy.netPosition - rent.netPosition;

    // Find break-even year
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
      timestamp: new Date().toISOString(),
      inputSummary: {
        homePrice: input.homePrice,
        monthlyRent: input.monthlyRent,
        yearsAnalyzed: input.yearsToAnalyze,
        downPaymentPercent: (input.downPayment / input.homePrice) * 100,
      },
    };
  }
}
