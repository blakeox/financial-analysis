/**
 * Inventory Optimization Model
 * Optimize inventory levels with EOQ, safety stock, and ABC analysis
 */

import type { InventoryOptimizationInput } from '../../schemas/inventory-optimization.js';

export class InventoryOptimizer {
  /**
   * Optimize inventory levels
   */
  static analyze(input: InventoryOptimizationInput): unknown {
    const inventoryData = input.inventoryData;
    const costs = input.costs;
    const serviceLevel = input.serviceLevel;
    const analysis = input.analysis;

    // EOQ analysis
    const eoqAnalysis = analysis.includeEOQ ? this.calculateEOQ(inventoryData, costs) : undefined;

    // ABC analysis
    const abcAnalysis = analysis.includeABC ? this.performABCAnalysis(inventoryData) : undefined;

    // Safety stock calculation
    const safetyStockAnalysis = analysis.includeSafetyStock
      ? this.calculateSafetyStock(inventoryData, serviceLevel)
      : undefined;

    // Reorder point
    const reorderPointAnalysis = analysis.includeReorderPoint
      ? this.calculateReorderPoint(inventoryData, safetyStockAnalysis)
      : undefined;

    // Total cost analysis
    const totalCostAnalysis = analysis.includeTotalCostAnalysis
      ? this.analyzeTotalCosts(inventoryData, costs, eoqAnalysis, safetyStockAnalysis)
      : undefined;

    // Recommendations
    const recommendations = this.generateRecommendations(
      eoqAnalysis,
      abcAnalysis,
      safetyStockAnalysis,
      totalCostAnalysis
    );

    return {
      summary: {
        totalInventoryValue: inventoryData.totalInventoryValue,
        optimalOrderQuantity: eoqAnalysis?.averageEOQ || 0,
        totalSafetyStock: safetyStockAnalysis?.totalSafetyStock || 0,
        totalCostSavings: totalCostAnalysis?.potentialSavings || 0,
      },
      eoqAnalysis,
      abcAnalysis,
      safetyStockAnalysis,
      reorderPointAnalysis,
      totalCostAnalysis,
      recommendations,
    };
  }

  private static calculateEOQ(
    inventory: InventoryOptimizationInput['inventoryData'],
    costs: InventoryOptimizationInput['costs']
  ): {
    items: Array<{
      sku: string;
      eoq: number;
      annualOrders: number;
      totalCost: number;
    }>;
    averageEOQ: number;
  } {
    const items = inventory.currentInventory.map((item) => {
      // EOQ = sqrt(2 * Annual Demand * Ordering Cost / Holding Cost per unit)
      const holdingCostPerUnit = item.unitCost * costs.holdingCostRate;
      const eoq = Math.sqrt((2 * item.annualDemand * costs.orderingCost) / holdingCostPerUnit);
      const annualOrders = item.annualDemand / eoq;
      const totalCost = costs.orderingCost * annualOrders + holdingCostPerUnit * (eoq / 2);

      return {
        sku: item.sku,
        eoq: Math.ceil(eoq),
        annualOrders: Math.ceil(annualOrders),
        totalCost,
      };
    });

    const averageEOQ = items.reduce((sum, item) => sum + item.eoq, 0) / items.length;

    return {
      items,
      averageEOQ,
    };
  }

  private static performABCAnalysis(inventory: InventoryOptimizationInput['inventoryData']): {
    aItems: Array<{ sku: string; value: number; percentage: number }>;
    bItems: Array<{ sku: string; value: number; percentage: number }>;
    cItems: Array<{ sku: string; value: number; percentage: number }>;
  } {
    const items = inventory.currentInventory
      .map((item) => ({
        sku: item.sku,
        value: item.currentStock * item.unitCost,
      }))
      .sort((a, b) => b.value - a.value);

    const totalValue = items.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercentage = 0;

    const aItems: Array<{ sku: string; value: number; percentage: number }> = [];
    const bItems: Array<{ sku: string; value: number; percentage: number }> = [];
    const cItems: Array<{ sku: string; value: number; percentage: number }> = [];

    items.forEach((item) => {
      const percentage = (item.value / totalValue) * 100;
      cumulativePercentage += percentage;

      if (cumulativePercentage <= 80) {
        aItems.push({ ...item, percentage });
      } else if (cumulativePercentage <= 95) {
        bItems.push({ ...item, percentage });
      } else {
        cItems.push({ ...item, percentage });
      }
    });

    return { aItems, bItems, cItems };
  }

