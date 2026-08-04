import { z } from 'zod';

export const CONTRACT_VERSION = '1.0.0';

const IdentifierSchema = z.string().trim().min(1).max(128);
const VersionSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, 'Version must use MAJOR.MINOR.PATCH format');
const JsonObjectSchema = z.record(z.string(), z.unknown());
const TimestampSchema = z.string().datetime({ offset: true });

export const DataClassificationSchema = z.enum([
  'public',
  'user',
  'workspace',
  'case',
  'sensitive',
  'external',
]);

export const ExecutionScopeSchema = z.enum(['stateless', 'user', 'workspace', 'case']);
export const LifecycleSchema = z.enum(['preview', 'stable', 'deprecated']);
export const CurrencyCodeSchema = z
  .string()
  .regex(/^[A-Z]{3}$/, 'Currency must be an ISO 4217 code');

export const PrecisionSchema = z.object({
  decimalPlaces: z.number().int().min(0).max(20),
  rounding: z.enum(['half-up', 'half-even', 'floor', 'ceil', 'truncate']),
});

export const AssumptionSchema = z.object({
  id: IdentifierSchema,
  label: z.string().trim().min(1).max(256),
  value: z.unknown(),
  unit: z.string().trim().min(1).max(64).optional(),
  source: z.enum(['user', 'default', 'derived', 'external']),
  dataClassification: DataClassificationSchema,
});

export const WarningSchema = z.object({
  code: IdentifierSchema,
  message: z.string().trim().min(1).max(1024),
  severity: z.enum(['info', 'warning', 'error']),
});

export const EvidenceSchema = z.object({
  id: IdentifierSchema,
  kind: z.enum(['calculation', 'document', 'market-data', 'user-input', 'external']),
  title: z.string().trim().min(1).max(256),
  source: z.string().trim().min(1).max(256),
  sourceUri: z.string().url().optional(),
  retrievedAt: TimestampSchema.optional(),
  dataClassification: DataClassificationSchema,
});

export const FormulaSemanticsSchema = z.object({
  formulaVersion: VersionSchema,
  precision: PrecisionSchema,
  currency: CurrencyCodeSchema.optional(),
  rateConvention: z.string().trim().min(1).max(128).optional(),
  dateBasis: z.string().trim().min(1).max(128).optional(),
});

export const ScenarioSchema = z.object({
  id: IdentifierSchema,
  name: z.string().trim().min(1).max(256),
  description: z.string().trim().max(1024).optional(),
  inputs: JsonObjectSchema,
  assumptions: z.array(AssumptionSchema),
});

export const CapabilitySchema = z.object({
  contractVersion: VersionSchema,
  id: IdentifierSchema.regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/),
  version: VersionSchema,
  name: z.string().trim().min(1).max(256),
  description: z.string().trim().min(1).max(2048),
  lifecycle: LifecycleSchema,
  executionScope: ExecutionScopeSchema,
  allowedDataClassifications: z.array(DataClassificationSchema).min(1),
  inputSchemaRef: z.string().trim().min(1).max(256),
  outputSchemaRef: z.string().trim().min(1).max(256),
  formula: FormulaSemanticsSchema.optional(),
  sideEffects: z.enum(['none', 'writes-state', 'external-action']),
  owner: IdentifierSchema,
  inputLimitBytes: z.number().int().positive(),
  outputLimitBytes: z.number().int().positive(),
});

const RequestStateSchema = z.object({
  principalId: IdentifierSchema,
  userId: IdentifierSchema.optional(),
  workspaceId: IdentifierSchema.optional(),
  caseId: IdentifierSchema.optional(),
  agentSessionId: IdentifierSchema.optional(),
});

export const AnalysisRequestSchema = z
  .object({
    contractVersion: VersionSchema,
    requestId: IdentifierSchema,
    submittedAt: TimestampSchema,
    capabilityId: IdentifierSchema,
    capabilityVersion: VersionSchema,
    executionScope: ExecutionScopeSchema,
    scenario: ScenarioSchema,
    requestedDataClassifications: z.array(DataClassificationSchema),
    state: RequestStateSchema.optional(),
  })
  .superRefine((request, context) => {
    if (request.executionScope === 'stateless' && request.state) {
      context.addIssue({
        code: 'custom',
        path: ['state'],
        message: 'Stateless requests cannot carry Agent, workspace, or case state',
      });
    }

    if (
      request.executionScope === 'stateless' &&
      request.requestedDataClassifications.some((classification) =>
        ['workspace', 'case', 'sensitive'].includes(classification)
      )
    ) {
      context.addIssue({
        code: 'custom',
        path: ['requestedDataClassifications'],
        message: 'Stateless requests cannot request workspace, case, or sensitive data',
      });
    }

    if (request.executionScope !== 'stateless' && !request.state) {
      context.addIssue({
        code: 'custom',
        path: ['state'],
        message: 'Stateful requests must identify their principal and state scope',
      });
    }

    if (request.executionScope === 'user' && !request.state?.userId) {
      context.addIssue({
        code: 'custom',
        path: ['state', 'userId'],
        message: 'User-scoped requests must identify a user',
      });
    }

    if (request.executionScope === 'workspace' && !request.state?.workspaceId) {
      context.addIssue({
        code: 'custom',
        path: ['state', 'workspaceId'],
        message: 'Workspace-scoped requests must identify a workspace',
      });
    }

    if (
      request.executionScope === 'case' &&
      (!request.state?.workspaceId || !request.state.caseId)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['state'],
        message: 'Case-scoped requests must identify a workspace and case',
      });
    }
  });

export const AnalysisResultSchema = z.object({
  contractVersion: VersionSchema,
  analysisRunId: IdentifierSchema,
  requestId: IdentifierSchema,
  capabilityId: IdentifierSchema,
  capabilityVersion: VersionSchema,
  formulaVersion: VersionSchema,
  status: z.enum(['completed', 'partial', 'failed']),
  generatedAt: TimestampSchema,
  inputs: JsonObjectSchema,
  assumptions: z.array(AssumptionSchema),
  outputs: JsonObjectSchema,
  precision: PrecisionSchema,
  currency: CurrencyCodeSchema.optional(),
  warnings: z.array(WarningSchema),
  evidence: z.array(EvidenceSchema),
  scenarioId: IdentifierSchema,
});

export const AnswerSchema = z.object({
  contractVersion: VersionSchema,
  answerId: IdentifierSchema,
  analysisRunId: IdentifierSchema,
  createdAt: TimestampSchema,
  content: z.string().trim().min(1).max(20000),
  generatedBy: z.enum(['system', 'user', 'model']),
  isCanonicalResult: z.literal(false),
  resultReference: IdentifierSchema,
});

export type DataClassification = z.infer<typeof DataClassificationSchema>;
export type ExecutionScope = z.infer<typeof ExecutionScopeSchema>;
export type Lifecycle = z.infer<typeof LifecycleSchema>;
export type Precision = z.infer<typeof PrecisionSchema>;
export type Assumption = z.infer<typeof AssumptionSchema>;
export type Warning = z.infer<typeof WarningSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type FormulaSemantics = z.infer<typeof FormulaSemanticsSchema>;
export type Scenario = z.infer<typeof ScenarioSchema>;
export type Capability = z.infer<typeof CapabilitySchema>;
export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type Answer = z.infer<typeof AnswerSchema>;
