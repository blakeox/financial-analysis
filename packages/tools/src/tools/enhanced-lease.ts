import { EnhancedLeaseAnalyzer, type EnhancedLeaseAnalysisResult } from '@financial-analysis/analysis';
import { z } from 'zod';

// MCP-compatible input schema for enhanced lease analysis
const EnhancedLeaseToolInputSchema = z.object({
  // Basic lease information
  leaseType: z.enum([
    'equipment',
    'office-gross',
    'office-nnn',
    'office-modified',
    'warehouse-gross',
    'warehouse-nnn',
    'retail-base',
    'retail-percentage',
    'medical-gross',
    'medical-nnn',
    'mixed-use',
    'commercial-gross',
    'commercial-nnn',
    'commercial-modified',
  ]).default('equipment'),
  principal: z.number().min(0).default(0),
  baseRent: z.number().positive().optional(),
  annualRate: z.number().min(0).max(1).default(0),
  termMonths: z.number().int().positive(),
  residualValue: z.number().min(0).default(0),

  // Advanced lease terms
  escalation: z
    .object({
      type: z.enum(['none', 'fixed', 'cpi', 'market', 'stepped']).default('none'),
      rate: z.number().min(0).default(0),
      schedule: z
        .array(
          z.object({
            startMonth: z.number().int().positive(),
            rate: z.number().min(0),
          })
        )
        .default([]),
      cpiBase: z.number().min(0).default(0),
    })
    .optional(),

  // Additional costs
  additionalCosts: z
    .object({
      camCharges: z.number().min(0).default(0),
      propertyTaxes: z.number().min(0).default(0),
      insurance: z.number().min(0).default(0),
      utilities: z.number().min(0).default(0),
      maintenance: z.number().min(0).default(0),
      managementFee: z.number().min(0).default(0),
      parking: z.number().min(0).default(0),
      security: z.number().min(0).default(0),
      cleaning: z.number().min(0).default(0),
      technology: z.number().min(0).default(0),
      elevatorMaintenance: z.number().min(0).default(0),
      hvacMaintenance: z.number().min(0).default(0),
      landscaping: z.number().min(0).default(0),
      wasteManagement: z.number().min(0).default(0),
    })
    .optional(),

  // Options and flexibility
  renewalOptions: z
    .array(
      z.object({
        termMonths: z.number().int().positive(),
        rateAdjustment: z.number().default(0),
        marketRateOption: z.boolean().default(false),
        escalationType: z.enum(['none', 'fixed', 'cpi', 'market', 'stepped']).default('none'),
        escalationRate: z.number().min(0).default(0),
      })
    )
    .default([]),
  purchaseOption: z
    .object({
      enabled: z.boolean().default(false),
      fixedAmount: z.number().min(0).optional(),
      fairMarketValue: z.boolean().default(false),
      percentage: z.number().min(0).max(1).optional(),
    })
    .optional(),
  earlyTermination: z
    .object({
      allowed: z.boolean().default(false),
      penaltyMonths: z.number().int().min(0).default(0),
      penaltyAmount: z.number().min(0).default(0),
    })
    .optional(),

  // Financial analysis parameters
  discountRate: z.number().min(0).max(1).default(0.08),

  // Security and deposits
  securityDeposit: z
    .object({
      amount: z.number().min(0).default(0),
      interestRate: z.number().min(0).default(0),
      returnConditions: z.string().optional(),
    })
    .optional(),

  // Building space details (for real estate leases)
  buildingSpace: z
    .object({
      squareFeet: z.number().min(0).default(0),
      usableSquareFeet: z.number().min(0).default(0),
      loadFactor: z.number().min(0).default(0),
      pricePerSquareFoot: z.number().min(0).default(0),
      floors: z.array(z.string()).default([]),
      parkingSpaces: z.number().int().min(0).default(0),
      exclusiveAreas: z.array(z.string()).default([]),
      zoningType: z.string().optional(),
      permittedUses: z.array(z.string()).default([]),
    })
    .optional(),

  // Retail-specific
  percentageRent: z
    .object({
      enabled: z.boolean().default(false),
      percentage: z.number().min(0).max(1).default(0),
      breakpoint: z.number().min(0).default(0),
      annualSalesEstimate: z.number().min(0).default(0),
    })
    .optional(),

  // Analysis options
  compareAlternatives: z
    .object({
      purchasePrice: z.number().min(0).optional(),
      loanRate: z.number().min(0).max(1).optional(),
      loanTermMonths: z.number().int().positive().optional(),
      taxBenefits: z
        .object({
          depreciationRate: z.number().min(0).max(1).default(0),
          taxRate: z.number().min(0).max(1).default(0),
        })
        .optional(),
    })
    .optional(),
});

