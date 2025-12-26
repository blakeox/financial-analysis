/**
 * HELOC (Home Equity Line of Credit) Analyzer
 * Comprehensive analysis of HELOC vs refinancing and other options
 */

import { Decimal } from 'decimal.js';
import type { HELOCInput } from '../schemas/heloc.js';

export class HELOCAnalyzer {
  /**
   * Analyze HELOC options and compare to alternatives
   */
  static analyze(input: HELOCInput): unknown {
    const propertyInfo = input.propertyInfo;
    const helocDetails = input.helocDetails;
    const usage = input.usage;
    const comparison = input.comparison;

    // Calculate available equity
    const availableEquity = propertyInfo.currentHomeValue - propertyInfo.currentMortgageBalance;
    const equityPercentage = (availableEquity / propertyInfo.currentHomeValue) * 100;

    // Calculate HELOC payments
    const helocAnalysis = this.calculateHELOCPayments(helocDetails, usage);

    // Calculate interest-only vs amortizing payments
    const paymentScenarios = this.calculatePaymentScenarios(helocDetails, usage);

    // Tax implications (HELOC interest may be deductible)
    const taxAnalysis = this.calculateTaxImplications(helocAnalysis, usage);

    // Compare to refinancing
    const refinancingComparison = comparison.compareToRefinancing
      ? this.compareToRefinancing(propertyInfo, helocDetails, usage, comparison.newMortgageRate)
      : undefined;

    // Compare to personal loan
    const personalLoanComparison = comparison.compareToPersonalLoan
      ? this.compareToPersonalLoan(helocDetails, usage, comparison.personalLoanRate)
      : undefined;

    // Risk assessment
    const riskAssessment = this.assessRisks(availableEquity, helocDetails, propertyInfo);

    // Recommendations
    const recommendations = this.generateRecommendations(
      helocAnalysis,
      riskAssessment,
      usage,
      refinancingComparison,
      personalLoanComparison
    );

    return {
      summary: {
        availableEquity,
        equityPercentage,
        helocCreditLimit: helocDetails.creditLimit,
        monthlyPayment: helocAnalysis.monthlyPayment,
        totalInterest: helocAnalysis.totalInterest,
        totalCost: helocAnalysis.totalCost,
      },
      helocAnalysis,
      paymentScenarios,
      taxAnalysis,
      refinancingComparison,
      personalLoanComparison,
      riskAssessment,
      recommendations,
    };
  }

  private static calculateHELOCPayments(
    helocDetails: HELOCInput['helocDetails'],
    usage: HELOCInput['usage']
  ): {
    monthlyPayment: number;
    totalInterest: number;
    totalCost: number;
    interestOnlyPayment: number;
    amortizingPayment: number;
  } {
    const principal = usage.drawAmount;
    const annualRate = helocDetails.interestRate;
    const monthlyRate = annualRate / 12;

    // Interest-only payment during draw period
    const interestOnlyPayment = principal * monthlyRate;

    // Amortizing payment after draw period
    const repaymentMonths = helocDetails.repaymentPeriod * 12;
    const onePlusR = new Decimal(1).plus(monthlyRate);
    const onePlusRPowN = onePlusR.pow(repaymentMonths);
    const numerator = new Decimal(monthlyRate).times(onePlusRPowN);
    const denominator = onePlusRPowN.minus(1);
    const amortizingPayment = new Decimal(principal).times(numerator).div(denominator).toNumber();

    // Total interest over life of loan
    const totalPayments = amortizingPayment * repaymentMonths;
    const totalInterest = totalPayments - principal;
    const totalCost =
      totalPayments +
      helocDetails.annualFee * (helocDetails.drawPeriod + helocDetails.repaymentPeriod);

    return {
      monthlyPayment: amortizingPayment,
      totalInterest,
      totalCost,
      interestOnlyPayment,
      amortizingPayment,
    };
  }

