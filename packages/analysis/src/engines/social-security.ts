/**
 * Social Security Optimizer
 * Comprehensive Social Security claiming strategy analysis
 */

import type { SocialSecurityInput } from '../schemas/social-security.js';

export class SocialSecurityOptimizer {
  /**
   * Analyze Social Security claiming strategies and optimize benefits
   */
  static analyze(input: SocialSecurityInput): unknown {
    const personalInfo = input.personalInfo;
    const earnings = input.earnings;
    const maritalStatus = input.maritalStatus;
    const spouseInfo = input.spouseInfo;
    const claimingStrategy = input.claimingStrategy;
    const goals = input.goals;

    // Calculate Primary Insurance Amount (PIA)
    const pia = this.calculatePIA(earnings);

    // Calculate benefit at different claiming ages
    const benefitScenarios = this.calculateBenefitScenarios(
      pia,
      personalInfo.fullRetirementAge,
      personalInfo.currentAge,
      personalInfo.lifeExpectancy
    );

    // Calculate lifetime benefits for each scenario
    const lifetimeBenefits = this.calculateLifetimeBenefits(
      benefitScenarios,
      personalInfo.currentAge,
      personalInfo.lifeExpectancy
    );

    // Spousal benefits analysis
    const spousalBenefits =
      spouseInfo && maritalStatus === 'married'
        ? this.calculateSpousalBenefits(pia, spouseInfo, claimingStrategy)
        : undefined;

    // Survivor benefits analysis
    const survivorBenefits =
      spouseInfo && maritalStatus === 'married'
        ? this.calculateSurvivorBenefits(pia, spouseInfo, personalInfo)
        : undefined;

    // Break-even analysis
    const breakEvenAnalysis = goals.includeBreakEvenAnalysis
      ? this.calculateBreakEvenAnalysis(benefitScenarios, personalInfo.currentAge)
      : undefined;

    // Optimal strategy recommendation
    const optimalStrategy = this.recommendOptimalStrategy(
      lifetimeBenefits,
      benefitScenarios,
      goals,
      spousalBenefits,
      survivorBenefits
    );

    return {
      summary: {
        primaryInsuranceAmount: pia,
        fullRetirementAge: personalInfo.fullRetirementAge,
        optimalClaimingAge: optimalStrategy.optimalAge,
        maximumLifetimeBenefit: optimalStrategy.maximumLifetimeBenefit,
        breakEvenAge: breakEvenAnalysis?.breakEvenAge,
      },
      benefitScenarios,
      lifetimeBenefits,
      spousalBenefits,
      survivorBenefits,
      breakEvenAnalysis,
      optimalStrategy,
      recommendations: this.generateRecommendations(
        optimalStrategy,
        benefitScenarios,
        goals,
        spousalBenefits,
        survivorBenefits
      ),
    };
  }

  private static calculatePIA(earnings: SocialSecurityInput['earnings']): number {
    // Simplified PIA calculation
    // In reality, this uses the 35 highest earning years, indexed for inflation
    const averageIndexedMonthlyEarnings = earnings.averageLifetimeEarnings
      ? earnings.averageLifetimeEarnings / 12
      : earnings.currentAnnualEarnings / 12;

    // 2024 bend points (simplified)
    const bendPoint1 = 1115;
    const bendPoint2 = 6721;

    let pia = 0;
    if (averageIndexedMonthlyEarnings <= bendPoint1) {
      pia = averageIndexedMonthlyEarnings * 0.9;
    } else if (averageIndexedMonthlyEarnings <= bendPoint2) {
      pia = bendPoint1 * 0.9 + (averageIndexedMonthlyEarnings - bendPoint1) * 0.32;
    } else {
      pia =
        bendPoint1 * 0.9 +
        (bendPoint2 - bendPoint1) * 0.32 +
        (averageIndexedMonthlyEarnings - bendPoint2) * 0.15;
    }

    return Math.min(pia, 3822); // Maximum PIA for 2024
  }

  private static calculateBenefitScenarios(
    pia: number,
    fullRetirementAge: number,
    _currentAge: number,
    _lifeExpectancy: number
  ): Array<{
    claimingAge: number;
    monthlyBenefit: number;
    reductionFactor: number;
    increaseFactor: number;
  }> {
    const scenarios: Array<{
      claimingAge: number;
      monthlyBenefit: number;
      reductionFactor: number;
      increaseFactor: number;
    }> = [];

    for (let age = 62; age <= 70; age++) {
      let monthlyBenefit = pia;
      let reductionFactor = 1;
      let increaseFactor = 1;

      if (age < fullRetirementAge) {
        // Early claiming reduction: ~6.67% per year before FRA
        const monthsEarly = (fullRetirementAge - age) * 12;
        reductionFactor = 1 - monthsEarly * 0.00556; // ~5.56% per month
        monthlyBenefit = pia * reductionFactor;
      } else if (age > fullRetirementAge) {
        // Delayed claiming increase: 8% per year after FRA
        const monthsDelayed = (age - fullRetirementAge) * 12;
        increaseFactor = 1 + monthsDelayed * 0.00667; // ~0.667% per month
        monthlyBenefit = pia * increaseFactor;
      }

      scenarios.push({
        claimingAge: age,
        monthlyBenefit,
        reductionFactor,
        increaseFactor,
      });
    }

    return scenarios;
  }

