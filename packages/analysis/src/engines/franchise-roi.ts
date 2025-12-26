/**
 * Franchise ROI Calculator
 * Analyze franchise investment returns and profitability
 */

import type { FranchiseROIInput } from '../schemas/franchise-roi.js';

export class FranchiseROICalculator {
  /**
   * Analyze franchise ROI
   */
  static analyze(input: FranchiseROIInput): unknown {
    const initialInvestment = input.initialInvestment;
    const ongoingCosts = input.ongoingCosts;
    const revenueProjections = input.revenueProjections;
    const exitStrategy = input.exitStrategy;
    const analysis = input.analysis;

    // Calculate cash flows
    const cashFlows = this.calculateCashFlows(
      initialInvestment,
      ongoingCosts,
      revenueProjections,
      analysis
    );

    // ROI analysis
    const roiAnalysis = analysis.includeROI
      ? this.calculateROI(initialInvestment, cashFlows, exitStrategy)
      : undefined;

    // Payback period
    const paybackPeriod = analysis.includePaybackPeriod
      ? this.calculatePaybackPeriod(initialInvestment, cashFlows)
      : undefined;

    // NPV and IRR
    const npv = analysis.includeNPV
      ? this.calculateNPV(cashFlows, 0.1)
      : undefined;
    const irr = analysis.includeIRR
      ? this.calculateIRR(cashFlows)
      : undefined;

    // Break-even analysis
    const breakEven = analysis.includeBreakEven
      ? this.calculateBreakEven(ongoingCosts, revenueProjections)
      : undefined;

    // Sensitivity analysis
    const sensitivity = analysis.includeSensitivityAnalysis
      ? this.performSensitivityAnalysis(initialInvestment, ongoingCosts, revenueProjections)
      : undefined;

    // Recommendations
    const recommendations = this.generateRecommendations(
      roiAnalysis,
      paybackPeriod,
      npv,
      irr,
      breakEven
    );

    return {
      summary: {
        totalInvestment: initialInvestment.totalInvestment,
        totalROI: roiAnalysis?.totalROI || 0,
        paybackPeriod: paybackPeriod?.years || 0,
        npv: npv || 0,
        irr: irr || 0,
        breakEvenYear: breakEven?.year || 0,
      },
      cashFlows,
      roiAnalysis,
      paybackPeriod,
      npv,
      irr,
      breakEven,
      sensitivity,
      recommendations,
    };
  }

  private static calculateCashFlows(
    initial: FranchiseROIInput['initialInvestment'],
    ongoing: FranchiseROIInput['ongoingCosts'],
    revenue: FranchiseROIInput['revenueProjections'],
    _analysis: FranchiseROIInput['analysis']
  ): {
    annualCashFlows: Array<{ year: number; revenue: number; expenses: number; netCashFlow: number; cumulativeCashFlow: number }>;
  } {
    const cashFlows: Array<{ year: number; revenue: number; expenses: number; netCashFlow: number; cumulativeCashFlow: number }> = [];
    let cumulativeCashFlow = -initial.totalInvestment;

    for (let year = 1; year <= revenue.revenueProjectionYears; year++) {
      const yearRevenue = revenue.firstYearRevenue * Math.pow(1 + revenue.revenueGrowthRate, year - 1);
      const royaltyFee = yearRevenue * ongoing.royaltyFee;
      const marketingFee = yearRevenue * ongoing.marketingFee;
      const totalExpenses = royaltyFee + marketingFee + ongoing.annualOperatingExpenses + ongoing.annualRent + ongoing.annualUtilities + ongoing.annualInsurance + ongoing.annualSalaries;
      const netCashFlow = yearRevenue - totalExpenses;
      cumulativeCashFlow += netCashFlow;

      cashFlows.push({
        year,
        revenue: yearRevenue,
        expenses: totalExpenses,
        netCashFlow,
        cumulativeCashFlow,
      });
    }

    return {
      annualCashFlows: cashFlows,
    };
  }

  private static calculateROI(
    initial: FranchiseROIInput['initialInvestment'],
    cashFlows: { annualCashFlows: Array<{ netCashFlow: number }> },
    exit: FranchiseROIInput['exitStrategy']
  ): {
    totalROI: number;
    annualizedROI: number;
    totalReturn: number;
  } {
    const totalCashFlow = cashFlows.annualCashFlows.reduce((sum, cf) => sum + cf.netCashFlow, 0);
    const exitValue = exit.expectedExitValue;
    const totalReturn = totalCashFlow + exitValue;
    const totalROI = ((totalReturn - initial.totalInvestment) / initial.totalInvestment) * 100;
    const annualizedROI = (Math.pow(totalReturn / initial.totalInvestment, 1 / exit.expectedExitYear) - 1) * 100;

    return {
      totalROI,
      annualizedROI,
      totalReturn,
    };
  }

  private static calculatePaybackPeriod(
    _initial: FranchiseROIInput['initialInvestment'],
    cashFlows: { annualCashFlows: Array<{ year: number; cumulativeCashFlow: number }> }
  ): {
    years: number;
    months: number;
  } {
    const paybackYear = cashFlows.annualCashFlows.find((cf) => cf.cumulativeCashFlow >= 0);
    const years = paybackYear?.year || 999;
    const months = Math.ceil((years - 1) * 12);

    return { years, months };
  }

  private static calculateNPV(
    cashFlows: { annualCashFlows: Array<{ netCashFlow: number }> },
    discountRate: number
  ): number {
    let npv = 0;
    cashFlows.annualCashFlows.forEach((cf, index) => {
      npv += cf.netCashFlow / Math.pow(1 + discountRate, index + 1);
    });
    return npv;
  }

