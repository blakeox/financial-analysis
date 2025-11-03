/**
 * Unit Economics Analysis Engine
 * 
 * Analyzes customer-level profitability metrics critical for SaaS, subscription,
 * and e-commerce businesses. Calculates CAC, LTV, payback period, and provides
 * actionable recommendations for improving unit economics.
 */

export interface UnitEconomicsInput {
  // Customer Acquisition
  monthlyMarketingSpend: number;
  newCustomersPerMonth: number;
  
  // Revenue & Pricing
  averageMonthlyRevenue: number; // ARPU (Average Revenue Per User)
  averageCustomerLifespanMonths: number;
  
  // Costs
  costOfGoodsSoldPercent: number; // % of revenue (COGS)
  variableServicingCostPerCustomer: number; // Monthly cost to service each customer
  
  // Retention & Growth
  monthlyChurnRate: number; // % customers lost per month
  
  // Optional Advanced Inputs
  organicGrowthPercent?: number; // % of customers acquired without paid marketing
  referralRate?: number; // % of customers who refer others
  discountRate?: number; // For NPV calculations (default 10%)
  revenueGrowthRate?: number; // Annual revenue growth per customer (upsells, expansion)
}

export interface CohortAnalysis {
  month: number;
  customersRemaining: number;
  cumulativeRevenue: number;
  cumulativeCosts: number;
  cumulativeProfit: number;
  lifetimeValue: number;
}

export interface UnitEconomicsResult {
  // Core Metrics
  cac: number; // Customer Acquisition Cost
  ltv: number; // Lifetime Value
  ltvToCacRatio: number;
  
  // Profitability
  grossMarginPercent: number;
  contributionMarginPerCustomer: number;
  
  // Payback & Timing
  paybackPeriodMonths: number;
  breakEvenMonth: number;
  
  // Retention Metrics
  customerLifespanMonths: number;
  retentionRate: number;
  churnRate: number;
  
  // Advanced Metrics
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  netRevenueRetention: number;
  
  // Cohort Analysis
  cohortAnalysis: CohortAnalysis[];
  
  // Benchmarking
  benchmarks: {
    ltvCacRatio: { your: number; target: number; status: 'good' | 'warning' | 'poor' };
    payback: { your: number; target: number; status: 'good' | 'warning' | 'poor' };
    churn: { your: number; target: number; status: 'good' | 'warning' | 'poor' };
    grossMargin: { your: number; target: number; status: 'good' | 'warning' | 'poor' };
  };
  
  // Insights & Recommendations
  insights: string[];
  recommendations: string[];
  warnings: string[];
  
  // Summary
  summary: {
    overallHealth: 'excellent' | 'good' | 'needs-improvement' | 'critical';
    profitPerCustomer: number;
    monthsToPositiveCashFlow: number;
    annualizedCustomerValue: number;
  };
}

