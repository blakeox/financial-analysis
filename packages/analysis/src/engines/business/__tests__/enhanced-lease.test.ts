import { describe, it, expect, vi, afterEach } from 'vitest';
import { EnhancedLeaseAnalyzer } from '../enhanced-lease';
import { EnhancedLeaseInputSchema, type EnhancedLeaseInput } from '../../../schemas/enhanced-lease';
import type {
  FinancialMetrics,
  LeaseVsBuyAnalysis,
  PurchaseOptionAnalysis,
  RiskAnalysis,
} from '../../../types/enhanced-lease-result';

afterEach(() => {
  vi.restoreAllMocks();
});

const helpers = EnhancedLeaseAnalyzer as unknown as {
  calculateEquipmentPayment: (input: EnhancedLeaseInput) => { basePayment: number; interestRate: number };
  applyEscalation: (
    basePayment: number,
    month: number,
    escalation?: NonNullable<EnhancedLeaseInput['escalation']>
  ) => number;
  calculatePercentageRent: (
    percentageRent?: NonNullable<EnhancedLeaseInput['percentageRent']>
  ) => number;
  calculateAdditionalCosts: (
    additionalCosts?: EnhancedLeaseInput['additionalCosts']
  ) => { total: number; camCharges: number } & Record<string, number>;
  analyzePurchaseOption: (input: EnhancedLeaseInput) => PurchaseOptionAnalysis | undefined;
  analyzeLeaseVsBuy: (
    input: EnhancedLeaseInput,
    metrics: FinancialMetrics
  ) => LeaseVsBuyAnalysis | undefined;
  analyzeRisk: (input: EnhancedLeaseInput, metrics: FinancialMetrics) => RiskAnalysis;
  generateInsights: (
    input: EnhancedLeaseInput,
    metrics: FinancialMetrics,
    risk: RiskAnalysis
  ) => ReturnType<typeof EnhancedLeaseAnalyzer.analyze>['insights'];
};

const createBaseInput = (overrides: Partial<EnhancedLeaseInput> = {}): EnhancedLeaseInput => ({
  leaseType: 'equipment',
  principal: 120000,
  termMonths: 24,
  annualRate: 0.05,
  residualValue: 10000,
  discountRate: 0.05,
  renewalOptions: [],
  ...overrides,
});

const createMetrics = (overrides: Partial<FinancialMetrics> = {}): FinancialMetrics => ({
  totalCost: 100000,
  presentValue: 95000,
  futureValue: 0,
  effectiveAnnualRate: 0.05,
  internalRateOfReturn: 0.04,
  paybackPeriod: 24,
  totalInterestPaid: 5000,
  averageMonthlyPayment: 3500,
  costPerMonth: 3500,
  costPerYear: 42000,
  ...overrides,
});

