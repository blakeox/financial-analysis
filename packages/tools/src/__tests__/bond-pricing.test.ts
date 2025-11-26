import { describe, expect, it } from 'vitest';
import { BondPricingTool } from '../tools/bond-pricing';

describe('BondPricingTool', () => {
  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(BondPricingTool.toolName).toBe('analyze_bond_pricing');
    });

    it('has a description', () => {
      expect(BondPricingTool.description).toBeTruthy();
      expect(BondPricingTool.description.length).toBeGreaterThan(50);
    });

    it('has required input schema fields', () => {
      const schema = BondPricingTool.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toContain('couponRate');
      expect(schema.required).toContain('yieldToMaturity');
      expect(schema.required).toContain('maturityDate');
      expect(schema.required).toContain('issueDate');
    });

    it('has valid bondType enum values', () => {
      const bondTypeEnum = BondPricingTool.inputSchema.properties.bondType.enum;
      expect(bondTypeEnum).toContain('treasury');
      expect(bondTypeEnum).toContain('corporate');
      expect(bondTypeEnum).toContain('municipal');
      expect(bondTypeEnum).toContain('agency');
      expect(bondTypeEnum).toContain('zero-coupon');
    });
  });

  describe('execute', () => {
    it('calculates bond price for treasury bond', async () => {
      const result = await BondPricingTool.execute({
        bondType: 'treasury',
        principal: 1000,
        couponRate: 0.05,
        yieldToMaturity: 0.04,
        issueDate: '2020-01-01',
        maturityDate: '2030-01-01',
        settlementDate: '2025-01-01',
      });

      const parsed = JSON.parse(result);
      expect(parsed.bondType).toBe('treasury');
      expect(parsed.faceValue).toBe(1000);
      expect(parsed.couponRate).toBe(0.05);
      expect(parsed.metrics).toBeDefined();
      expect(parsed.metrics.price).toBeGreaterThan(0);
      expect(parsed.metrics.yieldToMaturity).toBe(0.04);
    });

    it('calculates with default bondType when not provided', async () => {
      const result = await BondPricingTool.execute({
        principal: 1000,
        couponRate: 0.05,
        yieldToMaturity: 0.04,
        issueDate: '2020-01-01',
        maturityDate: '2030-01-01',
      });

      const parsed = JSON.parse(result);
      expect(parsed.bondType).toBe('treasury');
    });

    it('uses faceValue as alternative to principal', async () => {
      const result = await BondPricingTool.execute({
        faceValue: 5000,
        couponRate: 0.06,
        yieldToMaturity: 0.05,
        issueDate: '2020-01-01',
        maturityDate: '2030-01-01',
      });

      const parsed = JSON.parse(result);
      expect(parsed.faceValue).toBe(5000);
    });

    it('defaults face value to 1000 when not provided', async () => {
      const result = await BondPricingTool.execute({
        couponRate: 0.05,
        yieldToMaturity: 0.04,
        issueDate: '2020-01-01',
        maturityDate: '2030-01-01',
      });

      const parsed = JSON.parse(result);
      expect(parsed.faceValue).toBe(1000);
    });

    it('includes duration metrics', async () => {
      const result = await BondPricingTool.execute({
        bondType: 'corporate',
        principal: 1000,
        couponRate: 0.06,
        yieldToMaturity: 0.05,
        issueDate: '2020-01-01',
        maturityDate: '2030-01-01',
      });

      const parsed = JSON.parse(result);
      expect(parsed.metrics.macaulayDuration).toBeDefined();
      expect(parsed.metrics.modifiedDuration).toBeDefined();
      expect(parsed.metrics.convexity).toBeDefined();
    });

    it('returns error for invalid input', async () => {
      const result = await BondPricingTool.execute({
        bondType: 'invalid-type',
        couponRate: 0.05,
        yieldToMaturity: 0.04,
        issueDate: 'invalid-date',
        maturityDate: '2030-01-01',
      });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBeDefined();
    });

    it('handles municipal bond type', async () => {
      const result = await BondPricingTool.execute({
        bondType: 'municipal',
        principal: 10000,
        couponRate: 0.04,
        yieldToMaturity: 0.035,
        issueDate: '2020-06-01',
        maturityDate: '2035-06-01',
      });

      const parsed = JSON.parse(result);
      expect(parsed.bondType).toBe('municipal');
      expect(parsed.faceValue).toBe(10000);
    });

    it('handles zero-coupon bond type', async () => {
      const result = await BondPricingTool.execute({
        bondType: 'zero-coupon',
        principal: 1000,
        couponRate: 0,
        yieldToMaturity: 0.05,
        issueDate: '2020-01-01',
        maturityDate: '2030-01-01',
      });

      const parsed = JSON.parse(result);
      expect(parsed.bondType).toBe('zero-coupon');
    });
  });
});
