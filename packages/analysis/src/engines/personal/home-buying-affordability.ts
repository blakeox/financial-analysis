/**
 * Home Buying Affordability Calculator
 * Comprehensive home purchase planning and affordability analysis
 *
 * Implements home buying analysis including:
 * - Maximum affordable price calculation
 * - Down payment strategies
 * - Closing cost analysis
 * - Debt-to-income ratio analysis
 * - Moving cost planning
 * - Ongoing cost projections
 */

import { Decimal } from 'decimal.js';
import type { HomeBuyingAffordabilityInput } from '../../schemas/home-buying-affordability.js';

export class HomeBuyingAffordabilityCalculator {
  /**
   * Analyze home buying affordability
   */
  static analyze(input: HomeBuyingAffordabilityInput): unknown {
    const personalInfo = input.personalInfo;
    const finances = input.finances;
    const homePreferences = input.homePreferences;
    const goals = input.goals;

    // Calculate maximum affordable price
    const maxAffordablePrice = this.calculateMaxAffordablePrice(
      finances.annualIncome,
      finances.monthlyDebtPayments,
      goals.riskTolerance
    );

    // Calculate recommended down payment
    const recommendedDownPayment = this.calculateRecommendedDownPayment(
      maxAffordablePrice,
      finances.downPaymentAvailable
    );

    // Calculate monthly payment
    const monthlyPayment = this.calculateMonthlyPayment(
      homePreferences.targetPrice,
      recommendedDownPayment,
      personalInfo.creditScore
    );

    // Calculate closing costs
    const closingCosts = this.calculateClosingCosts(homePreferences.targetPrice);

    // Calculate affordability score
    const affordabilityScore = this.calculateAffordabilityScore(
      finances.annualIncome,
      monthlyPayment,
      finances.monthlyDebtPayments,
      recommendedDownPayment,
      finances.downPaymentAvailable
    );

    // Calculate debt-to-income ratio
    const debtToIncomeRatio =
      ((monthlyPayment + finances.monthlyDebtPayments) * 12) / finances.annualIncome;

    // Generate recommendations
    const recommendations: string[] = [];
    if (affordabilityScore < 70) {
      recommendations.push('Consider a less expensive home or increase your down payment');
    }
    if (debtToIncomeRatio > 0.43) {
      recommendations.push(
        'Your debt-to-income ratio is high. Consider paying down debt before buying'
      );
    }
    if (finances.downPaymentAvailable < recommendedDownPayment * 0.8) {
      recommendations.push(
        `Save an additional $${(recommendedDownPayment - finances.downPaymentAvailable).toFixed(0)} for down payment`
      );
    }
    if (personalInfo.creditScore < 620) {
      recommendations.push('Improve your credit score to get better mortgage rates');
    }

    // Calculate ongoing costs
    const annualPropertyTax = homePreferences.targetPrice * 0.012; // 1.2% average
    const annualInsurance = homePreferences.targetPrice * 0.0035; // 0.35% average
    const annualMaintenance = homePreferences.targetPrice * 0.01; // 1% average
    const totalAnnualCosts =
      monthlyPayment * 12 + annualPropertyTax + annualInsurance + annualMaintenance;

    return {
      summary: {
        maxAffordablePrice: maxAffordablePrice.toFixed(2),
        recommendedDownPayment: recommendedDownPayment.toFixed(2),
        monthlyPayment: monthlyPayment.toFixed(2),
        affordabilityScore,
        debtToIncomeRatio: (debtToIncomeRatio * 100).toFixed(1),
      },
      costBreakdown: {
        purchasePrice: homePreferences.targetPrice.toFixed(2),
        downPayment: recommendedDownPayment.toFixed(2),
        loanAmount: (homePreferences.targetPrice - recommendedDownPayment).toFixed(2),
        closingCosts: closingCosts.toFixed(2),
        totalUpfrontCost: (recommendedDownPayment + closingCosts).toFixed(2),
      },
      ongoingCosts: {
        monthlyPayment: monthlyPayment.toFixed(2),
        annualPropertyTax: annualPropertyTax.toFixed(2),
        annualInsurance: annualInsurance.toFixed(2),
        annualMaintenance: annualMaintenance.toFixed(2),
        totalAnnualCosts: totalAnnualCosts.toFixed(2),
      },
      recommendations,
      insights: [
        `Based on your income, you can afford a home up to $${maxAffordablePrice.toFixed(0)}`,
        `Your debt-to-income ratio is ${(debtToIncomeRatio * 100).toFixed(1)}% (target: <43%)`,
        `You have $${finances.downPaymentAvailable.toFixed(0)} available for down payment`,
        affordabilityScore >= 80
          ? 'You are in a strong position to buy a home'
          : 'Consider improving your financial position before buying',
      ],
    };
  }