  private static calculateLifetimeBenefits(
    scenarios: Array<{ claimingAge: number; monthlyBenefit: number }>,
    _currentAge: number,
    lifeExpectancy: number
  ): Array<{
    claimingAge: number;
    totalLifetimeBenefit: number;
    yearsOfBenefits: number;
  }> {
    return scenarios.map((scenario) => {
      const yearsOfBenefits = lifeExpectancy - scenario.claimingAge;
      const totalLifetimeBenefit = scenario.monthlyBenefit * 12 * yearsOfBenefits;

      return {
        claimingAge: scenario.claimingAge,
        totalLifetimeBenefit,
        yearsOfBenefits,
      };
    });
  }

  private static calculateSpousalBenefits(
    primaryPIA: number,
    spouseInfo: NonNullable<SocialSecurityInput['spouseInfo']>,
    claimingStrategy: SocialSecurityInput['claimingStrategy']
  ): {
    spousalBenefit: number;
    maximumSpousalBenefit: number;
    claimingAge: number;
  } {
    // Spousal benefit is 50% of primary earner's PIA (at FRA)
    const maximumSpousalBenefit = primaryPIA * 0.5;
    const spousePIA = this.calculatePIA({
      currentAnnualEarnings: spouseInfo.currentAnnualEarnings,
      averageLifetimeEarnings: spouseInfo.averageLifetimeEarnings,
    });

    // Spouse gets the higher of their own benefit or spousal benefit
    const spousalBenefit = Math.max(spousePIA, maximumSpousalBenefit);

    return {
      spousalBenefit,
      maximumSpousalBenefit,
      claimingAge: claimingStrategy.spouseClaimingAge || spouseInfo.fullRetirementAge,
    };
  }

  private static calculateSurvivorBenefits(
    primaryPIA: number,
    spouseInfo: NonNullable<SocialSecurityInput['spouseInfo']>,
    personalInfo: SocialSecurityInput['personalInfo']
  ): {
    // Note: currentAge from personalInfo is not used in calculation but kept for potential future use
    survivorBenefit: number;
    claimingAge: number;
    totalLifetimeSurvivorBenefit: number;
  } {
    // Survivor gets 100% of deceased spouse's benefit
    const survivorBenefit = primaryPIA;
    const claimingAge = Math.max(60, spouseInfo.currentAge); // Earliest survivor can claim is 60

    const yearsOfBenefits = personalInfo.lifeExpectancy - claimingAge;
    const totalLifetimeSurvivorBenefit = survivorBenefit * 12 * yearsOfBenefits;

    return {
      survivorBenefit,
      claimingAge,
      totalLifetimeSurvivorBenefit,
    };
  }

  private static calculateBreakEvenAnalysis(
    scenarios: Array<{ claimingAge: number; monthlyBenefit: number }>,
    _currentAge: number
  ): {
    breakEvenAge: number;
    breakEvenAnalysis: Array<{
      age: number;
      earlyClaimingTotal: number;
      delayedClaimingTotal: number;
      difference: number;
    }>;
  } {
    const earlyScenario = scenarios.find((s) => s.claimingAge === 62);
    const delayedScenario = scenarios.find((s) => s.claimingAge === 70);

    if (!earlyScenario || !delayedScenario) {
      return {
        breakEvenAge: 0,
        breakEvenAnalysis: [],
      };
    }

    const analysis: Array<{
      age: number;
      earlyClaimingTotal: number;
      delayedClaimingTotal: number;
      difference: number;
    }> = [];

    let breakEvenAge = 0;

    for (let age = 62; age <= 85; age++) {
      const earlyMonths = Math.max(0, (age - 62) * 12);
      const delayedMonths = Math.max(0, (age - 70) * 12);

      const earlyClaimingTotal = earlyScenario.monthlyBenefit * earlyMonths;
      const delayedClaimingTotal = delayedScenario.monthlyBenefit * delayedMonths;
      const difference = delayedClaimingTotal - earlyClaimingTotal;

      analysis.push({
        age,
        earlyClaimingTotal,
        delayedClaimingTotal,
        difference,
      });

      if (breakEvenAge === 0 && difference > 0) {
        breakEvenAge = age;
      }
    }

    return {
      breakEvenAge: breakEvenAge || 80,
      breakEvenAnalysis: analysis,
    };
  }

