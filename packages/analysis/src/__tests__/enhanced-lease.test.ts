import { describe, it, expect } from 'vitest';
import { EnhancedLeaseAnalyzer } from '../engines/enhanced-lease';

describe('EnhancedLeaseAnalyzer', () => {
  describe('Equipment Lease Analysis', () => {
    it('should analyze basic equipment lease correctly', () => {
      const result = EnhancedLeaseAnalyzer.analyze({
        leaseType: 'equipment',
        principal: 50000,
        annualRate: 0.05,
        termMonths: 36,
        residualValue: 10000,
      });

      // Basic structure validation
      expect(result.leaseType).toBe('equipment');
      expect(result.termMonths).toBe(36);
      expect(result.schedule).toHaveLength(36);
      expect(result.metrics.totalCost).toBeGreaterThan(0);
      expect(result.metrics.presentValue).toBeGreaterThan(0);
      
      // First payment should be reasonable
      expect(result.schedule[0]?.totalPayment).toBeGreaterThan(1000);
      expect(result.schedule[0]?.totalPayment).toBeLessThan(2000);
      
      // Risk analysis should be present
      expect(result.riskAnalysis.flexibilityScore).toBeGreaterThanOrEqual(0);
      expect(result.riskAnalysis.flexibilityScore).toBeLessThanOrEqual(100);
    });

    it('should handle escalations correctly', () => {
      const result = EnhancedLeaseAnalyzer.analyze({
        leaseType: 'equipment',
        principal: 30000,
        annualRate: 0.04,
        termMonths: 24,
        residualValue: 5000,
        escalation: {
          type: 'fixed',
          rate: 0.03, // 3% annual escalation
        },
      });

      expect(result.escalationSummary).toBeDefined();
      expect(result.escalationSummary?.type).toBe('fixed');
      expect(result.escalationSummary?.averageAnnualIncrease).toBe(0.03);
      
      // Payment in month 13 should be higher than month 1 due to escalation
      const firstYearPayment = result.schedule[0]?.escalatedPayment || 0;
      const secondYearPayment = result.schedule[12]?.escalatedPayment || 0;
      expect(secondYearPayment).toBeGreaterThan(firstYearPayment);
    });

    it('should analyze renewal options', () => {
      const result = EnhancedLeaseAnalyzer.analyze({
        leaseType: 'equipment',
        principal: 40000,
        annualRate: 0.06,
        termMonths: 48,
        renewalOptions: [
          {
            termMonths: 12,
            rateAdjustment: 0.02,
            marketRateOption: false,
          },
          {
            termMonths: 24,
            rateAdjustment: 0.05,
            marketRateOption: false,
          },
        ],
      });

      expect(result.renewalOptions).toHaveLength(2);
      expect(result.renewalOptions[0]?.termMonths).toBe(12);
      expect(result.renewalOptions[1]?.termMonths).toBe(24);
      expect(result.renewalOptions[1]?.projectedMonthlyPayment).toBeGreaterThan(
        result.renewalOptions[0]?.projectedMonthlyPayment || 0
      );
    });
  });

  describe('Building Lease Analysis', () => {
    it('should analyze office building lease with base rent', () => {
      const result = EnhancedLeaseAnalyzer.analyze({
        leaseType: 'office-gross',
        principal: 0, // Not used for commercial
        baseRent: 5000,
        termMonths: 60,
        additionalCosts: {
          camCharges: 200,
          propertyTaxes: 300,
          insurance: 150,
          utilities: 0,
          maintenance: 100,
          managementFee: 50,
        },
      });

      expect(result.leaseType).toBe('office-gross');
      expect(result.schedule[0]?.basePayment).toBe(5000);
      expect(result.schedule[0]?.additionalCosts.total).toBe(800); // Sum of additional costs
      expect(result.schedule[0]?.totalPayment).toBe(5800); // Base + additional
    });

    it('should handle warehouse building lease with escalations', () => {
      const result = EnhancedLeaseAnalyzer.analyze({
        leaseType: 'warehouse-nnn',
        principal: 0,
        baseRent: 4000,
        termMonths: 36,
        escalation: {
          type: 'cpi',
          rate: 0.025, // 2.5% CPI-based escalation
        },
        additionalCosts: {
          camCharges: 500,
          propertyTaxes: 400,
          insurance: 200,
        },
      });

      expect(result.escalationSummary?.type).toBe('cpi');
      
      // Second year payment should be escalated
      const firstYearTotal = result.schedule[0]?.totalPayment || 0;
      const secondYearTotal = result.schedule[12]?.totalPayment || 0;
      expect(secondYearTotal).toBeGreaterThan(firstYearTotal);
    });

    it('should handle medical building lease with comprehensive costs', () => {
      const result = EnhancedLeaseAnalyzer.analyze({
        leaseType: 'medical-nnn',
        principal: 0,
        baseRent: 6000,
        termMonths: 60,
        additionalCosts: {
          camCharges: 300,
          propertyTaxes: 400,
          insurance: 250,
          utilities: 500,
          maintenance: 200,
          managementFee: 100,
          parking: 150,
          security: 200,
          cleaning: 300,
          technology: 100,
          elevatorMaintenance: 50,
          hvacMaintenance: 150,
          landscaping: 75,
          wasteManagement: 50,
        },
      });

      expect(result.leaseType).toBe('medical-nnn');
      expect(result.schedule[0]?.basePayment).toBe(6000);
      
      // Calculate total additional costs
      const expectedAdditionalTotal = 300 + 400 + 250 + 500 + 200 + 100 + 150 + 200 + 300 + 100 + 50 + 150 + 75 + 50;
      expect(result.schedule[0]?.additionalCosts.total).toBe(expectedAdditionalTotal);
      expect(result.schedule[0]?.totalPayment).toBe(6000 + expectedAdditionalTotal);
    });
  });

  describe('Retail Lease Analysis', () => {
    it('should analyze retail lease with percentage rent', () => {
      const result = EnhancedLeaseAnalyzer.analyze({
        leaseType: 'retail-percentage',
        principal: 0,
        baseRent: 3000,
        termMonths: 60,
        percentageRent: {
          enabled: true,
          percentage: 0.05, // 5% of sales over breakpoint
          breakpoint: 600000, // $600k annual breakpoint
          annualSalesEstimate: 800000, // $800k estimated sales
        },
      });

      expect(result.schedule[0]?.percentageRent).toBeGreaterThan(0);
      
      // Should have percentage rent since sales exceed breakpoint
      const monthlySales = 800000 / 12; // ~$66.7k
      const monthlyBreakpoint = 600000 / 12; // $50k
      const expectedPercentageRent = (monthlySales - monthlyBreakpoint) * 0.05;
      expect(result.schedule[0]?.percentageRent).toBeCloseTo(expectedPercentageRent, 2);
    });
  });

  describe('Purchase Option Analysis', () => {
    it('should analyze purchase options', () => {
      const result = EnhancedLeaseAnalyzer.analyze({
        leaseType: 'equipment',
        principal: 60000,
        annualRate: 0.05,
        termMonths: 48,
        residualValue: 15000,
        purchaseOption: {
          enabled: true,
          fixedAmount: 12000,
          fairMarketValue: false,
        },
      });

      expect(result.purchaseOption).toBeDefined();
      expect(result.purchaseOption?.available).toBe(true);
      expect(result.purchaseOption?.purchasePrice).toBe(12000);
    });
  });

  describe('Lease vs Buy Analysis', () => {
    it('should compare lease vs buy options', () => {
      const result = EnhancedLeaseAnalyzer.analyze({
        leaseType: 'equipment',
        principal: 45000,
        annualRate: 0.06,
        termMonths: 36,
        compareAlternatives: {
          purchasePrice: 45000,
          loanRate: 0.05,
          loanTermMonths: 36,
        },
      });

      expect(result.leaseVsBuy).toBeDefined();
      expect(result.leaseVsBuy?.leaseOption.totalCost).toBeGreaterThan(0);
      expect(result.leaseVsBuy?.buyOption.totalLoanCost).toBeGreaterThan(0);
      expect(['lease', 'buy']).toContain(result.leaseVsBuy?.recommendation);
    });
  });

  describe('Risk Analysis', () => {
    it('should assess lease risk factors', () => {
      const result = EnhancedLeaseAnalyzer.analyze({
        leaseType: 'equipment',
        principal: 25000,
        annualRate: 0.07,
        termMonths: 24,
        earlyTermination: {
          allowed: true,
          penaltyMonths: 2,
        },
      });

      expect(result.riskAnalysis.flexibilityScore).toBeGreaterThan(50); // Should be higher with early termination
      expect(result.riskAnalysis.earlyTerminationCost).toBeGreaterThan(0);
      expect(['low', 'medium', 'high']).toContain(result.riskAnalysis.renewalRisk);
    });
  });

  describe('Sensitivity Analysis', () => {
    it('should perform sensitivity analysis', () => {
      const result = EnhancedLeaseAnalyzer.analyze({
        leaseType: 'equipment',
        principal: 35000,
        annualRate: 0.05,
        termMonths: 30,
      });

      expect(result.sensitivity).toBeDefined();
      expect(result.sensitivity?.rateIncrease1Percent.totalCostChange).toBeGreaterThan(0);
      expect(result.sensitivity?.termExtension6Months.totalCostChange).toBeGreaterThan(0);
    });
  });

  describe('Input Validation', () => {
    it('should validate required fields', () => {
      expect(() => {
        EnhancedLeaseAnalyzer.analyze({
          leaseType: 'equipment',
          principal: -1000, // Invalid negative principal
          annualRate: 0.05,
          termMonths: 36,
        });
      }).toThrow();
    });

    it('should handle optional fields gracefully', () => {
      const result = EnhancedLeaseAnalyzer.analyze({
        leaseType: 'equipment',
        principal: 20000,
        annualRate: 0.04,
        termMonths: 24,
        // All optional fields omitted
      });

      expect(result.schedule).toHaveLength(24);
      expect(result.escalationSummary).toBeUndefined();
      expect(result.purchaseOption).toBeUndefined();
      expect(result.leaseVsBuy).toBeUndefined();
    });
  });
});