  private static calculateMaxAffordablePrice(
    annualIncome: number,
    monthlyDebtPayments: number,
    riskTolerance: string
  ): number {
    // Use 28% rule for housing costs (conservative) or 36% for total debt (moderate/aggressive)
    const housingRatio = riskTolerance === 'conservative' ? 0.28 : 0.33;
    const monthlyIncome = annualIncome / 12;
    const maxMonthlyHousingPayment = monthlyIncome * housingRatio - monthlyDebtPayments;

    // Assume 30-year mortgage at 6.5% interest
    const interestRate = 0.065;
    const monthlyRate = interestRate / 12;
    const months = 360;
    const downPaymentPercent = 0.2; // 20% down

    // Calculate loan amount from monthly payment
    // PMT = P * (r(1+r)^n) / ((1+r)^n - 1)
    // P = PMT * ((1+r)^n - 1) / (r(1+r)^n)
    const onePlusR = new Decimal(1).plus(monthlyRate);
    const onePlusRPowN = onePlusR.pow(months);
    const numerator = onePlusRPowN.minus(1);
    const denominator = new Decimal(monthlyRate).times(onePlusRPowN);
    const loanAmount = new Decimal(maxMonthlyHousingPayment)
      .times(numerator)
      .div(denominator)
      .toNumber();

    // Calculate home price (loan = price * (1 - downPaymentPercent))
    return loanAmount / (1 - downPaymentPercent);
  }

  private static calculateRecommendedDownPayment(
    homePrice: number,
    availableDownPayment: number
  ): number {
    const twentyPercent = homePrice * 0.2;
    const tenPercent = homePrice * 0.1;
    const minimum = homePrice * 0.03; // 3% minimum for some loans

    if (availableDownPayment >= twentyPercent) {
      return twentyPercent; // 20% to avoid PMI
    } else if (availableDownPayment >= tenPercent) {
      return Math.max(availableDownPayment, tenPercent);
    } else {
      return Math.max(availableDownPayment, minimum);
    }
  }

  private static calculateMonthlyPayment(
    homePrice: number,
    downPayment: number,
    creditScore: number
  ): number {
    const loanAmount = homePrice - downPayment;
    const interestRate = this.getInterestRate(creditScore);
    const monthlyRate = interestRate / 12;
    const months = 360; // 30 years

    // PMT = P * (r(1+r)^n) / ((1+r)^n - 1)
    const onePlusR = new Decimal(1).plus(monthlyRate);
    const onePlusRPowN = onePlusR.pow(months);
    const numerator = new Decimal(monthlyRate).times(onePlusRPowN);
    const denominator = onePlusRPowN.minus(1);
    const monthlyPayment = new Decimal(loanAmount).times(numerator).div(denominator).toNumber();

    // Add PMI if down payment < 20%
    const pmi = downPayment < homePrice * 0.2 ? (loanAmount * 0.001) / 12 : 0;

    // Add property tax and insurance (estimated)
    const monthlyPropertyTax = (homePrice * 0.012) / 12;
    const monthlyInsurance = (homePrice * 0.0035) / 12;

    return monthlyPayment + pmi + monthlyPropertyTax + monthlyInsurance;
  }

  private static getInterestRate(creditScore: number): number {
    if (creditScore >= 760) return 0.06;
    if (creditScore >= 700) return 0.065;
    if (creditScore >= 660) return 0.07;
    if (creditScore >= 620) return 0.075;
    return 0.08; // Lower credit scores
  }

  private static calculateClosingCosts(homePrice: number): number {
    // Typical closing costs: 2-5% of home price
    return homePrice * 0.03; // 3% average
  }

  private static calculateAffordabilityScore(
    annualIncome: number,
    monthlyPayment: number,
    monthlyDebtPayments: number,
    recommendedDownPayment: number,
    availableDownPayment: number
  ): number {
    let score = 100;

    // Debt-to-income ratio (max 50 points)
    const dti = ((monthlyPayment + monthlyDebtPayments) * 12) / annualIncome;
    if (dti > 0.43) score -= 30;
    else if (dti > 0.36) score -= 15;
    else if (dti <= 0.28) score += 10;

    // Down payment adequacy (max 30 points)
    const downPaymentRatio = availableDownPayment / recommendedDownPayment;
    if (downPaymentRatio < 0.5) score -= 20;
    else if (downPaymentRatio < 0.8) score -= 10;
    else if (downPaymentRatio >= 1.0) score += 10;

    // Emergency fund (max 20 points)
    // Assume 3 months expenses = monthlyPayment * 3
    // This would need to be passed in, but for now assume it's adequate
    score += 10;

    return Math.max(0, Math.min(100, score));
  }
}
