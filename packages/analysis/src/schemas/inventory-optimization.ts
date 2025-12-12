import { z } from 'zod';

export const InventoryOptimizationInputSchema = z.object({
  inventoryData: z.object({
    currentInventory: z.array(
      z.object({
        sku: z.string(),
        description: z.string().optional(),
        currentStock: z.number().min(0),
        unitCost: z.number().min(0),
        annualDemand: z.number().min(0),
        demandVariability: z.number().min(0).max(1).default(0.2), // Coefficient of variation
        leadTime: z.number().min(0), // days
        leadTimeVariability: z.number().min(0).default(0), // days standard deviation
      })
    ),
    totalInventoryValue: z.number().min(0),
  }),
  costs: z.object({
    orderingCost: z.number().min(0).default(50), // Cost per order
    holdingCostRate: z.number().min(0).max(1).default(0.2), // Annual holding cost as % of value
    stockoutCost: z.number().min(0).default(0), // Cost per unit stockout
    carryingCost: z.number().min(0).default(0), // Annual carrying cost
  }),
  serviceLevel: z.object({
    targetServiceLevel: z.number().min(0).max(1).default(0.95), // 95% fill rate
    safetyStockMultiplier: z.number().min(0).default(1.65), // Z-score for service level
  }),
  analysis: z.object({
    includeEOQ: z.boolean().default(true), // Economic Order Quantity
    includeABC: z.boolean().default(true), // ABC analysis
    includeSafetyStock: z.boolean().default(true),
    includeReorderPoint: z.boolean().default(true),
    includeTotalCostAnalysis: z.boolean().default(true),
  }),
});

export type InventoryOptimizationInput = z.infer<typeof InventoryOptimizationInputSchema>;


