/**
 * Value at Risk (VaR) Calculator
 * Historical, Parametric, and Monte Carlo VaR methods
 */

import type { VaRInput } from '../schemas/var.js';

export class VaRCalculator {
  /**
   * Calculate Value at Risk
   */
  static analyze(input: VaRInput): unknown {
    const portfolio = input.portfolio;
    const parameters = input.parameters;
    const marketData = input.marketData;
    const analysis = input.analysis;

    let varResult: {
      varValue: number;
      method: string;
      confidenceLevel: number;
      timeHorizon: number;
    };

    // Calculate VaR based on method
    if (parameters.method === 'historical' && marketData.historicalReturns) {
      varResult = this.calculateHistoricalVaR(
        marketData.historicalReturns,
        portfolio.totalValue,
        parameters.confidenceLevel
      );
    } else if (parameters.method === 'parametric') {
      varResult = this.calculateParametricVaR(
        portfolio,
        marketData.volatilities,
        parameters.confidenceLevel,
        parameters.timeHorizon
      );
    } else {
      varResult = this.calculateMonteCarloVaR(
        portfolio,
        marketData.volatilities,
        parameters.confidenceLevel,
        parameters.timeHorizon
      );
    }

    // Stress testing
    const stressTesting = analysis.includeStressTesting
      ? this.performStressTesting(portfolio, varResult.varValue)
      : undefined;

    // Backtesting
    const backtesting =
      analysis.includeBacktesting && marketData.historicalReturns
        ? this.performBacktesting(
            marketData.historicalReturns,
            varResult.varValue,
            portfolio.totalValue
          )
        : undefined;

    // Recommendations
    const recommendations = this.generateRecommendations(varResult, stressTesting);

    return {
      summary: {
        var: varResult.varValue,
        varPercent: (varResult.varValue / portfolio.totalValue) * 100,
        method: varResult.method,
        confidenceLevel: varResult.confidenceLevel,
        timeHorizon: varResult.timeHorizon,
      },
      varResult,
      stressTesting,
      backtesting,
      recommendations,
    };
  }

  private static calculateHistoricalVaR(
    historicalReturns: number[],
    portfolioValue: number,
    confidenceLevel: number
  ): {
    varValue: number;
    method: string;
    confidenceLevel: number;
    timeHorizon: number;
  } {
    // Sort returns and find percentile
    const sortedReturns = [...historicalReturns].sort((a, b) => a - b);
    const percentileIndex = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    const varReturn = sortedReturns[percentileIndex] || sortedReturns[0] || 0;
    const varValue = Math.abs(varReturn) * portfolioValue;

    return {
      varValue,
      method: 'Historical Simulation',
      confidenceLevel,
      timeHorizon: 1,
    };
  }

  private static calculateParametricVaR(
    portfolio: VaRInput['portfolio'],
    volatilities?: number[],
    confidenceLevel: number = 0.95,
    timeHorizon: number = 1
  ): {
    varValue: number;
    method: string;
    confidenceLevel: number;
    timeHorizon: number;
  } {
    // Simplified: assume portfolio volatility
    const portfolioVolatility =
      volatilities && volatilities.length > 0
        ? volatilities.reduce((sum, v) => sum + v, 0) / volatilities.length
        : 0.15; // Default 15% volatility

    // Z-score for confidence level (95% = 1.65, 99% = 2.33)
    const zScore = confidenceLevel === 0.95 ? 1.65 : confidenceLevel === 0.99 ? 2.33 : 1.96;

    // VaR = Portfolio Value × Volatility × Z-score × sqrt(time horizon)
    const varValue =
      portfolio.totalValue * portfolioVolatility * zScore * Math.sqrt(timeHorizon / 252);

    return {
      varValue,
      method: 'Parametric (Variance-Covariance)',
      confidenceLevel,
      timeHorizon,
    };
  }

  private static calculateMonteCarloVaR(
    portfolio: VaRInput['portfolio'],
    volatilities?: number[],
    confidenceLevel: number = 0.95,
    timeHorizon: number = 1
  ): {
    varValue: number;
    method: string;
    confidenceLevel: number;
    timeHorizon: number;
  } {
    // Simplified Monte Carlo simulation
    const simulations = 10000;
    const portfolioVolatility =
      volatilities && volatilities.length > 0
        ? volatilities.reduce((sum, v) => sum + v, 0) / volatilities.length
        : 0.15;

    const simulatedReturns: number[] = [];
    for (let i = 0; i < simulations; i++) {
      // Generate random return using normal distribution
      const randomReturn =
        this.generateNormalRandom() * portfolioVolatility * Math.sqrt(timeHorizon / 252);
      simulatedReturns.push(randomReturn);
    }

    // Sort and find percentile
    simulatedReturns.sort((a, b) => a - b);
    const percentileIndex = Math.floor((1 - confidenceLevel) * simulations);
    const varReturn = Math.abs(simulatedReturns[percentileIndex] || 0);
    const varValue = varReturn * portfolio.totalValue;

    return {
      varValue,
      method: 'Monte Carlo Simulation',
      confidenceLevel,
      timeHorizon,
    };
  }

  private static generateNormalRandom(): number {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  private static performStressTesting(
    portfolio: VaRInput['portfolio'],
    baseVaR: number
  ): {
    scenarios: Array<{
      scenario: string;
      stressVaR: number;
      stressPercent: number;
    }>;
  } {
    const scenarios = [
      { name: 'Market Crash (-20%)', shock: -0.2 },
      { name: 'Market Correction (-10%)', shock: -0.1 },
      { name: 'Volatility Spike (+50%)', shock: 0.5 },
    ];

    return {
      scenarios: scenarios.map((s) => ({
        scenario: s.name,
        stressVaR: baseVaR * (1 + Math.abs(s.shock)),
        stressPercent: ((baseVaR * (1 + Math.abs(s.shock))) / portfolio.totalValue) * 100,
      })),
    };
  }

  private static performBacktesting(
    historicalReturns: number[],
    varValue: number,
    portfolioValue: number
  ): {
    violations: number;
    violationRate: number;
    backtestResult: string;
  } {
    const varReturn = varValue / portfolioValue;
    const violations = historicalReturns.filter((r) => r < -varReturn).length;
    const violationRate = historicalReturns.length > 0 ? violations / historicalReturns.length : 0;

    let backtestResult = '';
    const expectedViolations = (1 - 0.95) * historicalReturns.length; // Assuming 95% confidence
    if (violations <= expectedViolations * 1.5) {
      backtestResult = 'VaR model appears accurate';
    } else {
      backtestResult = 'VaR model may underestimate risk - consider recalibration';
    }

    return {
      violations,
      violationRate,
      backtestResult,
    };
  }

  private static generateRecommendations(
    varResult: { varValue: number; method: string },
    stressTesting?: { scenarios: Array<{ stressVaR: number }> }
  ): string[] {
    const recommendations: string[] = [];

    recommendations.push(`VaR (${varResult.method}): $${varResult.varValue.toFixed(0)}`);

    if (stressTesting) {
      const maxStressVaR = Math.max(...stressTesting.scenarios.map((s) => s.stressVaR));
      recommendations.push(`Maximum stress VaR: $${maxStressVaR.toFixed(0)}`);
    }

    recommendations.push('Monitor VaR regularly and adjust positions if risk exceeds tolerance');
    recommendations.push('Consider diversification to reduce portfolio VaR');

    return recommendations;
  }
}