describe('EnhancedLeaseAnalyzer - Commercial Real Estate Scenarios', () => {
  describe('Warehouse NNN Lease Analysis', () => {
    it('should handle warehouse NNN lease with all additional costs', () => {
      const input: EnhancedLeaseInput = {
        leaseType: 'warehouse-nnn',
        baseRent: 45000, // $45,000/month
        termMonths: 60, // 5 years
        annualRate: 0.05,
        principal: 0, // Real estate lease, no equipment
        residualValue: 0,
        
        // Escalation: 3% annually
        escalation: {
          type: 'fixed',
          rate: 0.03, // 3% annual escalation
          schedule: [],
          cpiBase: 0,
        },
        
        // Additional costs (NNN lease - tenant pays these)
        additionalCosts: {
          camCharges: 5000, // CAM charges
          propertyTaxes: 3000, // Property taxes
          insurance: 1500, // Insurance
          utilities: 2000, // Utilities (separately metered)
          maintenance: 1000, // Building maintenance
          managementFee: 500, // Property management fee
          parking: 0,
          security: 500,
          cleaning: 300,
          technology: 200,
          elevatorMaintenance: 0,
          hvacMaintenance: 1200, // Quarterly HVAC service
          landscaping: 400,
          wasteManagement: 600,
        },
        
        // Security deposit
        securityDeposit: {
          amount: 90000, // $90,000
          interestRate: 0,
        },
        
        // Building space details
        buildingSpace: {
          squareFeet: 50000, // 50,000 RSF
          usableSquareFeet: 47500, // Usable square footage
          loadFactor: 1.05, // 5% load factor
          pricePerSquareFoot: 10.80, // $45,000 * 12 / 50,000
          floors: ['1'],
          parkingSpaces: 60, // 60 exclusive parking spaces
          exclusiveAreas: ['Loading docks', 'Storage area'],
          zoningType: 'Industrial',
          permittedUses: ['Precision machining', 'Metal fabrication', 'Warehousing'],
        },
        
        discountRate: 0.08,
        renewalOptions: [],
      };

      const result = EnhancedLeaseAnalyzer.analyze(input);

      // Verify basic structure
      expect(result.leaseType).toBe('warehouse-nnn');
      expect(result.termMonths).toBe(60);
      expect(result.schedule).toHaveLength(60);

      // Verify base payment
      expect(result.schedule[0]!.basePayment).toBe(45000);

      // Verify additional costs are included
      expect(result.schedule[0]!.additionalCosts.camCharges).toBe(5000);
      expect(result.schedule[0]!.additionalCosts.propertyTaxes).toBe(3000);
      expect(result.schedule[0]!.additionalCosts.insurance).toBe(1500);
      expect(result.schedule[0]!.additionalCosts.utilities).toBe(2000);
      expect(result.schedule[0]!.additionalCosts.hvacMaintenance).toBe(1200);

      // Total first month payment should include all costs
      const firstMonthTotal = 45000 + 5000 + 3000 + 1500 + 2000 + 1000 + 500 + 500 + 300 + 200 + 1200 + 400 + 600;
      expect(result.schedule[0]!.totalPayment).toBeCloseTo(firstMonthTotal, 0.01);

      // Verify escalation is applied
      expect(result.escalationSummary).toBeDefined();
      expect(result.escalationSummary!.type).toBe('fixed');
      expect(result.escalationSummary!.effectiveRate).toBe(0.03);

      // Check that payment increases over time due to escalation
      const lastMonthTotal = result.schedule[59]!.totalPayment;
      expect(lastMonthTotal).toBeGreaterThan(firstMonthTotal);

      // Verify financial metrics
      expect(result.metrics.totalCost).toBeGreaterThan(0);
      expect(result.metrics.averageMonthlyPayment).toBeGreaterThan(firstMonthTotal);
      expect(result.metrics.costPerYear).toBeGreaterThan(firstMonthTotal * 12);

      // Verify insights include flexibility and recommendations
      expect(result.insights.flexibilityRating).toBeDefined();
      expect(result.insights.recommendations).toBeInstanceOf(Array);
    });

    it('should handle NNN lease with $0 additional costs (tenant pays all operating expenses)', () => {
      const input: EnhancedLeaseInput = {
        leaseType: 'warehouse-nnn',
        baseRent: 45000,
        termMonths: 60,
        annualRate: 0.05,
        principal: 0,
        residualValue: 0,
        
        escalation: {
          type: 'fixed',
          rate: 0.03,
          schedule: [],
          cpiBase: 0,
        },
        
        // NNN lease where tenant pays 100% of operating expenses
        // These would be calculated separately and passed in as additional costs
        // For this test, we're setting them to 0 to verify the engine handles it
        additionalCosts: {
          camCharges: 0,
          propertyTaxes: 0,
          insurance: 0,
          utilities: 0,
          maintenance: 0,
          managementFee: 0,
          parking: 0,
          security: 0,
          cleaning: 0,
          technology: 0,
          elevatorMaintenance: 0,
          hvacMaintenance: 0,
          landscaping: 0,
          wasteManagement: 0,
        },
        
        discountRate: 0.08,
        renewalOptions: [],
      };

      const result = EnhancedLeaseAnalyzer.analyze(input);

      // Verify that all additional costs are 0
      expect(result.schedule[0]!.additionalCosts.camCharges).toBe(0);
      expect(result.schedule[0]!.additionalCosts.propertyTaxes).toBe(0);
      expect(result.schedule[0]!.additionalCosts.insurance).toBe(0);

      // Total should just be base rent
      expect(result.schedule[0]!.totalPayment).toBe(45000);

      // Still should have valid escalation applied
      expect(result.schedule[59]!.totalPayment).toBeGreaterThan(45000);
    });

    it('should project future costs with annual escalation', () => {
      const input: EnhancedLeaseInput = {
        leaseType: 'warehouse-nnn',
        baseRent: 45000,
        termMonths: 60, // 5 years
        annualRate: 0.05,
        principal: 0,
        residualValue: 0,
        
        escalation: {
          type: 'fixed',
          rate: 0.03, // 3% annually
          schedule: [],
          cpiBase: 0,
        },
        
        additionalCosts: {
          camCharges: 5000,
          propertyTaxes: 3000,
          insurance: 1500,
          utilities: 2000,
          maintenance: 1000,
          managementFee: 500,
          parking: 0,
          security: 500,
          cleaning: 300,
          technology: 200,
          elevatorMaintenance: 0,
          hvacMaintenance: 1200,
          landscaping: 400,
          wasteManagement: 600,
        },
        
        discountRate: 0.08,
        renewalOptions: [],
      };

      const result = EnhancedLeaseAnalyzer.analyze(input);

      // Get first year average
      const firstYearPayments = result.schedule.slice(0, 12);
      const firstYearAvg = firstYearPayments.reduce((sum, p) => sum + p.totalPayment, 0) / 12;

      // Get last year average
      const lastYearPayments = result.schedule.slice(48, 60);
      const lastYearAvg = lastYearPayments.reduce((sum, p) => sum + p.totalPayment, 0) / 12;

      // Last year should be roughly 3% higher than first year (compounded over 4 years)
      const expectedIncrease = 0.03 * 4; // 12% total increase over 4 years
      const actualIncrease = (lastYearAvg - firstYearAvg) / firstYearAvg;
      
      // Allow for rounding tolerance - base rent increases but total includes fixed additional costs
      // So actual increase will be less than 12% as additional costs don't escalate
      expect(actualIncrease).toBeGreaterThan(expectedIncrease * 0.6); // At least 60% of expected
      expect(actualIncrease).toBeLessThan(expectedIncrease * 1.5);
    });

    it('should calculate present value with discount rate', () => {
      const input: EnhancedLeaseInput = {
        leaseType: 'warehouse-nnn',
        baseRent: 45000,
        termMonths: 60,
        annualRate: 0.05,
        principal: 0,
        residualValue: 0,
        
        escalation: {
          type: 'fixed',
          rate: 0.03,
          schedule: [],
          cpiBase: 0,
        },
        
        additionalCosts: {
          camCharges: 5000,
          propertyTaxes: 3000,
          insurance: 1500,
          utilities: 2000,
          maintenance: 0,
          managementFee: 0,
          parking: 0,
          security: 0,
          cleaning: 0,
          technology: 0,
          elevatorMaintenance: 0,
          hvacMaintenance: 0,
          landscaping: 0,
          wasteManagement: 0,
        },
        
        discountRate: 0.08, // 8% discount rate
        renewalOptions: [],
      };

      const result = EnhancedLeaseAnalyzer.analyze(input);

      // Present value should be less than total cost due to discounting
      expect(result.metrics.presentValue).toBeLessThan(result.metrics.totalCost);
      
      // Present value should be reasonable (not negative, not zero)
      expect(result.metrics.presentValue).toBeGreaterThan(0);
      
      // Each payment's present value should decrease over time
      expect(result.schedule[0]!.presentValue).toBeGreaterThan(result.schedule[59]!.presentValue);
    });

    it('should handle percentage rent for retail leases', () => {
      const input: EnhancedLeaseInput = {
        leaseType: 'retail-percentage',
        baseRent: 10000,
        termMonths: 60,
        annualRate: 0.05,
        principal: 0,
        residualValue: 0,
        
        percentageRent: {
          enabled: true,
          percentage: 0.06, // 6% of gross sales
          breakpoint: 2000000, // $2M annual breakpoint
          annualSalesEstimate: 3000000, // $3M annual sales estimate
        },
        
        additionalCosts: {
          camCharges: 2000,
          propertyTaxes: 1500,
          insurance: 800,
          utilities: 500,
          maintenance: 0,
          managementFee: 0,
          parking: 0,
          security: 0,
          cleaning: 0,
          technology: 0,
          elevatorMaintenance: 0,
          hvacMaintenance: 0,
          landscaping: 0,
          wasteManagement: 0,
        },
        
        discountRate: 0.08,
        renewalOptions: [],
      };

      const result = EnhancedLeaseAnalyzer.analyze(input);

      // Percentage rent = (monthly sales - monthly breakpoint) * percentage
      // Monthly sales = $3M / 12 = $250,000
      // Monthly breakpoint = $2M / 12 = $166,667
      // Excess = $250,000 - $166,667 = $83,333
      // Percentage rent = $83,333 * 0.06 = $5,000/month
      const expectedPercentageRent = 5000;

      // Total payment should include base rent, additional costs, and percentage rent
      const expectedTotal = 10000 + 2000 + 1500 + 800 + 500 + expectedPercentageRent;
      expect(result.schedule[0]!.totalPayment).toBeCloseTo(expectedTotal, 0.01);
      
      // Verify percentage rent is included in the schedule
      expect(result.schedule[0]!.percentageRent).toBeCloseTo(expectedPercentageRent, 0.01);
    });

    it('should provide risk analysis for commercial leases', () => {
      const input: EnhancedLeaseInput = {
        leaseType: 'warehouse-nnn',
        baseRent: 45000,
        termMonths: 60,
        annualRate: 0.05,
        principal: 0,
        residualValue: 0,
        
        escalation: {
          type: 'fixed',
          rate: 0.03,
          schedule: [],
          cpiBase: 0,
        },
        
        earlyTermination: {
          allowed: true,
          penaltyMonths: 3,
          penaltyAmount: 0,
        },
        
        renewalOptions: [
          {
            termMonths: 60,
            rateAdjustment: 0.05, // 5% increase
            marketRateOption: false,
            escalationType: 'fixed',
            escalationRate: 0.03,
          },
        ],
        
        discountRate: 0.08,
      };

      const result = EnhancedLeaseAnalyzer.analyze(input);

      // Risk analysis should be present
      expect(result.riskAnalysis).toBeDefined();
      
      // With early termination option, flexibility score should be higher
      expect(result.riskAnalysis.flexibilityScore).toBeGreaterThan(50);
      
      // With renewal options, renewal risk should be lower
      expect(result.riskAnalysis.renewalRisk).toBe('low');
      
      // With escalation, rate escalation risk should not be low
      expect(result.riskAnalysis.rateEscalationRisk).not.toBe('low');
      
      // Early termination cost should be reasonable
      expect(result.riskAnalysis.earlyTerminationCost).toBeGreaterThan(0);
    });

    it('should provide sensitivity analysis for cost changes', () => {
      const input: EnhancedLeaseInput = {
        leaseType: 'warehouse-nnn',
        baseRent: 45000,
        termMonths: 60,
        annualRate: 0.05,
        principal: 0,
        residualValue: 0,
        
        escalation: {
          type: 'fixed',
          rate: 0.03,
          schedule: [],
          cpiBase: 0,
        },
        
        additionalCosts: {
          camCharges: 5000,
          propertyTaxes: 3000,
          insurance: 1500,
          utilities: 2000,
          maintenance: 0,
          managementFee: 0,
          parking: 0,
          security: 0,
          cleaning: 0,
          technology: 0,
          elevatorMaintenance: 0,
          hvacMaintenance: 0,
          landscaping: 0,
          wasteManagement: 0,
        },
        
        discountRate: 0.08,
        renewalOptions: [],
      };

      const result = EnhancedLeaseAnalyzer.analyze(input);

      // Sensitivity analysis should be present
      expect(result.sensitivity).toBeDefined();
      
      // Rate increase sensitivity should show increased costs
      expect(result.sensitivity!.rateIncrease1Percent.totalCostChange).toBeGreaterThan(0);
      expect(result.sensitivity!.rateIncrease1Percent.monthlyPaymentChange).toBeGreaterThan(0);
      
      // Term extension sensitivity should show increased costs
      expect(result.sensitivity!.termExtension6Months.totalCostChange).toBeGreaterThan(0);
    });
  });
});

