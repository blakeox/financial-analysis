/**
 * Equipment Lease vs Buy MCP Tool
 */

import { EquipmentLeaseVsBuyInputSchema, EquipmentLeaseVsBuyCalculator } from '@financial-analysis/analysis';

export class EquipmentLeaseVsBuyTool {
  static readonly toolName = 'analyze_equipment_lease_vs_buy';
  static readonly description =
    'Compare equipment leasing vs purchasing with tax implications, NPV/IRR analysis, and cash flow comparison';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      equipmentInfo: {
        type: 'object',
        properties: {
          purchasePrice: { type: 'number', minimum: 0, description: 'Purchase price' },
          usefulLife: { type: 'number', minimum: 1, maximum: 20, default: 5, description: 'Useful life (years)' },
          expectedResidualValue: { type: 'number', minimum: 0, default: 0, description: 'Expected residual value' },
        },
        required: ['purchasePrice', 'usefulLife'],
      },
      leaseTerms: {
        type: 'object',
        properties: {
          leaseType: {
            type: 'string',
            enum: ['operating-lease', 'capital-lease', 'finance-lease'],
            default: 'operating-lease',
            description: 'Lease type',
          },
          leaseTerm: { type: 'number', minimum: 1, maximum: 10, default: 5, description: 'Lease term (years)' },
          monthlyPayment: { type: 'number', minimum: 0, description: 'Monthly lease payment' },
          downPayment: { type: 'number', minimum: 0, default: 0, description: 'Down payment' },
          buyoutOption: { type: 'boolean', default: false, description: 'Buyout option available' },
          buyoutPrice: { type: 'number', minimum: 0, default: 0, description: 'Buyout price' },
          maintenanceIncluded: { type: 'boolean', default: false, description: 'Maintenance included' },
        },
        required: ['leaseTerm', 'monthlyPayment'],
      },
      purchaseTerms: {
        type: 'object',
        properties: {
          downPayment: { type: 'number', minimum: 0, default: 0, description: 'Down payment' },
          loanTerm: { type: 'number', minimum: 1, maximum: 10, default: 5, description: 'Loan term (years)' },
          interestRate: { type: 'number', minimum: 0, maximum: 0.2, default: 0.08, description: 'Interest rate' },
          annualMaintenanceCost: { type: 'number', minimum: 0, default: 0, description: 'Annual maintenance cost' },
        },
        required: ['loanTerm', 'interestRate'],
      },
      taxInfo: {
        type: 'object',
        properties: {
          federalTaxRate: { type: 'number', minimum: 0, maximum: 0.5, default: 0.21, description: 'Federal tax rate' },
          section179Eligible: { type: 'boolean', default: true, description: 'Section 179 eligible' },
          bonusDepreciationEligible: { type: 'boolean', default: true, description: 'Bonus depreciation eligible' },
        },
        required: ['federalTaxRate'],
      },
      analysis: {
        type: 'object',
        properties: {
          includeNPV: { type: 'boolean', default: true, description: 'Include NPV' },
          includeIRR: { type: 'boolean', default: true, description: 'Include IRR' },
          includeCashFlowComparison: { type: 'boolean', default: true, description: 'Include cash flow comparison' },
          includeTaxImpact: { type: 'boolean', default: true, description: 'Include tax impact' },
          analysisPeriod: { type: 'number', minimum: 1, maximum: 20, default: 5, description: 'Analysis period (years)' },
        },
        required: ['analysisPeriod'],
      },
    },
    required: ['equipmentInfo', 'leaseTerms', 'purchaseTerms', 'taxInfo', 'analysis'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = EquipmentLeaseVsBuyInputSchema.parse(args);
    return EquipmentLeaseVsBuyCalculator.analyze(validated);
  }
}


