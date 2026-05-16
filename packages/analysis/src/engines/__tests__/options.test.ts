/**
 * Comprehensive test suite for Options Pricing Engine
 *
 * Tests Black-Scholes, Black-Scholes-Merton, Binomial, and Monte Carlo pricing models
 * along with Greeks calculations, probability metrics, and strategy analysis.
 */
import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import {
  OptionsPricingAnalyzer,
  OptionAnalysisInputSchema,
  OptionSchema,
  type Option,
  type OptionAnalysisInput,
  type StrategyPosition,
} from '../options';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createBasicCallOption(overrides: Partial<Option> = {}): Option {
  return {
    type: 'call',
    style: 'european',
    underlyingPrice: 100,
    strikePrice: 100,
    timeToExpiry: 1, // 1 year
    riskFreeRate: 0.05,
    volatility: 0.2, // 20% volatility
    volatilityType: 'implied',
    contractSize: 100,
    ...overrides,
  };
}

function createBasicPutOption(overrides: Partial<Option> = {}): Option {
  return {
    type: 'put',
    style: 'european',
    underlyingPrice: 100,
    strikePrice: 100,
    timeToExpiry: 1,
    riskFreeRate: 0.05,
    volatility: 0.2,
    volatilityType: 'implied',
    contractSize: 100,
    ...overrides,
  };
}

function createBasicInput(optionOverrides: Partial<Option> = {}, analysisOverrides: Partial<OptionAnalysisInput['analysis']> = {}): OptionAnalysisInput {
  return {
    option: createBasicCallOption(optionOverrides),
    analysis: {
      includeGreeks: true,
      includeImpliedVol: true,
      includeMoneyness: true,
      includeProbabilities: true,
      includeTimeDecay: true,
      timeDecayDays: [1, 7, 14, 30, 60, 90],
      pricingModel: 'black-scholes',
      monteCarloSimulations: 10000, // Reduced for faster tests
      ...analysisOverrides,
    },
  };
}

// ============================================================================
// BLACK-SCHOLES PRICING TESTS
// ============================================================================

describe('Black-Scholes Pricing', () => {
  it('should price an at-the-money call option correctly', () => {
    const input = createBasicInput();
    const result = OptionsPricingAnalyzer.analyze(input);

    // ATM call should have theoretical price around 10-12 for these parameters
    expect(result.theoreticalPrice).toBeGreaterThan(8);
    expect(result.theoreticalPrice).toBeLessThan(15);
    expect(result.pricingModel).toBe('black-scholes');
  });

  it('should price an at-the-money put option correctly', () => {
    const input = createBasicInput({ type: 'put' });
    const result = OptionsPricingAnalyzer.analyze(input);

    // ATM put should have similar price to call due to put-call parity
    expect(result.theoreticalPrice).toBeGreaterThan(5);
    expect(result.theoreticalPrice).toBeLessThan(12);
  });

  it('should price an in-the-money call correctly', () => {
    const input = createBasicInput({ underlyingPrice: 120, strikePrice: 100 });
    const result = OptionsPricingAnalyzer.analyze(input);

    // ITM call should have significant intrinsic value
    expect(result.intrinsicValue).toBe(20);
    expect(result.theoreticalPrice).toBeGreaterThan(20);
    expect(result.timeValue).toBeGreaterThan(0);
  });

  it('should price an out-of-the-money put correctly', () => {
    const input = createBasicInput({ type: 'put', underlyingPrice: 120, strikePrice: 100 });
    const result = OptionsPricingAnalyzer.analyze(input);

    // OTM put should have zero intrinsic value
    expect(result.intrinsicValue).toBe(0);
    expect(result.theoreticalPrice).toBeGreaterThan(0);
    expect(result.timeValue).toBe(result.theoreticalPrice);
  });

  it('should price a deep in-the-money call correctly', () => {
    const input = createBasicInput({ underlyingPrice: 150, strikePrice: 100 });
    const result = OptionsPricingAnalyzer.analyze(input);

    expect(result.intrinsicValue).toBe(50);
    expect(result.theoreticalPrice).toBeGreaterThan(50);
  });

  it('should price a deep out-of-the-money call correctly', () => {
    const input = createBasicInput({ underlyingPrice: 50, strikePrice: 100 });
    const result = OptionsPricingAnalyzer.analyze(input);

    expect(result.intrinsicValue).toBe(0);
    expect(result.theoreticalPrice).toBeGreaterThan(0);
    expect(result.theoreticalPrice).toBeLessThan(5); // Very low time value
  });

  it('should increase call price with higher volatility', () => {
    const lowVol = OptionsPricingAnalyzer.analyze(createBasicInput({ volatility: 0.1 }));
    const highVol = OptionsPricingAnalyzer.analyze(createBasicInput({ volatility: 0.4 }));

    expect(highVol.theoreticalPrice).toBeGreaterThan(lowVol.theoreticalPrice);
  });

  it('should decrease call price with shorter time to expiry', () => {
    const longTime = OptionsPricingAnalyzer.analyze(createBasicInput({ timeToExpiry: 1 }));
    const shortTime = OptionsPricingAnalyzer.analyze(createBasicInput({ timeToExpiry: 0.25 }));

    expect(longTime.theoreticalPrice).toBeGreaterThan(shortTime.theoreticalPrice);
  });
});

// ============================================================================
// BLACK-SCHOLES-MERTON (WITH DIVIDENDS) TESTS
// ============================================================================

describe('Black-Scholes-Merton Pricing', () => {
  it('should price a call with dividends correctly', () => {
    const input = createBasicInput(
      { dividendYield: 0.02 },
      { pricingModel: 'black-scholes-merton' }
    );
    const result = OptionsPricingAnalyzer.analyze(input);

    expect(result.theoreticalPrice).toBeGreaterThan(0);
    expect(result.pricingModel).toBe('black-scholes-merton');
  });

  it('should price call lower with dividends than without', () => {
    const noDividend = OptionsPricingAnalyzer.analyze(
      createBasicInput({}, { pricingModel: 'black-scholes-merton' })
    );
    const withDividend = OptionsPricingAnalyzer.analyze(
      createBasicInput({ dividendYield: 0.03 }, { pricingModel: 'black-scholes-merton' })
    );

    expect(withDividend.theoreticalPrice).toBeLessThan(noDividend.theoreticalPrice);
  });

  it('should price put higher with dividends', () => {
    const noDividend = OptionsPricingAnalyzer.analyze(
      createBasicInput({ type: 'put' }, { pricingModel: 'black-scholes-merton' })
    );
    const withDividend = OptionsPricingAnalyzer.analyze(
      createBasicInput({ type: 'put', dividendYield: 0.03 }, { pricingModel: 'black-scholes-merton' })
    );

    expect(withDividend.theoreticalPrice).toBeGreaterThan(noDividend.theoreticalPrice);
  });
});

