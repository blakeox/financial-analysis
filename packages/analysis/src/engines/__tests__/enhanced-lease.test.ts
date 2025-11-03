import { describe, it, expect } from 'vitest';
import { EnhancedLeaseAnalyzer } from '../enhanced-lease';
import type { EnhancedLeaseInput } from '../../schemas/enhanced-lease';

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

