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
    const result = InventoryOptimizer.analyze(baseInput);
    expect(result.eoqAnalysis).toBeDefined();
    expect(Array.isArray(result.eoqAnalysis)).toBe(true);
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

  it('should handle disabled analyses', () => {
    const result = InventoryOptimizer.analyze({
      ...baseInput,
      analysis: {
        includeEOQ: false,
        includeABC: false,
        includeSafetyStock: false,
        includeReorderPoint: false,
        includeTotalCostAnalysis: false,
      },
    });

    expect(result.eoqAnalysis).toBeUndefined();
    expect(result.abcAnalysis).toBeUndefined();
    expect(result.safetyStockAnalysis).toBeUndefined();
    expect(result.reorderPointAnalysis).toBeUndefined();
    expect(result.totalCostAnalysis).toBeUndefined();
    expect(result.recommendations.length).toBe(0);
  });

  it('should classify items into ABC buckets', () => {
    const result = InventoryOptimizer.analyze({
      ...baseInput,
      inventoryData: {
        currentInventory: [
          { sku: 'A1', currentStock: 1, unitCost: 80, annualDemand: 500, leadTime: 5 },
          { sku: 'B1', currentStock: 1, unitCost: 10, annualDemand: 500, leadTime: 5 },
          { sku: 'C1', currentStock: 1, unitCost: 5, annualDemand: 500, leadTime: 5 },
          { sku: 'C2', currentStock: 1, unitCost: 5, annualDemand: 500, leadTime: 5 },
        ],
        totalInventoryValue: 0,
      },
    });

    expect(result.abcAnalysis.aItems.length).toBeGreaterThan(0);
    expect(result.abcAnalysis.bItems.length).toBeGreaterThan(0);
    expect(result.abcAnalysis.cItems.length).toBeGreaterThan(0);
  });

  it('should include safety stock lead time variability', () => {
    const result = InventoryOptimizer.analyze({
      ...baseInput,
      inventoryData: {
        currentInventory: [
          {
            sku: 'SKU003',
            currentStock: 200,
            unitCost: 20,
            annualDemand: 3000,
            leadTime: 10,
            demandVariability: 0.2,
            leadTimeVariability: 4,
          },
        ],
        totalInventoryValue: 4000,
      },
      serviceLevel: {
        targetServiceLevel: 0.95,
        safetyStockMultiplier: 1.65,
      },
    });

    expect(result.safetyStockAnalysis.totalSafetyStock).toBeGreaterThan(0);
    expect(result.reorderPointAnalysis.items[0].reorderPoint).toBeGreaterThan(0);
  });

  it('should skip savings recommendation when no savings', () => {
    const result = InventoryOptimizer.analyze({
      ...baseInput,
      analysis: {
        ...baseInput.analysis,
        includeEOQ: false,
      },
      costs: {
        ...baseInput.costs,
        holdingCostRate: 0,
      },
      serviceLevel: {
        targetServiceLevel: 0.95,
        safetyStockMultiplier: 0,
      },
    });

    expect(result.totalCostAnalysis.potentialSavings).toBe(0);
    expect(result.recommendations.some((item: string) => item.includes('Potential cost savings'))).toBe(false);
  });
});

