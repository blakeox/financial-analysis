/**
 * Revenue Forecasting Engine
 * 
 * Projects future revenue using multiple forecasting methods including
 * linear growth, seasonal patterns, and customer-based models.
 */

export interface RevenueStream {
  name: string;
  currentMonthlyRevenue: number;
  growthRate: number; // Annual % growth
  seasonalityPattern?: 'none' | 'retail' | 'b2b' | 'custom';
  customSeasonalFactors?: number[]; // 12 month factors (1.0 = average)
}

export interface RevenueForecastInput {
  // Revenue Streams
  revenueStreams: RevenueStream[];
  
  // Forecast Period
  forecastMonths: number; // How many months to forecast (default 12)
  
  // Customer-Based Inputs (Optional)
  existingCustomers?: number;
  averageRevenuePerCustomer?: number;
  monthlyChurnRate?: number; // %
  newCustomersPerMonth?: number;
  
  // One-Time Events (Optional)
  oneTimeRevenue?: {
    month: number; // Which month (1-12)
    amount: number;
    description: string;
  }[];
}

export interface MonthlyForecast {
  month: number;
  monthName: string;
  revenueByStream: Record<string, number>;
  totalRevenue: number;
  cumulativeRevenue: number;
  growthVsPreviousMonth: number;
  growthVsYearAgo?: number;
  customers?: number;
}

export interface RevenueForecastResult {
  // Forecasts
  monthlyForecasts: MonthlyForecast[];
  
  // Summary Metrics
  summary: {
    totalForecastRevenue: number;
    averageMonthlyRevenue: number;
    peakMonth: { month: number; revenue: number };
    lowestMonth: { month: number; revenue: number };
    totalGrowth: number; // % growth from month 1 to final month
    compoundMonthlyGrowthRate: number; // CMGR
  };
  
  // By Stream Analysis
  streamBreakdown: {
    name: string;
    totalRevenue: number;
    percentOfTotal: number;
    avgMonthlyRevenue: number;
    growth: number;
  }[];
  
  // Customer-Based Metrics (if applicable)
  customerMetrics?: {
    endingCustomers: number;
    totalAcquired: number;
    totalChurned: number;
    netCustomerGrowth: number;
    avgRevenuePerCustomer: number;
  };
  
  // Insights & Recommendations
  insights: string[];
  recommendations: string[];
  risks: string[];
}