  private static recommendOptimalStrategy(
    lifetimeBenefits: Array<{ claimingAge: number; totalLifetimeBenefit: number }>,
    benefitScenarios: Array<{ claimingAge: number; monthlyBenefit: number }>,
    goals: SocialSecurityInput['goals'],
    _spousalBenefits?: { spousalBenefit: number },
    survivorBenefits?: { totalLifetimeSurvivorBenefit: number }
  ): {
    optimalAge: number;
    maximumLifetimeBenefit: number;
    maximumMonthlyBenefit: number;
    strategy: string;
    reasoning: string;
  } {
    if (goals.optimizeFor === 'maximum-monthly') {
      const maxMonthly = benefitScenarios.reduce((max, s) =>
        s.monthlyBenefit > max.monthlyBenefit ? s : max
      );
      return {
        optimalAge: maxMonthly.claimingAge,
        maximumLifetimeBenefit:
          lifetimeBenefits.find((l) => l.claimingAge === maxMonthly.claimingAge)
            ?.totalLifetimeBenefit || 0,
        maximumMonthlyBenefit: maxMonthly.monthlyBenefit,
        strategy: 'Delayed claiming for maximum monthly benefit',
        reasoning:
          'Claiming at age 70 provides the highest monthly benefit, maximizing income in later years',
      };
    }

    if (goals.optimizeFor === 'survivor-benefits' && survivorBenefits) {
      return {
        optimalAge: 70,
        maximumLifetimeBenefit: survivorBenefits.totalLifetimeSurvivorBenefit,
        maximumMonthlyBenefit:
          benefitScenarios.find((s) => s.claimingAge === 70)?.monthlyBenefit || 0,
        strategy: 'Delayed claiming to maximize survivor benefits',
        reasoning:
          'Claiming at 70 maximizes the benefit that will transfer to your spouse as survivor benefits',
      };
    }

    // Default: maximize lifetime benefits
    const maxLifetime = lifetimeBenefits.reduce((max, l) =>
      l.totalLifetimeBenefit > max.totalLifetimeBenefit ? l : max
    );

    return {
      optimalAge: maxLifetime.claimingAge,
      maximumLifetimeBenefit: maxLifetime.totalLifetimeBenefit,
      maximumMonthlyBenefit:
        benefitScenarios.find((s) => s.claimingAge === maxLifetime.claimingAge)?.monthlyBenefit ||
        0,
      strategy:
        maxLifetime.claimingAge === 62
          ? 'Early claiming maximizes lifetime benefits'
          : maxLifetime.claimingAge === 70
            ? 'Delayed claiming maximizes lifetime benefits'
            : 'Full retirement age claiming balances monthly and lifetime benefits',
      reasoning:
        maxLifetime.claimingAge === 62
          ? 'If you expect to live an average lifespan, claiming early may provide more total benefits'
          : 'Delaying benefits increases monthly payments significantly, which can maximize lifetime benefits if you live longer',
    };
  }

  private static generateRecommendations(
    optimalStrategy: { optimalAge: number; strategy: string },
    benefitScenarios: Array<{ claimingAge: number; monthlyBenefit: number }>,
    _goals: SocialSecurityInput['goals'],
    spousalBenefits?: { spousalBenefit: number },
    survivorBenefits?: { totalLifetimeSurvivorBenefit: number }
  ): string[] {
    const recommendations: string[] = [];

    recommendations.push(
      `Optimal claiming age: ${optimalStrategy.optimalAge} - ${optimalStrategy.strategy}`
    );

    const earlyBenefit = benefitScenarios.find((s) => s.claimingAge === 62)?.monthlyBenefit || 0;
    const delayedBenefit = benefitScenarios.find((s) => s.claimingAge === 70)?.monthlyBenefit || 0;
    const difference = delayedBenefit - earlyBenefit;
    const percentIncrease = earlyBenefit > 0 ? (difference / earlyBenefit) * 100 : 0;

    recommendations.push(
      `Delaying from 62 to 70 increases monthly benefit by $${difference.toFixed(0)} (${percentIncrease.toFixed(0)}% increase)`
    );

    if (spousalBenefits) {
      recommendations.push(
        `Spousal benefits available: $${spousalBenefits.spousalBenefit.toFixed(0)}/month at full retirement age`
      );
    }

    if (survivorBenefits) {
      recommendations.push(
        `Survivor benefits can provide significant lifetime value: $${survivorBenefits.totalLifetimeSurvivorBenefit.toFixed(0)} total`
      );
    }

    if (optimalStrategy.optimalAge < 70) {
      recommendations.push(
        'Consider health and life expectancy - if you expect to live beyond average, delaying to 70 may be beneficial'
      );
    }

    return recommendations;
  }
}
