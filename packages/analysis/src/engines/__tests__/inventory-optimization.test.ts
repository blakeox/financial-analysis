/**
 * Inventory Optimization Tests
 */

import { describe, expect, it } from 'vitest';
import type { InventoryOptimizationInput } from '../../schemas/inventory-optimization.js';
import { InventoryOptimizer } from '../inventory-optimization.js';

describe('InventoryOptimizer', () => {
  const baseInput: InventoryOptimizationInput = {
    inventoryData: {
      currentInventory: [
        {
          sku: 'SKU001',
          currentStock: 1000,
          unitCost: 10,
          annualDemand: 5000,
          leadTime: 7,
        },
        {
          sku: 'SKU002',
          currentStock: 500,
          unitCost: 25,
          annualDemand: 2000,
          leadTime: 14,
        },
      ],
      totalInventoryValue: 22500,
    },
    costs: {
      orderingCost: 50,
      holdingCostRate: 0.2,
      stockoutCost: 100,
    },
    serviceLevel: {
      targetServiceLevel: 0.95,
    },
    analysis: {
      includeEOQ: true,
      includeABC: true,
      includeSafetyStock: true,
      includeReorderPoint: true,
      includeTotalCostAnalysis: true,
    },
  };

  it('should calculate inventory optimization', () => {
    const result = InventoryOptimizer.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
  });

  it('should calculate EOQ when requested', () => {
    const result = InventoryOptimizer.analyze(baseInput) as any;
    expect(result.eoqAnalysis).toBeDefined();
    expect(Array.isArray(result.eoqAnalysis.items)).toBe(true);
  });

  it('should perform ABC analysis when requested', () => {
    const result = InventoryOptimizer.analyze(baseInput);
    expect(result.abcAnalysis).toBeDefined();
  });

  it('should calculate safety stock', () => {
    const result = InventoryOptimizer.analyze(baseInput);
    expect(result.safetyStockAnalysis).toBeDefined();
  });

  it('should calculate reorder points', () => {
    const result = InventoryOptimizer.analyze(baseInput);
    expect(result.reorderPointAnalysis).toBeDefined();
  });
});

