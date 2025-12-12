/**
 * Equipment Lease vs Buy Analysis
 * Compare equipment leasing vs purchasing with tax implications
 */

import type { EquipmentLeaseVsBuyInput } from '../schemas/equipment-lease-vs-buy.js';

export class EquipmentLeaseVsBuyCalculator {
  /**
   * Analyze equipment lease vs buy decision
   */
  static analyze(input: EquipmentLeaseVsBuyInput): unknown {
    const equipmentInfo = input.equipmentInfo;
    const leaseTerms = input.leaseTerms;
    const purchaseTerms = input.purchaseTerms;
    const taxInfo = input.taxInfo;
    const financialAssumptions = input.financialAssumptions;
    const analysis = input.analysis;

    // Calculate lease costs
    const leaseAnalysis = this.calculateLeaseCosts(leaseTerms, taxInfo, analysis);

    // Calculate purchase costs
    const purchaseAnalysis = this.calculatePurchaseCosts(
      equipmentInfo,
      purchaseTerms,
      taxInfo,
      financialAssumptions,
      analysis
    );

    // Compare options
    const comparison = this.compareOptions(leaseAnalysis, purchaseAnalysis, analysis);

    // Recommendations
    const recommendations = this.generateRecommendations(
      leaseAnalysis,
      purchaseAnalysis,
      comparison,
      analysis
    );

    return {
      summary: {
        leaseTotalCost: leaseAnalysis.totalCost,
        purchaseTotalCost: purchaseAnalysis.totalCost,
        betterOption: comparison.betterOption,
        costDifference: Math.abs(leaseAnalysis.totalCost - purchaseAnalysis.totalCost),
        npvDifference: comparison.npvDifference,
      },
      leaseAnalysis,
      purchaseAnalysis,
      comparison,
      recommendations,
    };
  }

  private static calculateLeaseCosts(
    leaseTerms: EquipmentLeaseVsBuyInput['leaseTerms'],
    taxInfo: EquipmentLeaseVsBuyInput['taxInfo'],
    _analysis: EquipmentLeaseVsBuyInput['analysis']
  ): {
    totalPayments: number;
    totalFees: number;
    totalCost: number;
    afterTaxCost: number;
    npv: number;
  } {
    const totalPayments = leaseTerms.monthlyPayment * leaseTerms.leaseTerm * 12;
    const totalFees = leaseTerms.downPayment + leaseTerms.securityDeposit;
    const totalCost = totalPayments + totalFees;

    // Lease payments are typically fully deductible
    const taxSavings = totalPayments * (taxInfo.federalTaxRate + taxInfo.stateTaxRate);
    const afterTaxCost = totalCost - taxSavings;

    // NPV calculation
    const discountRate = 0.1; // 10% cost of capital
    const npv = this.calculateNPV(totalPayments, leaseTerms.leaseTerm, discountRate) - totalFees;

    return {
      totalPayments,
      totalFees,
      totalCost,
      afterTaxCost,
      npv,
    };
  }

  private static calculatePurchaseCosts(
    equipment: EquipmentLeaseVsBuyInput['equipmentInfo'],
    purchaseTerms: EquipmentLeaseVsBuyInput['purchaseTerms'],
    taxInfo: EquipmentLeaseVsBuyInput['taxInfo'],
    assumptions: EquipmentLeaseVsBuyInput['financialAssumptions'],
    analysis: EquipmentLeaseVsBuyInput['analysis']
  ): {
    purchasePrice: number;
    totalInterest: number;
    totalMaintenance: number;
    depreciation: number;
    taxSavings: number;
    totalCost: number;
    afterTaxCost: number;
    npv: number;
    resaleValue: number;
  } {
    const purchasePrice = equipment.purchasePrice;
    const salesTax = purchasePrice * 0.08; // Assume 8% sales tax
    const totalPurchase = purchasePrice + salesTax - purchaseTerms.downPayment;

    // Loan calculation
    const loanAmount = totalPurchase;
    const monthlyRate = purchaseTerms.interestRate / 12;
    const numPayments = purchaseTerms.loanTerm * 12;
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    const totalInterest = (monthlyPayment * numPayments) - loanAmount;

    // Maintenance and insurance
    const totalMaintenance = purchaseTerms.annualMaintenanceCost * analysis.analysisPeriod;
    const totalInsurance = purchaseTerms.insuranceCost * analysis.analysisPeriod;

    // Depreciation and tax benefits
    const depreciation = purchasePrice * (1 - Math.pow(1 - 0.2, analysis.analysisPeriod)); // 20% annual depreciation
    const section179 = taxInfo.section179Eligible ? Math.min(purchasePrice, taxInfo.section179Deduction) : 0;
    const bonusDepreciation = taxInfo.bonusDepreciationEligible ? purchasePrice * taxInfo.bonusDepreciationPercentage : 0;
    const totalDepreciation = section179 + bonusDepreciation + depreciation;
    const taxSavings = totalDepreciation * (taxInfo.federalTaxRate + taxInfo.stateTaxRate);

    // Resale value
    const resaleValue = equipment.expectedResidualValue * Math.pow(1 - assumptions.inflationRate, analysis.analysisPeriod);

    const totalCost = purchasePrice + salesTax + totalInterest + totalMaintenance + totalInsurance - taxSavings - resaleValue;
    const afterTaxCost = totalCost;

    // NPV
    const discountRate = assumptions.opportunityCostRate;
    const npv = this.calculateNPV(monthlyPayment * 12, analysis.analysisPeriod, discountRate) - purchasePrice - salesTax + taxSavings + resaleValue;

    return {
      purchasePrice: totalPurchase,
      totalInterest,
      totalMaintenance: totalMaintenance + totalInsurance,
      depreciation: totalDepreciation,
      taxSavings,
      totalCost,
      afterTaxCost,
      npv,
      resaleValue,
    };
  }

  private static calculateNPV(annualCashFlow: number, years: number, discountRate: number): number {
    let npv = 0;
    for (let year = 1; year <= years; year++) {
      npv += annualCashFlow / Math.pow(1 + discountRate, year);
    }
    return npv;
  }

  private static compareOptions(
    lease: { npv: number; afterTaxCost: number },
    purchase: { npv: number; afterTaxCost: number },
    _analysis: EquipmentLeaseVsBuyInput['analysis']
  ): {
    betterOption: 'lease' | 'buy';
    costDifference: number;
    npvDifference: number;
  } {
    const betterOption = lease.npv > purchase.npv ? 'lease' : 'buy';
    const costDifference = Math.abs(lease.afterTaxCost - purchase.afterTaxCost);
    const npvDifference = lease.npv - purchase.npv;

    return {
      betterOption,
      costDifference,
      npvDifference,
    };
  }

  private static generateRecommendations(
    lease: { totalCost: number },
    purchase: { totalCost: number },
    comparison: { betterOption: string },
    analysis: EquipmentLeaseVsBuyInput['analysis']
  ): string[] {
    const recommendations: string[] = [];

    recommendations.push(`${comparison.betterOption === 'lease' ? 'Leasing' : 'Buying'} is more cost-effective`);
    recommendations.push(`Cost difference: $${comparison.costDifference.toFixed(0)} over ${analysis.analysisPeriod} years`);

    if (comparison.betterOption === 'lease') {
      recommendations.push('Leasing provides tax benefits and preserves capital');
    } else {
      recommendations.push('Buying provides ownership and potential resale value');
    }

    return recommendations;
  }
}