export class RevenueForecastEngine {
  /**
   * Generate revenue forecast
   */
  static analyze(input: RevenueForecastInput): RevenueForecastResult {
    const months = Math.min(input.forecastMonths || 12, 36); // Cap at 36 months
    const monthlyForecasts: MonthlyForecast[] = [];
    
    // Track cumulative revenue
    let cumulativeRevenue = 0;
    
    // Track customers if customer-based
    let currentCustomers = input.existingCustomers || 0;
    let totalAcquired = 0;
    let totalChurned = 0;
    
    // Generate month-by-month forecasts
    for (let month = 1; month <= months; month++) {
      const monthIndex = (month - 1) % 12; // For seasonality (0-11)
      const monthName = this.getMonthName(monthIndex);
      
      // Calculate revenue for each stream
      const revenueByStream: Record<string, number> = {};
      let totalMonthRevenue = 0;
      
      input.revenueStreams.forEach(stream => {
        const baseMonthlyRevenue = stream.currentMonthlyRevenue;
        const monthlyGrowthRate = Math.pow(1 + stream.growthRate / 100, 1/12) - 1;
        const compoundedRevenue = baseMonthlyRevenue * Math.pow(1 + monthlyGrowthRate, month - 1);
        
        // Apply seasonality
        const seasonalFactor = this.getSeasonalFactor(stream, monthIndex);
        const seasonalRevenue = compoundedRevenue * seasonalFactor;
        
        revenueByStream[stream.name] = seasonalRevenue;
        totalMonthRevenue += seasonalRevenue;
      });
      
      // Add one-time revenue
      const oneTimeEvent = input.oneTimeRevenue?.find(e => e.month === month);
      if (oneTimeEvent) {
        totalMonthRevenue += oneTimeEvent.amount;
        revenueByStream[`One-time: ${oneTimeEvent.description}`] = oneTimeEvent.amount;
      }
      
      // Calculate customer metrics
      let monthCustomers = currentCustomers;
      if (input.existingCustomers !== undefined && input.newCustomersPerMonth !== undefined) {
        const newCustomers = input.newCustomersPerMonth;
        const churnedCustomers = input.monthlyChurnRate 
          ? currentCustomers * (input.monthlyChurnRate / 100)
          : 0;
        
        currentCustomers = currentCustomers + newCustomers - churnedCustomers;
        monthCustomers = currentCustomers;
        totalAcquired += newCustomers;
        totalChurned += churnedCustomers;
        
        // Override total revenue if using customer-based model
        if (input.averageRevenuePerCustomer) {
          totalMonthRevenue = currentCustomers * input.averageRevenuePerCustomer;
        }
      }
      
      cumulativeRevenue += totalMonthRevenue;
      
      // Calculate growth rates
      const growthVsPreviousMonth = month > 1
        ? ((totalMonthRevenue - monthlyForecasts[month - 2]!.totalRevenue) / monthlyForecasts[month - 2]!.totalRevenue) * 100
        : 0;
      
      const growthVsYearAgo = month > 12
        ? ((totalMonthRevenue - monthlyForecasts[month - 13]!.totalRevenue) / monthlyForecasts[month - 13]!.totalRevenue) * 100
        : undefined;
      
      monthlyForecasts.push({
        month,
        monthName,
        revenueByStream,
        totalRevenue: totalMonthRevenue,
        cumulativeRevenue,
        growthVsPreviousMonth,
        growthVsYearAgo,
        customers: input.existingCustomers !== undefined ? monthCustomers : undefined,
      } as MonthlyForecast);
    }
    
    // Calculate summary metrics
    const totalForecastRevenue = cumulativeRevenue;
    const averageMonthlyRevenue = totalForecastRevenue / months;
    
    if (monthlyForecasts.length === 0) {
      throw new Error('No forecast data generated');
    }
    
    const peakMonth = monthlyForecasts.reduce((max, curr) => 
      curr.totalRevenue > max.totalRevenue ? curr : max
    );
    
    const lowestMonth = monthlyForecasts.reduce((min, curr) => 
      curr.totalRevenue < min.totalRevenue ? curr : min
    );
    
    const firstMonthRevenue = monthlyForecasts[0]!.totalRevenue;
    const lastMonthRevenue = monthlyForecasts[months - 1]!.totalRevenue;
    const totalGrowth = firstMonthRevenue > 0
      ? ((lastMonthRevenue - firstMonthRevenue) / firstMonthRevenue) * 100
      : 0;
    
    const compoundMonthlyGrowthRate = firstMonthRevenue > 0
      ? (Math.pow(lastMonthRevenue / firstMonthRevenue, 1 / (months - 1)) - 1) * 100
      : 0;
    
    // Stream breakdown
    const streamBreakdown = this.calculateStreamBreakdown(input.revenueStreams, monthlyForecasts);
    
    // Customer metrics (if applicable)
    let customerMetrics: RevenueForecastResult['customerMetrics'] = undefined;
    if (input.existingCustomers !== undefined && input.newCustomersPerMonth !== undefined) {
      customerMetrics = {
        endingCustomers: currentCustomers,
        totalAcquired,
        totalChurned,
        netCustomerGrowth: currentCustomers - input.existingCustomers,
        avgRevenuePerCustomer: input.averageRevenuePerCustomer || 0,
      };
    }
    
    // Generate insights, recommendations, and risks
    const insights = this.generateInsights(monthlyForecasts, streamBreakdown, customerMetrics);
    const recommendations = this.generateRecommendations(input, streamBreakdown, totalGrowth);
    const risks = this.generateRisks(input, streamBreakdown);
    
    const result: RevenueForecastResult = {
      monthlyForecasts,
      summary: {
        totalForecastRevenue,
        averageMonthlyRevenue,
        peakMonth: { month: peakMonth!.month, revenue: peakMonth!.totalRevenue },
        lowestMonth: { month: lowestMonth!.month, revenue: lowestMonth!.totalRevenue },
        totalGrowth,
        compoundMonthlyGrowthRate,
      },
      streamBreakdown,
      insights,
      recommendations,
      risks,
    };
    
    if (customerMetrics) {
      result.customerMetrics = customerMetrics;
    }
    
    return result;
  }
  
