import { describe, expect, it } from 'vitest';
import { AmortizationTool } from '../tools/amortization';

describe('AmortizationTool', () => {
  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(AmortizationTool.toolName).toBe('analyze_amortization');
    });

    it('has a description', () => {
      expect(AmortizationTool.description).toBe('Analyze loan amortization schedule');
    });

    it('has required input schema fields', () => {
      const schema = AmortizationTool.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toContain('principal');
      expect(schema.required).toContain('annualRate');
      expect(schema.required).toContain('termMonths');
    });

    it('defines all expected properties', () => {
      const props = AmortizationTool.inputSchema.properties;
      expect(props.principal).toBeDefined();
      expect(props.annualRate).toBeDefined();
      expect(props.termMonths).toBeDefined();
      expect(props.startDate).toBeDefined();
      expect(props.extraMonthlyPayment).toBeDefined();
      expect(props.oneTimePayments).toBeDefined();
      expect(props.paymentFrequency).toBeDefined();
      expect(props.interestOnlyMonths).toBeDefined();
      expect(props.balloonPayment).toBeDefined();
      expect(props.pmi).toBeDefined();
    });
  });

  describe('execute', () => {
    it('calculates basic amortization schedule', async () => {
      const result = await AmortizationTool.execute({
        principal: 200000,
        annualRate: 0.06,
        termMonths: 360,
      });

      expect(result.monthlyPayment).toBeGreaterThan(0);
      expect(result.schedule).toBeDefined();
      expect(result.schedule.length).toBe(360);
      expect(result.totalInterest).toBeGreaterThan(0);
      expect(result.insights).toBeDefined();
      expect(result.comprehensiveAnalysis).toBeDefined();
    });

    it('handles extra monthly payments', async () => {
      const baseResult = await AmortizationTool.execute({
        principal: 200000,
        annualRate: 0.06,
        termMonths: 360,
      });

      const resultWithExtra = await AmortizationTool.execute({
        principal: 200000,
        annualRate: 0.06,
        termMonths: 360,
        extraMonthlyPayment: 200,
      });

      // Extra payments should reduce total interest
      expect(resultWithExtra.totalInterest).toBeLessThan(baseResult.totalInterest);
    });

    it('handles biweekly payment frequency', async () => {
      const result = await AmortizationTool.execute({
        principal: 200000,
        annualRate: 0.06,
        termMonths: 360,
        paymentFrequency: 'biweekly',
      });

      expect(result.monthlyPayment).toBeGreaterThan(0);
      expect(result.schedule).toBeDefined();
    });

    it('handles interest-only period', async () => {
      const result = await AmortizationTool.execute({
        principal: 200000,
        annualRate: 0.06,
        termMonths: 360,
        interestOnlyMonths: 12,
      });

      expect(result.monthlyPayment).toBeGreaterThan(0);
      expect(result.schedule).toBeDefined();
    });

    it('includes insights in response', async () => {
      const result = await AmortizationTool.execute({
        principal: 200000,
        annualRate: 0.06,
        termMonths: 360,
      });

      expect(result.insights).toBeDefined();
      expect(result.insights.periods).toBeGreaterThan(0);
      expect(result.insights.totalInterestShare).toBeDefined();
      expect(result.insights.highestInterestMonth).toBeDefined();
    });

    it('includes comprehensive analysis', async () => {
      const result = await AmortizationTool.execute({
        principal: 200000,
        annualRate: 0.06,
        termMonths: 360,
      });

      expect(result.comprehensiveAnalysis).toBeDefined();
    });

    it('handles PMI configuration', async () => {
      const result = await AmortizationTool.execute({
        principal: 200000,
        annualRate: 0.06,
        termMonths: 360,
        pmi: {
          enabled: true,
          rate: 0.005,
          dropOffLTV: 0.8,
          homeValue: 250000,
        },
      });

      expect(result.monthlyPayment).toBeGreaterThan(0);
    });

    it('rejects invalid input', () => {
      expect(() =>
        AmortizationTool.execute({
          principal: -1000,
          annualRate: 0.06,
          termMonths: 360,
        })
      ).toThrow();
    });

    it('rejects missing required fields', () => {
      expect(() =>
        AmortizationTool.execute({
          principal: 200000,
        })
      ).toThrow();
    });
  });
});
