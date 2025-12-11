/**
 * Real Estate Investment Analysis
 * Cap rate, cash-on-cash return, NOI, IRR for real estate investments
 */

import { Decimal } from 'decimal.js';
import type { RealEstateInvestmentInput } from '../schemas/real-estate-investment.js';

export class RealEstateInvestmentAnalyzer {
  /**
   * Analyze real estate investment metrics
   */
  static analyze(input: RealEstateInvestmentInput): unknown {
    const propertyInfo = input.propertyInfo;
    const financing = input.financing;
    const income = input.income;
    const expenses = input.expenses;
    const projections = input.projections;
    const analysis = input.analysis;

    // Calculate NOI
    const noi = analysis.includeNOI ? this.calculateNOI(income, expenses) : undefined;

    // Calculate Cap Rate
    const capRate = analysis.includeCapRate
      ? this.calculateCapRate(noi?.annualNOI || 0, propertyInfo.purchasePrice)
      : undefined;

    // Calculate Cash-on-Cash Return
    const cashOnCash = analysis.includeCashOnCash
      ? this.calculateCashOnCash(noi?.annualNOI || 0, financing, expenses)
      : undefined;

    // Calculate mortgage payment
    const mortgagePayment = this.calculateMortgagePayment(financing);

    // Cash flow analysis
    const cashFlow = this.calculateCashFlow(noi?.annualNOI || 0, mortgagePayment, expenses);

    // Projected returns
    const projectedReturns = this.projectReturns(
      propertyInfo,
      financing,
      income,
      expenses,
      projections,
      cashFlow
    );

    // IRR calculation
    const irr = analysis.includeIRR
      ? this.calculateIRR(propertyInfo, financing, income, expenses, projections, cashFlow)
      : undefined;

    // Recommendations
    const recommendations = this.generateRecommendations(
      capRate,
      cashOnCash,
      irr,
      cashFlow,
      propertyInfo
    );

    return {
      summary: {
        capRate: capRate?.capRate,
        cashOnCashReturn: cashOnCash?.cashOnCashReturn,
        annualNOI: noi?.annualNOI,
        monthlyCashFlow: cashFlow.monthlyCashFlow,
        irr: irr?.irr,
        totalReturn: projectedReturns.totalReturn,
      },
      noi,
      capRate,
      cashOnCash,
      mortgagePayment,
      cashFlow,
      projectedReturns,
      irr,
      recommendations,
    };
  }

  private static calculateNOI(
    income: RealEstateInvestmentInput['income'],
    expenses: RealEstateInvestmentInput['expenses']
  ): {
    grossRentalIncome: number;
    effectiveRentalIncome: number;
    totalOperatingExpenses: number;
    annualNOI: number;
    monthlyNOI: number;
  } {
    const grossRentalIncome = income.monthlyRent * 12;
    const effectiveRentalIncome = grossRentalIncome * income.occupancyRate;
    const totalOperatingExpenses =
      expenses.propertyTaxes +
      expenses.insurance +
      expenses.maintenance +
      expenses.propertyManagement +
      expenses.utilities +
      expenses.otherExpenses;
    const annualNOI = effectiveRentalIncome + income.otherIncome * 12 - totalOperatingExpenses;
    const monthlyNOI = annualNOI / 12;

    return {
      grossRentalIncome,
      effectiveRentalIncome,
      totalOperatingExpenses,
      annualNOI,
      monthlyNOI,
    };
  }

  private static calculateCapRate(
    annualNOI: number,
    purchasePrice: number
  ): {
    capRate: number;
    interpretation: string;
  } {
    const capRate = purchasePrice > 0 ? annualNOI / purchasePrice : 0;
    let interpretation = '';

    if (capRate >= 0.08) {
      interpretation = 'Excellent cap rate - strong income potential';
    } else if (capRate >= 0.06) {
      interpretation = 'Good cap rate - solid investment';
    } else if (capRate >= 0.04) {
      interpretation = 'Moderate cap rate - consider market conditions';
    } else {
      interpretation = 'Low cap rate - may be appreciation play rather than income';
    }

    return {
      capRate,
      interpretation,
    };
  }

  private static calculateCashOnCash(
    annualNOI: number,
    financing: RealEstateInvestmentInput['financing'],
    _expenses: RealEstateInvestmentInput['expenses']
  ): {
    annualDebtService: number;
    annualCashFlow: number;
    cashOnCashReturn: number;
    interpretation: string;
  } {
    const monthlyPayment = this.calculateMortgagePayment(financing);
    const annualDebtService = monthlyPayment * 12;
    const annualCashFlow = annualNOI - annualDebtService;
    const cashOnCashReturn = financing.downPayment > 0 ? annualCashFlow / financing.downPayment : 0;

    let interpretation = '';
    if (cashOnCashReturn >= 0.1) {
      interpretation = 'Excellent cash-on-cash return';
    } else if (cashOnCashReturn >= 0.06) {
      interpretation = 'Good cash-on-cash return';
    } else if (cashOnCashReturn >= 0) {
      interpretation = 'Positive but modest cash-on-cash return';
    } else {
      interpretation = 'Negative cash flow - relying on appreciation';
    }

    return {
      annualDebtService,
      annualCashFlow,
      cashOnCashReturn,
      interpretation,
    };
  }