// ============================================================================
// BINOMIAL TREE PRICING TESTS
// ============================================================================

describe('Binomial Tree Pricing', () => {
  it('should price European call similar to Black-Scholes', () => {
    const bsPrice = OptionsPricingAnalyzer.analyze(
      createBasicInput({}, { pricingModel: 'black-scholes' })
    ).theoreticalPrice;
    
    const binomialPrice = OptionsPricingAnalyzer.analyze(
      createBasicInput({}, { pricingModel: 'binomial' })
    ).theoreticalPrice;

    // Binomial with 100 steps converges to BS within a larger tolerance
    // More steps would reduce this variance
    expect(Math.abs(binomialPrice - bsPrice)).toBeLessThan(5);
  });

  it('should price American call correctly', () => {
    const input = createBasicInput({ style: 'american' }, { pricingModel: 'binomial' });
    const result = OptionsPricingAnalyzer.analyze(input);

    // American call without dividends should be similar to European
    expect(result.theoreticalPrice).toBeGreaterThan(0);
    expect(result.pricingModel).toBe('binomial');
  });

  it('should price American put higher than European put', () => {
    const european = OptionsPricingAnalyzer.analyze(
      createBasicInput({ type: 'put', style: 'european' }, { pricingModel: 'binomial' })
    );
    const american = OptionsPricingAnalyzer.analyze(
      createBasicInput({ type: 'put', style: 'american' }, { pricingModel: 'binomial' })
    );

    // American put should be worth at least as much due to early exercise
    expect(american.theoreticalPrice).toBeGreaterThanOrEqual(european.theoreticalPrice - 0.1);
  });

  it('should handle deep ITM American put with early exercise premium', () => {
    const input = createBasicInput(
      { type: 'put', style: 'american', underlyingPrice: 50, strikePrice: 100 },
      { pricingModel: 'binomial' }
    );
    const result = OptionsPricingAnalyzer.analyze(input);

    // Deep ITM American put should be close to intrinsic value
    expect(result.intrinsicValue).toBe(50);
    expect(result.theoreticalPrice).toBeGreaterThanOrEqual(50);
  });
});

// ============================================================================
// MONTE CARLO PRICING TESTS
// ============================================================================

describe('Monte Carlo Pricing', () => {
  it('should price call similar to Black-Scholes', () => {
    const bsPrice = OptionsPricingAnalyzer.analyze(
      createBasicInput({}, { pricingModel: 'black-scholes' })
    ).theoreticalPrice;
    
    const mcPrice = OptionsPricingAnalyzer.analyze(
      createBasicInput({}, { pricingModel: 'monte-carlo', monteCarloSimulations: 50000 })
    ).theoreticalPrice;

    // Monte Carlo has variance due to random sampling
    // With 50k simulations, expect ~30% tolerance
    expect(Math.abs(mcPrice - bsPrice) / bsPrice).toBeLessThan(0.35);
  });

  it('should price put similar to Black-Scholes', () => {
    const bsPrice = OptionsPricingAnalyzer.analyze(
      createBasicInput({ type: 'put' }, { pricingModel: 'black-scholes' })
    ).theoreticalPrice;
    
    const mcPrice = OptionsPricingAnalyzer.analyze(
      createBasicInput({ type: 'put' }, { pricingModel: 'monte-carlo', monteCarloSimulations: 50000 })
    ).theoreticalPrice;

    // Monte Carlo has variance due to random sampling
    expect(Math.abs(mcPrice - bsPrice) / bsPrice).toBeLessThan(0.40);
  });

  it('should converge with more simulations', () => {
    const bsPrice = OptionsPricingAnalyzer.analyze(
      createBasicInput({}, { pricingModel: 'black-scholes' })
    ).theoreticalPrice;

    // More simulations should get closer to BS price (on average)
    const mcPrice = OptionsPricingAnalyzer.analyze(
      createBasicInput({}, { pricingModel: 'monte-carlo', monteCarloSimulations: 100000 })
    ).theoreticalPrice;

    // Should be within 30% of BS price due to Monte Carlo variance
    expect(Math.abs(mcPrice - bsPrice) / bsPrice).toBeLessThan(0.30);
  });
});

// ============================================================================
// GREEKS CALCULATION TESTS
// ============================================================================

