import { z } from 'zod';

export const CollegeSavingsInputSchema = z.object({
  familyInfo: z.object({
    numberOfChildren: z.number().min(1).max(10),
    children: z.array(
      z.object({
        name: z.string(),
        age: z.number().min(0).max(18),
        expectedCollegeStartAge: z.number().min(16).max(25),
        expectedGraduationAge: z.number().min(18).max(30),
        collegeType: z.enum(['private', 'public', 'community', 'ivy-league']),
        specialNeeds: z.boolean(),
        expectedMajor: z.string().optional(),
      })
    ),
    stateOfResidence: z.string(),
    maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']),
  }),
  currentSavings: z.object({
    total529Balance: z.number().min(0),
    totalCoverdellBalance: z.number().min(0),
    totalOtherSavings: z.number().min(0),
    monthlyContribution: z.number().min(0),
  }),
  goals: z.object({
    targetCoverage: z.number().min(0).max(1),
    riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
    investmentStrategy: z.enum(['age-based', 'static', 'custom']),
  }),
});

export type CollegeSavingsInput = z.infer<typeof CollegeSavingsInputSchema>;
