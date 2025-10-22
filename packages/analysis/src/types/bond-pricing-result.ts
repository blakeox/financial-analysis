export interface CouponPayment {
  paymentNumber: number;
  date: string; // ISO date
  couponAmount: number;
  accruedInterest: number;
  discountedValue: number; // Present value of this payment
}

export interface BondMetrics {
  price: number; // Clean price (without accrued interest)
  dirtyPrice: number; // Price including accrued interest
  accruedInterest: number;
  yieldToMaturity: number; // If calculated from market price
  yieldToCall?: number; // For callable bonds
  yieldToWorst?: number; // Worst case yield
  currentYield: number; // Annual coupon / current price
  
  // Duration and convexity
  macaulayDuration: number; // Weighted average time to cash flows
  modifiedDuration: number; // Price sensitivity to yield changes
  dollarDuration: number; // Price change per 1% yield change
  convexity: number; // Second derivative of price/yield relationship
  dv01: number; // Dollar value of 1 basis point (0.01%)
  
  // Return metrics
  totalReturn?: number; // If holding period specified
  holdingPeriodReturn?: number;
  realizedCompoundYield?: number; // Including reinvestment
}

export interface SensitivityAnalysis {
  priceYieldCurve: Array<{
    yield: number;
    price: number;
  }>;
  durationAnalysis: {
    yieldChange: number; // In basis points
    priceChange: number;
    percentChange: number;
  }[];
}

export interface TaxAdjustedMetrics {
  taxEquivalentYield: number; // For tax-exempt bonds
  afterTaxYield: number;
  taxSavings: number; // Annual tax savings for muni bonds
}

export interface CallAnalysis {
  isProbablyCallable: boolean; // Based on current rates vs coupon
  yieldToCall: number;
  callDate: string;
  callPrice: number;
  callValue: number; // Present value if called
}

export interface ConvertibleAnalysis {
  conversionValue: number; // Value if converted to stock
  conversionPremium: number; // Bond price - conversion value
  conversionParity: number; // Stock price at which conversion is at par
  investmentValue: number; // Value as straight bond (no conversion)
  optionValue: number; // Value of conversion option
}

export interface RiskMetrics {
  creditRisk: string; // Based on rating
  interestRateRisk: 'Low' | 'Medium' | 'High'; // Based on duration
  callRisk?: 'Low' | 'Medium' | 'High';
  reinvestmentRisk: 'Low' | 'Medium' | 'High';
  liquidityRisk?: 'Low' | 'Medium' | 'High';
  defaultProbability?: number; // If calculable from rating
}

export interface BondPricingResult {
  bondType: string;
  faceValue: number;
  couponRate: number;
  
  // Timing
  issueDate: string;
  maturityDate: string;
  settlementDate: string;
  yearsToMaturity: number;
  remainingPayments: number;
  
  // Pricing and metrics
  metrics: BondMetrics;
  
  // Cash flow schedule
  couponSchedule: CouponPayment[];
  
  // Analysis components
  sensitivityAnalysis: SensitivityAnalysis;
  riskMetrics: RiskMetrics;
  taxAdjustedMetrics?: TaxAdjustedMetrics;
  callAnalysis?: CallAnalysis;
  convertibleAnalysis?: ConvertibleAnalysis;
  
  // Insights and recommendations
  insights: string[];
  recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
  
  // Additional metadata
  calculationDate: string;
  assumptions: string[];
}
