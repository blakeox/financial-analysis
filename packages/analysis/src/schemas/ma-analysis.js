import { z } from 'zod';

export const MAAnalysisInputSchema = z.object({
  transactionInfo: z.object({
    acquirer: z.string(),
    target: z.string(),
    transactionType: z.enum(['acquisition', 'merger', 'divestiture', 'spin-off', 'joint-venture']),
    purchasePrice: z.number().min(0),
    premium: z.number().min(0).max(1),
    dealSize: z.enum(['small', 'medium', 'large', 'mega']),
  }),
  financialData: z.object({
    acquirerRevenue: z.number().min(0),
    acquirerEbitda: z.number().min(0),
    targetRevenue: z.number().min(0),
    targetEbitda: z.number().min(0),
    synergies: z.number().min(0),
    integrationCosts: z.number().min(0),
  }),
  assumptions: z.object({
    synergyProbability: z.number().min(0).max(1),
    integrationTimeline: z.number().min(1).max(10),
    revenueSynergies: z.number().min(0),
    costSynergies: z.number().min(0),
  }),
  goals: z.object({
    analysisType: z.enum(['accretion-dilution', 'synergy-analysis', 'value-creation']),
    includeSensitivity: z.boolean(),
    includeIntegrationPlanning: z.boolean(),
  }),
});
