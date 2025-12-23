/**
 * Project Finance Analyzer
 * NPV, IRR, Payback period, and sensitivity analysis for capital projects
 */

import type { ProjectFinanceInput } from '../../schemas/project-finance.js';

export class ProjectFinanceAnalyzer {
  /**
   * Analyze project finance metrics
   */
  static analyze(input: ProjectFinanceInput): unknown {
    const projectInfo = input.projectInfo;
    const cashFlows = input.cashFlows;
    const financing = input.financing;
    const analysis = input.analysis;

    // Calculate WACC
    const wacc = this.calculateWACC(financing);
    const discountRate = analysis.discountRate || wacc;

    // Calculate free cash flows
    const freeCashFlows = this.calculateFreeCashFlows(cashFlows, financing);

    // NPV calculation
    const npv = analysis.includeNPV ? this.calculateNPV(freeCashFlows, discountRate) : undefined;

    // IRR calculation
    const irr = analysis.includeIRR ? this.calculateIRR(freeCashFlows) : undefined;

    // Payback analysis
    const payback = analysis.includePayback
      ? this.calculatePayback(freeCashFlows, cashFlows.initialInvestment)
      : undefined;

    // Sensitivity analysis
    const sensitivity = analysis.includeSensitivity
      ? this.performSensitivityAnalysis(cashFlows, financing, discountRate)
      : undefined;

    // Risk assessment
    const riskAssessment = this.assessProjectRisks(npv, irr, payback, projectInfo);

    // Recommendations
    const recommendations = this.generateRecommendations(npv, irr, payback, riskAssessment);

    return {
      summary: {
        npv: npv?.npv,
        irr: irr?.irr,
        paybackPeriod: payback?.simplePayback,
        discountedPayback: payback?.discountedPayback,
        wacc,
        projectViability: this.assessViability(npv, irr, discountRate),
      },
      wacc,
      freeCashFlows,
      npv,
      irr,
      payback,
      sensitivity,
      riskAssessment,
      recommendations,
    };
  }

  private static calculateWACC(financing: ProjectFinanceInput['financing']): number {
    const equityWeight = financing.equityPercentage / 100;
    const debtWeight = financing.debtPercentage / 100;
    const afterTaxCostOfDebt = financing.costOfDebt * (1 - financing.taxRate);
    const wacc = equityWeight * financing.costOfEquity + debtWeight * afterTaxCostOfDebt;
    return wacc;
  }

  private static calculateFreeCashFlows(
    cashFlows: ProjectFinanceInput['cashFlows'],
    financing: ProjectFinanceInput['financing']
  ): Array<{
    year: number;
    revenue: number;
    operatingExpenses: number;
    ebitda: number;
    taxes: number;
    netOperatingCashFlow: number;
    capitalExpenditures: number;
    workingCapital: number;
    freeCashFlow: number;
  }> {
    return cashFlows.annualCashFlows.map((cf) => {
      const ebitda = cf.revenue - cf.operatingExpenses;
      const taxes = ebitda * financing.taxRate;
      const netOperatingCashFlow = ebitda - taxes;
      const freeCashFlow = netOperatingCashFlow - cf.capitalExpenditures - cf.workingCapital;

      return {
        year: cf.year,
        revenue: cf.revenue,
        operatingExpenses: cf.operatingExpenses,
        ebitda,
        taxes,
        netOperatingCashFlow,
        capitalExpenditures: cf.capitalExpenditures,
        workingCapital: cf.workingCapital,
        freeCashFlow,
      };
    });
  }

  private static calculateNPV(
    freeCashFlows: Array<{ year: number; freeCashFlow: number }>,
    discountRate: number
  ): {
    npv: number;
    presentValues: Array<{ year: number; cashFlow: number; presentValue: number }>;
  } {
    let npv = 0;
    const presentValues: Array<{ year: number; cashFlow: number; presentValue: number }> = [];

    freeCashFlows.forEach((cf) => {
      const presentValue = cf.freeCashFlow / Math.pow(1 + discountRate, cf.year);
      npv += presentValue;
      presentValues.push({
        year: cf.year,
        cashFlow: cf.freeCashFlow,
        presentValue,
      });
    });

    return {
      npv,
      presentValues,
    };
  }

