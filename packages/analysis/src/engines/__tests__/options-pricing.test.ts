import { describe, it, expect } from 'vitest';
import { OptionsPricingAnalyzer } from '../options-pricing';

describe('OptionsPricingAnalyzer', () => {
  const basicCallInput = {
    optionType: 'call' as const,
    optionStyle: 'european' as const,
    strikePrice: 100,
    currentPrice: 105,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    volatility: 0.25,
    riskFreeRate: 0.05,
    dividendYield: 0.02,
    pricingModel: 'black-scholes' as const,
    contractSize: 100,
  };

  const basicPutInput = {
    ...basicCallInput,
    optionType: 'put' as const,
    currentPrice: 95, // OTM put
  };

  describe('basic option pricing', () => {
    it('calculates call option price', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      expect(result.pricing.theoreticalValue).toBeGreaterThan(0);
    });

    it('calculates put option price', () => {
      const result = OptionsPricingAnalyzer.analyze(basicPutInput);

      expect(result.pricing.theoreticalValue).toBeGreaterThan(0);
    });

    it('returns correct option type', () => {
      const callResult = OptionsPricingAnalyzer.analyze(basicCallInput);
      const putResult = OptionsPricingAnalyzer.analyze(basicPutInput);

      expect(callResult.optionType).toBe('call');
      expect(putResult.optionType).toBe('put');
    });
  });

  describe('intrinsic and time value', () => {
    it('ITM call has positive intrinsic value', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      // Call is ITM when price > strike (105 > 100)
      expect(result.pricing.intrinsicValue).toBeGreaterThan(0);
    });

    it('OTM call has zero intrinsic value', () => {
      const otmCall = {
        ...basicCallInput,
        currentPrice: 95, // Below strike
      };

      const result = OptionsPricingAnalyzer.analyze(otmCall);

      expect(result.pricing.intrinsicValue).toBe(0);
    });

    it('time value is positive for non-expired options', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      expect(result.pricing.timeValue).toBeGreaterThan(0);
    });

    it('theoretical value equals intrinsic + time value', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      expect(result.pricing.theoreticalValue).toBeCloseTo(
        result.pricing.intrinsicValue + result.pricing.timeValue,
        2
      );
    });
  });

  describe('moneyness', () => {
    it('identifies ITM call correctly', () => {
      const itmCall = {
        ...basicCallInput,
        currentPrice: 110, // Well above strike
      };

      const result = OptionsPricingAnalyzer.analyze(itmCall);

      expect(result.pricing.moneyness).toBe('ITM');
    });

    it('identifies OTM call correctly', () => {
      const otmCall = {
        ...basicCallInput,
        currentPrice: 90, // Below strike
      };

      const result = OptionsPricingAnalyzer.analyze(otmCall);

      expect(result.pricing.moneyness).toBe('OTM');
    });

    it('identifies ATM option correctly', () => {
      const atmOption = {
        ...basicCallInput,
        currentPrice: 100, // At strike
      };

      const result = OptionsPricingAnalyzer.analyze(atmOption);

      expect(result.pricing.moneyness).toBe('ATM');
    });

    it('identifies ITM put correctly', () => {
      const itmPut = {
        ...basicPutInput,
        currentPrice: 90, // Below strike for put
      };

      const result = OptionsPricingAnalyzer.analyze(itmPut);

      expect(result.pricing.moneyness).toBe('ITM');
    });
  });

  describe('Greeks calculations', () => {
    it('calculates delta', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      expect(result.greeks.delta).toBeDefined();
      // ITM call should have delta > 0.5
      expect(result.greeks.delta).toBeGreaterThan(0.5);
      expect(result.greeks.delta).toBeLessThanOrEqual(1);
    });

    it('call delta is positive', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      expect(result.greeks.delta).toBeGreaterThan(0);
    });

    it('put delta is negative', () => {
      const result = OptionsPricingAnalyzer.analyze(basicPutInput);

      expect(result.greeks.delta).toBeLessThan(0);
    });

    it('calculates gamma', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      expect(result.greeks.gamma).toBeGreaterThan(0);
    });

    it('calculates theta (time decay)', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      // Theta is typically negative for long options (time decay)
      expect(result.greeks.theta).toBeDefined();
    });

    it('calculates vega', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      // Vega should be positive
      expect(result.greeks.vega).toBeGreaterThan(0);
    });

    it('calculates rho', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      expect(result.greeks.rho).toBeDefined();
    });

    it('calculates lambda (leverage)', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      expect(result.greeks.lambda).toBeGreaterThan(1);
    });
  });

  describe('scenario analysis', () => {
    it('generates price scenarios', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      expect(result.scenarioAnalysis.priceScenarios).toBeDefined();
      expect(result.scenarioAnalysis.priceScenarios.length).toBeGreaterThan(0);
    });

    it('price scenarios have correct structure', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      const scenario = result.scenarioAnalysis.priceScenarios[0]!;
      expect(scenario).toHaveProperty('underlyingPrice');
      expect(scenario).toHaveProperty('optionValue');
      expect(scenario).toHaveProperty('profitLoss');
      expect(scenario).toHaveProperty('percentReturn');
    });

    it('generates volatility scenarios', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      expect(result.scenarioAnalysis.volatilityScenarios).toBeDefined();
      expect(result.scenarioAnalysis.volatilityScenarios.length).toBeGreaterThan(0);
    });

    it('generates time decay scenarios', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      expect(result.scenarioAnalysis.timeDecayScenarios).toBeDefined();
      expect(result.scenarioAnalysis.timeDecayScenarios.length).toBeGreaterThan(0);
    });
  });

  describe('risk metrics', () => {
    it('calculates leverage ratio', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      expect(result.riskMetrics.leverageRatio).toBeGreaterThan(0);
    });

    it('calculates probability of loss', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      expect(result.riskMetrics.probabilityOfLoss).toBeGreaterThanOrEqual(0);
      expect(result.riskMetrics.probabilityOfLoss).toBeLessThanOrEqual(1);
    });

    it('assesses volatility risk', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      expect(['High', 'Medium', 'Low']).toContain(result.riskMetrics.volatilityRisk);
    });

    it('assesses time decay risk', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      expect(['High', 'Medium', 'Low']).toContain(result.riskMetrics.timeDecayRisk);
    });
  });

  describe('pricing metrics', () => {
    it('calculates break-even price', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      expect(result.pricing.breakEvenPrice).toBeGreaterThan(0);
    });

    it('call break-even is above strike', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      expect(result.pricing.breakEvenPrice).toBeGreaterThan(basicCallInput.strikePrice);
    });

    it('put break-even is below strike', () => {
      const result = OptionsPricingAnalyzer.analyze(basicPutInput);

      expect(result.pricing.breakEvenPrice).toBeLessThan(basicPutInput.strikePrice);
    });

    it('calculates total cost', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      expect(result.pricing.totalCost).toBeCloseTo(
        result.pricing.premium * basicCallInput.contractSize,
        2
      );
    });

    it('max loss equals total cost for long options', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      expect(result.pricing.maxLoss).toBeCloseTo(result.pricing.totalCost, 2);
    });
  });

  describe('probability metrics', () => {
    it('calculates probability ITM', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      expect(result.pricing.probabilityITM).toBeGreaterThanOrEqual(0);
      expect(result.pricing.probabilityITM).toBeLessThanOrEqual(1);
    });

    it('calculates probability of profit', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      expect(result.pricing.probabilityProfit).toBeGreaterThanOrEqual(0);
      expect(result.pricing.probabilityProfit).toBeLessThanOrEqual(1);
    });

    it('deep ITM call has higher probability ITM', () => {
      const deepItm = {
        ...basicCallInput,
        currentPrice: 120, // Deep ITM
      };

      const result = OptionsPricingAnalyzer.analyze(deepItm);

      expect(result.pricing.probabilityITM).toBeGreaterThan(0.7);
    });
  });

  describe('insights and recommendations', () => {
    it('generates insights', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      expect(result.insights).toBeDefined();
      expect(Array.isArray(result.insights)).toBe(true);
      expect(result.insights.length).toBeGreaterThan(0);
    });

    it('generates recommendation', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      expect(['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell']).toContain(result.recommendation);
    });

    it('includes assumptions', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      expect(result.assumptions).toBeDefined();
      expect(Array.isArray(result.assumptions)).toBe(true);
    });
  });

  describe('warnings', () => {
    it('warns about near-expiration options', () => {
      const nearExpiry = {
        ...basicCallInput,
        expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
      };

      const result = OptionsPricingAnalyzer.analyze(nearExpiry);

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('warns about high volatility', () => {
      const highVol = {
        ...basicCallInput,
        volatility: 0.9, // 90%
      };

      const result = OptionsPricingAnalyzer.analyze(highVol);

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('metadata', () => {
    it('includes calculation date', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      expect(result.calculationDate).toBeDefined();
    });

    it('includes days to expiration', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      expect(result.daysToExpiration).toBeGreaterThan(0);
    });

    it('reflects input parameters', () => {
      const result = OptionsPricingAnalyzer.analyze(basicCallInput);

      expect(result.strikePrice).toBe(basicCallInput.strikePrice);
      expect(result.currentPrice).toBe(basicCallInput.currentPrice);
      expect(result.volatility).toBe(basicCallInput.volatility);
    });
  });

  describe('volatility effects', () => {
    it('higher volatility increases option price', () => {
      const lowVol = { ...basicCallInput, volatility: 0.15 };
      const highVol = { ...basicCallInput, volatility: 0.35 };

      const lowVolResult = OptionsPricingAnalyzer.analyze(lowVol);
      const highVolResult = OptionsPricingAnalyzer.analyze(highVol);

      expect(highVolResult.pricing.theoreticalValue).toBeGreaterThan(
        lowVolResult.pricing.theoreticalValue
      );
    });
  });
});
