import { describe, expect, it } from 'vitest';
import { OptionsPricingTool } from '../tools/options-pricing';

describe('OptionsPricingTool', () => {
  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(OptionsPricingTool.toolName).toBe('analyze_options_pricing');
    });

    it('has a description', () => {
      expect(OptionsPricingTool.description).toBeTruthy();
      expect(OptionsPricingTool.description.length).toBeGreaterThan(50);
    });

    it('has required input schema fields', () => {
      const schema = OptionsPricingTool.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toContain('optionType');
      expect(schema.required).toContain('strikePrice');
      expect(schema.required).toContain('currentPrice');
      expect(schema.required).toContain('expiryDate');
      expect(schema.required).toContain('volatility');
      expect(schema.required).toContain('riskFreeRate');
    });

    it('supports multiple option types', () => {
      const types = OptionsPricingTool.inputSchema.properties.optionType.enum;
      expect(types).toContain('call');
      expect(types).toContain('put');
    });

    it('supports multiple option styles', () => {
      const styles = OptionsPricingTool.inputSchema.properties.optionStyle.enum;
      expect(styles).toContain('European');
      expect(styles).toContain('American');
      expect(styles).toContain('Bermudan');
      expect(styles).toContain('Asian');
      expect(styles).toContain('Barrier');
    });

    it('supports multiple pricing models', () => {
      const models = OptionsPricingTool.inputSchema.properties.pricingModel.enum;
      expect(models).toContain('Black-Scholes');
      expect(models).toContain('Binomial');
      expect(models).toContain('Monte Carlo');
    });
  });

  describe('execute', () => {
    // Note: The analyzer expects 'expirationDate' (lowercase enums) but the MCP tool
    // schema shows 'expiryDate' with PascalCase enums. The tool passes input directly
    // to the analyzer, so we use the analyzer's expected schema format.
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 3);
    const expirationDate = futureDate.toISOString().split('T')[0];

    const baseCallOption = {
      optionType: 'call',
      strikePrice: 100,
      currentPrice: 105,
      expirationDate, // analyzer expects 'expirationDate'
      volatility: 0.25,
      riskFreeRate: 0.05,
    };

    const basePutOption = {
      optionType: 'put',
      strikePrice: 100,
      currentPrice: 95,
      expirationDate,
      volatility: 0.25,
      riskFreeRate: 0.05,
    };

    it('prices a basic call option using Black-Scholes', async () => {
      const result = await OptionsPricingTool.execute(baseCallOption);

      expect(result).toBeDefined();
      const parsed = JSON.parse(result);
      expect(parsed.error).toBeUndefined();
    });

    it('prices a basic put option using Black-Scholes', async () => {
      const result = await OptionsPricingTool.execute(basePutOption);

      expect(result).toBeDefined();
      const parsed = JSON.parse(result);
      expect(parsed.error).toBeUndefined();
    });

    it('handles dividend yield', async () => {
      const result = await OptionsPricingTool.execute({
        ...baseCallOption,
        dividendYield: 0.02,
      });

      expect(result).toBeDefined();
      const parsed = JSON.parse(result);
      expect(parsed.error).toBeUndefined();
    });

    it('prices using binomial model', async () => {
      const result = await OptionsPricingTool.execute({
        ...baseCallOption,
        pricingModel: 'binomial', // analyzer expects lowercase
        binomialSteps: 100,
      });

      expect(result).toBeDefined();
      const parsed = JSON.parse(result);
      expect(parsed.error).toBeUndefined();
    });

    it('prices using monte-carlo model', async () => {
      const result = await OptionsPricingTool.execute({
        ...baseCallOption,
        pricingModel: 'monte-carlo', // analyzer expects lowercase with hyphen
        monteCarloSimulations: 1000,
      });

      expect(result).toBeDefined();
      const parsed = JSON.parse(result);
      expect(parsed.error).toBeUndefined();
    });

    it('handles american style options', async () => {
      const result = await OptionsPricingTool.execute({
        ...baseCallOption,
        optionStyle: 'american', // analyzer expects lowercase
        pricingModel: 'binomial',
      });

      expect(result).toBeDefined();
      const parsed = JSON.parse(result);
      expect(parsed.error).toBeUndefined();
    });

    it('handles european style options', async () => {
      const result = await OptionsPricingTool.execute({
        ...basePutOption,
        optionStyle: 'european', // analyzer expects lowercase
      });

      expect(result).toBeDefined();
      const parsed = JSON.parse(result);
      expect(parsed.error).toBeUndefined();
    });

    it('handles high volatility scenarios', async () => {
      const result = await OptionsPricingTool.execute({
        ...baseCallOption,
        volatility: 0.8,
      });

      expect(result).toBeDefined();
      const parsed = JSON.parse(result);
      expect(parsed.error).toBeUndefined();
    });

    it('handles low volatility scenarios', async () => {
      const result = await OptionsPricingTool.execute({
        ...baseCallOption,
        volatility: 0.1,
      });

      expect(result).toBeDefined();
      const parsed = JSON.parse(result);
      expect(parsed.error).toBeUndefined();
    });

    it('handles deep in-the-money call option', async () => {
      const result = await OptionsPricingTool.execute({
        ...baseCallOption,
        strikePrice: 80,
        currentPrice: 120,
      });

      expect(result).toBeDefined();
      const parsed = JSON.parse(result);
      expect(parsed.error).toBeUndefined();
    });

    it('handles deep out-of-the-money put option', async () => {
      const result = await OptionsPricingTool.execute({
        ...basePutOption,
        strikePrice: 80,
        currentPrice: 120,
      });

      expect(result).toBeDefined();
      const parsed = JSON.parse(result);
      expect(parsed.error).toBeUndefined();
    });

    it('handles at-the-money options', async () => {
      const result = await OptionsPricingTool.execute({
        ...baseCallOption,
        strikePrice: 100,
        currentPrice: 100,
      });

      expect(result).toBeDefined();
      const parsed = JSON.parse(result);
      expect(parsed.error).toBeUndefined();
    });

    it('returns error for missing required fields', async () => {
      const result = await OptionsPricingTool.execute({
        optionType: 'call',
        // Missing other required fields
      });

      expect(result).toBeDefined();
      const parsed = JSON.parse(result);
      expect(parsed.error).toBeDefined();
    });
  });
});