export class EnhancedLeaseTool {
  static readonly toolName = 'analyze_enhanced_lease';
  static readonly description =
    'Perform comprehensive enhanced lease analysis for equipment, office, warehouse, retail, medical, and mixed-use leases with advanced features including escalations, renewal options, purchase options, building space analysis, percentage rent, and lease vs buy comparisons';

  static readonly inputSchema = {
    type: 'object' as const,
    properties: {
      leaseType: {
        type: 'string',
        enum: [
          'equipment',
          'office-gross',
          'office-nnn',
          'office-modified',
          'warehouse-gross',
          'warehouse-nnn',
          'retail-base',
          'retail-percentage',
          'medical-gross',
          'medical-nnn',
          'mixed-use',
          'commercial-gross',
          'commercial-nnn',
          'commercial-modified',
        ],
        description: 'Type of lease to analyze',
        default: 'equipment',
      },
      principal: {
        type: 'number',
        description: 'Asset cost (for equipment leases)',
        default: 0,
      },
      baseRent: {
        type: 'number',
        description: 'Monthly base rent (for real estate leases)',
      },
      annualRate: {
        type: 'number',
        description: 'Annual interest rate (0-1, for equipment leases)',
        default: 0,
      },
      termMonths: {
        type: 'number',
        description: 'Lease term in months',
      },
      residualValue: {
        type: 'number',
        description: 'Residual value at end of lease',
        default: 0,
      },
      escalation: {
        type: 'object',
        description: 'Rent escalation configuration',
        properties: {
          type: {
            type: 'string',
            enum: ['none', 'fixed', 'cpi', 'market', 'stepped'],
            description: 'Type of escalation',
            default: 'none',
          },
          rate: {
            type: 'number',
            description: 'Annual escalation rate (for fixed/CPI)',
            default: 0,
          },
          schedule: {
            type: 'array',
            description: 'Step schedule for stepped escalations',
            items: {
              type: 'object',
              properties: {
                startMonth: { type: 'number', description: 'Month when step begins' },
                rate: { type: 'number', description: 'Annual rate for this step' },
              },
              required: ['startMonth', 'rate'],
            },
            default: [],
          },
          cpiBase: {
            type: 'number',
            description: 'Base CPI for CPI-based escalations',
            default: 0,
          },
        },
      },
      additionalCosts: {
        type: 'object',
        description: 'Additional monthly costs',
        properties: {
          camCharges: { type: 'number', description: 'Common Area Maintenance', default: 0 },
          propertyTaxes: { type: 'number', description: 'Property taxes', default: 0 },
          insurance: { type: 'number', description: 'Building insurance', default: 0 },
          utilities: { type: 'number', description: 'Utilities', default: 0 },
          maintenance: { type: 'number', description: 'Building maintenance', default: 0 },
          managementFee: { type: 'number', description: 'Property management fee', default: 0 },
          parking: { type: 'number', description: 'Parking fees', default: 0 },
          security: { type: 'number', description: 'Security services', default: 0 },
          cleaning: { type: 'number', description: 'Cleaning services', default: 0 },
          technology: { type: 'number', description: 'Technology/internet', default: 0 },
          elevatorMaintenance: { type: 'number', description: 'Elevator maintenance', default: 0 },
          hvacMaintenance: { type: 'number', description: 'HVAC maintenance', default: 0 },
          landscaping: { type: 'number', description: 'Landscaping', default: 0 },
          wasteManagement: { type: 'number', description: 'Waste management', default: 0 },
        },
      },
      renewalOptions: {
        type: 'array',
        description: 'Renewal option configurations',
        items: {
          type: 'object',
          properties: {
            termMonths: { type: 'number', description: 'Renewal term length' },
            rateAdjustment: { type: 'number', description: 'Rate adjustment', default: 0 },
            marketRateOption: { type: 'boolean', description: 'Use market rate', default: false },
            escalationType: {
              type: 'string',
              enum: ['none', 'fixed', 'cpi', 'market', 'stepped'],
              default: 'none',
            },
            escalationRate: { type: 'number', description: 'Escalation rate', default: 0 },
          },
          required: ['termMonths'],
        },
        default: [],
      },
      purchaseOption: {
        type: 'object',
        description: 'Purchase option configuration',
        properties: {
          enabled: { type: 'boolean', default: false },
          fixedAmount: { type: 'number', description: 'Fixed purchase price' },
          fairMarketValue: { type: 'boolean', description: 'Use fair market value', default: false },
          percentage: { type: 'number', description: 'Percentage of original cost' },
        },
      },
      earlyTermination: {
        type: 'object',
        description: 'Early termination configuration',
        properties: {
          allowed: { type: 'boolean', default: false },
          penaltyMonths: { type: 'number', description: 'Penalty in months of rent', default: 0 },
          penaltyAmount: { type: 'number', description: 'Fixed penalty amount', default: 0 },
        },
      },
      discountRate: {
        type: 'number',
        description: 'Discount rate for NPV calculations (0-1)',
        default: 0.08,
      },
      securityDeposit: {
        type: 'object',
        description: 'Security deposit configuration',
        properties: {
          amount: { type: 'number', default: 0 },
          interestRate: { type: 'number', description: 'Annual interest rate', default: 0 },
          returnConditions: { type: 'string', description: 'Return conditions' },
        },
      },
      buildingSpace: {
        type: 'object',
        description: 'Building space details (for real estate leases)',
        properties: {
          squareFeet: { type: 'number', description: 'Total square footage', default: 0 },
          usableSquareFeet: { type: 'number', description: 'Usable square footage', default: 0 },
          loadFactor: { type: 'number', description: 'Load factor', default: 0 },
          pricePerSquareFoot: { type: 'number', description: 'Annual rent per sq ft', default: 0 },
          floors: { type: 'array', items: { type: 'string' }, default: [] },
          parkingSpaces: { type: 'number', description: 'Parking spaces', default: 0 },
          exclusiveAreas: { type: 'array', items: { type: 'string' }, default: [] },
          zoningType: { type: 'string', description: 'Zoning classification' },
          permittedUses: { type: 'array', items: { type: 'string' }, default: [] },
        },
      },
      percentageRent: {
        type: 'object',
        description: 'Percentage rent configuration (for retail leases)',
        properties: {
          enabled: { type: 'boolean', default: false },
          percentage: { type: 'number', description: 'Percentage of gross sales', default: 0 },
          breakpoint: { type: 'number', description: 'Sales breakpoint', default: 0 },
          annualSalesEstimate: { type: 'number', description: 'Estimated annual sales', default: 0 },
        },
      },
      compareAlternatives: {
        type: 'object',
        description: 'Lease vs buy comparison configuration',
        properties: {
          purchasePrice: { type: 'number', description: 'Purchase price for comparison' },
          loanRate: { type: 'number', description: 'Loan rate for purchase' },
          loanTermMonths: { type: 'number', description: 'Loan term for purchase' },
          taxBenefits: {
            type: 'object',
            properties: {
              depreciationRate: { type: 'number', default: 0 },
              taxRate: { type: 'number', default: 0 },
            },
          },
        },
      },
    },
    required: ['termMonths'],
  };

  static async execute(input: unknown): Promise<EnhancedLeaseAnalysisResult> {
    const validated = EnhancedLeaseToolInputSchema.parse(input);
    return EnhancedLeaseAnalyzer.analyze(validated);
  }
}
