import { describe, expect, it } from 'vitest';
import { ESGScoreTool } from '../tools/esg-score';

describe('ESGScoreTool', () => {
  const validInput = {
    environmentalScore: 80,
    socialScore: 70,
    governanceScore: 90,
    weights: {
      environmental: 2,
      social: 1,
      governance: 1,
    },
  };

  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(ESGScoreTool.toolName).toBe('calculate_esg_score');
    });

    it('requires environmental, social, and governance scores', () => {
      expect(ESGScoreTool.inputSchema.required).toEqual([
        'environmentalScore',
        'socialScore',
        'governanceScore',
      ]);
    });
  });

  describe('execute', () => {
    it('computes weighted ESG score and rating', async () => {
      const result = (await ESGScoreTool.execute(validInput)) as {
        score: number;
        rating: string;
        weights: { environmental: number; social: number; governance: number };
      };

      expect(result.score).toBeCloseTo(80, 6);
      expect(result.rating).toBe('AA');
      expect(result.weights.environmental).toBeCloseTo(0.5, 6);
    });

    it('rejects invalid input', async () => {
      await expect(
        ESGScoreTool.execute({
          ...validInput,
          governanceScore: 101,
        })
      ).rejects.toThrow();
    });
  });
});