  private static calculateIRR(
    cashFlows: { annualCashFlows: Array<{ netCashFlow: number }> }
  ): number {
    // Simplified IRR calculation using trial and error
    let irr = 0.1;
    const maxIterations = 100;
    const tolerance = 0.0001;

    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      cashFlows.annualCashFlows.forEach((cf, index) => {
        npv += cf.netCashFlow / Math.pow(1 + irr, index + 1);
      });

      if (Math.abs(npv) < tolerance) break;

      // Newton-Raphson approximation
      let npvDerivative = 0;
      cashFlows.annualCashFlows.forEach((cf, index) => {
        npvDerivative -= (cf.netCashFlow * (index + 1)) / Math.pow(1 + irr, index + 2);
      });

      if (Math.abs(npvDerivative) > 0.0001) {
        irr = irr - npv / npvDerivative;
      } else {
        irr += 0.01;
      }

      irr = Math.max(0, Math.min(1, irr)); // Clamp between 0 and 100%
    }

    return irr * 100;
  }

  private static calculateBreakEven(
    ongoing: FranchiseROIInput['ongoingCosts'],
    revenue: FranchiseROIInput['revenueProjections']
  ): {
    year: number;
    monthlyRevenue: number;
    breakEvenRevenue: number;
  } {
    const fixedCosts = ongoing.annualOperatingExpenses + ongoing.annualRent + ongoing.annualUtilities + ongoing.annualInsurance + ongoing.annualSalaries;
    const variableCostRate = ongoing.royaltyFee + ongoing.marketingFee;
    const breakEvenRevenue = fixedCosts / (1 - variableCostRate);

    // Find year when revenue exceeds break-even
    let year = 1;
    while (year <= revenue.revenueProjectionYears) {
      const yearRevenue = revenue.firstYearRevenue * Math.pow(1 + revenue.revenueGrowthRate, year - 1);
      if (yearRevenue >= breakEvenRevenue) {
        break;
      }
      year++;
    }

    return {
      year: year <= revenue.revenueProjectionYears ? year : 999,
      monthlyRevenue: breakEvenRevenue / 12,
      breakEvenRevenue,
    };
  }

  private static performSensitivityAnalysis(
    initial: FranchiseROIInput['initialInvestment'],
    ongoing: FranchiseROIInput['ongoingCosts'],
    revenue: FranchiseROIInput['revenueProjections']
  ): {
    scenarios: Array<{ scenario: string; npv: number; irr: number }>;
  } {
    const baseCashFlows = this.calculateCashFlows(initial, ongoing, revenue, { includeROI: true, includePaybackPeriod: true, includeNPV: true, includeIRR: true, includeBreakEven: true, includeSensitivityAnalysis: false });
    const baseNPV = this.calculateNPV(baseCashFlows, 0.1);
    const baseIRR = this.calculateIRR(baseCashFlows);

    const scenarios = [
      {
        scenario: 'Base Case',
        npv: baseNPV,
        irr: baseIRR,
      },
      {
        scenario: 'Optimistic (+20% Revenue)',
        npv: this.calculateNPV(this.calculateCashFlows(initial, ongoing, { ...revenue, firstYearRevenue: revenue.firstYearRevenue * 1.2 }, { includeROI: true, includePaybackPeriod: true, includeNPV: true, includeIRR: true, includeBreakEven: true, includeSensitivityAnalysis: false }), 0.1),
        irr: this.calculateIRR(this.calculateCashFlows(initial, ongoing, { ...revenue, firstYearRevenue: revenue.firstYearRevenue * 1.2 }, { includeROI: true, includePaybackPeriod: true, includeNPV: true, includeIRR: true, includeBreakEven: true, includeSensitivityAnalysis: false })),
      },
      {
        scenario: 'Pessimistic (-20% Revenue)',
        npv: this.calculateNPV(this.calculateCashFlows(initial, ongoing, { ...revenue, firstYearRevenue: revenue.firstYearRevenue * 0.8 }, { includeROI: true, includePaybackPeriod: true, includeNPV: true, includeIRR: true, includeBreakEven: true, includeSensitivityAnalysis: false }), 0.1),
        irr: this.calculateIRR(this.calculateCashFlows(initial, ongoing, { ...revenue, firstYearRevenue: revenue.firstYearRevenue * 0.8 }, { includeROI: true, includePaybackPeriod: true, includeNPV: true, includeIRR: true, includeBreakEven: true, includeSensitivityAnalysis: false })),
      },
    ];

    return { scenarios };
  }

  private static generateRecommendations(
    roi: { totalROI: number } | undefined,
    payback: { years: number } | undefined,
    npv: number | undefined,
    irr: number | undefined,
    breakEven: { year: number } | undefined
  ): string[] {
    const recommendations: string[] = [];

    if (roi) {
      recommendations.push(`Total ROI: ${roi.totalROI.toFixed(2)}%`);
    }

    if (payback) {
      recommendations.push(`Payback period: ${payback.years} years`);
    }

    if (npv !== undefined) {
      recommendations.push(`NPV: $${npv.toFixed(0)}`);
      if (npv > 0) {
        recommendations.push('Positive NPV indicates good investment');
      }
    }

    if (irr !== undefined) {
      recommendations.push(`IRR: ${irr.toFixed(2)}%`);
      if (irr > 15) {
        recommendations.push('Strong IRR indicates attractive returns');
      }
    }

    if (breakEven) {
      recommendations.push(`Break-even year: ${breakEven.year}`);
    }

    return recommendations;
  }
}