export class UnitEconomicsEngine {
  /**
   * Analyze unit economics and customer profitability
   */
  static analyze(input: UnitEconomicsInput): UnitEconomicsResult {
    // Defaults
    const discountRate = input.discountRate || 0.10; // 10% annual = 0.833% monthly
    const monthlyDiscountRate = discountRate / 12;
    const revenueGrowthRate = input.revenueGrowthRate || 0;
    const monthlyRevenueGrowthRate = revenueGrowthRate / 12;
    
    // 1. Calculate CAC (Customer Acquisition Cost)
    const organicPercent = input.organicGrowthPercent || 0;
    const paidCustomers = input.newCustomersPerMonth * (1 - organicPercent / 100);
    const cac = paidCustomers > 0 ? input.monthlyMarketingSpend / paidCustomers : 0;
    
    // 2. Calculate Gross Margin
    const grossMarginPercent = 100 - input.costOfGoodsSoldPercent;
    const grossMarginDollars = input.averageMonthlyRevenue * (grossMarginPercent / 100);
    
    // 3. Calculate Contribution Margin (Gross Margin - Variable Servicing Costs)
    const contributionMarginPerCustomer = grossMarginDollars - input.variableServicingCostPerCustomer;
    
    // 4. Calculate Customer Lifespan
    const retentionRate = 1 - input.monthlyChurnRate / 100;
    const customerLifespanMonths = input.monthlyChurnRate > 0 
      ? 1 / (input.monthlyChurnRate / 100)
      : input.averageCustomerLifespanMonths;
    
    // 5. Calculate LTV (Lifetime Value) - Basic Method
    const ltv = this.calculateLTV(
      input.averageMonthlyRevenue,
      grossMarginPercent,
      input.variableServicingCostPerCustomer,
      retentionRate,
      monthlyDiscountRate,
      monthlyRevenueGrowthRate
    );
    
    // 6. LTV:CAC Ratio
    const ltvToCacRatio = cac > 0 ? ltv / cac : 0;
    
    // 7. Payback Period (months to recover CAC)
    const paybackPeriodMonths = contributionMarginPerCustomer > 0
      ? cac / contributionMarginPerCustomer
      : 999;
    
    // 8. Cohort Analysis (24 months)
    const cohortAnalysis = this.generateCohortAnalysis(
      input.averageMonthlyRevenue,
      grossMarginPercent,
      input.variableServicingCostPerCustomer,
      retentionRate,
      cac,
      monthlyRevenueGrowthRate,
      24
    );
    
    // 9. Calculate MRR and ARR
    const monthlyRecurringRevenue = input.averageMonthlyRevenue * input.newCustomersPerMonth;
    const annualRecurringRevenue = monthlyRecurringRevenue * 12;
    
    // 10. Net Revenue Retention (assumes revenue growth per customer)
    const netRevenueRetention = (retentionRate * (1 + monthlyRevenueGrowthRate)) * 100;
    
    // 11. Benchmarking
    const benchmarks = this.generateBenchmarks(
      ltvToCacRatio,
      paybackPeriodMonths,
      input.monthlyChurnRate,
      grossMarginPercent
    );
    
    // 12. Generate Insights
    const insights = this.generateInsights(
      ltvToCacRatio,
      paybackPeriodMonths,
      input.monthlyChurnRate,
      grossMarginPercent,
      contributionMarginPerCustomer,
      netRevenueRetention
    );
    
    // 13. Generate Recommendations
    const recommendations = this.generateRecommendations(
      ltvToCacRatio,
      paybackPeriodMonths,
      input.monthlyChurnRate,
      cac,
      ltv,
      grossMarginPercent
    );
    
    // 14. Generate Warnings
    const warnings = this.generateWarnings(
      ltvToCacRatio,
      paybackPeriodMonths,
      input.monthlyChurnRate,
      cac,
      ltv
    );
    
    // 15. Overall Health Assessment
    const overallHealth = this.assessOverallHealth(
      ltvToCacRatio,
      paybackPeriodMonths,
      input.monthlyChurnRate,
      grossMarginPercent
    );
    
    // 16. Summary Metrics
    const breakEvenMonth = cohortAnalysis.findIndex(m => m.cumulativeProfit >= 0);
    const monthsToPositiveCashFlow = breakEvenMonth >= 0 ? breakEvenMonth : 999;
    const profitPerCustomer = ltv - cac;
    const annualizedCustomerValue = input.averageMonthlyRevenue * 12;
    
    return {
      cac,
      ltv,
      ltvToCacRatio,
      grossMarginPercent,
      contributionMarginPerCustomer,
      paybackPeriodMonths,
      breakEvenMonth: monthsToPositiveCashFlow,
      customerLifespanMonths,
      retentionRate: retentionRate * 100,
      churnRate: input.monthlyChurnRate,
      monthlyRecurringRevenue,
      annualRecurringRevenue,
      netRevenueRetention,
      cohortAnalysis,
      benchmarks,
      insights,
      recommendations,
      warnings,
      summary: {
        overallHealth,
        profitPerCustomer,
        monthsToPositiveCashFlow,
        annualizedCustomerValue,
      },
    };
  }
  
  /**
   * Calculate Lifetime Value using discounted cash flow method
   */
  private static calculateLTV(
    monthlyRevenue: number,
    grossMarginPercent: number,
    servicingCost: number,
    retentionRate: number,
    discountRate: number,
    revenueGrowthRate: number
  ): number {
    let ltv = 0;
    let revenue = monthlyRevenue;
    let retention = retentionRate;
    
    // Project 60 months or until retention drops below 1%
    for (let month = 1; month <= 60 && retention > 0.01; month++) {
      const grossProfit = revenue * (grossMarginPercent / 100);
      const contributionMargin = grossProfit - servicingCost;
      const discountFactor = Math.pow(1 + discountRate, -month);
      
      ltv += contributionMargin * retention * discountFactor;
      
      // Apply growth and churn
      revenue *= (1 + revenueGrowthRate);
      retention *= retentionRate;
    }
    
    return ltv;
  }
  