describe('EnhancedLeaseAnalyzer helper coverage', () => {
  it('calculates zero-interest equipment payments using straight-line math', () => {
    const input: EnhancedLeaseInput = {
      leaseType: 'equipment',
      principal: 120000,
      residualValue: 20000,
      termMonths: 40,
      annualRate: 0,
      discountRate: 0.05,
      renewalOptions: [],
    };

    const { basePayment, interestRate } = helpers.calculateEquipmentPayment(input);
    expect(basePayment).toBeCloseTo((120000 - 20000) / 40, 6);
    expect(interestRate).toBe(0);
  });

  it('applies stepped escalation rates when start months are met', () => {
    const payment = helpers.applyEscalation(1000, 15, {
      type: 'stepped',
      rate: 0,
      schedule: [
        { startMonth: 6, rate: 0.02 },
        { startMonth: 13, rate: 0.04 },
      ],
      cpiBase: 0,
    });

    expect(payment).toBeCloseTo(1000 * 1.04, 6);
  });

  it('keeps stepped escalation flat before the first step begins', () => {
    const payment = helpers.applyEscalation(1200, 3, {
      type: 'stepped',
      rate: 0,
      schedule: [{ startMonth: 6, rate: 0.05 }],
      cpiBase: 0,
    });

    expect(payment).toBe(1200);
  });

  it('applies market escalation only after the first year', () => {
    const escalation = {
      type: 'market' as const,
      rate: 0.05,
      schedule: [],
      cpiBase: 0,
    };

    const firstYear = helpers.applyEscalation(2000, 12, escalation);
    const secondYear = helpers.applyEscalation(2000, 13, escalation);

    expect(firstYear).toBe(2000);
    expect(secondYear).toBeCloseTo(2000 * 1.05, 6);
  });

  it('falls back to base payment for unknown escalation types', () => {
    const payment = helpers.applyEscalation(1500, 5, {
      type: 'unknown' as any,
      rate: 0.1,
      schedule: [],
      cpiBase: 0,
    });

    expect(payment).toBe(1500);
  });

  it('applies CPI escalation compounded by years passed', () => {
    const paymentYearTwo = helpers.applyEscalation(2200, 13, {
      type: 'cpi',
      rate: 0.03,
      schedule: [],
      cpiBase: 0,
    });

    expect(paymentYearTwo).toBeCloseTo(2200 * Math.pow(1.03, 1), 6);
  });

  it('defaults CPI escalation to the 2.5% fallback when rate is missing', () => {
    const paymentYearThree = helpers.applyEscalation(1800, 25, {
      type: 'cpi',
      rate: 0,
      schedule: [],
      cpiBase: 0,
    });

    expect(paymentYearThree).toBeCloseTo(1800 * Math.pow(1.025, 2), 6);
  });

  it('defaults additional costs to zeros when omitted', () => {
    const defaults = helpers.calculateAdditionalCosts();
    expect(defaults.total).toBe(0);
    expect(defaults.camCharges).toBe(0);
    expect(defaults.propertyTaxes).toBe(0);
  });

  it('returns zero percentage rent when sales do not exceed the breakpoint', () => {
    const percentageRent = helpers.calculatePercentageRent({
      enabled: true,
      percentage: 0.07,
      breakpoint: 1_200_000,
      annualSalesEstimate: 1_100_000,
    });

    expect(percentageRent).toBe(0);
  });

  it('skips purchase option analysis when the option is disabled', () => {
    const result = helpers.analyzePurchaseOption(createBaseInput({
      purchaseOption: { enabled: false },
    }));

    expect(result).toBeUndefined();
  });

  it('falls back to residual value when purchase option fixed amount is missing', () => {
    const result = helpers.analyzePurchaseOption(createBaseInput({
      residualValue: 18000,
      purchaseOption: { enabled: true },
    }));

    expect(result?.purchasePrice).toBe(18000);
  });

  it('returns undefined for lease-vs-buy comparisons without purchase price', () => {
    const metrics = createMetrics();
    const result = helpers.analyzeLeaseVsBuy(createBaseInput({
      compareAlternatives: {
        loanRate: 0.05,
      },
    }), metrics);

    expect(result).toBeUndefined();
  });

  it('uses default loan rate and term when compare alternatives omit them', () => {
    const purchasePrice = 90000;
    const termMonths = 36;
    const metrics = createMetrics();
    const analysis = helpers.analyzeLeaseVsBuy(createBaseInput({
      termMonths,
      compareAlternatives: {
        purchasePrice,
      },
    }), metrics);

    expect(analysis).toBeDefined();

    const fallbackRate = 0.06;
    const monthlyRate = fallbackRate / 12;
    const expectedPayment = purchasePrice * (
      (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1)
    );

    expect(analysis!.buyOption.loanPayment).toBeCloseTo(expectedPayment, 2);
    expect(analysis!.buyOption.totalLoanCost).toBeCloseTo(expectedPayment * termMonths, 2);
  });
});

