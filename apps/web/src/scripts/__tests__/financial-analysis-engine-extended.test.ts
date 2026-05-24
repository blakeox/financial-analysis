import { describe, expect, it } from 'vitest';
import { FinancialAnalysisEngine } from '../analysis/financial-analysis-engine';
import {
  analyzeBreakEvenFromResult,
  analyzeBusinessLoanQualifierFromResult,
  analyzeCreditCardPayoffFromResult,
  analyzeEbitdaForecastFromResult,
  analyzeEmergencyFundFromResult,
  analyze401kMatchFromResult,
  analyzeCapitalStructureFromResult,
  analyzeCharitableGivingFromResult,
  analyzeCreditScoreImpactFromResult,
  analyzeDepreciationFromResult,
  analyze1031ExchangeFromResult,
  analyzeBondPricingFromResult,
  analyzeBusinessExpansionLoanFromResult,
  analyzeBusinessFinancialHealthFromResult,
  analyzeAccountsPayableOptimizationFromResult,
  analyzeAccountsReceivableAgingFromResult,
  analyzeCashFlowFromResult,
  analyzeCcaValuationFromResult,
  analyzeEmployeeStockOptionsFromResult,
  analyzeInventoryOptimizationFromResult,
  analyzeBusinessSuccessionPlanningFromResult,
  analyzeFinancialJourneyFromResult,
  analyzeMultiModelScenarioFromResult,
  analyzeCreditRiskFromResult,
  analyzeEquipmentLeaseVsBuyFromResult,
  analyzeVarFromResult,
  analyzeCryptocurrencyTaxFromResult,
  analyzeInsuranceNeedsFromResult,
  analyzeInternationalTaxPlanningFromResult,
  analyzeLifeInsuranceReassessmentFromResult,
  analyzePortfolioOptimizationFromResult,
  analyzeTaxLossHarvestingFromResult,
  analyzeDscrFromResult,
  analyzeTaxOptimizationFromResult,
  analyzeWorkingCapitalFromResult,
  analyzeHelocFromResult,
  analyzeLboFromResult,
  analyzeRealEstateInvestmentFromResult,
  analyzeMortgageScenarioPlanningFromResult,
  analyzeRefinancingFromResult,
  analyzeSocialSecurityFromResult,
  analyzeRentVsBuyFromResult,
  analyzeRothVsTraditionalIraFromResult,
  analyzeSaasMetricsFromResult,
} from '../analysis/financial-analysis-engine-extended';

