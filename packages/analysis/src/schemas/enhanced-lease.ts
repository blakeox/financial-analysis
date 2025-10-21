import { z } from 'zod';

// Enhanced lease type enumeration - supports comprehensive building and equipment leases
export const LeaseTypeSchema = z.enum([
  'equipment',           // Equipment/vehicle leases
  'office-gross',        // Office building - gross lease (landlord pays most expenses)
  'office-nnn',          // Office building - triple net lease (tenant pays taxes, insurance, maintenance)
  'office-modified',     // Office building - modified gross lease (shared expenses)
  'warehouse-gross',     // Warehouse/industrial building - gross lease
  'warehouse-nnn',       // Warehouse/industrial building - triple net lease
  'retail-base',         // Retail building lease with base rent only
  'retail-percentage',   // Retail building lease with base + percentage rent
  'medical-gross',       // Medical building - gross lease
  'medical-nnn',         // Medical building - triple net lease
  'mixed-use',           // Mixed-use building (office, retail, etc.)
  // Legacy commercial types (maintained for backward compatibility)
  'commercial-gross',    // Commercial real estate - gross lease
  'commercial-nnn',      // Commercial real estate - triple net lease  
  'commercial-modified', // Commercial real estate - modified gross
]);

// Escalation types
export const EscalationTypeSchema = z.enum([
  'none',        // No escalations
  'fixed',       // Fixed percentage increase
  'cpi',         // Consumer Price Index based
  'market',      // Market rate adjustments
  'stepped',     // Pre-defined step increases
]);

// Escalation schedule for stepped increases
export const EscalationStepSchema = z.object({
  startMonth: z.number().int().positive(),
  rate: z.number().min(0), // Annual percentage increase (e.g., 0.03 for 3%)
});

// Additional costs structure - comprehensive building lease expenses
export const AdditionalCostsSchema = z.object({
  camCharges: z.number().min(0).default(0),           // Common Area Maintenance (monthly)
  propertyTaxes: z.number().min(0).default(0),        // Property taxes (monthly) 
  insurance: z.number().min(0).default(0),            // Building insurance (monthly)
  utilities: z.number().min(0).default(0),            // Utilities (HVAC, electric, water) (monthly)
  maintenance: z.number().min(0).default(0),          // Building maintenance (monthly)
  managementFee: z.number().min(0).default(0),        // Property management fee (monthly)
  // Building-specific costs
  parking: z.number().min(0).default(0),              // Parking fees (monthly)
  security: z.number().min(0).default(0),             // Security services (monthly)
  cleaning: z.number().min(0).default(0),             // Cleaning services (monthly)
  technology: z.number().min(0).default(0),           // Technology/internet services (monthly)
  // Specialized building costs
  elevatorMaintenance: z.number().min(0).default(0),  // Elevator maintenance (monthly)
  hvacMaintenance: z.number().min(0).default(0),      // HVAC system maintenance (monthly)
  landscaping: z.number().min(0).default(0),          // Landscaping services (monthly)
  wasteManagement: z.number().min(0).default(0),      // Waste disposal services (monthly)
});

// Renewal option structure
export const RenewalOptionSchema = z.object({
  termMonths: z.number().int().positive(),            // Renewal term length
  rateAdjustment: z.number().default(0),              // Rate adjustment (e.g., 0.05 for 5% increase)
  marketRateOption: z.boolean().default(false),      // Use market rate instead of adjustment
  escalationType: EscalationTypeSchema.default('none'),
  escalationRate: z.number().min(0).default(0),
});

// Purchase option structure  
export const PurchaseOptionSchema = z.object({
  enabled: z.boolean().default(false),
  fixedAmount: z.number().min(0).optional(),          // Fixed purchase price
  fairMarketValue: z.boolean().default(false),       // Use fair market value
  percentage: z.number().min(0).max(1).optional(),   // Percentage of original cost
});

// Security deposit structure
export const SecurityDepositSchema = z.object({
  amount: z.number().min(0).default(0),
  interestRate: z.number().min(0).default(0),        // Annual interest rate if applicable
  returnConditions: z.string().optional(),
});

