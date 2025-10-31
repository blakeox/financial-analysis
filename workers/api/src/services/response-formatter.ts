/**
 * Enhanced Response Formatter
 * Converts tool results into user-friendly, conversational responses
 */

export class ResponseFormatter {
  /**
   * Format tool result into readable response
   */
  formatToolResponse(toolName: string, result: any, context?: any): string {
    const formatters: Record<string, (result: any, context?: any) => string> = {
      'analyze_amortization': this.formatAmortizationResponse.bind(this),
      'analyze_lease': this.formatLeaseResponse.bind(this),
      'analyze_enhanced_lease': this.formatLeaseResponse.bind(this),
      'analyze_auto_loan': this.formatAutoLoanResponse.bind(this),
      'analyze_debt_payoff': this.formatDebtPayoffResponse.bind(this),
      'analyze_retirement_savings': this.formatRetirementResponse.bind(this),
      'analyze_savings_goal': this.formatSavingsGoalResponse.bind(this),
      'analyze_student_loans': this.formatStudentLoanResponse.bind(this),
      'optimize_budget': this.formatBudgetResponse.bind(this),
      'analyze_financial_journey': this.formatFinancialJourneyResponse.bind(this),
      // Add more formatters as needed
    };

    const formatter = formatters[toolName];
    return formatter ? formatter(result, context) : this.formatGenericResponse(result);
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  private formatAmortizationResponse(result: any): string {
    const monthly = this.formatCurrency(result.monthlyPayment);
    const totalInterest = this.formatCurrency(result.totalInterest);
    const totalCost = this.formatCurrency(result.totalPayment);

    const insights = this.generateAmortizationInsights(result);
    const recommendations = this.generateAmortizationRecommendations(result);

    return `Here's your loan analysis:

💰 **Monthly Payment:** ${monthly}
📊 **Total Interest:** ${totalInterest}
📈 **Total Cost:** ${totalCost}

${insights.length > 0 ? `**Key Insights:**\n${insights.join('\n')}\n\n` : ''}${recommendations.length > 0 ? `**Recommendations:**\n${recommendations.join('\n')}` : ''}`;
  }

  private generateAmortizationInsights(result: any): string[] {
    const insights: string[] = [];

    if (result.totalInterest > result.principal) {
      insights.push(`⚠️ You'll pay more in interest (${this.formatCurrency(result.totalInterest)}) than the principal amount`);
    }

    if (result.monthlyPayment > 3000) {
      insights.push(`💡 Your monthly payment is quite high - consider if this fits your budget comfortably`);
    }

    const interestRatio = result.totalInterest / result.totalPayment;
    if (interestRatio > 0.3) {
      insights.push(`📉 High interest proportion: ${(interestRatio * 100).toFixed(0)}% of your payment goes to interest`);
    }

    return insights;
  }

  private generateAmortizationRecommendations(result: any): string[] {
    const recommendations: string[] = [];

    if (result.totalInterest > result.principal) {
      recommendations.push(`Consider making extra payments to reduce total interest cost`);
    }

    if (result.monthlyPayment < 1500) {
      recommendations.push(`This loan looks affordable for most budgets`);
    }

    recommendations.push(`Try different scenarios to find the best balance between monthly payment and total cost`);

    return recommendations;
  }

  private formatLeaseResponse(result: any): string {
    const monthly = this.formatCurrency(result.metrics?.averageMonthlyPayment || result.metrics?.totalCost / result.termMonths || 0);
    const total = this.formatCurrency(result.metrics?.totalCost || 0);
    const effectiveRate = result.metrics?.effectiveAnnualRate
      ? `${(result.metrics.effectiveAnnualRate * 100).toFixed(2)}%`
      : 'N/A';

    return `Here's your lease analysis:

💼 **Lease Type:** ${result.leaseType || 'Standard'}
📅 **Term:** ${result.termMonths || 'N/A'} months
💰 **Avg Monthly Payment:** ${monthly}
📊 **Total Cost:** ${total}
📈 **Effective Annual Rate:** ${effectiveRate}

${result.insights?.recommendations?.length > 0 ? `**Recommendations:**\n${result.insights.recommendations.map((r: string) => `• ${r}`).join('\n')}\n\n` : ''}`;
  }

  private formatAutoLoanResponse(result: any): string {
    const monthly = this.formatCurrency(result.loanAnalysis?.monthlyPayment || 0);
    const totalInterest = this.formatCurrency(result.loanAnalysis?.totalInterest || 0);
    const totalCost = this.formatCurrency(result.loanAnalysis?.totalCost || 0);

    return `Here's your auto loan analysis:

🚗 **Monthly Payment:** ${monthly}
💵 **Total Interest:** ${totalInterest}
📊 **Total Cost:** ${totalCost}

${result.insights?.length > 0 ? `**Key Points:**\n${result.insights.slice(0, 3).map((i: string) => `• ${i}`).join('\n')}\n\n` : ''}`;
  }

  private formatDebtPayoffResponse(result: any): string {
    const recommended = result.strategy || {};
    const payoffDate = recommended.payoffDate || 'N/A';
    const totalInterest = this.formatCurrency(result.summary?.totalInterestPaid || 0);

    return `Here's your debt payoff strategy:

📅 **Recommended Strategy:** ${recommended.name || 'Avalanche Method'}
🎯 **Payoff Date:** ${payoffDate}
💰 **Total Interest:** ${totalInterest}
⏱️ **Months to Payoff:** ${recommended.totalMonths || 'N/A'}

${recommended.reasoning ? `**Why this strategy:** ${recommended.reasoning}\n\n` : ''}`;
  }

  private formatRetirementResponse(result: any): string {
    const retirementAge = result.summary?.retirementAge || 'N/A';
    const monthlyNeeded = this.formatCurrency(result.summary?.monthlyContributionNeeded || 0);
    const retirementFund = this.formatCurrency(result.summary?.projectedRetirementFund || 0);

    return `Here's your retirement plan:

🎯 **Target Retirement Age:** ${retirementAge}
💰 **Monthly Contribution Needed:** ${monthlyNeeded}
🏦 **Projected Retirement Fund:** ${retirementFund}

${result.insights?.length > 0 ? `**Important Insights:**\n${result.insights.slice(0, 3).map((i: string) => `• ${i}`).join('\n')}\n\n` : ''}`;
  }

  private formatSavingsGoalResponse(result: any): string {
    const monthlyNeeded = this.formatCurrency(result.plan?.monthlyContribution || 0);
    const totalNeeded = this.formatCurrency(result.goal?.targetAmount || 0);
    const timeline = result.plan?.monthsToReach || 'N/A';

    return `Here's your savings plan:

🎯 **Goal Amount:** ${totalNeeded}
💰 **Monthly Savings:** ${monthlyNeeded}
📅 **Timeline:** ${timeline} months

${result.recommendations?.length > 0 ? `**Recommendations:**\n${result.recommendations.slice(0, 3).map((r: string) => `• ${r}`).join('\n')}\n\n` : ''}`;
  }

  private formatStudentLoanResponse(result: any): string {
    const monthly = this.formatCurrency(result.summary?.monthlyPayment || 0);
    const totalInterest = this.formatCurrency(result.summary?.totalInterestPaid || 0);
    const payoffDate = result.summary?.payoffDate || 'N/A';

    return `Here's your student loan analysis:

💰 **Monthly Payment:** ${monthly}
💵 **Total Interest:** ${totalInterest}
📅 **Payoff Date:** ${payoffDate}

${result.recommendations?.length > 0 ? `**Recommendations:**\n${result.recommendations.slice(0, 3).map((r: string) => `• ${r}`).join('\n')}\n\n` : ''}`;
  }

  private formatBudgetResponse(result: any): string {
    const deficit = this.formatCurrency(Math.abs(result.summary?.monthlyDeficit || 0));
    const surplus = this.formatCurrency(result.summary?.monthlySurplus || 0);
    const hasDeficit = result.summary?.monthlyDeficit && result.summary.monthlyDeficit < 0;

    return `Here's your budget analysis:

${hasDeficit ? `⚠️ **Monthly Deficit:** ${deficit}` : `✅ **Monthly Surplus:** ${surplus}`}

${result.recommendations?.length > 0 ? `**To improve your budget:**\n${result.recommendations.slice(0, 3).map((r: string) => `• ${r}`).join('\n')}\n\n` : ''}`;
  }

  private formatFinancialJourneyResponse(result: any): string {
    const stage = result.summary?.currentStage || 'unknown';
    const score = result.summary?.overallFinancialHealth || 0;
    const nextMilestone = result.summary?.nextMilestone || 'Get started';

    return `Here's your financial journey assessment:

🎯 **Current Stage:** ${this.formatStageName(stage)}
📊 **Financial Health Score:** ${score}/100
🚀 **Next Milestone:** ${nextMilestone}

${result.recommendations?.length > 0 ? `**Next Steps:**\n${result.recommendations.slice(0, 3).map((r: string) => `• ${r}`).join('\n')}\n\n` : ''}`;
  }

  private formatStageName(stage: string): string {
    const stageNames: Record<string, string> = {
      'getting-started': 'Getting Started',
      'building-foundations': 'Building Foundations',
      'acceleration': 'Acceleration Phase',
      'optimization': 'Optimization',
      'preparation': 'Preparation',
      'independence': 'Financial Independence',
    };
    return stageNames[stage] || stage;
  }

  private formatGenericResponse(result: any): string {
    // Generic formatter for unknown results
    if (typeof result === 'string') {
      return result;
    }

    if (typeof result === 'object' && result !== null) {
      // Try to extract key information
      const summary = result.summary || result.result || result;
      
      if (summary && typeof summary === 'object') {
        const keyPoints = Object.entries(summary)
          .slice(0, 5)
          .map(([key, value]) => `**${key}:** ${value}`)
          .join('\n');
        
        return `Analysis Results:\n\n${keyPoints}`;
      }
    }

    // Fallback to JSON
    return JSON.stringify(result, null, 2).slice(0, 2000);
  }
}


