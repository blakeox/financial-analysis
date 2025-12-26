/**
 * LBO (Leveraged Buyout) Model
 * Analyze LBO transactions, returns, and exit scenarios
 */

import { Decimal } from 'decimal.js';
import type { LBOInput } from '../schemas/lbo.js';

export class LBOModel {
  /**
   * Analyze LBO transaction
   */
  static analyze(input: LBOInput): unknown {
    const targetCompany = input.targetCompany;
    const transaction = input.transaction;
    const financing = input.financing;
    const projections = input.projections;
    const analysis = input.analysis;

    // Calculate initial metrics
    const initialMetrics = this.calculateInitialMetrics(targetCompany, transaction);

    // Calculate debt service
    const debtService = this.calculateDebtService(financing);

    // Project cash flows
    const cashFlowProjections = this.projectCashFlows(
      targetCompany,
      projections,
      debtService,
      financing
    );

    // Calculate exit value
    const exitValue = this.calculateExitValue(targetCompany, projections, cashFlowProjections);

    // Calculate returns
    const returns =
      analysis.includeIRR || analysis.includeMOIC
        ? this.calculateReturns(
            transaction,
            exitValue,
            cashFlowProjections,
            projections.holdingPeriod
          )
        : undefined;

    // Debt paydown analysis
    const debtPaydown = analysis.includeDebtPaydown
      ? this.analyzeDebtPaydown(financing, cashFlowProjections)
      : undefined;

    // Exit scenarios
    const exitScenarios = analysis.includeExitScenarios
      ? this.analyzeExitScenarios(targetCompany, projections, cashFlowProjections, transaction)
      : undefined;

    // Risk assessment
    const riskAssessment = this.assessRisks(initialMetrics, debtService, cashFlowProjections);

    // Recommendations
    const recommendations = this.generateRecommendations(returns, riskAssessment, initialMetrics);

    return {
      summary: {
        purchasePrice: transaction.purchasePrice,
        equityContribution: transaction.equityContribution,
        debtAmount: transaction.debtAmount,
        leverage: initialMetrics.leverage,
        irr: returns?.irr,
        moic: returns?.moic,
        exitValue: exitValue.exitValue,
      },
      initialMetrics,
      debtService,
      cashFlowProjections,
      exitValue,
      returns,
      debtPaydown,
      exitScenarios,
      riskAssessment,
      recommendations,
    };
  }

  private static calculateInitialMetrics(
    targetCompany: LBOInput['targetCompany'],
    transaction: LBOInput['transaction']
  ): {
    purchaseMultiple: number;
    leverage: number;
    debtToEBITDA: number;
    equityMultiple: number;
  } {
    const purchaseMultiple =
      targetCompany.ebitda > 0 ? transaction.purchasePrice / targetCompany.ebitda : 0;
    const leverage =
      transaction.equityContribution > 0
        ? transaction.debtAmount / transaction.equityContribution
        : 999;
    const debtToEBITDA =
      targetCompany.ebitda > 0 ? transaction.debtAmount / targetCompany.ebitda : 999;
    const equityMultiple =
      transaction.equityContribution > 0
        ? transaction.purchasePrice / transaction.equityContribution
        : 0;

    return {
      purchaseMultiple,
      leverage,
      debtToEBITDA,
      equityMultiple,
    };
  }

  private static calculateDebtService(financing: LBOInput['financing']): {
    seniorDebtService: number;
    mezzanineDebtService: number;
    totalDebtService: number;
  } {
    // Senior debt payment
    const seniorMonthlyRate = financing.seniorDebt.interestRate / 12;
    const seniorMonths = financing.seniorDebt.term * 12;
    const seniorOnePlusR = new Decimal(1).plus(seniorMonthlyRate);
    const seniorOnePlusRPowN = seniorOnePlusR.pow(seniorMonths);
    const seniorNumerator = new Decimal(seniorMonthlyRate).times(seniorOnePlusRPowN);
    const seniorDenominator = seniorOnePlusRPowN.minus(1);
    const seniorMonthlyPayment = new Decimal(financing.seniorDebt.amount)
      .times(seniorNumerator)
      .div(seniorDenominator)
      .toNumber();
    const seniorDebtService = seniorMonthlyPayment * 12;

    // Mezzanine debt payment
    let mezzanineDebtService = 0;
    if (financing.mezzanineDebt.amount > 0) {
      const mezzMonthlyRate = financing.mezzanineDebt.interestRate / 12;
      const mezzMonths = financing.mezzanineDebt.term * 12;
      const mezzOnePlusR = new Decimal(1).plus(mezzMonthlyRate);
      const mezzOnePlusRPowN = mezzOnePlusR.pow(mezzMonths);
      const mezzNumerator = new Decimal(mezzMonthlyRate).times(mezzOnePlusRPowN);
      const mezzDenominator = mezzOnePlusRPowN.minus(1);
      const mezzMonthlyPayment = new Decimal(financing.mezzanineDebt.amount)
        .times(mezzNumerator)
        .div(mezzDenominator)
        .toNumber();
      mezzanineDebtService = mezzMonthlyPayment * 12;
    }

    return {
      seniorDebtService,
      mezzanineDebtService,
      totalDebtService: seniorDebtService + mezzanineDebtService,
    };
  }