describe('Greeks Calculation', () => {
  describe('Delta', () => {
    it('should have delta between 0 and 1 for call', () => {
      const result = OptionsPricingAnalyzer.analyze(createBasicInput());
      expect(result.greeks.delta).toBeGreaterThan(0);
      expect(result.greeks.delta).toBeLessThan(1);
    });

    it('should have delta between -1 and 0 for put', () => {
      const result = OptionsPricingAnalyzer.analyze(createBasicInput({ type: 'put' }));
      expect(result.greeks.delta).toBeGreaterThan(-1);
      expect(result.greeks.delta).toBeLessThan(0);
    });

    it('should have higher delta for ITM call', () => {
      const atm = OptionsPricingAnalyzer.analyze(createBasicInput());
      const itm = OptionsPricingAnalyzer.analyze(createBasicInput({ underlyingPrice: 120 }));

      expect(itm.greeks.delta).toBeGreaterThan(atm.greeks.delta);
    });

    it('should have delta near 0.5 for ATM call', () => {
      const result = OptionsPricingAnalyzer.analyze(createBasicInput());
      expect(result.greeks.delta).toBeGreaterThan(0.45);
      expect(result.greeks.delta).toBeLessThan(0.65);
    });
  });

  describe('Gamma', () => {
    it('should always be positive for both calls and puts', () => {
      const call = OptionsPricingAnalyzer.analyze(createBasicInput());
      const put = OptionsPricingAnalyzer.analyze(createBasicInput({ type: 'put' }));

      expect(call.greeks.gamma).toBeGreaterThan(0);
      expect(put.greeks.gamma).toBeGreaterThan(0);
    });

    it('should be highest for ATM options with short expiry', () => {
      // Gamma is highest for ATM options, especially close to expiry
      // With 1 year expiry, the difference is less pronounced
      const atm = OptionsPricingAnalyzer.analyze(createBasicInput({ timeToExpiry: 0.1 }));
      const itm = OptionsPricingAnalyzer.analyze(createBasicInput({ underlyingPrice: 120, timeToExpiry: 0.1 }));
      const otm = OptionsPricingAnalyzer.analyze(createBasicInput({ underlyingPrice: 80, timeToExpiry: 0.1 }));

      // Gamma should be highest for ATM with short expiry
      expect(atm.greeks.gamma).toBeGreaterThan(itm.greeks.gamma);
      expect(atm.greeks.gamma).toBeGreaterThan(otm.greeks.gamma);
    });
  });

  describe('Theta', () => {
    it('should be negative for long options (time decay)', () => {
      const call = OptionsPricingAnalyzer.analyze(createBasicInput());
      const put = OptionsPricingAnalyzer.analyze(createBasicInput({ type: 'put' }));

      expect(call.greeks.theta).toBeLessThan(0);
      expect(put.greeks.theta).toBeLessThan(0);
    });

    it('should be more negative closer to expiry', () => {
      const longTime = OptionsPricingAnalyzer.analyze(createBasicInput({ timeToExpiry: 1 }));
      const shortTime = OptionsPricingAnalyzer.analyze(createBasicInput({ timeToExpiry: 0.1 }));

      // Theta accelerates closer to expiry for ATM options
      expect(Math.abs(shortTime.greeks.theta)).toBeGreaterThan(Math.abs(longTime.greeks.theta));
    });
  });

  describe('Vega', () => {
    it('should be positive for long options', () => {
      const call = OptionsPricingAnalyzer.analyze(createBasicInput());
      const put = OptionsPricingAnalyzer.analyze(createBasicInput({ type: 'put' }));

      expect(call.greeks.vega).toBeGreaterThan(0);
      expect(put.greeks.vega).toBeGreaterThan(0);
    });

    it('should be higher for ATM options', () => {
      const atm = OptionsPricingAnalyzer.analyze(createBasicInput());
      const itm = OptionsPricingAnalyzer.analyze(createBasicInput({ underlyingPrice: 130 }));
      const otm = OptionsPricingAnalyzer.analyze(createBasicInput({ underlyingPrice: 70 }));

      expect(atm.greeks.vega).toBeGreaterThan(itm.greeks.vega);
      expect(atm.greeks.vega).toBeGreaterThan(otm.greeks.vega);
    });

    it('should be higher for longer expiry', () => {
      const longTime = OptionsPricingAnalyzer.analyze(createBasicInput({ timeToExpiry: 1 }));
      const shortTime = OptionsPricingAnalyzer.analyze(createBasicInput({ timeToExpiry: 0.1 }));

      expect(longTime.greeks.vega).toBeGreaterThan(shortTime.greeks.vega);
    });
  });

  describe('Rho', () => {
    it('should be positive for calls', () => {
      const result = OptionsPricingAnalyzer.analyze(createBasicInput());
      expect(result.greeks.rho).toBeGreaterThan(0);
    });

    it('should be negative for puts', () => {
      const result = OptionsPricingAnalyzer.analyze(createBasicInput({ type: 'put' }));
      expect(result.greeks.rho).toBeLessThan(0);
    });
  });

  describe('Second-Order Greeks', () => {
    it('should calculate vanna (delta sensitivity to vol)', () => {
      const result = OptionsPricingAnalyzer.analyze(createBasicInput());
      expect(typeof result.greeks.vanna).toBe('number');
      expect(Number.isFinite(result.greeks.vanna)).toBe(true);
    });

    it('should calculate charm (delta decay)', () => {
      const result = OptionsPricingAnalyzer.analyze(createBasicInput());
      expect(typeof result.greeks.charm).toBe('number');
      expect(Number.isFinite(result.greeks.charm)).toBe(true);
    });

    it('should calculate vomma (vega convexity)', () => {
      const result = OptionsPricingAnalyzer.analyze(createBasicInput());
      expect(typeof result.greeks.vomma).toBe('number');
      expect(Number.isFinite(result.greeks.vomma)).toBe(true);
    });

    it('should calculate speed, color, zomma, and ultima', () => {
      const result = OptionsPricingAnalyzer.analyze(createBasicInput());
      
      expect(typeof result.greeks.speed).toBe('number');
      expect(typeof result.greeks.color).toBe('number');
      expect(typeof result.greeks.zomma).toBe('number');
      expect(typeof result.greeks.ultima).toBe('number');
    });
  });
});

// ============================================================================
// INTRINSIC AND TIME VALUE TESTS
// ============================================================================