describe('financial-analysis-engine-extended', () => {
  it('analyzes SaaS metrics with insights', () => {
    const analysis = analyzeSaasMetricsFromResult({
      mrr: 50000,
      arr: 600000,
      ltvCacRatio: 2.5,
      churnRate: 3,
      paybackPeriod: 14,
      ruleOf40: 35,
      health: { grade: 'B', status: 'good', score: 72 },
      recommendations: ['Improve retention'],
    });

    expect(analysis.insights.length).toBeGreaterThan(0);
    expect(analysis.recommendations.length).toBeGreaterThan(0);
  });

  it('analyzes rent vs buy comparison', () => {
    const analysis = analyzeRentVsBuyFromResult({
      buy: { netPosition: 120000, equity: 80000 },
      rent: { netPosition: 90000, equity: 50000 },
      comparison: {
        difference: 30000,
        breakEvenYear: 5,
        recommendation: 'Buying may be favorable',
        factors: { costAdvantage: 'Buying' },
      },
    });

    expect(analysis.summary.buyNetPosition).toBe(120000);
    expect(analysis.insights.some((i) => i.title.includes('Net position'))).toBe(true);
  });

  it('routes extended model types through analyzeForModelType', () => {
    const credit = FinancialAnalysisEngine.analyzeForModelType('credit-card-payoff', {
      currentStrategy: { monthsToPayoff: 18, totalInterest: 2400 },
      recommendation: { bestStrategy: 'Aggressive', savings: 800 },
      utilization: { current: 45, after6Months: 20 },
      minimumOnly: { monthsToPayoff: 84, totalInterest: 9000 },
    });

    expect(credit.insights.length).toBeGreaterThan(0);

    const breakEven = analyzeBreakEvenFromResult({
      breakEven: {
        units: 500,
        revenue: 25000,
        contributionMarginRatio: 40,
        contributionMargin: 50,
      },
      marginOfSafety: { percentage: 15, units: 75 },
    });

    expect(breakEven.summary.breakEvenUnits).toBe(500);

    const card = analyzeCreditCardPayoffFromResult({
      currentStrategy: { monthsToPayoff: 12, totalInterest: 1000 },
      recommendation: { bestStrategy: 'Snowball', savings: 500 },
      utilization: { current: 30, after6Months: 15 },
      minimumOnly: { monthsToPayoff: 60, totalInterest: 5000 },
    });

    expect(card.summary.savings).toBe(500);
  });

  it('analyzes mortgage scenario comparison', () => {
    const analysis = analyzeMortgageScenarioPlanningFromResult({
      scenarios: [
        {
          name: '20% Down',
          totalCost: 420000,
          monthlyPaymentWithPMI: 2100,
          hasPMI: false,
        },
        {
          name: '10% Down',
          totalCost: 445000,
          monthlyPaymentWithPMI: 2350,
          hasPMI: true,
        },
      ],
    });

    expect(analysis.summary.bestScenario).toBe('20% Down');
    expect(analysis.insights.length).toBeGreaterThan(0);
  });

  it('analyzes EBITDA forecast summary', () => {
    const analysis = analyzeEbitdaForecastFromResult({
      summary: {
        totalRevenue: 1200000,
        totalEbitda: 240000,
        averageEbitdaMargin: 0.2,
        revenueGrowth: 0.08,
      },
      keyMetrics: { revenuePerEmployee: 150000 },
      scenario: { name: 'Baseline' },
    });

    expect(analysis.summary.totalEbitda).toBe(240000);
    expect(analysis.insights.length).toBeGreaterThan(0);
  });

  it('analyzes business loan qualifier DSCR', () => {
    const analysis = analyzeBusinessLoanQualifierFromResult({
      dscr: 1.4,
      bestOption: 'SBA 7(a)',
      estimatedMonthlyPayment: 3200,
      loanEligibility: {
        sba7a: { eligible: true },
        sba504: { eligible: false },
        bankTerm: { eligible: true },
        lineOfCredit: { eligible: false },
      },
      recommendations: [],
    });

    expect(analysis.summary.dscr).toBe(1.4);
  });

  it('analyzes Roth vs Traditional IRA comparison', () => {
    const analysis = analyzeRothVsTraditionalIraFromResult({
      comparison: {
        betterOption: 'roth',
        rothAfterTaxValue: 500000,
        traditionalAfterTaxValue: 450000,
        taxSavingsDifference: 50000,
      },
      recommendation: { recommendedAccount: 'roth', rationale: 'Lower tax in retirement.' },
    });

    expect(analysis.summary.recommendedAccount).toBe('roth');
  });

  it('analyzes emergency fund summary', () => {
    const analysis = analyzeEmergencyFundFromResult({
      summary: {
        targetFund: 30000,
        currentFund: 12000,
        shortfall: 18000,
        monthsToBuild: 18,
        onTrack: false,
      },
      recommendations: ['Increase monthly savings'],
    });

    expect(analysis.summary.targetFund).toBe(30000);
    expect(analysis.insights.length).toBeGreaterThan(0);
  });

  it('analyzes refinancing summary', () => {
    const analysis = analyzeRefinancingFromResult({
      summary: {
        monthlySavings: 350,
        netBenefit: 42000,
        breakEvenMonths: 14,
        totalInterestSavings: 55000,
        newMonthlyPayment: 2100,
      },
      recommendations: ['Proceed if you plan to stay past break-even'],
    });

    expect(analysis.summary.monthlySavings).toBe(350);
    expect(analysis.insights.some((i) => i.title.includes('Break-even'))).toBe(true);
  });

  it('analyzes HELOC summary', () => {
    const analysis = analyzeHelocFromResult({
      summary: {
        availableEquity: 180000,
        equityPercentage: 45,
        helocCreditLimit: 150000,
        monthlyPayment: 1200,
        totalCost: 95000,
      },
      recommendations: [],
    });

    expect(analysis.summary.availableEquity).toBe(180000);
    expect(analysis.insights.length).toBeGreaterThan(0);
  });

  it('analyzes DSCR result', () => {
    const analysis = analyzeDscrFromResult({
      ratio: 1.42,
      status: 'good',
      margin: 0.17,
      targetRatio: 1.25,
      recommendations: ['Good DSCR - acceptable for most lenders'],
    });

    expect(analysis.summary.ratio).toBe(1.42);
    expect(analysis.insights.length).toBeGreaterThan(0);
  });

  it('analyzes charitable giving tax savings', () => {
    const analysis = analyzeCharitableGivingFromResult({
      totalTaxSavings: 2200,
      optimalGivingStrategy: 'Donor-advised fund',
      projectedImpact: { immediateTaxBenefit: 2200 },
      recommendations: ['Bunch donations'],
    });

    expect(analysis.summary.totalTaxSavings).toBe(2200);
  });

  it('analyzes tax optimization summary', () => {
    const analysis = analyzeTaxOptimizationFromResult({
      taxSummary: {
        currentYearTaxSavings: 8500,
        projectedLongTermSavings: 42000,
        optimizationScore: 72,
      },
      capitalGainsOptimization: { totalTaxSavings: 1200 },
      riskAssessment: { auditRisk: 'low' },
      recommendations: [],
    });

    expect(analysis.summary.optimizationScore).toBe(72);
  });

  it('analyzes working capital', () => {
    const analysis = analyzeWorkingCapitalFromResult({
      summary: {
        workingCapital: 250000,
        currentRatio: 1.8,
        quickRatio: 1.2,
        cashConversionCycle: 45,
      },
      recommendations: [],
    });

    expect(analysis.summary.workingCapital).toBe(250000);
  });

  it('analyzes credit score impact', () => {
    const analysis = analyzeCreditScoreImpactFromResult({
      summary: {
        currentScore: 680,
        projectedScore: 720,
        scoreChange: 40,
        creditHealth: 'fair',
      },
      recommendations: ['Lower utilization below 30%'],
    });

    expect(analysis.summary.scoreChange).toBe(40);
  });

  it('analyzes LBO returns', () => {
    const analysis = analyzeLboFromResult({
      summary: { irr: 0.22, moic: 2.4, leverage: 5.5, exitValue: 120000000 },
      recommendations: [],
    });

    expect(analysis.summary.moic).toBe(2.4);
    expect(analysis.insights.length).toBeGreaterThan(0);
  });

  it('analyzes real estate investment summary', () => {
    const analysis = analyzeRealEstateInvestmentFromResult({
      summary: {
        capRate: 0.065,
        cashOnCashReturn: 0.09,
        monthlyCashFlow: 850,
        irr: 0.11,
        annualNOI: 52000,
      },
      recommendations: [],
    });

    expect(analysis.summary.monthlyCashFlow).toBe(850);
  });

  it('routes refinancing through analyzeForModelType', () => {
    const analysis = FinancialAnalysisEngine.analyzeForModelType('refinancing', {
      summary: { monthlySavings: 200, netBenefit: 10000, breakEvenMonths: 18 },
    });

    expect(analysis.insights.length).toBeGreaterThan(0);
  });

  it('analyzes 401k match summary', () => {
    const analysis = analyze401kMatchFromResult({
      summary: {
        matchLeftOnTable: 2400,
        currentMatch: 3000,
        maximumMatch: 5400,
        optimalContribution: 0.06,
      },
      recommendations: ['Increase deferral to capture full match'],
    });

    expect(analysis.summary.matchLeftOnTable).toBe(2400);
    expect(analysis.insights.some((i) => i.title.includes('match'))).toBe(true);
  });

  it('analyzes social security claiming strategy', () => {
    const analysis = analyzeSocialSecurityFromResult({
      summary: {
        optimalClaimingAge: 70,
        maximumLifetimeBenefit: 450000,
        primaryInsuranceAmount: 3200,
        breakEvenAge: 78,
      },
    });

    expect(analysis.summary.optimalClaimingAge).toBe(70);
    expect(analysis.insights.length).toBeGreaterThan(0);
  });

  it('analyzes insurance needs coverage gap', () => {
    const analysis = analyzeInsuranceNeedsFromResult({
      insuranceSummary: {
        totalCoverageGap: 250000,
        totalRecommendedCoverage: 1200000,
        insuranceHealthScore: 62,
      },
      recommendations: ['Increase term life coverage'],
    });

    expect(analysis.summary.totalCoverageGap).toBe(250000);
    expect(analysis.insights.length).toBeGreaterThan(0);
  });

  it('routes insurance batch model types through analyzeForModelType', () => {
    const disability = FinancialAnalysisEngine.analyzeForModelType('disability-insurance', {
      recommendedCoverage: 90000,
      monthlyPremium: 150,
      benefitAmount: 90000,
      eliminationPeriod: 90,
    });
    expect(disability.insights.length).toBeGreaterThan(0);

    const taxLoss = analyzeTaxLossHarvestingFromResult({
      totalTaxLoss: 12000,
      projectedTaxSavings: 2400,
      harvestableLosses: [{ symbol: 'VTI' }],
    });
    expect(taxLoss.summary.projectedTaxSavings).toBe(2400);

    const depreciation = analyzeDepreciationFromResult({
      summary: { totalDepreciation: 50000, totalTaxSavings: 10500, bookValue: 150000 },
    });
    expect(depreciation.summary.totalTaxSavings).toBe(10500);

    const capital = analyzeCapitalStructureFromResult({
      summary: { currentWACC: 0.09, optimalWACC: 0.085, debtCapacity: 5000000 },
    });
    expect(capital.summary.debtCapacity).toBe(5000000);
  });

  it('analyzes life insurance reassessment gap', () => {
    const analysis = analyzeLifeInsuranceReassessmentFromResult({
      summary: {
        totalNeeded: 1500000,
        currentCoverage: 500000,
        coverageGap: 1000000,
        recommendation: 'increase',
      },
      recommendations: ['Add term coverage'],
    });

    expect(analysis.summary.coverageGap).toBe(1000000);
  });

  it('routes specialized batch model types through analyzeForModelType', () => {
    const intl = analyzeInternationalTaxPlanningFromResult({
      taxLiability: { netTaxOwed: 42000, foreignTaxCredit: 12000 },
      projectedSavings: 8000,
      recommendations: [],
    });
    expect(intl.summary.netTaxOwed).toBe(42000);

    const scf = FinancialAnalysisEngine.analyzeForModelType('supply-chain-finance', {
      summary: { cashFlowImprovement: 150000, totalSavings: 25000, optimizedCycle: 42 },
    });
    expect(scf.insights.length).toBeGreaterThan(0);

    const bond = analyzeBondPricingFromResult({
      metrics: { price: 980, yieldToMaturity: 0.055, modifiedDuration: 6.2, dv01: 64 },
      recommendation: 'Hold',
    });
    expect(bond.summary.modifiedDuration).toBe(6.2);

    const exchange = analyze1031ExchangeFromResult({
      summary: { taxDeferred: 85000, netTaxSavings: 72000, taxOnBoot: 0 },
    });
    expect(exchange.summary.taxDeferred).toBe(85000);
  });

  it('analyzes portfolio optimization returns', () => {
    const analysis = analyzePortfolioOptimizationFromResult({
      summary: {
        currentReturn: 0.08,
        optimalReturn: 0.11,
        improvement: 0.03,
        currentRisk: 0.15,
        optimalRisk: 0.14,
      },
      recommendations: [],
    });
    expect(analysis.summary.optimalReturn).toBe(11);
  });

  it('routes risk batch model types through analyzeForModelType', () => {
    const credit = analyzeCreditRiskFromResult({
      summary: { pd: 0.035, expectedLoss: 125000, creditRating: 'BB', riskLevel: 'medium' },
      recommendations: [],
    });
    expect(credit.summary.expectedLoss).toBe(125000);

    const options = FinancialAnalysisEngine.analyzeForModelType('options-pricing', {
      pricing: { theoreticalValue: 4.25, moneyness: 'OTM' },
      greeks: { delta: 0.42, theta: -0.05 },
      optionType: 'call',
      daysToExpiration: 90,
      recommendation: 'Hold',
    });
    expect(options.insights.length).toBeGreaterThan(0);

    const crypto = analyzeCryptocurrencyTaxFromResult({
      summary: { totalTaxLiability: 5200, netCapitalGains: 18000 },
    });
    expect(crypto.summary.totalTaxLiability).toBe(5200);

    const expansion = analyzeBusinessExpansionLoanFromResult({
      summary: {
        financialHealthScore: 72,
        recommendedLoanAmount: 500000,
        dscr: 1.35,
        successProbability: 78,
      },
    });
    expect(expansion.summary.dscr).toBe(1.35);
  });

  it('analyzes business financial health score', () => {
    const analysis = analyzeBusinessFinancialHealthFromResult({
      score: 72,
      metrics: { debtToEBITDA: 2.5, currentRatio: 1.8, quickRatio: 1.1 },
      strengths: ['Strong liquidity'],
      weaknesses: [],
    });
    expect(analysis.summary.score).toBe(72);
  });

  it('routes operations batch model types through analyzeForModelType', () => {
    const varResult = analyzeVarFromResult({
      summary: {
        var: 125000,
        varPercent: 2.5,
        confidenceLevel: 0.95,
        timeHorizon: 1,
        method: 'historical',
      },
    });
    expect(varResult.summary.var).toBe(125000);

    const revenue = FinancialAnalysisEngine.analyzeForModelType('revenue-recognition', {
      summary: {
        totalContractValue: 600000,
        totalRevenueRecognized: 300000,
        totalDeferredRevenue: 300000,
      },
    });
    expect(revenue.insights.length).toBeGreaterThan(0);

    const equip = analyzeEquipmentLeaseVsBuyFromResult({
      summary: { betterOption: 'lease', costDifference: 15000, npvDifference: 8000 },
    });
    expect(equip.summary.betterOption).toBe('lease');

    const cca = analyzeCcaValuationFromResult({
      valuation: {
        equityValue: { median: 50_000_000 },
        valuePerShare: { median: 42 },
        upsideDownside: 12,
      },
    });
    expect(cca.summary.upsideDownside).toBe(12);
  });

  it('analyzes operations batch 5 model types', () => {
    const cashFlow = analyzeCashFlowFromResult({
      overallHealth: 'Good',
      metrics: { freeCashFlow: 120000, runway: 8 },
      liquidityAnalysis: { currentLiquidity: 'Good' },
      recommendations: ['Extend AR terms'],
    });
    expect(cashFlow.summary.freeCashFlow).toBe(120000);

    const eso = analyzeEmployeeStockOptionsFromResult({
      summary: {
        totalOptions: 5000,
        totalIntrinsicValue: 80000,
        totalBlackScholesValue: 95000,
        estimatedTaxOnExercise: 22000,
      },
    });
    expect(eso.summary.totalBlackScholesValue).toBe(95000);

    const payable = analyzeAccountsPayableOptimizationFromResult({
      summary: {
        totalPayables: 200000,
        potentialDiscountSavings: 3500,
        cashFlowImpact: -12000,
        optimalPaymentDays: 28,
      },
    });
    expect(payable.summary.potentialDiscountSavings).toBe(3500);
    expect(
      FinancialAnalysisEngine.analyzeForModelType('cash-flow', {
        overallHealth: 'Fair',
        metrics: { freeCashFlow: 1, runway: 0 },
        liquidityAnalysis: { currentLiquidity: 'Adequate' },
      }).insights.length
    ).toBeGreaterThan(0);

    const ar = analyzeAccountsReceivableAgingFromResult({
      summary: {
        totalReceivables: 150000,
        daysSalesOutstanding: 42,
        overdueAmount: 25000,
        estimatedBadDebt: 3000,
      },
    });
    expect(ar.summary.daysSalesOutstanding).toBe(42);

    const inventory = analyzeInventoryOptimizationFromResult({
      summary: {
        totalInventoryValue: 400000,
        optimalOrderQuantity: 250,
        totalSafetyStock: 80,
        totalCostSavings: 18000,
      },
    });
    expect(inventory.summary.totalCostSavings).toBe(18000);
  });

  it('analyzes journey and succession model types', () => {
    const succession = analyzeBusinessSuccessionPlanningFromResult({
      summary: {
        businessValue: 2_500_000,
        estateTax: 200_000,
        transferTax: 50_000,
        recommendedStrategy: 'family-transfer',
        yearsUntilTransfer: 8,
      },
    });
    expect(succession.summary.businessValue).toBe(2_500_000);

    const journey = analyzeFinancialJourneyFromResult({
      journeyOverview: {
        overallFinancialHealth: 72,
        currentStage: 'debt-management',
        nextStage: 'emergency-funding',
        progressPercentage: 45,
      },
    });
    expect(journey.summary.overallFinancialHealth).toBe(72);

    const scenario = analyzeMultiModelScenarioFromResult({
      scenario: {
        id: 'young-professional',
        name: 'Young Professional',
        progress: { completed: 2, total: 6, percentage: 33 },
      },
      analysis: { summary: 'Focus on emergency fund next.', recommendations: ['Run budget model'] },
    });
    expect(scenario.summary.progressPercentage).toBe(33);
  });
});
