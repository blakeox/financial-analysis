import { describe, expect, it } from 'vitest';
import { InventoryOptimizationTool } from '../tools/inventory-optimization';

describe('InventoryOptimizationTool', () => {
  const validInput = {
    inventoryData: {
      currentInventory: [
        {
          sku: 'SKU-1',
          currentStock: 100,
          unitCost: 10,
          annualDemand: 1200,
          demandVariability: 0.2,
          leadTime: 30,
          leadTimeVariability: 0,
        },
      ],
      totalInventoryValue: 1000,
    },
    costs: {
      orderingCost: 50,
      holdingCostRate: 0.2,
      stockoutCost: 0,
      carryingCost: 0,
    },
    serviceLevel: {
      targetServiceLevel: 0.95,
      safetyStockMultiplier: 1.65,
    },
    analysis: {
      includeEOQ: true,
      includeABC: true,
      includeSafetyStock: true,
      includeReorderPoint: true,
      includeTotalCostAnalysis: true,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(InventoryOptimizationTool.toolName).toBe('analyze_inventory_optimization');
    expect(InventoryOptimizationTool.inputSchema.required).toEqual(['inventoryData']);
  });

  it('calculates EOQ, safety stock, and cost savings', async () => {
    const result = (await InventoryOptimizationTool.execute(validInput)) as {
      summary: {
        totalInventoryValue: number;
        optimalOrderQuantity: number;
        totalSafetyStock: number;
        totalCostSavings: number;
      };
    };

    expect(result.summary.totalInventoryValue).toBeCloseTo(1000, 6);
    expect(result.summary.optimalOrderQuantity).toBeCloseTo(245, 6);
    expect(result.summary.totalSafetyStock).toBeCloseTo(8, 6);
    expect(result.summary.totalCostSavings).toBeCloseTo(0, 6);
  });

  it('rejects invalid input', async () => {
    await expect(
      InventoryOptimizationTool.execute({
        ...validInput,
        costs: {
          ...validInput.costs,
          holdingCostRate: 1.5,
        },
      })
    ).rejects.toThrow();
  });
});