  private static projectCashFlows(
    targetCompany: LBOInput['targetCompany'],
    projections: LBOInput['projections'],
    debtService: { totalDebtService: number },
    _financing: LBOInput['financing']
  ): Array<{
    year: number;
    ebitda: number;
    revenue: number;
    debtService: number;
    freeCashFlow: number;
    cumulativeCashFlow: number;
  }> {
    const cashFlowProjections: Array<{
      year: number;
      ebitda: number;
      revenue: number;
      debtService: number;
      freeCashFlow: number;
      cumulativeCashFlow: number;
    }> = [];

    let ebitda = targetCompany.ebitda;
    let revenue = targetCompany.revenue;
    let cumulativeCashFlow = 0;

    for (let year = 1; year <= projections.holdingPeriod; year++) {
      ebitda = ebitda * (1 + projections.ebitdaGrowth);
      revenue = revenue * (1 + projections.revenueGrowth);
      const freeCashFlow = ebitda - debtService.totalDebtService;
      cumulativeCashFlow += freeCashFlow;

      cashFlowProjections.push({
        year,
        ebitda,
        revenue,
        debtService: debtService.totalDebtService,
        freeCashFlow,
        cumulativeCashFlow,
      });
    }

    return cashFlowProjections;
  }

  private static calculateExitValue(
    targetCompany: LBOInput['targetCompany'],
    projections: LBOInput['projections'],
    cashFlowProjections: Array<{ ebitda: number }>
  ): {
    exitEBITDA: number;
    exitMultiple: number;
    exitValue: number;
    netExitValue: number;
  } {
    const finalYear = cashFlowProjections[cashFlowProjections.length - 1];
    const exitEBITDA =
      finalYear?.ebitda ||
      targetCompany.ebitda * Math.pow(1 + projections.ebitdaGrowth, projections.holdingPeriod);
    const exitValue = exitEBITDA * projections.exitMultiple;
    const netExitValue = exitValue; // Simplified - would subtract remaining debt

    return {
      exitEBITDA,
      exitMultiple: projections.exitMultiple,
      exitValue,
      netExitValue,
    };
  }

  private static calculateReturns(
    transaction: LBOInput['transaction'],
    exitValue: { netExitValue: number },
    cashFlowProjections: Array<{ freeCashFlow: number }>,
    holdingPeriod: number
  ): {
    irr: number;
    moic: number;
    totalReturn: number;
  } {
    const totalCashFlows = cashFlowProjections.reduce((sum, cf) => sum + cf.freeCashFlow, 0);
    const totalReturn = exitValue.netExitValue + totalCashFlows - transaction.equityContribution;
    const moic =
      transaction.equityContribution > 0
        ? (exitValue.netExitValue + totalCashFlows) / transaction.equityContribution
        : 0;

    // Simplified IRR calculation
    const irr =
      transaction.equityContribution > 0
        ? Math.pow(
            (exitValue.netExitValue + totalCashFlows) / transaction.equityContribution,
            1 / holdingPeriod
          ) - 1
        : 0;

    return {
      irr: Math.max(0, Math.min(irr, 1)), // Cap between 0 and 100%
      moic,
      totalReturn,
    };
  }