  /**
   * Generate cohort analysis showing cumulative metrics over time
   */
  private static generateCohortAnalysis(
    monthlyRevenue: number,
    grossMarginPercent: number,
    servicingCost: number,
    retentionRate: number,
    cac: number,
    revenueGrowthRate: number,
    months: number
  ): CohortAnalysis[] {
    const cohort: CohortAnalysis[] = [];
    
    let customersRemaining = 100; // Start with 100 customer cohort
    let revenue = monthlyRevenue;
    
    for (let month = 0; month <= months; month++) {
      const monthRevenue = customersRemaining * revenue;
      const grossProfit = monthRevenue * (grossMarginPercent / 100);
      const variableCosts = customersRemaining * servicingCost;
      const monthProfit = grossProfit - variableCosts;
      
      const prevCumProfit = month > 0 ? cohort[month - 1]!.cumulativeProfit : 0;
      const prevCumRevenue = month > 0 ? cohort[month - 1]!.cumulativeRevenue : 0;
      const prevCumCosts = month > 0 ? cohort[month - 1]!.cumulativeCosts : 0;
      
      const acquisitionCost = month === 0 ? cac * 100 : 0;
      
      cohort.push({
        month,
        customersRemaining: Math.round(customersRemaining * 10) / 10,
        cumulativeRevenue: prevCumRevenue + monthRevenue,
        cumulativeCosts: prevCumCosts + variableCosts + acquisitionCost,
        cumulativeProfit: prevCumProfit + monthProfit - acquisitionCost,
        lifetimeValue: (prevCumRevenue + monthRevenue - prevCumCosts - variableCosts - acquisitionCost) / 100,
      });
      
      // Apply churn
      customersRemaining *= retentionRate;
      
      // Apply revenue growth
      revenue *= (1 + revenueGrowthRate);
    }
    
    return cohort;
  }
  
  /**
   * Generate benchmark comparisons
   */
  private static generateBenchmarks(
    ltvCacRatio: number,
    paybackMonths: number,
    churnRate: number,
    grossMargin: number
  ): UnitEconomicsResult['benchmarks'] {
    return {
      ltvCacRatio: {
        your: ltvCacRatio,
        target: 3.0,
        status: (ltvCacRatio >= 3 ? 'good' : ltvCacRatio >= 2 ? 'warning' : 'poor') as 'good' | 'warning' | 'poor',
      },
      payback: {
        your: paybackMonths,
        target: 12,
        status: (paybackMonths <= 12 ? 'good' : paybackMonths <= 18 ? 'warning' : 'poor') as 'good' | 'warning' | 'poor',
      },
      churn: {
        your: churnRate,
        target: 5,
        status: (churnRate <= 5 ? 'good' : churnRate <= 7 ? 'warning' : 'poor') as 'good' | 'warning' | 'poor',
      },
      grossMargin: {
        your: grossMargin,
        target: 70,
        status: (grossMargin >= 70 ? 'good' : grossMargin >= 60 ? 'warning' : 'poor') as 'good' | 'warning' | 'poor',
      },
    };
  }
  
