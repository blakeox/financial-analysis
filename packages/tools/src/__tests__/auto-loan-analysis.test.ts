import { describe, expect, it } from 'vitest';
import { AutoLoanAnalysisTool } from '../tools/auto-loan-analysis';

describe('AutoLoanAnalysisTool', () => {
  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(AutoLoanAnalysisTool.toolName).toBe('analyze_auto_loan_analysis');
    });

    it('has a description', () => {
      expect(AutoLoanAnalysisTool.description).toBeTruthy();
      expect(AutoLoanAnalysisTool.description.length).toBeGreaterThan(50);
    });

    it('has required input schema fields', () => {
      const schema = AutoLoanAnalysisTool.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toContain('vehicle');
      expect(schema.required).toContain('loanTerms');
      expect(schema.required).toContain('analysis');
      expect(schema.required).toContain('tcoParameters');
    });
  });

  describe('execute', () => {
    it('calculates a basic auto loan analysis', async () => {
      const result = await AutoLoanAnalysisTool.execute({
        vehicle: {
          make: 'Toyota',
          model: 'Camry',
          year: 2024,
          msrp: 32000,
          negotiatedPrice: 30000,
          tradeInValue: 0,
          downPayment: 5000,
        },
        loanTerms: {
          loanAmount: 25000,
          interestRate: 0.0549,
          termMonths: 60,
          salesTaxRate: 0.0825,
          fees: {
            documentationFee: 500,
            titleFee: 100,
            registrationFee: 200,
            otherFees: 0,
          },
        },
        analysis: {
          includeLeaseComparison: false,
          includeRefinancingAnalysis: true,
          includeTCOAnalysis: true,
          includePaymentSchedule: true,
          refinancingRates: [0.04, 0.05],
          ownershipYears: 5,
        },
        tcoParameters: {
          annualMileage: 12000,
          fuelCostPerGallon: 3.5,
          mpg: 28,
          maintenanceCostPerYear: 900,
          insuranceCostPerYear: 1400,
          registrationCostPerYear: 120,
          depreciationRate: 0.15,
        },
      });

      expect(result).toBeDefined();
      expect(result.loanAnalysis).toBeDefined();
      expect(result.loanAnalysis.monthlyPayment).toBeGreaterThan(0);
      expect(result.loanAnalysis.paymentSchedule.length).toBe(60);
      expect(Array.isArray(result.insights)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.metadata).toBeDefined();
    });

    it('rejects invalid loan term', async () => {
      await expect(
        AutoLoanAnalysisTool.execute({
          vehicle: {
            make: 'Toyota',
            model: 'Camry',
            year: 2024,
            msrp: 32000,
            negotiatedPrice: 30000,
          },
          loanTerms: {
            loanAmount: 25000,
            interestRate: 0.0549,
            termMonths: 6,
            fees: {},
          },
          analysis: {},
          tcoParameters: {},
        })
      ).rejects.toThrow();
    });
  });
});