  private static calculateSafetyStock(
    inventory: InventoryOptimizationInput['inventoryData'],
    serviceLevel: InventoryOptimizationInput['serviceLevel']
  ): {
    items: Array<{
      sku: string;
      safetyStock: number;
      reorderPoint: number;
    }>;
    totalSafetyStock: number;
  } {
    const items = inventory.currentInventory.map((item) => {
      const demandVariability = item.annualDemand * item.demandVariability;
      const leadTimeVariability = item.leadTimeVariability || 0;
      const safetyStock =
        serviceLevel.safetyStockMultiplier *
        Math.sqrt(
          (demandVariability * item.leadTime) / 365 +
            (leadTimeVariability * item.annualDemand) / 365
        );
      const reorderPoint = (item.annualDemand * item.leadTime) / 365 + safetyStock;

      return {
        sku: item.sku,
        safetyStock: Math.ceil(safetyStock),
        reorderPoint: Math.ceil(reorderPoint),
      };
    });

    const totalSafetyStock = items.reduce((sum, item) => sum + item.safetyStock, 0);

    return {
      items,
      totalSafetyStock,
    };
  }

  private static calculateReorderPoint(
    _inventory: InventoryOptimizationInput['inventoryData'],
    safetyStock: { items: Array<{ sku: string; reorderPoint: number }> } | undefined
  ): {
    items: Array<{ sku: string; reorderPoint: number }>;
  } {
    if (!safetyStock) {
      return { items: [] };
    }

    return {
      items: safetyStock.items,
    };
  }

  private static analyzeTotalCosts(
    inventory: InventoryOptimizationInput['inventoryData'],
    costs: InventoryOptimizationInput['costs'],
    eoq: { items: Array<{ totalCost: number }> } | undefined,
    safetyStock: { totalSafetyStock: number } | undefined
  ): {
    currentTotalCost: number;
    optimizedTotalCost: number;
    potentialSavings: number;
  } {
    const currentTotalCost = inventory.totalInventoryValue * costs.holdingCostRate;
    const optimizedTotalCost = eoq
      ? eoq.items.reduce((sum, item) => sum + item.totalCost, 0) +
        (safetyStock?.totalSafetyStock || 0) * costs.holdingCostRate
      : currentTotalCost;
    const potentialSavings = currentTotalCost - optimizedTotalCost;

    return {
      currentTotalCost,
      optimizedTotalCost,
      potentialSavings: Math.max(0, potentialSavings),
    };
  }

  private static generateRecommendations(
    eoq: { averageEOQ: number } | undefined,
    abc: { aItems: Array<unknown> } | undefined,
    safetyStock: { totalSafetyStock: number } | undefined,
    costs: { potentialSavings: number } | undefined
  ): string[] {
    const recommendations: string[] = [];

    if (eoq) {
      recommendations.push(`Optimal order quantity: ${eoq.averageEOQ.toFixed(0)} units`);
    }

    if (abc) {
      recommendations.push(`Focus on ${abc.aItems.length} A-items (80% of value)`);
    }

    if (safetyStock) {
      recommendations.push(`Total safety stock: ${safetyStock.totalSafetyStock.toFixed(0)} units`);
    }

    if (costs && costs.potentialSavings > 0) {
      recommendations.push(`Potential cost savings: $${costs.potentialSavings.toFixed(0)}`);
    }

    return recommendations;
  }
}