  /**
   * Generate insights about unit economics
   */
  private static generateInsights(
    ltvCacRatio: number,
    paybackMonths: number,
    churnRate: number,
    grossMargin: number,
    contributionMargin: number,
    netRevenueRetention: number
  ): string[] {
    const insights: string[] = [];
    
    // LTV:CAC Insights
    if (ltvCacRatio >= 5) {
      insights.push(`🎯 Exceptional LTV:CAC ratio of ${ltvCacRatio.toFixed(1)}:1 - You have strong product-market fit and can invest more in customer acquisition.`);
    } else if (ltvCacRatio >= 3) {
      insights.push(`✅ Healthy LTV:CAC ratio of ${ltvCacRatio.toFixed(1)}:1 - Your unit economics are sustainable.`);
    } else if (ltvCacRatio >= 2) {
      insights.push(`⚠️ Marginal LTV:CAC ratio of ${ltvCacRatio.toFixed(1)}:1 - Focus on improving retention or reducing CAC.`);
    } else {
      insights.push(`🚨 Critical LTV:CAC ratio of ${ltvCacRatio.toFixed(1)}:1 - Current unit economics are not sustainable. Urgent action needed.`);
    }
    
    // Payback Period Insights
    if (paybackMonths <= 6) {
      insights.push(`💰 Excellent payback period of ${paybackMonths.toFixed(1)} months - You recover acquisition costs quickly.`);
    } else if (paybackMonths <= 12) {
      insights.push(`✅ Good payback period of ${paybackMonths.toFixed(1)} months - Industry standard for most SaaS businesses.`);
    } else if (paybackMonths <= 18) {
      insights.push(`⚠️ Long payback period of ${paybackMonths.toFixed(1)} months - Consider ways to accelerate revenue or reduce CAC.`);
    } else {
      insights.push(`🚨 Very long payback period of ${paybackMonths.toFixed(1)} months - This creates significant cash flow risk.`);
    }
    
    // Churn Insights
    if (churnRate <= 3) {
      insights.push(`🎯 Excellent retention with ${churnRate.toFixed(1)}% monthly churn - Your product has strong stickiness.`);
    } else if (churnRate <= 5) {
      insights.push(`✅ Good retention with ${churnRate.toFixed(1)}% monthly churn - Within healthy range for most businesses.`);
    } else if (churnRate <= 7) {
      insights.push(`⚠️ High churn rate of ${churnRate.toFixed(1)}% per month - Focus on improving customer success and product value.`);
    } else {
      insights.push(`🚨 Critical churn rate of ${churnRate.toFixed(1)}% per month - Retention issues are severely limiting growth.`);
    }
    
    // Gross Margin Insights
    if (grossMargin >= 80) {
      insights.push(`💎 Outstanding ${grossMargin.toFixed(1)}% gross margin - You have a highly scalable business model.`);
    } else if (grossMargin >= 70) {
      insights.push(`✅ Strong ${grossMargin.toFixed(1)}% gross margin - Good foundation for profitability.`);
    } else if (grossMargin >= 60) {
      insights.push(`⚠️ Moderate ${grossMargin.toFixed(1)}% gross margin - Look for ways to reduce COGS or increase prices.`);
    } else {
      insights.push(`🚨 Low ${grossMargin.toFixed(1)}% gross margin - High COGS may limit profitability. Review pricing and cost structure.`);
    }
    
    // Contribution Margin Insights
    if (contributionMargin > 0) {
      insights.push(`Each customer contributes $${contributionMargin.toFixed(2)}/month after variable costs - this drives your profitability.`);
    } else {
      insights.push(`🚨 Negative contribution margin of $${contributionMargin.toFixed(2)}/month - You lose money on every customer. Urgent pricing/cost review needed.`);
    }
    
    // Net Revenue Retention
    if (netRevenueRetention >= 110) {
      insights.push(`🚀 Exceptional ${netRevenueRetention.toFixed(0)}% net revenue retention - Negative churn through expansion revenue!`);
    } else if (netRevenueRetention >= 100) {
      insights.push(`💰 Strong ${netRevenueRetention.toFixed(0)}% net revenue retention - Expansion revenue offsets churn.`);
    } else if (netRevenueRetention >= 90) {
      insights.push(`Net revenue retention of ${netRevenueRetention.toFixed(0)}% - Focus on upsells and cross-sells to reach 100%+.`);
    }
    
    return insights;
  }
  
