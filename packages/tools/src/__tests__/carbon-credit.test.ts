import { describe, expect, it } from 'vitest';
import { CarbonCreditValuationTool } from '../tools/carbon-credit';

describe('CarbonCreditValuationTool', () => {
  const validInput = {
    tonnesCO2e: 1000,
    pricePerTonne: 25,
    yearsUntilSale: 3,
    priceGrowthRate: 0.04,
    discountRate: 0.08,
  };

  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(CarbonCreditValuationTool.toolName).toBe('value_carbon_credits');
    });

    it('requires tonnes and price per tonne', () => {
      expect(CarbonCreditValuationTool.inputSchema.required).toEqual([
        'tonnesCO2e',
        'pricePerTonne',
      ]);
    });
  });

  describe('execute', () => {
    it('calculates spot, future, and present value', async () => {
      const result = (await CarbonCreditValuationTool.execute(validInput)) as {
        spotValue: number;
        futurePricePerTonne: number;
        futureValue: number;
        presentValue: number;
      };

      expect(result.spotValue).toBeCloseTo(25000, 6);
      expect(result.futurePricePerTonne).toBeCloseTo(28.1216, 6);
      expect(result.futureValue).toBeCloseTo(28121.6, 6);
      expect(result.presentValue).toBeCloseTo(22323.832749, 6);
    });

    it('rejects invalid input', async () => {
      await expect(
        CarbonCreditValuationTool.execute({
          ...validInput,
          tonnesCO2e: -1,
        })
      ).rejects.toThrow();
    });
  });
});