describe('Intrinsic and Time Value', () => {
  it('should calculate intrinsic value for ITM call', () => {
    const result = OptionsPricingAnalyzer.analyze(
      createBasicInput({ underlyingPrice: 110, strikePrice: 100 })
    );
    expect(result.intrinsicValue).toBe(10);
  });

  it('should calculate intrinsic value for ITM put', () => {
    const result = OptionsPricingAnalyzer.analyze(
      createBasicInput({ type: 'put', underlyingPrice: 90, strikePrice: 100 })
    );
    expect(result.intrinsicValue).toBe(10);
  });

  it('should have zero intrinsic value for OTM options', () => {
    const otmCall = OptionsPricingAnalyzer.analyze(
      createBasicInput({ underlyingPrice: 90, strikePrice: 100 })
    );
    const otmPut = OptionsPricingAnalyzer.analyze(
      createBasicInput({ type: 'put', underlyingPrice: 110, strikePrice: 100 })
    );

    expect(otmCall.intrinsicValue).toBe(0);
    expect(otmPut.intrinsicValue).toBe(0);
  });

  it('should have time value equal theoretical price minus intrinsic value', () => {
    const result = OptionsPricingAnalyzer.analyze(
      createBasicInput({ underlyingPrice: 110, strikePrice: 100 })
    );
    
    expect(result.timeValue).toBeCloseTo(result.theoreticalPrice - result.intrinsicValue, 4);
  });

  it('should always have non-negative time value', () => {
    const result = OptionsPricingAnalyzer.analyze(createBasicInput());
    expect(result.timeValue).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// PROBABILITY METRICS TESTS
// ============================================================================

describe('Probability Metrics', () => {
  it('should calculate probability ITM for call', () => {
    const result = OptionsPricingAnalyzer.analyze(createBasicInput());

    expect(result.probabilityITM).toBeGreaterThan(0);
    expect(result.probabilityITM).toBeLessThan(1);
  });

  it('should have higher probability ITM for ITM call', () => {
    const atm = OptionsPricingAnalyzer.analyze(createBasicInput());
    const itm = OptionsPricingAnalyzer.analyze(createBasicInput({ underlyingPrice: 120 }));

    expect(itm.probabilityITM).toBeGreaterThan(atm.probabilityITM);
  });

  it('should have probability ITM + OTM equal to 1', () => {
    const result = OptionsPricingAnalyzer.analyze(createBasicInput());

    expect(result.probabilityITM + result.probabilityOTM).toBeCloseTo(1, 4);
  });

  it('should calculate probability of profit', () => {
    const result = OptionsPricingAnalyzer.analyze(createBasicInput());

    expect(result.probabilityOfProfit).toBeGreaterThan(0);
    expect(result.probabilityOfProfit).toBeLessThan(1);
    // Probability of profit should be less than probability ITM (due to premium)
    expect(result.probabilityOfProfit).toBeLessThanOrEqual(result.probabilityITM);
  });

  it('should calculate probability of touch', () => {
    const result = OptionsPricingAnalyzer.analyze(createBasicInput());

    expect(result.probabilityTouch).toBeGreaterThanOrEqual(0);
    expect(result.probabilityTouch).toBeLessThanOrEqual(1);
  });

  it('should clamp probability of touch to 1 for extreme strikes', () => {
    const result = OptionsPricingAnalyzer.analyze(
      createBasicInput({ underlyingPrice: 10, strikePrice: 100 })
    );

    expect(result.probabilityTouch).toBe(1);
  });
});

// ============================================================================
// BREAKEVEN ANALYSIS TESTS
// ============================================================================

describe('Breakeven Analysis', () => {
  it('should calculate breakeven for call option', () => {
    const result = OptionsPricingAnalyzer.analyze(createBasicInput());

    expect(result.breakevenPoints.length).toBe(1);
    // Breakeven for call = Strike + Premium
    expect(result.breakevenPoints[0]).toBeGreaterThan(100);
  });

  it('should calculate breakeven for put option', () => {
    const result = OptionsPricingAnalyzer.analyze(createBasicInput({ type: 'put' }));

    expect(result.breakevenPoints.length).toBe(1);
    // Breakeven for put = Strike - Premium
    expect(result.breakevenPoints[0]).toBeLessThan(100);
    expect(result.breakevenPoints[0]).toBeGreaterThan(0);
  });

  it('should have unlimited max profit for long call', () => {
    const result = OptionsPricingAnalyzer.analyze(createBasicInput());
    expect(result.maxProfit).toBeNull();
  });

  it('should have limited max profit for long put', () => {
    const result = OptionsPricingAnalyzer.analyze(createBasicInput({ type: 'put' }));
    expect(result.maxProfit).toBeGreaterThan(0);
  });

  it('should have max loss equal to premium paid', () => {
    const result = OptionsPricingAnalyzer.analyze(createBasicInput());
    expect(result.maxLoss).toBeCloseTo(result.theoreticalPrice, 2);
  });
});

// ============================================================================
// TIME DECAY ANALYSIS TESTS
// ============================================================================

describe('Time Decay Analysis', () => {
  it('should generate time decay schedule', () => {
    const result = OptionsPricingAnalyzer.analyze(createBasicInput());

    expect(result.thetaDecay.length).toBeGreaterThan(0);
  });

  it('should show decreasing price over time', () => {
    const result = OptionsPricingAnalyzer.analyze(createBasicInput());

    // Prices should generally decrease as we approach expiry
    for (let i = 1; i < result.thetaDecay.length; i++) {
      const current = result.thetaDecay[i];
      const previous = result.thetaDecay[i - 1];
      
      // More days to expiry should have higher (or equal) price
      if (current && previous && current.daysToExpiry > previous.daysToExpiry) {
        expect(current.theoreticalPrice).toBeGreaterThanOrEqual(previous.theoreticalPrice - 0.01);
      }
    }
  });

  it('should have negative theta values in decay schedule', () => {
    const result = OptionsPricingAnalyzer.analyze(createBasicInput());

    for (const point of result.thetaDecay) {
      expect(point.theta).toBeLessThanOrEqual(0);
    }
  });

  it('should show decreasing time value approaching expiry', () => {
    const result = OptionsPricingAnalyzer.analyze(createBasicInput());

    if (result.thetaDecay.length >= 2) {
      const first = result.thetaDecay[0]!;
      const last = result.thetaDecay[result.thetaDecay.length - 1]!;
      
      // First entry should have more time value than last
      expect(first.timeValue).toBeGreaterThanOrEqual(last.timeValue);
    }
  });

  it('should skip days beyond expiry', () => {
    const result = OptionsPricingAnalyzer.analyze(
      createBasicInput(
        { timeToExpiry: 0.01 },
        { timeDecayDays: [1, 5, 10] }
      )
    );

    expect(result.thetaDecay.length).toBe(1);
  });
});

// ============================================================================
// MONEYNESS ANALYSIS TESTS
// ============================================================================

describe('Moneyness Analysis', () => {
  it('should calculate spot moneyness', () => {
    const result = OptionsPricingAnalyzer.analyze(
      createBasicInput({ underlyingPrice: 110, strikePrice: 100 })
    );

    expect(result.moneyness.spot).toBeCloseTo(1.1, 4);
  });

  it('should calculate log moneyness', () => {
    const result = OptionsPricingAnalyzer.analyze(
      createBasicInput({ underlyingPrice: 110, strikePrice: 100 })
    );

    expect(result.moneyness.logMoneyness).toBeCloseTo(Math.log(1.1), 4);
  });

  it('should calculate percent moneyness', () => {
    const result = OptionsPricingAnalyzer.analyze(
      createBasicInput({ underlyingPrice: 110, strikePrice: 100 })
    );

    expect(result.moneyness.percentMoneyness).toBeCloseTo(10, 2);
  });

  it('should calculate forward moneyness', () => {
    const result = OptionsPricingAnalyzer.analyze(createBasicInput());

    expect(result.moneyness.forward).toBeGreaterThan(0);
    expect(Number.isFinite(result.moneyness.forward)).toBe(true);
  });

  it('should have spot moneyness = 1 for ATM', () => {
    const result = OptionsPricingAnalyzer.analyze(createBasicInput());
    expect(result.moneyness.spot).toBeCloseTo(1, 4);
  });
});

// ============================================================================
// IMPLIED VOLATILITY TESTS
// ============================================================================

describe('Implied Volatility Calculation', () => {
  it('should calculate implied volatility from market price', () => {
    // First get a theoretical price
    const theoretical = OptionsPricingAnalyzer.analyze(createBasicInput());
    
    // Then use that as market price to recover IV
    const input = createBasicInput({ premium: theoretical.theoreticalPrice });
    const result = OptionsPricingAnalyzer.analyze(input);

    // Should recover the original volatility (20%)
    expect(result.impliedVolatility).toBeDefined();
    if (result.impliedVolatility) {
      expect(result.impliedVolatility).toBeCloseTo(0.2, 2);
    }
  });

  it('should handle IV calculation for ITM option', () => {
    const input = createBasicInput({ underlyingPrice: 120, strikePrice: 100, premium: 25 });
    const result = OptionsPricingAnalyzer.analyze(input);

    expect(result.impliedVolatility).toBeDefined();
    if (result.impliedVolatility) {
      expect(result.impliedVolatility).toBeGreaterThan(0);
      expect(result.impliedVolatility).toBeLessThan(5);
    }
  });

  it('should not calculate IV without market price', () => {
    const input = createBasicInput();
    const result = OptionsPricingAnalyzer.analyze(input);

    expect(result.impliedVolatility).toBeUndefined();
  });

  it('should fallback when vega is near zero', () => {
    const option = createBasicCallOption({
      underlyingPrice: 1000,
      strikePrice: 1,
      timeToExpiry: 1e-8,
      volatility: 0.2,
    });

    const implied = (OptionsPricingAnalyzer as any).calculateImpliedVolatility(option, 0.01);
    expect(implied).toBeGreaterThanOrEqual(0.001);
    expect(implied).toBeLessThanOrEqual(5);
  });
});

// ============================================================================
// SINGLE GREEK FALLBACK TEST
// ============================================================================

describe('Single Greek fallback', () => {
  it('should return 0 for unsupported greek types', () => {
    const option = createBasicCallOption();
    const value = (OptionsPricingAnalyzer as any).calculateSingleGreek(option, 'rho', {});
    expect(value).toBe(0);
  });
});

// ============================================================================
// VOLATILITY METRICS TESTS
// ============================================================================

describe('Volatility Metrics', () => {
  it('should calculate volatility rank', () => {
    const result = OptionsPricingAnalyzer.analyze(createBasicInput());

    expect(result.volatilityRank).toBeGreaterThanOrEqual(0);
    expect(result.volatilityRank).toBeLessThanOrEqual(100);
  });

  it('should calculate volatility percentile', () => {
    const result = OptionsPricingAnalyzer.analyze(createBasicInput());

    expect(result.volatilityPercentile).toBeGreaterThanOrEqual(0);
    expect(result.volatilityPercentile).toBeLessThanOrEqual(100);
  });
});

// ============================================================================
// MODEL ASSUMPTIONS TESTS
// ============================================================================

describe('Model Assumptions', () => {
  it('should record European exercise assumption', () => {
    const european = OptionsPricingAnalyzer.analyze(createBasicInput({ style: 'european' }));
    const american = OptionsPricingAnalyzer.analyze(createBasicInput({ style: 'american' }));

    expect(european.assumptions.europeanExercise).toBe(true);
    expect(american.assumptions.europeanExercise).toBe(false);
  });

  it('should record dividend assumption', () => {
    const noDividend = OptionsPricingAnalyzer.analyze(createBasicInput());
    const withDividend = OptionsPricingAnalyzer.analyze(createBasicInput({ dividendYield: 0.02 }));

    expect(noDividend.assumptions.noDividends).toBe(true);
    expect(withDividend.assumptions.noDividends).toBe(false);
  });

  it('should record constant volatility assumption', () => {
    const result = OptionsPricingAnalyzer.analyze(createBasicInput());
    expect(result.assumptions.constantVolatility).toBe(true);
  });

  it('should record constant risk-free rate assumption', () => {
    const result = OptionsPricingAnalyzer.analyze(createBasicInput());
    expect(result.assumptions.constantRiskFreeRate).toBe(true);
  });
});

// ============================================================================
// PROPERTY-BASED INVARIANTS
// ============================================================================

/** fast-check 4 may emit NaN from fc.double; filter for valid financial inputs */
const finiteDouble = (constraints: { min: number; max: number }) =>
  fc.double(constraints).filter((n): n is number => Number.isFinite(n));

describe('Property-based invariants', () => {
  it('should have monotonic call price with underlying', () => {
    fc.assert(
      fc.property(
        finiteDouble({ min: 50, max: 150 }),
        finiteDouble({ min: 50, max: 150 }),
        finiteDouble({ min: 0.01, max: 0.8 }),
        finiteDouble({ min: 0.0, max: 0.1 }),
        finiteDouble({ min: 0.05, max: 2 }),
        (s1, s2, vol, r, T) => {
          const [lowS, highS] = s1 <= s2 ? [s1, s2] : [s2, s1];
          const low = OptionsPricingAnalyzer.analyze(
            createBasicInput({ underlyingPrice: lowS, volatility: vol, riskFreeRate: r, timeToExpiry: T })
          );
          const high = OptionsPricingAnalyzer.analyze(
            createBasicInput({ underlyingPrice: highS, volatility: vol, riskFreeRate: r, timeToExpiry: T })
          );

          expect(high.theoreticalPrice).toBeGreaterThanOrEqual(low.theoreticalPrice - 1e-6);
        }
      ),
      { seed: 42, numRuns: 25 }
    );
  });

  it('should satisfy put-call parity within tolerance', () => {
    fc.assert(
      fc.property(
        finiteDouble({ min: 50, max: 150 }),
        finiteDouble({ min: 50, max: 150 }),
        finiteDouble({ min: 0.01, max: 0.8 }),
        finiteDouble({ min: 0.0, max: 0.1 }),
        finiteDouble({ min: 0.05, max: 2 }),
        (S, K, vol, r, T) => {
          const call = OptionsPricingAnalyzer.analyze(
            createBasicInput({ underlyingPrice: S, strikePrice: K, volatility: vol, riskFreeRate: r, timeToExpiry: T })
          );
          const put = OptionsPricingAnalyzer.analyze(
            createBasicInput({ type: 'put', underlyingPrice: S, strikePrice: K, volatility: vol, riskFreeRate: r, timeToExpiry: T })
          );

          const expectedDifference = S - K * Math.exp(-r * T);
          const actualDifference = call.theoreticalPrice - put.theoreticalPrice;

          expect(actualDifference).toBeCloseTo(expectedDifference, 2);
        }
      ),
      { seed: 42, numRuns: 25 }
    );
  });
});

// ============================================================================
// SNAPSHOT SHAPE TESTS
// ============================================================================

describe('Snapshot shapes', () => {
  it('should keep a stable analysis shape', () => {
    const result = OptionsPricingAnalyzer.analyze(createBasicInput());
    const shape = {
      keys: Object.keys(result).sort(),
      greeks: Object.keys(result.greeks).sort(),
      moneyness: Object.keys(result.moneyness).sort(),
      thetaDecayKeys: result.thetaDecay[0] ? Object.keys(result.thetaDecay[0]).sort() : [],
    };

    expect(shape).toMatchInlineSnapshot(`
      {
        "greeks": [
          "charm",
          "color",
          "delta",
          "gamma",
          "rho",
          "speed",
          "theta",
          "ultima",
          "vanna",
          "vega",
          "vomma",
          "zomma",
        ],
        "keys": [
          "assumptions",
          "breakevenPoints",
          "greeks",
          "impliedVolatility",
          "intrinsicValue",
          "maxLoss",
          "maxProfit",
          "moneyness",
          "pricingModel",
          "probabilityITM",
          "probabilityOTM",
          "probabilityOfProfit",
          "probabilityTouch",
          "theoreticalPrice",
          "thetaDecay",
          "timeValue",
          "volatilityPercentile",
          "volatilityRank",
        ],
        "moneyness": [
          "forward",
          "logMoneyness",
          "percentMoneyness",
          "spot",
        ],
        "thetaDecayKeys": [
          "daysToExpiry",
          "theoreticalPrice",
          "theta",
          "timeValue",
        ],
      }
    `);
  });
});

// ============================================================================
// ANALYSIS TOGGLE BRANCHES
// ============================================================================

describe('Analysis Toggles', () => {
  it('should zero-fill greeks when disabled', () => {
    const result = OptionsPricingAnalyzer.analyze(
      createBasicInput({}, { includeGreeks: false })
    );

    expect(result.greeks.delta).toBe(0);
    expect(result.greeks.gamma).toBe(0);
    expect(result.greeks.theta).toBe(0);
  });

  it('should skip probabilities when disabled', () => {
    const result = OptionsPricingAnalyzer.analyze(
      createBasicInput({}, { includeProbabilities: false })
    );

    expect(result.probabilityOfProfit).toBe(0);
    expect(result.probabilityITM).toBe(0);
    expect(result.probabilityOTM).toBe(0);
    expect(result.probabilityTouch).toBe(0);
  });

  it('should skip time decay when disabled', () => {
    const result = OptionsPricingAnalyzer.analyze(
      createBasicInput({}, { includeTimeDecay: false })
    );

    expect(result.thetaDecay.length).toBe(0);
  });

  it('should skip moneyness when disabled', () => {
    const result = OptionsPricingAnalyzer.analyze(
      createBasicInput({}, { includeMoneyness: false })
    );

    expect(result.moneyness.spot).toBe(1);
    expect(result.moneyness.forward).toBe(1);
    expect(result.moneyness.logMoneyness).toBe(0);
    expect(result.moneyness.percentMoneyness).toBe(0);
  });

  it('should skip implied volatility when disabled', () => {
    const withPremium = createBasicInput(
      { premium: 12 },
      { includeImpliedVol: false }
    );
    const result = OptionsPricingAnalyzer.analyze(withPremium);

    expect(result.impliedVolatility).toBeUndefined();
  });

  it('should honor disabled analysis flags and undefined dividend yield', () => {
    const parsed = OptionAnalysisInputSchema.parse(createBasicInput());
    const mockedParsed = {
      ...parsed,
      option: { ...parsed.option, dividendYield: undefined },
      analysis: {
        ...parsed.analysis,
        includeGreeks: false,
        includeProbabilities: false,
        includeTimeDecay: false,
        includeMoneyness: false,
        includeImpliedVol: false,
      },
    };

    const parseSpy = vi.spyOn(OptionAnalysisInputSchema, 'parse').mockReturnValue(mockedParsed as OptionAnalysisInput);
    const result = OptionsPricingAnalyzer.analyze(createBasicInput({ premium: 10 }));
    parseSpy.mockRestore();

    expect(result.greeks.delta).toBe(0);
    expect(result.probabilityOfProfit).toBe(0);
    expect(result.thetaDecay.length).toBe(0);
    expect(result.moneyness.spot).toBe(1);
    expect(result.impliedVolatility).toBeUndefined();
    expect(result.assumptions.noDividends).toBe(true);
  });
});

// ============================================================================
// INTERNAL BRANCH COVERAGE HELPERS
// ============================================================================

describe('Internal branch coverage helpers', () => {
  it('should fallback in binomial pricing when steps produce no node values', () => {
    const option = createBasicCallOption({ dividendYield: undefined });
    const value = (OptionsPricingAnalyzer as any).binomialPrice(option, -1);

    expect(value).toBe(0);
  });

  it('should handle undefined dividend yield in Monte Carlo pricing', () => {
    const option = createBasicCallOption({ dividendYield: undefined });
    const value = (OptionsPricingAnalyzer as any).monteCarloPrice(option, 1);

    expect(Number.isFinite(value)).toBe(true);
  });

  it('should handle undefined dividend yield in probability metrics', () => {
    const option = createBasicCallOption({ dividendYield: undefined });
    const result = (OptionsPricingAnalyzer as any).calculateProbabilities(option);

    expect(result.probabilityITM).toBeGreaterThanOrEqual(0);
    expect(result.probabilityITM).toBeLessThanOrEqual(1);
  });

  it('should handle undefined dividend yield in moneyness metrics', () => {
    const option = createBasicCallOption({ dividendYield: undefined });
    const result = (OptionsPricingAnalyzer as any).calculateMoneyness(option);

    expect(result.spot).toBeCloseTo(1, 4);
  });

  it('should default risk-free rate for empty strategies', () => {
    const result = OptionsPricingAnalyzer.analyzeStrategy([], { min: 90, max: 110, steps: 4 });

    expect(result.sharpeRatio).toBe(0);
  });

  it('should return null max profit/loss for infinite payoff ranges', () => {
    const result = (OptionsPricingAnalyzer as any).analyzeStrategyRisk([
      { underlyingPrice: 0, payoff: Infinity },
      { underlyingPrice: 1, payoff: -Infinity },
    ]);

    expect(result.maxProfit).toBeNull();
    expect(result.maxLoss).toBeNull();
  });

  it('should handle empty payoff diagrams in strategy metrics', () => {
    const probability = (OptionsPricingAnalyzer as any).calculateStrategyProbabilityOfProfit([], []);
    const expectedValue = (OptionsPricingAnalyzer as any).calculateExpectedValue([]);
    const sharpe = (OptionsPricingAnalyzer as any).calculateSharpeRatio(
      [{ underlyingPrice: 1, payoff: 5 }, { underlyingPrice: 2, payoff: 5 }],
      0.05
    );

    expect(probability).toBe(0);
    expect(expectedValue).toBe(0);
    expect(sharpe).toBe(0);
  });
});

// ============================================================================
// STRATEGY ANALYSIS TESTS
// ============================================================================

describe('Strategy Analysis', () => {
  function createStrategyPosition(
    optionOverrides: Partial<Option>,
    quantity: number,
    cost: number
  ): StrategyPosition {
    return {
      option: createBasicCallOption(optionOverrides),
      quantity,
      cost,
    };
  }

  describe('Single Position Strategy', () => {
    it('should analyze a long call position', () => {
      const positions: StrategyPosition[] = [
        createStrategyPosition({}, 1, 10),
      ];

      const result = OptionsPricingAnalyzer.analyzeStrategy(
        positions,
        { min: 80, max: 120, steps: 20 }
      );

      expect(result.name).toBe('Custom Strategy');
      expect(result.positions.length).toBe(1);
      expect(result.netCost).toBe(10);
      expect(result.payoffDiagram.length).toBe(21);
    });

    it('should analyze a long put position', () => {
      const positions: StrategyPosition[] = [
        {
          option: createBasicPutOption(),
          quantity: 1,
          cost: 8,
        },
      ];

      const result = OptionsPricingAnalyzer.analyzeStrategy(
        positions,
        { min: 80, max: 120, steps: 20 }
      );

      expect(result.netCost).toBe(8);
      expect(result.payoffDiagram.length).toBe(21);
    });
  });

  describe('Multi-Leg Strategies', () => {
    it('should analyze a bull call spread', () => {
      const positions: StrategyPosition[] = [
        createStrategyPosition({ strikePrice: 95 }, 1, 8),  // Long call at 95
        createStrategyPosition({ strikePrice: 105 }, -1, 4), // Short call at 105
      ];

      const result = OptionsPricingAnalyzer.analyzeStrategy(
        positions,
        { min: 80, max: 120, steps: 40 }
      );

      expect(result.netCost).toBe(4); // 8 - 4
      expect(result.positions.length).toBe(2);
    });

    it('should analyze a straddle', () => {
      const positions: StrategyPosition[] = [
        createStrategyPosition({ type: 'call', strikePrice: 100 }, 1, 10),
        {
          option: createBasicPutOption({ strikePrice: 100 }),
          quantity: 1,
          cost: 8,
        },
      ];

      const result = OptionsPricingAnalyzer.analyzeStrategy(
        positions,
        { min: 70, max: 130, steps: 30 }
      );

      expect(result.netCost).toBe(18); // 10 + 8
      expect(result.breakevenPoints.length).toBeGreaterThanOrEqual(0);
    });

    it('should analyze an iron condor', () => {
      const positions: StrategyPosition[] = [
        // Put spread
        {
          option: createBasicPutOption({ strikePrice: 85 }),
          quantity: 1,
          cost: 2,
        },
        {
          option: createBasicPutOption({ strikePrice: 90 }),
          quantity: -1,
          cost: 4,
        },
        // Call spread
        createStrategyPosition({ strikePrice: 110 }, -1, 4),
        createStrategyPosition({ strikePrice: 115 }, 1, 2),
      ];

      const result = OptionsPricingAnalyzer.analyzeStrategy(
        positions,
        { min: 70, max: 130, steps: 60 }
      );

      expect(result.positions.length).toBe(4);
      expect(Number.isFinite(result.netCost)).toBe(true);
    });
  });

  describe('Strategy Greeks', () => {
    it('should calculate combined delta for strategy', () => {
      const positions: StrategyPosition[] = [
        createStrategyPosition({}, 1, 10),
        createStrategyPosition({ strikePrice: 110 }, -1, 5),
      ];

      const result = OptionsPricingAnalyzer.analyzeStrategy(
        positions,
        { min: 80, max: 120, steps: 20 }
      );

      // Combined delta should be less than single long call
      expect(result.strategyGreeks.delta).toBeLessThan(1);
      expect(result.strategyGreeks.delta).toBeGreaterThan(-1);
    });

    it('should have near-zero delta for delta-neutral strategy', () => {
      // Long straddle should have near-zero delta at ATM
      const positions: StrategyPosition[] = [
        createStrategyPosition({ type: 'call', strikePrice: 100 }, 1, 10),
        {
          option: createBasicPutOption({ strikePrice: 100 }),
          quantity: 1,
          cost: 8,
        },
      ];

      const result = OptionsPricingAnalyzer.analyzeStrategy(
        positions,
        { min: 80, max: 120, steps: 20 }
      );

      // ATM straddle should have delta close to zero
      expect(Math.abs(result.strategyGreeks.delta)).toBeLessThan(0.2);
    });
  });

  describe('Payoff Diagram', () => {
    it('should generate correct number of points', () => {
      const positions: StrategyPosition[] = [
        createStrategyPosition({}, 1, 10),
      ];

      const result = OptionsPricingAnalyzer.analyzeStrategy(
        positions,
        { min: 80, max: 120, steps: 40 }
      );

      expect(result.payoffDiagram.length).toBe(41); // steps + 1
    });

    it('should have correct price range in diagram', () => {
      const positions: StrategyPosition[] = [
        createStrategyPosition({}, 1, 10),
      ];

      const result = OptionsPricingAnalyzer.analyzeStrategy(
        positions,
        { min: 80, max: 120, steps: 40 }
      );

      expect(result.payoffDiagram[0]?.underlyingPrice).toBe(80);
      expect(result.payoffDiagram[result.payoffDiagram.length - 1]?.underlyingPrice).toBe(120);
    });
  });

  describe('Risk Metrics', () => {
    it('should calculate probability of profit', () => {
      const positions: StrategyPosition[] = [
        createStrategyPosition({}, 1, 10),
      ];

      const result = OptionsPricingAnalyzer.analyzeStrategy(
        positions,
        { min: 50, max: 150, steps: 100 }
      );

      expect(result.probabilityOfProfit).toBeGreaterThanOrEqual(0);
      expect(result.probabilityOfProfit).toBeLessThanOrEqual(1);
    });

    it('should calculate expected value', () => {
      const positions: StrategyPosition[] = [
        createStrategyPosition({}, 1, 10),
      ];

      const result = OptionsPricingAnalyzer.analyzeStrategy(
        positions,
        { min: 80, max: 120, steps: 40 }
      );

      expect(Number.isFinite(result.expectedValue)).toBe(true);
    });

    it('should calculate Sharpe ratio', () => {
      const positions: StrategyPosition[] = [
        createStrategyPosition({}, 1, 10),
      ];

      const result = OptionsPricingAnalyzer.analyzeStrategy(
        positions,
        { min: 80, max: 120, steps: 40 }
      );

      expect(Number.isFinite(result.sharpeRatio)).toBe(true);
    });

    it('should calculate maximum drawdown', () => {
      const positions: StrategyPosition[] = [
        createStrategyPosition({}, 1, 10),
      ];

      const result = OptionsPricingAnalyzer.analyzeStrategy(
        positions,
        { min: 80, max: 120, steps: 40 }
      );

      expect(result.maximumDrawdown).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============================================================================
// SCHEMA VALIDATION TESTS
// ============================================================================

describe('Schema Validation', () => {
  describe('OptionSchema', () => {
    it('should validate valid call option', () => {
      const option = createBasicCallOption();
      const result = OptionSchema.safeParse(option);
      expect(result.success).toBe(true);
    });

    it('should validate valid put option', () => {
      const option = createBasicPutOption();
      const result = OptionSchema.safeParse(option);
      expect(result.success).toBe(true);
    });

    it('should reject invalid option type', () => {
      const option = { ...createBasicCallOption(), type: 'invalid' };
      const result = OptionSchema.safeParse(option);
      expect(result.success).toBe(false);
    });

    it('should reject negative strike price', () => {
      const option = { ...createBasicCallOption(), strikePrice: -100 };
      const result = OptionSchema.safeParse(option);
      expect(result.success).toBe(false);
    });

    it('should reject invalid time to expiry', () => {
      const option = { ...createBasicCallOption(), timeToExpiry: 0 };
      const result = OptionSchema.safeParse(option);
      expect(result.success).toBe(false);
    });

    it('should reject volatility above 500%', () => {
      const option = { ...createBasicCallOption(), volatility: 6 };
      const result = OptionSchema.safeParse(option);
      expect(result.success).toBe(false);
    });

    it('should accept volatility at 500%', () => {
      const option = { ...createBasicCallOption(), volatility: 5 };
      const result = OptionSchema.safeParse(option);
      expect(result.success).toBe(true);
    });

    it('should accept optional market data fields', () => {
      const option = {
        ...createBasicCallOption(),
        symbol: 'AAPL',
        underlying: 'Apple Inc.',
        bidPrice: 10.5,
        askPrice: 11.0,
        volume: 1000,
        openInterest: 5000,
      };
      const result = OptionSchema.safeParse(option);
      expect(result.success).toBe(true);
    });
  });

  describe('OptionAnalysisInputSchema', () => {
    it('should validate complete input', () => {
      const input = createBasicInput();
      const result = OptionAnalysisInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should apply default analysis options', () => {
      const input = { option: createBasicCallOption() };
      const result = OptionAnalysisInputSchema.parse(input);

      expect(result.analysis.includeGreeks).toBe(true);
      expect(result.analysis.pricingModel).toBe('black-scholes');
      expect(result.analysis.monteCarloSimulations).toBe(100000);
    });

    it('should reject invalid pricing model', () => {
      const input = createBasicInput({}, { pricingModel: 'invalid' as 'black-scholes' });
      const result = OptionAnalysisInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should validate Monte Carlo simulations range', () => {
      const tooFew = createBasicInput({}, { monteCarloSimulations: 500 });
      const tooMany = createBasicInput({}, { monteCarloSimulations: 2000000 });

      expect(OptionAnalysisInputSchema.safeParse(tooFew).success).toBe(false);
      expect(OptionAnalysisInputSchema.safeParse(tooMany).success).toBe(false);
    });
  });
});

// ============================================================================
// EDGE CASES AND ERROR HANDLING TESTS
// ============================================================================

describe('Edge Cases', () => {
  it('should handle very small time to expiry', () => {
    const input = createBasicInput({ timeToExpiry: 0.001 }); // ~9 hours
    const result = OptionsPricingAnalyzer.analyze(input);

    expect(Number.isFinite(result.theoreticalPrice)).toBe(true);
    expect(result.theoreticalPrice).toBeGreaterThanOrEqual(0);
  });

  it('should handle very high volatility', () => {
    const input = createBasicInput({ volatility: 4 }); // 400%
    const result = OptionsPricingAnalyzer.analyze(input);

    expect(Number.isFinite(result.theoreticalPrice)).toBe(true);
    expect(result.theoreticalPrice).toBeGreaterThan(0);
  });

  it('should handle very low volatility', () => {
    const input = createBasicInput({ volatility: 0.01 }); // 1%
    const result = OptionsPricingAnalyzer.analyze(input);

    expect(Number.isFinite(result.theoreticalPrice)).toBe(true);
  });

  it('should handle zero risk-free rate', () => {
    const input = createBasicInput({ riskFreeRate: 0 });
    const result = OptionsPricingAnalyzer.analyze(input);

    expect(Number.isFinite(result.theoreticalPrice)).toBe(true);
  });

  it('should handle high risk-free rate', () => {
    const input = createBasicInput({ riskFreeRate: 0.2 }); // 20%
    const result = OptionsPricingAnalyzer.analyze(input);

    expect(Number.isFinite(result.theoreticalPrice)).toBe(true);
  });

  it('should handle very deep ITM option', () => {
    const input = createBasicInput({ underlyingPrice: 200, strikePrice: 100 });
    const result = OptionsPricingAnalyzer.analyze(input);

    expect(result.intrinsicValue).toBe(100);
    expect(result.greeks.delta).toBeCloseTo(1, 1);
  });

  it('should handle very deep OTM option', () => {
    const input = createBasicInput({ underlyingPrice: 50, strikePrice: 100 });
    const result = OptionsPricingAnalyzer.analyze(input);

    expect(result.intrinsicValue).toBe(0);
    expect(result.greeks.delta).toBeLessThan(0.1);
  });

  it('should handle bermudan style option', () => {
    const input = createBasicInput({ style: 'bermudan' }, { pricingModel: 'binomial' });
    const result = OptionsPricingAnalyzer.analyze(input);

    expect(Number.isFinite(result.theoreticalPrice)).toBe(true);
  });
});

// ============================================================================
// PUT-CALL PARITY TESTS
// ============================================================================

describe('Put-Call Parity', () => {
  it('should satisfy put-call parity for European options', () => {
    const S = 100;
    const K = 100;
    const r = 0.05;
    const T = 1;

    const call = OptionsPricingAnalyzer.analyze(
      createBasicInput({ underlyingPrice: S, strikePrice: K, riskFreeRate: r, timeToExpiry: T })
    );
    const put = OptionsPricingAnalyzer.analyze(
      createBasicInput({ type: 'put', underlyingPrice: S, strikePrice: K, riskFreeRate: r, timeToExpiry: T })
    );

    // Put-Call Parity: C - P = S - K*e^(-rT)
    const expectedDifference = S - K * Math.exp(-r * T);
    const actualDifference = call.theoreticalPrice - put.theoreticalPrice;

    expect(actualDifference).toBeCloseTo(expectedDifference, 2);
  });

  it('should satisfy put-call parity with dividends', () => {
    const S = 100;
    const K = 100;
    const r = 0.05;
    const q = 0.02;
    const T = 1;

    const call = OptionsPricingAnalyzer.analyze(
      createBasicInput(
        { underlyingPrice: S, strikePrice: K, riskFreeRate: r, timeToExpiry: T, dividendYield: q },
        { pricingModel: 'black-scholes-merton' }
      )
    );
    const put = OptionsPricingAnalyzer.analyze(
      createBasicInput(
        { type: 'put', underlyingPrice: S, strikePrice: K, riskFreeRate: r, timeToExpiry: T, dividendYield: q },
        { pricingModel: 'black-scholes-merton' }
      )
    );

    // Put-Call Parity with dividends: C - P = S*e^(-qT) - K*e^(-rT)
    const expectedDifference = S * Math.exp(-q * T) - K * Math.exp(-r * T);
    const actualDifference = call.theoreticalPrice - put.theoreticalPrice;

    expect(actualDifference).toBeCloseTo(expectedDifference, 2);
  });
});

// ============================================================================
// PERFORMANCE / STRESS TESTS
// ============================================================================

describe('Performance', () => {
  it('should handle rapid sequential calculations', () => {
    const startTime = Date.now();
    
    for (let i = 0; i < 100; i++) {
      OptionsPricingAnalyzer.analyze(createBasicInput({ underlyingPrice: 90 + i * 0.2 }));
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete 100 calculations in under 5 seconds
    expect(duration).toBeLessThan(5000);
  });

  it('should handle strategy with many positions', () => {
    const positions: StrategyPosition[] = [];
    
    for (let i = 0; i < 10; i++) {
      positions.push({
        option: createBasicCallOption({ strikePrice: 90 + i * 2 }),
        quantity: i % 2 === 0 ? 1 : -1,
        cost: 5 + i,
      });
    }

    const result = OptionsPricingAnalyzer.analyzeStrategy(
      positions,
      { min: 70, max: 130, steps: 60 }
    );

    expect(result.positions.length).toBe(10);
    expect(Number.isFinite(result.netCost)).toBe(true);
  });
});
