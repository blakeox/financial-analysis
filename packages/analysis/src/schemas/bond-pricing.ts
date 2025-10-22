import { z } from 'zod';

// Bond type enumeration
export const BondTypeSchema = z.enum([
  'corporate',      // Corporate bonds
  'municipal',      // Municipal bonds (tax-exempt)
  'treasury',       // US Treasury bonds
  'agency',         // Government agency bonds
  'convertible',    // Convertible bonds
  'zero-coupon',    // Zero-coupon bonds
  'floating-rate',  // Floating rate bonds
  'inflation-linked', // TIPS (Treasury Inflation-Protected Securities)
]);

// Coupon frequency
export const CouponFrequencySchema = z.enum([
  'annual',         // Once per year
  'semi-annual',    // Twice per year (most common)
  'quarterly',      // Four times per year
  'monthly',        // Twelve times per year
  'zero',           // No coupon payments (zero-coupon bonds)
]);

// Day count convention
export const DayCountConventionSchema = z.enum([
  'actual-actual',  // Actual/Actual (ISDA)
  'actual-360',     // Actual/360
  'actual-365',     // Actual/365
  '30-360',         // 30/360 Bond Basis
  '30-360-european', // 30E/360 European
]);

// Credit rating
export const CreditRatingSchema = z.enum([
  'AAA', 'AA+', 'AA', 'AA-',
  'A+', 'A', 'A-',
  'BBB+', 'BBB', 'BBB-',
  'BB+', 'BB', 'BB-',
  'B+', 'B', 'B-',
  'CCC+', 'CCC', 'CCC-',
  'CC', 'C', 'D',
]);

// Call/put option for callable/putable bonds
export const BondOptionSchema = z.object({
  enabled: z.boolean().default(false),
  firstCallDate: z.string().optional(), // ISO date
  callPrice: z.number().positive().optional(), // Usually as percentage of par (e.g., 102 for 102%)
  callSchedule: z.array(z.object({
    date: z.string(), // ISO date
    price: z.number().positive(), // Call price at this date
  })).default([]),
  isPutable: z.boolean().default(false), // If bond is putable (investor can sell back)
  putPrice: z.number().positive().optional(),
  putDate: z.string().optional(), // ISO date
});

// Convertible bond specific features
export const ConvertibleFeaturesSchema = z.object({
  conversionRatio: z.number().positive(), // Number of shares per bond
  conversionPrice: z.number().positive(), // Price at which bond converts to stock
  currentStockPrice: z.number().positive(),
  stockVolatility: z.number().min(0).max(1).optional(), // For option pricing
});

// Floating rate bond features
export const FloatingRateFeaturesSchema = z.object({
  referenceRate: z.enum(['SOFR', 'LIBOR', 'Fed Funds', 'Prime', 'Treasury']),
  spread: z.number(), // Spread over reference rate (in decimal, e.g., 0.02 for 200 bps)
  resetFrequency: CouponFrequencySchema,
  floor: z.number().min(0).optional(), // Minimum rate
  cap: z.number().min(0).optional(), // Maximum rate
});

// Inflation-linked bond features (TIPS)
export const InflationLinkedFeaturesSchema = z.object({
  realYield: z.number(), // Real yield (inflation-adjusted)
  inflationRate: z.number(), // Expected inflation rate
  indexRatio: z.number().positive().default(1), // Current index ratio
});

// Bond pricing input schema
export const BondPricingInputSchema = z.object({
  // Basic bond information
  bondType: BondTypeSchema.default('corporate'),
  faceValue: z.number().positive().default(1000), // Par value
  couponRate: z.number().min(0).max(1), // Annual coupon rate (0-1)
  couponFrequency: CouponFrequencySchema.default('semi-annual'),
  issueDate: z.string(), // ISO date
  maturityDate: z.string(), // ISO date
  settlementDate: z.string().optional(), // ISO date (defaults to today)
  
  // Market data
  yieldToMaturity: z.number().min(0).max(1), // Market yield (required for pricing)
  marketPrice: z.number().positive().optional(), // Current market price (for yield calculation)
  
  // Advanced features
  dayCountConvention: DayCountConventionSchema.default('30-360'),
  creditRating: CreditRatingSchema.optional(),
  callOption: BondOptionSchema.optional(),
  
  // Type-specific features
  convertibleFeatures: ConvertibleFeaturesSchema.optional(),
  floatingRateFeatures: FloatingRateFeaturesSchema.optional(),
  inflationLinkedFeatures: InflationLinkedFeaturesSchema.optional(),
  
  // Tax considerations (for municipal bonds)
  taxRate: z.number().min(0).max(1).default(0), // Federal tax rate
  stateTaxRate: z.number().min(0).max(1).default(0),
  isTaxExempt: z.boolean().default(false),
  
  // Analysis parameters
  reinvestmentRate: z.number().min(0).max(1).optional(), // For total return calculation
  holdingPeriod: z.number().int().positive().optional(), // In months
}).refine((data) => {
  // Zero-coupon bonds must have zero coupon rate
  if (data.bondType === 'zero-coupon') {
    return data.couponRate === 0;
  }
  return true;
}, {
  message: "Zero-coupon bonds must have couponRate of 0",
  path: ['couponRate'],
}).refine((data) => {
  // Floating rate bonds must have floating rate features
  if (data.bondType === 'floating-rate') {
    return data.floatingRateFeatures !== undefined;
  }
  return true;
}, {
  message: "Floating rate bonds require floatingRateFeatures",
  path: ['floatingRateFeatures'],
}).refine((data) => {
  // Convertible bonds must have convertible features
  if (data.bondType === 'convertible') {
    return data.convertibleFeatures !== undefined;
  }
  return true;
}, {
  message: "Convertible bonds require convertibleFeatures",
  path: ['convertibleFeatures'],
}).refine((data) => {
  // Inflation-linked bonds must have inflation features
  if (data.bondType === 'inflation-linked') {
    return data.inflationLinkedFeatures !== undefined;
  }
  return true;
}, {
  message: "Inflation-linked bonds require inflationLinkedFeatures",
  path: ['inflationLinkedFeatures'],
});

export type BondPricingInput = z.infer<typeof BondPricingInputSchema>;
export type BondType = z.infer<typeof BondTypeSchema>;
export type CouponFrequency = z.infer<typeof CouponFrequencySchema>;
export type CreditRating = z.infer<typeof CreditRatingSchema>;