  private static calculateMortgagePayment(financing: RealEstateInvestmentInput['financing']): {
    monthlyPayment: number;
    totalPayments: number;
    totalInterest: number;
  } {
    if (financing.loanType === 'cash' || financing.loanAmount === 0) {
      return {
        monthlyPayment: 0,
        totalPayments: 0,
        totalInterest: 0,
      };
    }

    const monthlyRate = financing.interestRate / 12;
    const termMonths = financing.loanTerm * 12;
    const onePlusR = new Decimal(1).plus(monthlyRate);
    const onePlusRPowN = onePlusR.pow(termMonths);
    const numerator = new Decimal(monthlyRate).times(onePlusRPowN);
    const denominator = onePlusRPowN.minus(1);
    const monthlyPayment = new Decimal(financing.loanAmount)
      .times(numerator)
      .div(denominator)
      .toNumber();
    const totalPayments = monthlyPayment * termMonths;
    const totalInterest = totalPayments - financing.loanAmount;

    return {
      monthlyPayment,
      totalPayments,
      totalInterest,
    };
  }

  private static calculateCashFlow(
    annualNOI: number,
    mortgagePayment: { monthlyPayment: number },
    _expenses: RealEstateInvestmentInput['expenses']
  ): {
    monthlyCashFlow: number;
    annualCashFlow: number;
    cashFlowMargin: number;
  } {
    const monthlyNOI = annualNOI / 12;
    const monthlyCashFlow = monthlyNOI - mortgagePayment.monthlyPayment;
    const annualCashFlow = monthlyCashFlow * 12;
    const cashFlowMargin = annualNOI > 0 ? (annualCashFlow / annualNOI) * 100 : 0;

    return {
      monthlyCashFlow,
      annualCashFlow,
      cashFlowMargin,
    };
  }

  private static projectReturns(
    propertyInfo: RealEstateInvestmentInput['propertyInfo'],
    financing: RealEstateInvestmentInput['financing'],
    income: RealEstateInvestmentInput['income'],
    expenses: RealEstateInvestmentInput['expenses'],
    projections: RealEstateInvestmentInput['projections'],
    cashFlow: { annualCashFlow: number }
  ): {
    projectedSalePrice: number;
    totalCashFlow: number;
    totalReturn: number;
    roi: number;
    annualizedReturn: number;
  } {
    const appreciationFactor = Math.pow(
      1 + projections.appreciationRate,
      projections.holdingPeriod
    );
    const projectedSalePrice =
      propertyInfo.purchasePrice * appreciationFactor * (1 - projections.saleCosts);
    const totalCashFlow = cashFlow.annualCashFlow * projections.holdingPeriod;
    const totalReturn =
      projectedSalePrice - financing.loanAmount + totalCashFlow - financing.downPayment;
    const roi = financing.downPayment > 0 ? (totalReturn / financing.downPayment) * 100 : 0;
    const annualizedReturn =
      financing.downPayment > 0
        ? (Math.pow(1 + totalReturn / financing.downPayment, 1 / projections.holdingPeriod) - 1) *
          100
        : 0;

    return {
      projectedSalePrice,
      totalCashFlow,
      totalReturn,
      roi,
      annualizedReturn,
    };
  }

  private static calculateIRR(
    _propertyInfo: RealEstateInvestmentInput['propertyInfo'],
    _financing: RealEstateInvestmentInput['financing'],
    _income: RealEstateInvestmentInput['income'],
    _expenses: RealEstateInvestmentInput['expenses'],
    projections: RealEstateInvestmentInput['projections'],
    cashFlow: { annualCashFlow: number }
  ): {
    irr: number;
    interpretation: string;
  } {
    // Simplified IRR calculation
    const projectedReturns = this.projectReturns(
      propertyInfo,
      financing,
      income,
      expenses,
      projections,
      cashFlow
    );
    const totalReturn = projectedReturns.totalReturn;
    const initialInvestment = financing.downPayment;

    // Use approximation: IRR ≈ (Total Return / Initial Investment) ^ (1/Years) - 1
    const irr =
      initialInvestment > 0
        ? Math.pow(1 + totalReturn / initialInvestment, 1 / projections.holdingPeriod) - 1
        : 0;

    let interpretation = '';
    if (irr >= 0.15) {
      interpretation = 'Excellent IRR - strong investment opportunity';
    } else if (irr >= 0.1) {
      interpretation = 'Good IRR - solid investment';
    } else if (irr >= 0.06) {
      interpretation = 'Moderate IRR - consider alternatives';
    } else {
      interpretation = 'Low IRR - may not meet return requirements';
    }

    return {
      irr,
      interpretation,
    };
  }

  private static generateRecommendations(
    capRate?: { capRate: number },
    cashOnCash?: { cashOnCashReturn: number },
    irr?: { irr: number },
    cashFlow?: { monthlyCashFlow: number },
    propertyInfo?: RealEstateInvestmentInput['propertyInfo']
  ): string[] {
    const recommendations: string[] = [];

    if (capRate) {
      recommendations.push(
        `Cap rate: ${(capRate.capRate * 100).toFixed(2)}% - ${capRate.interpretation}`
      );
    }

    if (cashOnCash) {
      recommendations.push(
        `Cash-on-cash return: ${(cashOnCash.cashOnCashReturn * 100).toFixed(2)}% - ${cashOnCash.interpretation}`
      );
    }

    if (irr) {
      recommendations.push(`IRR: ${(irr.irr * 100).toFixed(2)}% - ${irr.interpretation}`);
    }

    if (cashFlow && cashFlow.monthlyCashFlow < 0) {
      recommendations.push(
        'Negative cash flow - ensure you can cover shortfall or rely on appreciation'
      );
    }

    if (propertyInfo) {
      recommendations.push(
        `Property type: ${propertyInfo.propertyType} - consider market conditions for this asset class`
      );
    }

    return recommendations;
  }
}