  /**
   * Get seasonal factor for a given month and pattern
   */
  private static getSeasonalFactor(stream: RevenueStream, monthIndex: number): number {
    if (!stream.seasonalityPattern || stream.seasonalityPattern === 'none') {
      return 1.0;
    }
    
    // Retail pattern (high Q4, low Q1)
    if (stream.seasonalityPattern === 'retail') {
      const retailFactors = [0.8, 0.75, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.0, 1.1, 1.3, 1.5];
      return retailFactors[monthIndex] || 1.0;
    }
    
    // B2B pattern (low in summer and December)
    if (stream.seasonalityPattern === 'b2b') {
      const b2bFactors = [1.1, 1.05, 1.1, 1.0, 0.95, 0.85, 0.8, 0.85, 1.0, 1.05, 1.1, 0.9];
      return b2bFactors[monthIndex] || 1.0;
    }
    
    // Custom pattern
    if (stream.seasonalityPattern === 'custom' && stream.customSeasonalFactors) {
      return stream.customSeasonalFactors[monthIndex] || 1.0;
    }
    
    return 1.0;
  }
  
  /**
   * Get month name from index
   */
  private static getMonthName(index: number): string {
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return names[index] || 'Month';
  }
  
  /**
   * Calculate breakdown by revenue stream
   */
  private static calculateStreamBreakdown(
    streams: RevenueStream[],
    forecasts: MonthlyForecast[]
  ) {
    return streams.map(stream => {
      const totalRevenue = forecasts.reduce((sum, month) => 
        sum + (month.revenueByStream[stream.name] || 0), 0
      );
      
      const firstMonth = forecasts[0]?.revenueByStream[stream.name] || 0;
      const lastMonth = forecasts[forecasts.length - 1]?.revenueByStream[stream.name] || 0;
      const growth = firstMonth > 0 ? ((lastMonth - firstMonth) / firstMonth) * 100 : 0;
      
      const allStreamsTotal = forecasts.reduce((sum, month) => sum + month.totalRevenue, 0);
      const percentOfTotal = allStreamsTotal > 0 ? (totalRevenue / allStreamsTotal) * 100 : 0;
      
      return {
        name: stream.name,
        totalRevenue,
        percentOfTotal,
        avgMonthlyRevenue: totalRevenue / forecasts.length,
        growth,
      };
    });
  }
  
  /**
   * Generate insights about the forecast
   */
  private static generateInsights(
    forecasts: MonthlyForecast[],
    streamBreakdown: Array<{
      name: string;
      totalRevenue: number;
      percentOfTotal: number;
      avgMonthlyRevenue: number;
      growth: number;
    }>,
    customerMetrics?: RevenueForecastResult['customerMetrics']
  ): string[] {
    const insights: string[] = [];
    
    const peakMonth = forecasts.reduce((max, curr) => 
      curr.totalRevenue > (max?.totalRevenue || 0) ? curr : max
    , forecasts[0]) || forecasts[0];
    const lowestMonth = forecasts.reduce((min, curr) => 
      curr.totalRevenue < (min?.totalRevenue || Infinity) ? curr : min
    , forecasts[0]) || forecasts[0];
    
    insights.push(`Revenue peaks in ${peakMonth!.monthName} at ${this.formatCurrency(peakMonth!.totalRevenue)} and is lowest in ${lowestMonth!.monthName} at ${this.formatCurrency(lowestMonth!.totalRevenue)}.`);
    
    // Seasonality insight
    const seasonalVariation = ((peakMonth!.totalRevenue - lowestMonth!.totalRevenue) / lowestMonth!.totalRevenue) * 100;
    if (seasonalVariation > 30) {
      insights.push(`⚠️ High seasonality (${seasonalVariation.toFixed(0)}% variation) - ensure sufficient cash reserves for low months.`);
    }
    
    // Stream concentration
    const topStream = streamBreakdown.reduce((max, curr) => 
      curr.percentOfTotal > max.percentOfTotal ? curr : max
    );
    if (topStream.percentOfTotal > 70) {
      insights.push(`⚠️ Revenue concentration: ${topStream.name} represents ${topStream.percentOfTotal.toFixed(0)}% of total revenue.`);
    }
    
    // Customer-based insights
    if (customerMetrics && customerMetrics.endingCustomers !== undefined) {
      const startingCustomers = customerMetrics.endingCustomers - customerMetrics.netCustomerGrowth;
      insights.push(`Customer base grows from ${startingCustomers.toFixed(0)} to ${customerMetrics.endingCustomers.toFixed(0)} customers over the forecast period.`);
      
      if (customerMetrics.totalChurned > customerMetrics.totalAcquired * 0.5) {
        insights.push(`⚠️ High churn: You're losing ${((customerMetrics.totalChurned / customerMetrics.totalAcquired) * 100).toFixed(0)}% as many customers as you acquire.`);
      }
    }
    
    return insights;
  }
  