  /**
   * Generate actionable recommendations
   */
  private static generateRecommendations(
    ltvCacRatio: number,
    paybackMonths: number,
    churnRate: number,
    cac: number,
    ltv: number,
    grossMargin: number
  ): string[] {
    const recommendations: string[] = [];
    
    // LTV:CAC Recommendations
    if (ltvCacRatio < 3) {
      recommendations.push(`📈 Improve LTV:CAC Ratio: Target 3:1 or better. Current: ${ltvCacRatio.toFixed(1)}:1`);
      
      if (churnRate > 5) {
        recommendations.push(`   • Reduce churn from ${churnRate.toFixed(1)}% to <5% by improving onboarding and customer success`);
      }
      
      if (cac > ltv * 0.5) {
        recommendations.push(`   • Reduce CAC by optimizing marketing channels and improving conversion rates`);
      }
      
      recommendations.push(`   • Increase LTV through upsells, cross-sells, or annual contracts`);
    }
    
    // Payback Recommendations
    if (paybackMonths > 12) {
      recommendations.push(`⏱️ Accelerate Payback: Target <12 months. Current: ${paybackMonths.toFixed(1)} months`);
      recommendations.push(`   • Offer annual plans with discount to get cash upfront`);
      recommendations.push(`   • Implement onboarding fees or setup charges`);
      recommendations.push(`   • Add quick-win features that drive immediate value`);
    }
    
    // Churn Recommendations
    if (churnRate > 5) {
      recommendations.push(`🔄 Reduce Churn: Target <5% monthly. Current: ${churnRate.toFixed(1)}%`);
      recommendations.push(`   • Implement proactive customer success outreach`);
      recommendations.push(`   • Add usage monitoring and at-risk customer alerts`);
      recommendations.push(`   • Improve onboarding to drive faster time-to-value`);
      recommendations.push(`   • Consider annual contracts to reduce voluntary churn`);
    }
    
    // Margin Recommendations
    if (grossMargin < 70) {
      recommendations.push(`📊 Improve Gross Margin: Target 70%+. Current: ${grossMargin.toFixed(1)}%`);
      recommendations.push(`   • Review COGS and identify cost reduction opportunities`);
      recommendations.push(`   • Consider price increases if market allows`);
      recommendations.push(`   • Automate manual processes to reduce servicing costs`);
    }
    
    // Growth Recommendations
    if (ltvCacRatio >= 3 && paybackMonths <= 12) {
      recommendations.push(`🚀 Scale Opportunity: Your unit economics are strong - consider increasing marketing spend to accelerate growth`);
      recommendations.push(`   • Current CAC of $${cac.toFixed(2)} is sustainable with LTV of $${ltv.toFixed(2)}`);
      recommendations.push(`   • You can afford to spend up to $${(ltv / 3).toFixed(2)} per customer while maintaining healthy ratios`);
    }
    
    return recommendations;
  }
  
  /**
   * Generate warnings about critical issues
   */
  private static generateWarnings(
    ltvCacRatio: number,
    paybackMonths: number,
    churnRate: number,
    cac: number,
    ltv: number
  ): string[] {
    const warnings: string[] = [];
    
    if (ltvCacRatio < 1) {
      warnings.push(`🚨 CRITICAL: You're losing money on every customer. LTV ($${ltv.toFixed(2)}) < CAC ($${cac.toFixed(2)}). Immediate action required.`);
    }
    
    if (paybackMonths > 24) {
      warnings.push(`⚠️ CASH FLOW RISK: ${paybackMonths.toFixed(1)}-month payback creates significant working capital needs.`);
    }
    
    if (churnRate > 10) {
      warnings.push(`🚨 CRITICAL CHURN: ${churnRate.toFixed(1)}% monthly churn means you lose half your customers every 7 months.`);
    }
    
    if (churnRate > 7 && paybackMonths > 12) {
      warnings.push(`⚠️ DOUBLE RISK: High churn + long payback = you may lose customers before recovering acquisition costs.`);
    }
    
    return warnings;
  }
  
  /**
   * Assess overall health of unit economics
   */
  private static assessOverallHealth(
    ltvCacRatio: number,
    paybackMonths: number,
    churnRate: number,
    grossMargin: number
  ): 'excellent' | 'good' | 'needs-improvement' | 'critical' {
    const scores = {
      ltv: ltvCacRatio >= 4 ? 3 : ltvCacRatio >= 3 ? 2 : ltvCacRatio >= 2 ? 1 : 0,
      payback: paybackMonths <= 6 ? 3 : paybackMonths <= 12 ? 2 : paybackMonths <= 18 ? 1 : 0,
      churn: churnRate <= 3 ? 3 : churnRate <= 5 ? 2 : churnRate <= 7 ? 1 : 0,
      margin: grossMargin >= 80 ? 3 : grossMargin >= 70 ? 2 : grossMargin >= 60 ? 1 : 0,
    };
    
    const totalScore = scores.ltv + scores.payback + scores.churn + scores.margin;
    const avgScore = totalScore / 4;
    
    if (avgScore >= 2.5) return 'excellent';
    if (avgScore >= 1.5) return 'good';
    if (avgScore >= 0.75) return 'needs-improvement';
    return 'critical';
  }
}

