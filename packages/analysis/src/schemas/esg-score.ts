import { z } from 'zod';

export const ESGScoreInputSchema = z.object({
  environmentalScore: z.number().min(0).max(100),
  socialScore: z.number().min(0).max(100),
  governanceScore: z.number().min(0).max(100),
  weights: z
    .object({
      environmental: z.number().min(0),
      social: z.number().min(0),
      governance: z.number().min(0),
    })
    .optional(),
});

export type ESGScoreInput = z.infer<typeof ESGScoreInputSchema>;

