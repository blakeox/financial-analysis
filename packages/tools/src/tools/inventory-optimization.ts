/**
 * Inventory Optimization MCP Tool
 */

import { InventoryOptimizationInputSchema, InventoryOptimizer } from '@financial-analysis/analysis';

export class InventoryOptimizationTool {
  static readonly toolName = 'analyze_inventory_optimization';
  static readonly description =
    'Optimize inventory levels with EOQ, safety stock calculations, ABC analysis, reorder points, and total cost optimization';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      inventoryData: {
        type: 'object',
        properties: {
          currentInventory: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                sku: { type: 'string', description: 'SKU' },
                currentStock: { type: 'number', minimum: 0, description: 'Current stock' },
                unitCost: { type: 'number', minimum: 0, description: 'Unit cost' },
                annualDemand: { type: 'number', minimum: 0, description: 'Annual demand' },
                leadTime: { type: 'number', minimum: 0, description: 'Lead time (days)' },
              },
              required: ['sku', 'currentStock', 'unitCost', 'annualDemand', 'leadTime'],
            },
          },
          totalInventoryValue: { type: 'number', minimum: 0, description: 'Total inventory value' },
        },
        required: ['currentInventory', 'totalInventoryValue'],
      },
      costs: {
        type: 'object',
        properties: {
          orderingCost: {
            type: 'number',
            minimum: 0,
            default: 50,
            description: 'Ordering cost per order',
          },
          holdingCostRate: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            default: 0.2,
            description: 'Annual holding cost rate',
          },
          stockoutCost: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Stockout cost per unit',
          },
        },
      },
      serviceLevel: {
        type: 'object',
        properties: {
          targetServiceLevel: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            default: 0.95,
            description: 'Target service level',
          },
        },
      },
      analysis: {
        type: 'object',
        properties: {
          includeEOQ: { type: 'boolean', default: true, description: 'Include EOQ analysis' },
          includeABC: { type: 'boolean', default: true, description: 'Include ABC analysis' },
          includeSafetyStock: {
            type: 'boolean',
            default: true,
            description: 'Include safety stock',
          },
          includeReorderPoint: {
            type: 'boolean',
            default: true,
            description: 'Include reorder point',
          },
          includeTotalCostAnalysis: {
            type: 'boolean',
            default: true,
            description: 'Include total cost analysis',
          },
        },
      },
    },
    required: ['inventoryData'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = InventoryOptimizationInputSchema.parse(args);
    return InventoryOptimizer.analyze(validated);
  }
}