  private static calculatePaymentScenarios(
    helocDetails: HELOCInput['helocDetails'],
    usage: HELOCInput['usage']
  ): {
    interestOnly: {
      drawPeriodPayment: number;
      totalDrawPeriodInterest: number;
    };
    amortizing: {
      monthlyPayment: number;
      totalInterest: number;
    };
    interestOnlyThenAmortizing: {
      drawPeriodPayment: number;
      repaymentPeriodPayment: number;
      totalInterest: number;
    };
  } {
    const principal = usage.drawAmount;
    const annualRate = helocDetails.interestRate;
    const monthlyRate = annualRate / 12;

    // Interest-only during draw period
    const interestOnlyPayment = principal * monthlyRate;
    const drawPeriodMonths = helocDetails.drawPeriod * 12;
    const totalDrawPeriodInterest = interestOnlyPayment * drawPeriodMonths;

    // Amortizing from start
    const repaymentMonths = helocDetails.repaymentPeriod * 12;
    const onePlusR = new Decimal(1).plus(monthlyRate);
    const onePlusRPowN = onePlusR.pow(repaymentMonths);
    const numerator = new Decimal(monthlyRate).times(onePlusRPowN);
    const denominator = onePlusRPowN.minus(1);
    const amortizingPayment = new Decimal(principal).times(numerator).div(denominator).toNumber();
    const totalAmortizingInterest = amortizingPayment * repaymentMonths - principal;

    // Interest-only then amortizing
    const remainingBalanceAfterDraw = principal + totalDrawPeriodInterest;
    const onePlusRPowN2 = onePlusR.pow(repaymentMonths);
    const numerator2 = new Decimal(monthlyRate).times(onePlusRPowN2);
    const denominator2 = onePlusRPowN2.minus(1);
    const repaymentPayment = new Decimal(remainingBalanceAfterDraw)
      .times(numerator2)
      .div(denominator2)
      .toNumber();
    const totalInterestIOThenAmort =
      totalDrawPeriodInterest + (repaymentPayment * repaymentMonths - remainingBalanceAfterDraw);

    return {
      interestOnly: {
        drawPeriodPayment: interestOnlyPayment,
        totalDrawPeriodInterest,
      },
      amortizing: {
        monthlyPayment: amortizingPayment,
        totalInterest: totalAmortizingInterest,
      },
      interestOnlyThenAmortizing: {
        drawPeriodPayment: interestOnlyPayment,
        repaymentPeriodPayment: repaymentPayment,
        totalInterest: totalInterestIOThenAmort,
      },
    };
  }

  private static calculateTaxImplications(
    helocAnalysis: { totalInterest: number },
    usage: HELOCInput['usage']
  ): {
    deductibleInterest: number;
    taxSavings: number;
    afterTaxCost: number;
    note: string;
  } {
    // HELOC interest is only deductible if used for home improvement (2018 tax law)
    const isDeductible = usage.purpose === 'home-improvement';
    const deductibleInterest = isDeductible ? helocAnalysis.totalInterest : 0;
    const taxSavings = deductibleInterest * 0.25; // Assuming 25% tax bracket
    const afterTaxCost = helocAnalysis.totalInterest - taxSavings;

    return {
      deductibleInterest,
      taxSavings,
      afterTaxCost,
      note: isDeductible
        ? 'HELOC interest is tax-deductible when used for home improvements'
        : 'HELOC interest is NOT tax-deductible for this purpose (2018 tax law)',
    };
  }