describe('EnhancedLeaseAnalyzer risk and insights coverage', () => {
  it('derives early termination penalties from average payments when no fixed amount is provided', () => {
    const metrics = createMetrics({
      averageMonthlyPayment: 4200,
      costPerMonth: 4200,
      costPerYear: 50400,
      totalCost: 210000,
      presentValue: 190000,
    });

    const risk = helpers.analyzeRisk(createBaseInput({
      earlyTermination: {
        allowed: true,
        penaltyMonths: 2,
      },
      escalation: {
        type: 'none',
        rate: 0,
        schedule: [],
        cpiBase: 0,
      },
    }), metrics);

    expect(risk.earlyTerminationCost).toBeCloseTo(4200 * 2, 2);
    expect(risk.rateEscalationRisk).toBe('low');
  });

  it('prefers an explicit early termination penalty amount when provided', () => {
    const metrics = createMetrics({ averageMonthlyPayment: 3000 });

    const risk = helpers.analyzeRisk(createBaseInput({
      earlyTermination: {
        allowed: true,
        penaltyAmount: 10000,
        penaltyMonths: 12,
      },
    }), metrics);

    expect(risk.earlyTerminationCost).toBe(10000);
  });

  it('defaults penalty months to three when not specified', () => {
    const metrics = createMetrics({ averageMonthlyPayment: 2500 });

    const risk = helpers.analyzeRisk(createBaseInput({
      earlyTermination: {
        allowed: true,
      },
    }), metrics);

    expect(risk.earlyTerminationCost).toBeCloseTo(2500 * 3, 2);
  });

  it('treats early termination as full commitment when the clause is not allowed', () => {
    const metrics = createMetrics({
      totalCost: 250000,
      costPerMonth: 5000,
      costPerYear: 60000,
    });

    const risk = helpers.analyzeRisk(createBaseInput({
      earlyTermination: {
        allowed: false,
      },
    }), metrics);

    expect(risk.earlyTerminationCost).toBe(metrics.totalCost);
    expect(risk.flexibilityScore).toBe(25);
  });

  it('omits flexibility recommendations when the risk score is healthy and no escalation exists', () => {
    const metrics = createMetrics({ totalCost: 180000, costPerMonth: 4000, costPerYear: 48000 });
    const risk: RiskAnalysis = {
      earlyTerminationCost: 5000,
      totalCommitment: metrics.totalCost,
      flexibilityScore: 80,
      renewalRisk: 'low',
      rateEscalationRisk: 'low',
    };

    const insights = helpers.generateInsights(createBaseInput({
      escalation: {
        type: 'none',
        rate: 0,
        schedule: [],
        cpiBase: 0,
      },
    }), metrics, risk);

    expect(insights.recommendations).toHaveLength(0);
    expect(insights.flexibilityRating).toBe('High');
  });

  it('labels flexibility as Medium when the score is above 50 but below the High threshold', () => {
    const metrics = createMetrics({ totalCost: 175000 });
    const risk: RiskAnalysis = {
      earlyTerminationCost: 7000,
      totalCommitment: metrics.totalCost,
      flexibilityScore: 70,
      renewalRisk: 'medium',
      rateEscalationRisk: 'medium',
    };

    const insights = helpers.generateInsights(createBaseInput({
      escalation: {
        type: 'fixed',
        rate: 0.03,
        schedule: [],
        cpiBase: 0,
      },
    }), metrics, risk);

    expect(insights.flexibilityRating).toBe('Medium');
    expect(insights.recommendations).toContain('Monitor escalation clauses to ensure they align with market conditions');
  });
});

