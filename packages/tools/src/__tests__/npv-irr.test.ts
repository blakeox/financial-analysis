import { describe, expect, it } from 'vitest';
import { NPVIRRTool } from '../tools/npv-irr';

describe('NPVIRRTool', () => {
  const validInput = {
    cashFlows: [-1000, 400, 400, 400],
    discountRate: 0.1,
    sensitivityDiscountRates: [0.08, 0.12],
  };

  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(NPVIRRTool.toolName).toBe('calculate_npv_irr');
    });

    it('requires cash flows and a discount rate', () => {
      expect(NPVIRRTool.inputSchema.required).toEqual(['cashFlows', 'discountRate']);
    });
  });

  describe('execute', () => {
    it('calculates npv, irr, payback period, and sensitivity', async () => {
      const result = (await NPVIRRTool.execute(validInput)) as {
        npv: number;
        irr: number | null;
        paybackPeriod: number | null;
        sensitivity?: Array<{ discountRate: number; npv: number }>;
      };

      expect(result.npv).toBeCloseTo(-5.2592036063, 6);
      expect(result.irr).not.toBeNull();
      expect(result.paybackPeriod).toBeCloseTo(2.5, 6);
      expect(result.sensitivity).toEqual([
        expect.objectContaining({ discountRate: 0.08 }),
        expect.objectContaining({ discountRate: 0.12 }),
      ]);
    });

    it('rejects invalid input', async () => {
      await expect(NPVIRRTool.execute({ cashFlows: [] })).rejects.toThrow();
    });
  });
});
