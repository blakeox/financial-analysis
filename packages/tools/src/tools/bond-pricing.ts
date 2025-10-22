import { BondPricingAnalyzer, type BondPricingInput } from '@financial-analysis/analysis';

export class BondPricingTool {
  static readonly toolName = 'analyze_bond_pricing';
  static readonly description =
    'Performs comprehensive bond valuation and analysis. Calculates bond price, yield to maturity, duration, convexity, and provides investment insights. Supports various bond types including government, corporate, municipal, convertible, zero-coupon, floating-rate, and inflation-linked bonds. Handles callable and puttable bonds with complex features.';

  static readonly inputSchema = {
    type: 'object' as const,
    properties: {
      bondType: {
        type: 'string',
        enum: [
          'government',
          'corporate',
          'municipal',
          'convertible',
          'zero-coupon',
          'floating-rate',
          'inflation-linked',
        ],
        description: 'Type of bond to analyze',
      },
      principal: {
        type: 'number',
        description: 'Face value or par value of the bond (e.g., 1000 for $1,000)',
        minimum: 0,
      },
      couponRate: {
        type: 'number',
        description: 'Annual coupon rate as a decimal (e.g., 0.05 for 5%)',
        minimum: 0,
        maximum: 1,
      },
      couponFrequency: {
        type: 'string',
        enum: ['annual', 'semi-annual', 'quarterly', 'monthly'],
        description: 'How often coupon payments are made',
        default: 'semi-annual',
      },
      yieldToMaturity: {
        type: 'number',
        description: 'Market yield to maturity as a decimal (e.g., 0.04 for 4%)',
        minimum: 0,
        maximum: 1,
      },
      settlementDate: {
        type: 'string',
        description: 'Settlement date in ISO 8601 format (YYYY-MM-DD)',
      },
      maturityDate: {
        type: 'string',
        description: 'Maturity date in ISO 8601 format (YYYY-MM-DD)',
      },
      callProvision: {
        type: 'object',
        description: 'Call provision details if bond is callable',
        properties: {
          callPrice: {
            type: 'number',
            description: 'Price at which bond can be called',
            minimum: 0,
          },
          callDate: {
            type: 'string',
            description: 'Date when bond can be called (ISO 8601 format)',
          },
          callProtectionPeriod: {
            type: 'number',
            description: 'Number of years before bond can be called',
            minimum: 0,
          },
        },
      },
      putProvision: {
        type: 'object',
        description: 'Put provision details if bond is puttable',
        properties: {
          putPrice: {
            type: 'number',
            description: 'Price at which bond can be put back to issuer',
            minimum: 0,
          },
          putDate: {
            type: 'string',
            description: 'Date when bond can be put (ISO 8601 format)',
          },
        },
      },
      sinkingFund: {
        type: 'object',
        description: 'Sinking fund provision details',
        properties: {
          percentage: {
            type: 'number',
            description: 'Percentage of issue retired annually',
            minimum: 0,
            maximum: 1,
          },
          startDate: {
            type: 'string',
            description: 'Date when sinking fund starts (ISO 8601 format)',
          },
        },
      },
      creditRating: {
        type: 'string',
        enum: [
          'AAA',
          'AA+',
          'AA',
          'AA-',
          'A+',
          'A',
          'A-',
          'BBB+',
          'BBB',
          'BBB-',
          'BB+',
          'BB',
          'BB-',
          'B+',
          'B',
          'B-',
          'CCC+',
          'CCC',
          'CCC-',
          'CC',
          'C',
          'D',
        ],
        description: 'Credit rating of the bond',
      },
      taxTreatment: {
        type: 'string',
        enum: ['taxable', 'tax-exempt', 'tax-deferred'],
        description: 'Tax treatment of the bond',
        default: 'taxable',
      },
      dayCountConvention: {
        type: 'string',
        enum: ['30/360', 'actual/actual', 'actual/360', 'actual/365'],
        description: 'Day count convention for accrued interest',
        default: 'actual/actual',
      },
      priceQuoteConvention: {
        type: 'string',
        enum: ['clean', 'dirty'],
        description: 'Whether to quote clean price (excluding accrued) or dirty price (including accrued)',
        default: 'clean',
      },
    },
    required: [
      'bondType',
      'principal',
      'couponRate',
      'yieldToMaturity',
      'settlementDate',
      'maturityDate',
    ],
  };

  static async execute(args: unknown): Promise<string> {
    try {
      const result = await BondPricingAnalyzer.analyze(args as BondPricingInput);
      return JSON.stringify(result, null, 2);
    } catch (error) {
      if (error instanceof Error) {
        return JSON.stringify({ error: error.message }, null, 2);
      }
      return JSON.stringify({ error: 'Unknown error occurred' }, null, 2);
    }
  }
}