// Building space details (for real estate leases)
export const BuildingSpaceSchema = z.object({
  squareFeet: z.number().min(0).default(0),           // Total square footage leased
  usableSquareFeet: z.number().min(0).default(0),     // Usable square footage (excluding common areas)
  loadFactor: z.number().min(0).default(0),           // Load factor (common area multiplier)
  pricePerSquareFoot: z.number().min(0).default(0),   // Annual rent per square foot
  // Building features
  floors: z.array(z.string()).default([]),            // Floor numbers/names
  parkingSpaces: z.number().int().min(0).default(0),  // Number of parking spaces included
  exclusiveAreas: z.array(z.string()).default([]),    // Exclusive use areas (storage, etc.)
  // Zoning and usage
  zoningType: z.string().optional(),                  // Zoning classification
  permittedUses: z.array(z.string()).default([]),     // Permitted business uses
});

// Retail percentage rent (for retail leases)
export const PercentageRentSchema = z.object({
  enabled: z.boolean().default(false),
  percentage: z.number().min(0).max(1).default(0),   // Percentage of gross sales
  breakpoint: z.number().min(0).default(0),          // Sales breakpoint before percentage kicks in
  annualSalesEstimate: z.number().min(0).default(0), // Estimated annual sales
});

// Enhanced lease input schema
export const EnhancedLeaseInputSchema = z.object({
  // Basic lease information
  leaseType: LeaseTypeSchema.default('equipment'),
  principal: z.number().min(0),                       // Asset cost (equipment) or 0 (real estate)
  baseRent: z.number().positive().optional(),        // Monthly base rent (for real estate)
  annualRate: z.number().min(0).max(1).default(0),   // Interest rate (for equipment)
  termMonths: z.number().int().positive(),
  residualValue: z.number().min(0).default(0),
  
  // Advanced lease terms
  escalation: z.object({
    type: EscalationTypeSchema.default('none'),
    rate: z.number().min(0).default(0),               // Annual rate for fixed/CPI
    schedule: z.array(EscalationStepSchema).default([]), // For stepped escalations
    cpiBase: z.number().min(0).default(0),            // Base CPI for CPI-based escalations
  }).optional(),
  
  // Additional costs
  additionalCosts: AdditionalCostsSchema.optional(),
  
  // Options and flexibility
  renewalOptions: z.array(RenewalOptionSchema).default([]),
  purchaseOption: PurchaseOptionSchema.optional(),
  earlyTermination: z.object({
    allowed: z.boolean().default(false),
    penaltyMonths: z.number().int().min(0).default(0), // Penalty in months of rent
    penaltyAmount: z.number().min(0).default(0),       // Fixed penalty amount
  }).optional(),
  
  // Financial analysis parameters
  discountRate: z.number().min(0).max(1).default(0.08), // For NPV calculations
  
  // Security and deposits
  securityDeposit: SecurityDepositSchema.optional(),
  
  // Building space details (for real estate leases)
  buildingSpace: BuildingSpaceSchema.optional(),
  
  // Retail-specific
  percentageRent: PercentageRentSchema.optional(),
  
  // Analysis options
  compareAlternatives: z.object({
    purchasePrice: z.number().min(0).optional(),       // For lease vs buy analysis
    loanRate: z.number().min(0).max(1).optional(),     // Loan rate for purchase
    loanTermMonths: z.number().int().positive().optional(),
    taxBenefits: z.object({
      depreciationRate: z.number().min(0).max(1).default(0),
      taxRate: z.number().min(0).max(1).default(0),
    }).optional(),
  }).optional(),
}).refine((data) => {
  // Equipment leases must have positive principal
  if (data.leaseType === 'equipment') {
    return data.principal > 0;
  }
  // Building/real estate leases must have positive baseRent
  const buildingLeaseTypes = [
    'office-gross', 'office-nnn', 'office-modified',
    'warehouse-gross', 'warehouse-nnn', 
    'retail-base', 'retail-percentage',
    'medical-gross', 'medical-nnn', 'mixed-use',
    // Legacy types for backward compatibility
    'commercial-gross', 'commercial-nnn', 'commercial-modified'
  ];
  if (buildingLeaseTypes.includes(data.leaseType)) {
    return data.baseRent && data.baseRent > 0;
  }
  return true;
}, {
  message: "Equipment leases require positive principal; Building leases require positive baseRent",
  path: ['principal', 'baseRent'],
});

export type EnhancedLeaseInput = z.infer<typeof EnhancedLeaseInputSchema>;
export type LeaseType = z.infer<typeof LeaseTypeSchema>;
export type EscalationType = z.infer<typeof EscalationTypeSchema>;
export type AdditionalCosts = z.infer<typeof AdditionalCostsSchema>;