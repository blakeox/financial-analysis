/**
 * Car Lease vs Buy Calculator
 * Compare leasing vs buying a vehicle with comprehensive cost analysis
 */

import type { CarLeaseVsBuyInput } from '../../schemas/car-lease-vs-buy.js';

export class CarLeaseVsBuyCalculator {
  /**
   * Analyze car lease vs buy decision
   */
  static analyze(input: CarLeaseVsBuyInput): unknown {
    const vehicleInfo = input.vehicleInfo;
    const leaseTerms = input.leaseTerms;
    const purchaseTerms = input.purchaseTerms;
    const ownershipCosts = input.ownershipCosts;
    const financialAssumptions = input.financialAssumptions;
    const analysis = input.analysis;

    // Calculate lease costs
    const leaseAnalysis = this.calculateLeaseCosts(leaseTerms, ownershipCosts, analysis);

    // Calculate purchase costs
    const purchaseAnalysis = this.calculatePurchaseCosts(
      vehicleInfo,
      purchaseTerms,
      ownershipCosts,
      financialAssumptions,
      analysis
    );

    // Compare total costs
    const comparison = this.compareOptions(leaseAnalysis, purchaseAnalysis, analysis);

    // Recommendations
    const recommendations = this.generateRecommendations(comparison, analysis);

    return {
      summary: {
        leaseTotalCost: leaseAnalysis.totalCost,
        purchaseTotalCost: purchaseAnalysis.totalCost,
        betterOption: comparison.betterOption,
        costDifference: Math.abs(leaseAnalysis.totalCost - purchaseAnalysis.totalCost),
      },
      leaseAnalysis,
      purchaseAnalysis,
      comparison,
      recommendations,
    };
  }

  private static calculateLeaseCosts(
    leaseTerms: CarLeaseVsBuyInput['leaseTerms'],
    ownershipCosts: CarLeaseVsBuyInput['ownershipCosts'],
    analysis: CarLeaseVsBuyInput['analysis']
  ): {
    totalPayments: number;
    totalFees: number;
    totalOwnershipCosts: number;
    totalCost: number;
    monthlyEffectiveCost: number;
  } {
    const analysisPeriodMonths = Math.round(analysis.analysisPeriod * 12);
    const leaseTermMonths = leaseTerms.leaseTerm;

    const numberOfLeaseTerms = Math.ceil(analysisPeriodMonths / leaseTermMonths);

    const totalPayments = leaseTerms.monthlyPayment * analysisPeriodMonths;
    const perLeaseFees =
      leaseTerms.downPayment +
      leaseTerms.acquisitionFee +
      leaseTerms.dispositionFee +
      leaseTerms.securityDeposit;
    const totalFees = perLeaseFees * numberOfLeaseTerms;

    const annualOwnershipCosts =
      ownershipCosts.annualInsurance +
      ownershipCosts.annualMaintenance +
      ownershipCosts.annualRepairs +
      ownershipCosts.fuelCost;
    const totalOwnershipCosts = annualOwnershipCosts * analysis.analysisPeriod;

    const totalCost = totalPayments + totalFees + totalOwnershipCosts;
    const monthlyEffectiveCost = totalCost / analysisPeriodMonths;

    return {
      totalPayments,
      totalFees,
      totalOwnershipCosts,
      totalCost,
      monthlyEffectiveCost,
    };
  }

  private static calculatePurchaseCosts(
    vehicleInfo: CarLeaseVsBuyInput['vehicleInfo'],
    purchaseTerms: CarLeaseVsBuyInput['purchaseTerms'],
    ownershipCosts: CarLeaseVsBuyInput['ownershipCosts'],
    assumptions: CarLeaseVsBuyInput['financialAssumptions'],
    analysis: CarLeaseVsBuyInput['analysis']
  ): {
    purchasePrice: number;
    totalInterest: number;
    totalOwnershipCosts: number;
    depreciation: number;
    opportunityCost: number;
    totalCost: number;
    resaleValue: number;
  } {
    const analysisPeriodMonths = Math.round(analysis.analysisPeriod * 12);

    const vehiclePrice = vehicleInfo.negotiatedPrice;
    const salesTax = vehiclePrice * purchaseTerms.salesTaxRate;
    const purchaseFees = purchaseTerms.registrationFee + purchaseTerms.titleFee;
    const totalOutTheDoor = vehiclePrice + salesTax + purchaseFees;

    const principal = Math.max(0, totalOutTheDoor - purchaseTerms.downPayment);

    // Loan calculation
    const monthlyRate = purchaseTerms.interestRate / 12;
    const numPayments = purchaseTerms.loanTerm;

    const monthlyPayment =
      monthlyRate === 0
        ? principal / numPayments
        : (principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
          (Math.pow(1 + monthlyRate, numPayments) - 1);

    const monthsAnalyzed = Math.min(numPayments, analysisPeriodMonths);
    let remainingBalance = principal;
    let totalInterest = 0;

    for (let month = 0; month < monthsAnalyzed; month += 1) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = Math.min(
        Math.max(0, monthlyPayment - interestPayment),
        remainingBalance
      );
      totalInterest += interestPayment;
      remainingBalance -= principalPayment;
    }

    // Depreciation / resale value at end of analysis period (years)
    const resaleValue =
      vehiclePrice * Math.pow(1 - assumptions.expectedDepreciation, analysis.analysisPeriod);
    const depreciation = vehiclePrice - resaleValue;

    // Ownership costs
    const annualOwnershipCosts =
      ownershipCosts.annualInsurance +
      ownershipCosts.annualMaintenance +
      ownershipCosts.annualRepairs +
      ownershipCosts.fuelCost;
    const totalOwnershipCosts = annualOwnershipCosts * analysis.analysisPeriod;

    // Opportunity cost of down payment
    const opportunityCost =
      purchaseTerms.downPayment * assumptions.opportunityCostRate * analysis.analysisPeriod;

    const totalLoanPayments = monthlyPayment * monthsAnalyzed;
    const totalCost =
      purchaseTerms.downPayment +
      totalLoanPayments +
      totalOwnershipCosts +
      opportunityCost +
      remainingBalance -
      resaleValue;

    return {
      purchasePrice: totalOutTheDoor,
      totalInterest,
      totalOwnershipCosts,
      depreciation,
      opportunityCost,
      totalCost,
      resaleValue,
    };
  }

  private static compareOptions(
    lease: { totalCost: number },
    purchase: { totalCost: number },
    analysis: CarLeaseVsBuyInput['analysis']
  ): {
    betterOption: 'lease' | 'buy';
    costDifference: number;
    breakEvenYears: number;
  } {
    const betterOption = lease.totalCost < purchase.totalCost ? 'lease' : 'buy';
    const costDifference = Math.abs(lease.totalCost - purchase.totalCost);
    const breakEvenYears = analysis.analysisPeriod; // Simplified

    return {
      betterOption,
      costDifference,
      breakEvenYears,
    };
  }

  private static generateRecommendations(
    comparison: { betterOption: string; costDifference: number },
    analysis: CarLeaseVsBuyInput['analysis']
  ): string[] {
    const recommendations: string[] = [];

    recommendations.push(
      `${comparison.betterOption === 'lease' ? 'Leasing' : 'Buying'} is more cost-effective in your situation`
    );
    recommendations.push(
      `Cost difference: $${comparison.costDifference.toFixed(0)} over ${analysis.analysisPeriod} years`
    );

    if (comparison.betterOption === 'lease') {
      recommendations.push('Leasing provides lower upfront costs and newer vehicles');
    } else {
      recommendations.push('Buying provides equity and no mileage restrictions');
    }

    return recommendations;
  }
}