  private static calculateIRR(freeCashFlows: Array<{ year: number; freeCashFlow: number }>): {
    irr: number;
    iterations: number;
  } {
    // Use Newton-Raphson method to find IRR
    let irr = 0.1; // Initial guess
    const maxIterations = 100;
    const tolerance = 0.0001;
    let iterations = 0;

    for (let i = 0; i < maxIterations; i++) {
      iterations = i + 1;
      let npv = 0;
      let npvDerivative = 0;

      freeCashFlows.forEach((cf) => {
        const discountFactor = Math.pow(1 + irr, cf.year);
        npv += cf.freeCashFlow / discountFactor;
        npvDerivative -= (cf.year * cf.freeCashFlow) / (discountFactor * (1 + irr));
      });

      if (Math.abs(npv) < tolerance) {
        break;
      }

      if (Math.abs(npvDerivative) < tolerance) {
        break;
      }

      irr = irr - npv / npvDerivative;

      if (irr < 0 || irr > 10) {
        irr = 0.1; // Reset if out of bounds
        break;
      }
    }

    return {
      irr: Math.max(0, Math.min(irr, 1)), // Cap between 0 and 100%
      iterations,
    };
  }

  private static calculatePayback(
    freeCashFlows: Array<{ year: number; freeCashFlow: number }>,
    initialInvestment: number
  ): {
    simplePayback: number;
    discountedPayback: number;
    paybackAnalysis: Array<{
      year: number;
      cumulativeCashFlow: number;
      cumulativeDiscountedCashFlow: number;
    }>;
  } {
    let cumulativeCashFlow = -initialInvestment;
    let cumulativeDiscountedCashFlow = -initialInvestment;
    let simplePayback = 0;
    let discountedPayback = 0;
    const discountRate = 0.1; // Assume 10% for discounted payback

    const paybackAnalysis: Array<{
      year: number;
      cumulativeCashFlow: number;
      cumulativeDiscountedCashFlow: number;
    }> = [];

    freeCashFlows.forEach((cf) => {
      cumulativeCashFlow += cf.freeCashFlow;
      const discountedCF = cf.freeCashFlow / Math.pow(1 + discountRate, cf.year);
      cumulativeDiscountedCashFlow += discountedCF;

      paybackAnalysis.push({
        year: cf.year,
        cumulativeCashFlow,
        cumulativeDiscountedCashFlow,
      });

      if (simplePayback === 0 && cumulativeCashFlow >= 0) {
        // Interpolate for more precise payback
        const prevYear = cf.year - 1;
        const prevCF =
          paybackAnalysis[paybackAnalysis.length - 2]?.cumulativeCashFlow || -initialInvestment;
        const yearFraction = prevCF < 0 ? (0 - prevCF) / (cumulativeCashFlow - prevCF) : 0;
        simplePayback = prevYear + yearFraction;
      }

      if (discountedPayback === 0 && cumulativeDiscountedCashFlow >= 0) {
        const prevYear = cf.year - 1;
        const prevDCF =
          paybackAnalysis[paybackAnalysis.length - 2]?.cumulativeDiscountedCashFlow ||
          -initialInvestment;
        const yearFraction =
          prevDCF < 0 ? (0 - prevDCF) / (cumulativeDiscountedCashFlow - prevDCF) : 0;
        discountedPayback = prevYear + yearFraction;
      }
    });

    return {
      simplePayback: simplePayback || freeCashFlows.length,
      discountedPayback: discountedPayback || freeCashFlows.length,
      paybackAnalysis,
    };
  }