describe('EnhancedLeaseAnalyzer validation fallbacks', () => {
  it('falls back to zero base payment when a building lease is parsed without base rent', () => {
    const parsedLease = {
      leaseType: 'retail-base',
      principal: 0,
      baseRent: undefined,
      annualRate: 0,
      termMonths: 6,
      residualValue: 0,
      discountRate: 0.05,
      renewalOptions: [],
    } as unknown as EnhancedLeaseInput;

    const parseSpy = vi.spyOn(EnhancedLeaseInputSchema, 'parse').mockReturnValueOnce(parsedLease);

    const result = EnhancedLeaseAnalyzer.analyze({
      leaseType: 'retail-base',
      principal: 0,
      baseRent: 25000,
      annualRate: 0.01,
      termMonths: 6,
      residualValue: 0,
      discountRate: 0.05,
      renewalOptions: [],
    } as EnhancedLeaseInput);

    expect(parseSpy).toHaveBeenCalled();
    expect(result.schedule[0]!.basePayment).toBe(0);
  });
});

describe('EnhancedLeaseAnalyzer equipment scenario coverage', () => {
  it('handles equipment leases with CPI escalation and alternative analysis', () => {
    const input: EnhancedLeaseInput = {
      leaseType: 'equipment',
      principal: 150000,
      residualValue: 15000,
      annualRate: 0.06,
      termMonths: 48,
      discountRate: 0.05,
      escalation: {
        type: 'cpi',
        rate: 0.025,
        schedule: [],
        cpiBase: 0,
      },
      purchaseOption: {
        enabled: true,
        fixedAmount: 14000,
      },
      compareAlternatives: {
        purchasePrice: 160000,
        loanRate: 0.055,
        loanTermMonths: 48,
      },
      renewalOptions: [],
    };

    const result = EnhancedLeaseAnalyzer.analyze(input);

    expect(result.leaseType).toBe('equipment');
    expect(result.schedule).toHaveLength(48);
    const base = result.schedule[0]!.basePayment;
    expect(result.schedule[0]!.additionalCosts.total).toBe(0);
    expect(result.schedule[0]!.escalatedPayment).toBeCloseTo(base, 2);
    expect(result.schedule[13]!.escalatedPayment).toBeCloseTo(base * 1.025, 2);

    expect(result.purchaseOption?.available).toBe(true);
    expect(result.purchaseOption?.purchasePrice).toBe(14000);

    expect(result.leaseVsBuy?.buyOption.purchasePrice).toBe(160000);
    expect(result.leaseVsBuy?.recommendation).toMatch(/lease|buy/);

    const recs = result.insights.recommendations;
    expect(recs).toContain('Consider negotiating early termination options for flexibility');
    expect(recs).toContain('Monitor escalation clauses to ensure they align with market conditions');
  });
});

