import { z } from 'zod';

// Option type
export const OptionTypeSchema = z.enum([
  'call', // Right to buy
  'put', // Right to sell
]);

// Option style
export const OptionStyleSchema = z.enum([
  'european', // Can only be exercised at expiration
  'american', // Can be exercised any time before expiration
  'bermudan', // Can be exercised on specific dates
]);

// Pricing model
export const PricingModelSchema = z.enum([
  'black-scholes', // Black-Scholes-Merton model
  'binomial', // Binomial tree model
  'monte-carlo', // Monte Carlo simulation
]);

// Dividend schedule
export const DividendSchema = z.object({
  exDate: z.string(), // ISO date - ex-dividend date
  amount: z.number().positive(), // Dividend amount per share
});

// Greeks calculation precision
export const GreeksPrecisionSchema = z.enum([
  'low', // Faster, less precise
  'medium', // Balanced
  'high', // Slower, more precise
]);

// Options pricing input schema
export const OptionsPricingInputSchema = z
  .object({
    // Basic option information
    optionType: OptionTypeSchema,
    optionStyle: OptionStyleSchema.default('american'),

    // Contract details
    strikePrice: z.number().positive(),
    currentPrice: z.number().positive(), // Current underlying asset price
    expirationDate: z.string(), // ISO date
    contractSize: z.number().int().positive().default(100), // Standard is 100 shares

    // Market parameters
    riskFreeRate: z.number().min(0).max(1), // Risk-free interest rate (annual)
    volatility: z.number().min(0).max(5), // Implied or historical volatility (annual)
    dividendYield: z.number().min(0).max(1).default(0), // Continuous dividend yield

    // Dividends (discrete)
    dividends: z.array(DividendSchema).default([]),

    // Pricing methodology
    pricingModel: PricingModelSchema.default('black-scholes'),

    // Model-specific parameters
    binomialSteps: z.number().int().positive().default(100), // For binomial model
    monteCarloSimulations: z.number().int().positive().default(10000), // For Monte Carlo
    bermudanExerciseDates: z.array(z.string()).default([]), // ISO dates for Bermudan options

    // Analysis parameters
    greeksPrecision: GreeksPrecisionSchema.default('medium'),
    calculateImpliedVolatility: z.boolean().default(false),
    marketPrice: z.number().positive().optional(), // For implied volatility calculation

    // Strategy parameters (for multi-leg strategies)
    strategyLegs: z
      .array(
        z.object({
          optionType: OptionTypeSchema,
          strikePrice: z.number().positive(),
          quantity: z.number().int(), // Positive for long, negative for short
          premium: z.number().positive(), // Cost per contract
        })
      )
      .default([]),

    // Scenario analysis
    priceRange: z
      .object({
        min: z.number().positive(),
        max: z.number().positive(),
        step: z.number().positive().default(1),
      })
      .optional(),

    // Early exercise analysis (for American options)
    analyzeEarlyExercise: z.boolean().default(true),
  })
  .refine(
    (data) => {
      // Bermudan options need exercise dates
      if (data.optionStyle === 'bermudan') {
        return data.bermudanExerciseDates.length > 0;
      }
      return true;
    },
    {
      message: 'Bermudan options require bermudanExerciseDates',
      path: ['bermudanExerciseDates'],
    }
  )
  .refine(
    (data) => {
      // Implied volatility requires market price
      if (data.calculateImpliedVolatility) {
        return data.marketPrice !== undefined;
      }
      return true;
    },
    {
      message: 'Implied volatility calculation requires marketPrice',
      path: ['marketPrice'],
    }
  )
  .refine(
    (data) => {
      // Price range validation
      if (data.priceRange) {
        return data.priceRange.min < data.priceRange.max;
      }
      return true;
    },
    {
      message: 'Price range min must be less than max',
      path: ['priceRange'],
    }
  );

export type OptionsPricingInput = z.infer<typeof OptionsPricingInputSchema>;
export type OptionType = z.infer<typeof OptionTypeSchema>;
export type OptionStyle = z.infer<typeof OptionStyleSchema>;
export type PricingModel = z.infer<typeof PricingModelSchema>;