  private static performSensitivityAnalysis(
    cashFlows: ProjectFinanceInput['cashFlows'],
    financing: ProjectFinanceInput['financing'],
    baseDiscountRate: number
  ): {
    revenueSensitivity: Array<{ change: number; npv: number; irr: number }>;
    costSensitivity: Array<{ change: number; npv: number; irr: number }>;
    discountRateSensitivity: Array<{ discountRate: number; npv: number }>;
  } {
    const revenueSensitivity: Array<{ change: number; npv: number; irr: number }> = [];
    const costSensitivity: Array<{ change: number; npv: number; irr: number }> = [];
    const discountRateSensitivity: Array<{ discountRate: number; npv: number }> = [];

    // Revenue sensitivity (-20% to +20%)
    for (let change = -0.2; change <= 0.2; change += 0.05) {
      const modifiedCashFlows = cashFlows.annualCashFlows.map((cf) => ({
        ...cf,
        revenue: cf.revenue * (1 + change),
      }));

      const freeCFs = this.calculateFreeCashFlows(
        { ...cashFlows, annualCashFlows: modifiedCashFlows },
        financing
      );
      const npv = this.calculateNPV(freeCFs, baseDiscountRate);
      const irr = this.calculateIRR(freeCFs);

      revenueSensitivity.push({
        change: change * 100,
        npv: npv.npv,
        irr: irr.irr,
      });
    }

    // Cost sensitivity
    for (let change = -0.2; change <= 0.2; change += 0.05) {
      const modifiedCashFlows = cashFlows.annualCashFlows.map((cf) => ({
        ...cf,
        operatingExpenses: cf.operatingExpenses * (1 + change),
      }));

      const freeCFs = this.calculateFreeCashFlows(
        { ...cashFlows, annualCashFlows: modifiedCashFlows },
        financing
      );
      const npv = this.calculateNPV(freeCFs, baseDiscountRate);
      const irr = this.calculateIRR(freeCFs);

      costSensitivity.push({
        change: change * 100,
        npv: npv.npv,
        irr: irr.irr,
      });
    }

    // Discount rate sensitivity
    for (
      let rate = baseDiscountRate * 0.5;
      rate <= baseDiscountRate * 1.5;
      rate += baseDiscountRate * 0.1
    ) {
      const freeCFs = this.calculateFreeCashFlows(cashFlows, financing);
      const npv = this.calculateNPV(freeCFs, rate);

      discountRateSensitivity.push({
        discountRate: rate,
        npv: npv.npv,
      });
    }

    return {
      revenueSensitivity,
      costSensitivity,
      discountRateSensitivity,
    };
  }

  private static assessProjectRisks(
    npv?: { npv: number },
    irr?: { irr: number },
    payback?: { simplePayback: number },
    _projectInfo?: ProjectFinanceInput['projectInfo']
  ): {
    overallRisk: 'low' | 'medium' | 'high';
    riskFactors: Array<{
      factor: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
  } {
    const riskFactors: Array<{
      factor: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }> = [];

    if (npv && npv.npv < 0) {
      riskFactors.push({
        factor: 'Negative NPV',
        severity: 'high',
        description: 'Project has negative net present value - may not be financially viable',
      });
    }

    if (irr && irr.irr < 0.1) {
      riskFactors.push({
        factor: 'Low IRR',
        severity: 'medium',
        description: `IRR of ${(irr.irr * 100).toFixed(1)}% may be below required return`,
      });
    }

    if (payback && payback.simplePayback > 10) {
      riskFactors.push({
        factor: 'Long Payback Period',
        severity: 'medium',
        description: `Payback period of ${payback.simplePayback.toFixed(1)} years is quite long`,
      });
    }

    const overallRisk =
      riskFactors.filter((r) => r.severity === 'high').length > 0
        ? 'high'
        : riskFactors.filter((r) => r.severity === 'medium').length >= 2
          ? 'medium'
          : 'low';

    return {
      overallRisk,
      riskFactors,
    };
  }

  private static assessViability(
    npv?: { npv: number },
    irr?: { irr: number },
    discountRate: number = 0.1
  ): 'viable' | 'marginal' | 'not-viable' {
    if (!npv || !irr) return 'marginal';

    if (npv.npv > 0 && irr.irr > discountRate) {
      return 'viable';
    } else if (npv.npv < 0 || irr.irr < discountRate * 0.8) {
      return 'not-viable';
    } else {
      return 'marginal';
    }
  }

  private static generateRecommendations(
    npv?: { npv: number },
    irr?: { irr: number },
    payback?: { simplePayback: number },
    riskAssessment?: { overallRisk: string }
  ): string[] {
    const recommendations: string[] = [];

    if (npv && npv.npv > 0) {
      recommendations.push(
        `Positive NPV of $${npv.npv.toFixed(0)} indicates project creates value`
      );
    } else if (npv && npv.npv < 0) {
      recommendations.push(
        `Negative NPV of $${npv.npv.toFixed(0)} - project may not be financially viable`
      );
    }

    if (irr) {
      recommendations.push(
        `IRR of ${(irr.irr * 100).toFixed(1)}% - compare to required return/hurdle rate`
      );
    }

    if (payback) {
      recommendations.push(`Payback period: ${payback.simplePayback.toFixed(1)} years`);
    }

    if (riskAssessment && riskAssessment.overallRisk === 'high') {
      recommendations.push(
        'High risk project - consider risk mitigation strategies or alternative projects'
      );
    }

    return recommendations;
  }
}