  private static compareToRefinancing(
    propertyInfo: HELOCInput['propertyInfo'],
    helocDetails: HELOCInput['helocDetails'],
    usage: HELOCInput['usage'],
    newMortgageRate?: number
  ): {
    cashOutRefinance: {
      newLoanAmount: number;
      newMonthlyPayment: number;
      totalInterest: number;
      closingCosts: number;
      breakEvenMonths: number;
    };
    comparison: {
      helocAdvantage: number;
      refinancingAdvantage: number;
      recommendation: string;
    };
  } {
    if (!newMortgageRate) {
      newMortgageRate = propertyInfo.mortgageInterestRate * 0.95; // Assume 5% better rate
    }

    const cashOutAmount = usage.drawAmount;
    const newLoanAmount = propertyInfo.currentMortgageBalance + cashOutAmount;
    const newTerm = 30; // Assume 30-year refinance
    const monthlyRate = newMortgageRate / 12;
    const termMonths = newTerm * 12;

    const onePlusR = new Decimal(1).plus(monthlyRate);
    const onePlusRPowN = onePlusR.pow(termMonths);
    const numerator = new Decimal(monthlyRate).times(onePlusRPowN);
    const denominator = onePlusRPowN.minus(1);
    const newMonthlyPayment = new Decimal(newLoanAmount)
      .times(numerator)
      .div(denominator)
      .toNumber();

    const totalPayments = newMonthlyPayment * termMonths;
    const totalInterest = totalPayments - newLoanAmount;
    const closingCosts = newLoanAmount * 0.03; // Assume 3% closing costs

    // Current mortgage payment
    const currentMonthlyRate = propertyInfo.mortgageInterestRate / 12;
    const currentTermMonths = propertyInfo.yearsRemaining * 12;
    const currentOnePlusR = new Decimal(1).plus(currentMonthlyRate);
    const currentOnePlusRPowN = currentOnePlusR.pow(currentTermMonths);
    const currentNumerator = new Decimal(currentMonthlyRate).times(currentOnePlusRPowN);
    const currentDenominator = currentOnePlusRPowN.minus(1);
    const currentPayment = new Decimal(propertyInfo.currentMortgageBalance)
      .times(currentNumerator)
      .div(currentDenominator)
      .toNumber();

    const paymentIncrease = newMonthlyPayment - currentPayment;
    const helocPayment = this.calculateHELOCPayments(helocDetails, usage).monthlyPayment;
    const helocAdvantage = newMonthlyPayment - (currentPayment + helocPayment);
    const refinancingAdvantage = helocPayment - paymentIncrease;

    // Break-even: months to recover closing costs
    const monthlySavings = currentPayment - newMonthlyPayment;
    const breakEvenMonths = monthlySavings > 0 ? closingCosts / monthlySavings : 999;

    return {
      cashOutRefinance: {
        newLoanAmount,
        newMonthlyPayment,
        totalInterest,
        closingCosts,
        breakEvenMonths,
      },
      comparison: {
        helocAdvantage: helocAdvantage > 0 ? helocAdvantage : 0,
        refinancingAdvantage: refinancingAdvantage > 0 ? refinancingAdvantage : 0,
        recommendation:
          helocAdvantage > 0
            ? 'HELOC may be more cost-effective than cash-out refinancing'
            : 'Cash-out refinancing may provide better terms, especially if you can get a lower rate',
      },
    };
  }

  private static compareToPersonalLoan(
    helocDetails: HELOCInput['helocDetails'],
    usage: HELOCInput['usage'],
    personalLoanRate?: number
  ): {
    personalLoan: {
      monthlyPayment: number;
      totalInterest: number;
      totalCost: number;
    };
    comparison: {
      helocAdvantage: number;
      personalLoanAdvantage: number;
      recommendation: string;
    };
  } {
    if (!personalLoanRate) {
      personalLoanRate = helocDetails.interestRate * 1.5; // Personal loans typically higher
    }

    const principal = usage.drawAmount;
    const term = 5; // Assume 5-year personal loan
    const monthlyRate = personalLoanRate / 12;
    const termMonths = term * 12;

    const onePlusR = new Decimal(1).plus(monthlyRate);
    const onePlusRPowN = onePlusR.pow(termMonths);
    const numerator = new Decimal(monthlyRate).times(onePlusRPowN);
    const denominator = onePlusRPowN.minus(1);
    const monthlyPayment = new Decimal(principal).times(numerator).div(denominator).toNumber();

    const totalPayments = monthlyPayment * termMonths;
    const totalInterest = totalPayments - principal;
    const totalCost = totalPayments;

    const helocCost = this.calculateHELOCPayments(helocDetails, usage).totalCost;
    const helocAdvantage = totalCost - helocCost;
    const personalLoanAdvantage = helocCost - totalCost;

    return {
      personalLoan: {
        monthlyPayment,
        totalInterest,
        totalCost,
      },
      comparison: {
        helocAdvantage: helocAdvantage > 0 ? helocAdvantage : 0,
        personalLoanAdvantage: personalLoanAdvantage > 0 ? personalLoanAdvantage : 0,
        recommendation:
          helocAdvantage > 0
            ? 'HELOC typically offers lower rates and more flexibility than personal loans'
            : 'Personal loan may be simpler and faster, but usually at higher rates',
      },
    };
  }

