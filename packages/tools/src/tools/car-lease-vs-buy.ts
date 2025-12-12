/**
 * Car Lease vs Buy MCP Tool
 */

import { CarLeaseVsBuyCalculator, CarLeaseVsBuyInputSchema } from '@financial-analysis/analysis';

export class CarLeaseVsBuyTool {
  static readonly toolName = 'analyze_car_lease_vs_buy';
  static readonly description =
    'Compare car leasing vs buying with total cost analysis, mileage considerations, early termination scenarios, and opportunity cost';

  static readonly inputSchema = {
    type: 'object',
    properties: {
      vehicleInfo: {
        type: 'object',
        properties: {
          msrp: { type: 'number', minimum: 0, description: 'Manufacturer suggested retail price' },
          negotiatedPrice: { type: 'number', minimum: 0, description: 'Negotiated purchase price' },
          residualValue: { type: 'number', minimum: 0, description: 'Residual value (for lease)' },
        },
        required: ['msrp', 'negotiatedPrice'],
      },
      leaseTerms: {
        type: 'object',
        properties: {
          leaseTerm: { type: 'number', minimum: 24, maximum: 60, default: 36, description: 'Lease term (months)' },
          downPayment: { type: 'number', minimum: 0, default: 0, description: 'Down payment' },
          monthlyPayment: { type: 'number', minimum: 0, description: 'Monthly lease payment' },
          moneyFactor: { type: 'number', minimum: 0, default: 0.001, description: 'Money factor' },
          residualPercentage: { type: 'number', minimum: 0, maximum: 1, default: 0.5, description: 'Residual percentage' },
          mileageAllowance: { type: 'number', minimum: 0, default: 12000, description: 'Annual mileage allowance' },
          excessMileageFee: { type: 'number', minimum: 0, default: 0.25, description: 'Excess mileage fee per mile' },
        },
        required: ['leaseTerm', 'monthlyPayment'],
      },
      purchaseTerms: {
        type: 'object',
        properties: {
          loanTerm: { type: 'number', minimum: 12, maximum: 84, default: 60, description: 'Loan term (months)' },
          downPayment: { type: 'number', minimum: 0, default: 0, description: 'Down payment' },
          interestRate: { type: 'number', minimum: 0, maximum: 0.2, default: 0.05, description: 'Interest rate' },
          salesTaxRate: { type: 'number', minimum: 0, maximum: 0.2, default: 0.08, description: 'Sales tax rate' },
        },
        required: ['loanTerm', 'interestRate'],
      },
      ownershipCosts: {
        type: 'object',
        properties: {
          annualInsurance: { type: 'number', minimum: 0, description: 'Annual insurance cost' },
          annualMaintenance: { type: 'number', minimum: 0, default: 0, description: 'Annual maintenance' },
          annualRepairs: { type: 'number', minimum: 0, default: 0, description: 'Annual repairs' },
          fuelCost: { type: 'number', minimum: 0, default: 0, description: 'Annual fuel cost' },
          expectedOwnershipYears: { type: 'number', minimum: 1, maximum: 20, default: 6, description: 'Expected ownership years' },
        },
        required: ['annualInsurance'],
      },
      financialAssumptions: {
        type: 'object',
        properties: {
          opportunityCostRate: { type: 'number', minimum: 0, maximum: 0.2, default: 0.07, description: 'Opportunity cost rate' },
          expectedDepreciation: { type: 'number', minimum: 0, maximum: 1, default: 0.15, description: 'Annual depreciation rate' },
        },
      },
      analysis: {
        type: 'object',
        properties: {
          analysisPeriod: { type: 'number', minimum: 1, maximum: 10, default: 3, description: 'Analysis period (years)' },
          includeTaxBenefits: { type: 'boolean', default: true, description: 'Include tax benefits' },
          includeEarlyTermination: { type: 'boolean', default: false, description: 'Include early termination analysis' },
        },
      },
    },
    required: ['vehicleInfo', 'leaseTerms', 'purchaseTerms', 'ownershipCosts'],
  };

  static async execute(args: unknown): Promise<unknown> {
    const validated = CarLeaseVsBuyInputSchema.parse(args);
    return CarLeaseVsBuyCalculator.analyze(validated);
  }
}