  /**
   * Generate recommendations for revenue optimization
   */
  private static generateRecommendations(
    input: RevenueForecastInput,
    streamBreakdown: Array<{
      name: string;
      totalRevenue: number;
      percentOfTotal: number;
      avgMonthlyRevenue: number;
      growth: number;
    }>,
    totalGrowth: number
  ): string[] {
    const recommendations: string[] = [];
    
    // Growth recommendations
    if (totalGrowth < 10) {
      recommendations.push(`📈 Accelerate growth: Current ${totalGrowth.toFixed(1)}% growth is modest. Target 10%+ for healthy businesses.`);
    }
    
    // Diversification
    if (streamBreakdown.length === 1) {
      recommendations.push(`🎯 Diversify revenue: Add new revenue streams to reduce dependency on single source.`);
    }
    
    const topStream = streamBreakdown.reduce((max, curr) => 
      curr.percentOfTotal > max.percentOfTotal ? curr : max
    );
    if (topStream.percentOfTotal > 70) {
      recommendations.push(`⚠️ Reduce concentration: ${topStream.name} is ${topStream.percentOfTotal.toFixed(0)}% of revenue. Add complementary streams.`);
    }
    
    // Stream-specific recommendations
    const slowGrowthStreams = streamBreakdown.filter(s => s.growth < 5);
    if (slowGrowthStreams.length > 0) {
      recommendations.push(`🚀 Invest in growth for: ${slowGrowthStreams.map(s => s.name).join(', ')}`);
    }
    
    // Customer-based recommendations
    if (input.monthlyChurnRate && input.monthlyChurnRate > 5) {
      recommendations.push(`🔄 Reduce churn from ${input.monthlyChurnRate.toFixed(1)}% to <5% to accelerate revenue growth.`);
      recommendations.push(`   • Improving retention by 1% could add thousands in annual revenue`);
    }
    
    return recommendations;
  }
  
  /**
   * Generate risk warnings
   */
  private static generateRisks(
    input: RevenueForecastInput,
    streamBreakdown: Array<{
      name: string;
      totalRevenue: number;
      percentOfTotal: number;
      avgMonthlyRevenue: number;
      growth: number;
    }>
  ): string[] {
    const risks: string[] = [];
    
    // Suppress unused variable warning
    void streamBreakdown;
    
    // High growth rate risk
    const avgGrowthRate = input.revenueStreams.reduce((sum, s) => sum + s.growthRate, 0) / input.revenueStreams.length;
    if (avgGrowthRate > 30) {
      risks.push(`⚠️ Aggressive ${avgGrowthRate.toFixed(0)}% growth assumption - actual results may vary significantly.`);
    }
    
    // Negative growth risk
    const decliningStreams = input.revenueStreams.filter(s => s.growthRate < 0);
    if (decliningStreams.length > 0) {
      risks.push(`📉 Revenue decline risk in: ${decliningStreams.map(s => `${s.name} (${s.growthRate.toFixed(0)}%)`).join(', ')}`);
    }
    
    // Customer acquisition risk
    if (input.newCustomersPerMonth && input.existingCustomers && input.monthlyChurnRate) {
      const netGrowthRate = ((input.newCustomersPerMonth / input.existingCustomers) - (input.monthlyChurnRate / 100)) * 100;
      if (netGrowthRate < 2) {
        risks.push(`⚠️ Low net customer growth (${netGrowthRate.toFixed(1)}%/month) may limit revenue upside.`);
      }
    }
    
    // Forecast uncertainty
    if (input.forecastMonths > 12) {
      risks.push(`📅 Long forecast horizon (${input.forecastMonths} months) increases uncertainty. Review and update quarterly.`);
    }
    
    return risks;
  }
  
  /**
   * Format currency for display
   */
  private static formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
}