  private static assessRisks(
    availableEquity: number,
    helocDetails: HELOCInput['helocDetails'],
    propertyInfo: HELOCInput['propertyInfo']
  ): {
    overallRisk: 'low' | 'medium' | 'high';
    riskFactors: Array<{
      factor: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
    mitigations: string[];
  } {
    const riskFactors: Array<{
      factor: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }> = [];

    // Equity risk
    const equityRatio = availableEquity / propertyInfo.currentHomeValue;
    if (equityRatio < 0.2) {
      riskFactors.push({
        factor: 'Low Equity',
        severity: 'high',
        description: 'Less than 20% equity - limited buffer if property value declines',
      });
    } else if (equityRatio < 0.3) {
      riskFactors.push({
        factor: 'Moderate Equity',
        severity: 'medium',
        description: 'Between 20-30% equity - monitor property values closely',
      });
    }

    // Credit limit risk
    if (helocDetails.creditLimit > availableEquity * 0.8) {
      riskFactors.push({
        factor: 'High Credit Limit',
        severity: 'medium',
        description: 'Credit limit approaches available equity - risk of over-leveraging',
      });
    }

    // Variable rate risk
    riskFactors.push({
      factor: 'Variable Interest Rate',
      severity: 'medium',
      description: 'HELOC rates are variable and can increase with market rates',
    });

    // Payment shock risk
    const helocPayment = this.calculateHELOCPayments(helocDetails, {
      purpose: helocDetails.creditLimit > 0 ? 'other' : 'other',
      drawAmount: helocDetails.creditLimit,
      drawTiming: 'immediate',
    }).monthlyPayment;

    if (helocPayment > propertyInfo.currentHomeValue * 0.01) {
      riskFactors.push({
        factor: 'High Payment Relative to Property Value',
        severity: 'medium',
        description: 'HELOC payments may strain cash flow',
      });
    }

    // Determine overall risk
    const highRiskCount = riskFactors.filter((r) => r.severity === 'high').length;
    const mediumRiskCount = riskFactors.filter((r) => r.severity === 'medium').length;
    let overallRisk: 'low' | 'medium' | 'high';
    if (highRiskCount > 0) {
      overallRisk = 'high';
    } else if (mediumRiskCount >= 2) {
      overallRisk = 'medium';
    } else {
      overallRisk = 'low';
    }

    // Generate mitigations
    const mitigations: string[] = [];
    if (equityRatio < 0.3) {
      mitigations.push('Build more equity before taking HELOC to reduce risk');
    }
    if (helocDetails.creditLimit > availableEquity * 0.8) {
      mitigations.push('Consider a lower credit limit to maintain equity buffer');
    }
    mitigations.push('Monitor interest rates and consider locking in rate if available');
    mitigations.push('Have a repayment plan before drawing on HELOC');

    return {
      overallRisk,
      riskFactors,
      mitigations,
    };
  }

  private static generateRecommendations(
    helocAnalysis: { totalCost: number; monthlyPayment: number },
    riskAssessment: { overallRisk: string },
    usage: HELOCInput['usage'],
    refinancingComparison?: { comparison: { recommendation: string } },
    personalLoanComparison?: { comparison: { recommendation: string } }
  ): string[] {
    const recommendations: string[] = [];

    if (refinancingComparison) {
      recommendations.push(refinancingComparison.comparison.recommendation);
    }

    if (personalLoanComparison) {
      recommendations.push(personalLoanComparison.comparison.recommendation);
    }

    if (riskAssessment.overallRisk === 'high') {
      recommendations.push('High risk assessment - consider alternatives or reduce HELOC amount');
    }

    if (usage.purpose === 'home-improvement') {
      recommendations.push(
        'HELOC interest may be tax-deductible for home improvements - consult tax advisor'
      );
    } else {
      recommendations.push(
        'HELOC interest is NOT tax-deductible for this purpose - consider tax implications'
      );
    }

    recommendations.push(
      `Total cost of HELOC: $${helocAnalysis.totalCost.toFixed(0)} over loan term`
    );
    recommendations.push(
      `Monthly payment: $${helocAnalysis.monthlyPayment.toFixed(0)} during repayment period`
    );

    return recommendations;
  }
}
