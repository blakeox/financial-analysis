import { describe, expect, it } from 'vitest';
import { AutoLoanTool } from '../tools/auto-loan';

describe('AutoLoanTool', () => {
  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(AutoLoanTool.toolName).toBe('analyze_auto_loan');
    });

    it('has a description', () => {
      expect(AutoLoanTool.description).toBeTruthy();
      expect(AutoLoanTool.description.length).toBeGreaterThan(50);
    });

    it('has required input schema fields', () => {
      const schema = AutoLoanTool.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toContain('vehiclePrice');
      expect(schema.required).toContain('interestRate');
      expect(schema.required).toContain('loanTermMonths');
    });
  });

  describe('execute', () => {
    it('calculates basic auto loan', async () => {
      const result = await AutoLoanTool.execute({
        vehiclePrice: 30000,
        interestRate: 0.0549,
        loanTermMonths: 60,
      });

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.costBreakdown).toBeDefined();
      expect(result.paymentSchedule).toBeDefined();
    });

    it('handles down payment', async () => {
      const resultWithoutDown = await AutoLoanTool.execute({
        vehiclePrice: 30000,
        interestRate: 0.0549,
        loanTermMonths: 60,
        downPayment: 0,
      });

      const resultWithDown = await AutoLoanTool.execute({
        vehiclePrice: 30000,
        interestRate: 0.0549,
        loanTermMonths: 60,
        downPayment: 5000,
      });

      // With down payment, monthly payment should be lower
      // monthlyPayment is a formatted string like "$574.85", so we parse it
      const paymentWithoutDown = parseFloat(
        resultWithoutDown.summary.monthlyPayment.replace(/[$,]/g, '')
      );
      const paymentWithDown = parseFloat(
        resultWithDown.summary.monthlyPayment.replace(/[$,]/g, '')
      );
      expect(paymentWithDown).toBeLessThan(paymentWithoutDown);
    });

    it('handles trade-in value', async () => {
      const result = await AutoLoanTool.execute({
        vehiclePrice: 35000,
        interestRate: 0.0499,
        loanTermMonths: 72,
        tradeInValue: 8000,
      });

      expect(result).toBeDefined();
    });

    it('handles trade-in with amount owed', async () => {
      const result = await AutoLoanTool.execute({
        vehiclePrice: 40000,
        interestRate: 0.0599,
        loanTermMonths: 60,
        tradeInValue: 15000,
        tradeInOwed: 5000,
      });

      expect(result).toBeDefined();
    });

    it('includes sales tax', async () => {
      const result = await AutoLoanTool.execute({
        vehiclePrice: 30000,
        interestRate: 0.0549,
        loanTermMonths: 60,
        salesTaxRate: 0.0825,
      });

      expect(result).toBeDefined();
      expect(result.costBreakdown).toBeDefined();
    });

    it('handles dealer and registration fees', async () => {
      const result = await AutoLoanTool.execute({
        vehiclePrice: 30000,
        interestRate: 0.0549,
        loanTermMonths: 60,
        registrationFees: 500,
        dealerFees: 800,
      });

      expect(result).toBeDefined();
    });

    it('handles manufacturer rebate', async () => {
      const resultWithoutRebate = await AutoLoanTool.execute({
        vehiclePrice: 35000,
        interestRate: 0.0549,
        loanTermMonths: 60,
      });

      const resultWithRebate = await AutoLoanTool.execute({
        vehiclePrice: 35000,
        interestRate: 0.0549,
        loanTermMonths: 60,
        manufacturerRebate: 3000,
      });

      // With rebate, monthly payment should be lower
      expect(parseFloat(resultWithRebate.summary.monthlyPayment.replace(/[$,]/g, ''))).toBeLessThan(
        parseFloat(resultWithoutRebate.summary.monthlyPayment.replace(/[$,]/g, ''))
      );
    });

    it('handles GAP insurance', async () => {
      const result = await AutoLoanTool.execute({
        vehiclePrice: 30000,
        interestRate: 0.0549,
        loanTermMonths: 60,
        includeGapInsurance: true,
        gapInsuranceCost: 800,
      });

      expect(result).toBeDefined();
    });

    it('handles extended warranty', async () => {
      const result = await AutoLoanTool.execute({
        vehiclePrice: 30000,
        interestRate: 0.0549,
        loanTermMonths: 60,
        includeExtendedWarranty: true,
        extendedWarrantyCost: 2000,
      });

      expect(result).toBeDefined();
    });

    it('includes early payoff scenarios', async () => {
      const result = await AutoLoanTool.execute({
        vehiclePrice: 30000,
        interestRate: 0.0549,
        loanTermMonths: 60,
      });

      expect(result.earlyPayoffScenarios).toBeDefined();
    });

    it('generates payment schedule', async () => {
      const result = await AutoLoanTool.execute({
        vehiclePrice: 25000,
        interestRate: 0.0449,
        loanTermMonths: 48,
      });

      expect(result.paymentSchedule).toBeDefined();
      expect(result.paymentSchedule.length).toBe(48);
    });

    it('rejects negative vehicle price', async () => {
      await expect(
        AutoLoanTool.execute({
          vehiclePrice: -30000,
          interestRate: 0.0549,
          loanTermMonths: 60,
        })
      ).rejects.toThrow();
    });

    it('rejects invalid loan term', async () => {
      await expect(
        AutoLoanTool.execute({
          vehiclePrice: 30000,
          interestRate: 0.0549,
          loanTermMonths: 6, // Too short
        })
      ).rejects.toThrow();
    });
  });
});