  private static analyzeDebtPaydown(
    financing: LBOInput['financing'],
    cashFlowProjections: Array<{ freeCashFlow: number; year: number }>
  ): {
    remainingDebt: Array<{
      year: number;
      seniorDebt: number;
      mezzanineDebt: number;
      totalDebt: number;
    }>;
    debtPaydown: number;
  } {
    let seniorDebt = financing.seniorDebt.amount;
    let mezzanineDebt = financing.mezzanineDebt.amount;
    const remainingDebt: Array<{
      year: number;
      seniorDebt: number;
      mezzanineDebt: number;
      totalDebt: number;
    }> = [];

    cashFlowProjections.forEach((cf) => {
      // Apply free cash flow to debt paydown
      const availableForPaydown = Math.max(0, cf.freeCashFlow);
      seniorDebt = Math.max(0, seniorDebt - availableForPaydown * 0.7); // 70% to senior
      mezzanineDebt = Math.max(0, mezzanineDebt - availableForPaydown * 0.3); // 30% to mezz

      remainingDebt.push({
        year: cf.year,
        seniorDebt,
        mezzanineDebt,
        totalDebt: seniorDebt + mezzanineDebt,
      });
    });

    const initialDebt = financing.seniorDebt.amount + financing.mezzanineDebt.amount;
    const finalDebt = remainingDebt[remainingDebt.length - 1]?.totalDebt || 0;
    const debtPaydown = initialDebt - finalDebt;

    return {
      remainingDebt,
      debtPaydown,
    };
  }

  private static analyzeExitScenarios(
    targetCompany: LBOInput['targetCompany'],
    projections: LBOInput['projections'],
    cashFlowProjections: Array<{ ebitda: number }>,
    _transaction: LBOInput['transaction']
  ): {
    base: { exitValue: number; irr: number; moic: number };
    optimistic: { exitValue: number; irr: number; moic: number };
    pessimistic: { exitValue: number; irr: number; moic: number };
  } {
    const finalEBITDA =
      cashFlowProjections[cashFlowProjections.length - 1]?.ebitda || targetCompany.ebitda;

    const base = {
      exitValue: finalEBITDA * projections.exitMultiple,
      irr: 0.25, // Simplified
      moic: 2.5, // Simplified
    };

    const optimistic = {
      exitValue: finalEBITDA * projections.exitMultiple * 1.2,
      irr: 0.35,
      moic: 3.5,
    };

    const pessimistic = {
      exitValue: finalEBITDA * projections.exitMultiple * 0.8,
      irr: 0.15,
      moic: 1.5,
    };

    return {
      base,
      optimistic,
      pessimistic,
    };
  }

  private static assessRisks(
    initialMetrics: { debtToEBITDA: number; leverage: number },
    _debtService: { totalDebtService: number },
    cashFlowProjections: Array<{ freeCashFlow: number }>
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

    if (initialMetrics.debtToEBITDA > 6) {
      riskFactors.push({
        factor: 'High Debt-to-EBITDA',
        severity: 'high',
        description: `Debt-to-EBITDA of ${initialMetrics.debtToEBITDA.toFixed(1)}x is very high`,
      });
    } else if (initialMetrics.debtToEBITDA > 4) {
      riskFactors.push({
        factor: 'Moderate Debt-to-EBITDA',
        severity: 'medium',
        description: `Debt-to-EBITDA of ${initialMetrics.debtToEBITDA.toFixed(1)}x requires strong cash flow`,
      });
    }

    if (initialMetrics.leverage > 5) {
      riskFactors.push({
        factor: 'High Leverage',
        severity: 'high',
        description: `Leverage of ${initialMetrics.leverage.toFixed(1)}x is very aggressive`,
      });
    }

    const negativeCashFlowYears = cashFlowProjections.filter((cf) => cf.freeCashFlow < 0).length;
    if (negativeCashFlowYears > 0) {
      riskFactors.push({
        factor: 'Negative Cash Flow Periods',
        severity: 'medium',
        description: `${negativeCashFlowYears} years with negative free cash flow`,
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

  private static generateRecommendations(
    returns?: { irr: number; moic: number },
    riskAssessment?: { overallRisk: string },
    initialMetrics?: { leverage: number }
  ): string[] {
    const recommendations: string[] = [];

    if (returns) {
      recommendations.push(
        `IRR: ${(returns.irr * 100).toFixed(1)}% - ${returns.irr >= 0.25 ? 'Strong returns' : returns.irr >= 0.15 ? 'Good returns' : 'Moderate returns'}`
      );
      recommendations.push(
        `MOIC: ${returns.moic.toFixed(2)}x - ${returns.moic >= 2.5 ? 'Excellent multiple' : returns.moic >= 2.0 ? 'Good multiple' : 'Moderate multiple'}`
      );
    }

    if (riskAssessment && riskAssessment.overallRisk === 'high') {
      recommendations.push(
        'High risk transaction - ensure strong operational improvements and exit strategy'
      );
    }

    if (initialMetrics && initialMetrics.leverage > 5) {
      recommendations.push(
        'Very high leverage - focus on rapid debt paydown and operational efficiency'
      );
    }

    return recommendations;
  }
}
