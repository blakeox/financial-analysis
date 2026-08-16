import { describe, expect, it } from 'vitest';

import {
  AnalysisRequestSchema,
  AnalysisResultSchema,
  AnswerSchema,
  CapabilitySchema,
  CONTRACT_VERSION,
  EvidenceEnvelopeSchema,
  NumericClaimSchema,
  ResponseVerificationSchema,
} from './index.js';
import { verifyNumericClaims } from './response-verification.js';

const timestamp = '2026-08-02T12:00:00.000Z';

const scenario = {
  id: 'base-case',
  name: 'Base case',
  inputs: { revenue: 100000, expenses: 70000 },
  assumptions: [
    {
      id: 'tax-rate',
      label: 'Tax rate',
      value: 0.25,
      source: 'default' as const,
      dataClassification: 'public' as const,
    },
  ],
};

describe('financial analysis contracts', () => {
  it('accepts a stateless deterministic request without agent state', () => {
    const result = AnalysisRequestSchema.safeParse({
      contractVersion: CONTRACT_VERSION,
      requestId: 'request-1',
      submittedAt: timestamp,
      capabilityId: 'business.cash-flow',
      capabilityVersion: '1.0.0',
      executionScope: 'stateless',
      scenario,
      requestedDataClassifications: ['public', 'user'],
    });

    expect(result.success).toBe(true);
  });

  it('rejects state or private classifications on stateless requests', () => {
    const statelessWithState = AnalysisRequestSchema.safeParse({
      contractVersion: CONTRACT_VERSION,
      requestId: 'request-1',
      submittedAt: timestamp,
      capabilityId: 'business.cash-flow',
      capabilityVersion: '1.0.0',
      executionScope: 'stateless',
      scenario,
      requestedDataClassifications: ['public'],
      state: { principalId: 'principal-1' },
    });
    const missingScopedState = AnalysisRequestSchema.safeParse({
      contractVersion: CONTRACT_VERSION,
      requestId: 'request-2',
      submittedAt: timestamp,
      capabilityId: 'workspace.cash-flow',
      capabilityVersion: '1.0.0',
      executionScope: 'workspace',
      scenario,
      requestedDataClassifications: ['workspace'],
    });
    const statelessWithPrivateData = AnalysisRequestSchema.safeParse({
      contractVersion: CONTRACT_VERSION,
      requestId: 'request-3',
      submittedAt: timestamp,
      capabilityId: 'business.cash-flow',
      capabilityVersion: '1.0.0',
      executionScope: 'stateless',
      scenario,
      requestedDataClassifications: ['public', 'workspace'],
    });

    expect(statelessWithState.success).toBe(false);
    expect(missingScopedState.success).toBe(false);
    expect(statelessWithPrivateData.success).toBe(false);
  });

  it('requires versioned formula and provenance fields on results', () => {
    const result = AnalysisResultSchema.safeParse({
      contractVersion: CONTRACT_VERSION,
      analysisRunId: 'run-1',
      requestId: 'request-1',
      capabilityId: 'business.cash-flow',
      capabilityVersion: '1.0.0',
      formulaVersion: '1.0.0',
      status: 'completed',
      generatedAt: timestamp,
      inputs: { revenue: 100000 },
      assumptions: [],
      outputs: { netCashFlow: 30000 },
      precision: { decimalPlaces: 2, rounding: 'half-up' },
      currency: 'USD',
      warnings: [],
      evidence: [],
      scenarioId: 'base-case',
    });

    expect(result.success).toBe(true);
  });

  it('does not allow unversioned capabilities or canonical assistant answers', () => {
    const capability = CapabilitySchema.safeParse({
      contractVersion: CONTRACT_VERSION,
      id: 'business.cash-flow',
      version: '1.0',
      name: 'Cash flow',
      description: 'Calculates cash flow',
      lifecycle: 'preview',
      executionScope: 'stateless',
      allowedDataClassifications: ['public'],
      inputSchemaRef: 'schemas/cash-flow-input',
      outputSchemaRef: 'schemas/cash-flow-output',
      sideEffects: 'none',
      requiredScope: 'financial.calculate',
      resourceScope: 'stateless',
      budgetClass: 'deterministic',
      approvalRequired: false,
      auditEvent: 'capability.business.cash-flow.execute',
      killSwitch: 'ANALYSIS_CAPABILITIES_ENABLED',
      owner: 'analysis-team',
      inputLimitBytes: 10000,
      outputLimitBytes: 10000,
    });
    const answer = AnswerSchema.safeParse({
      contractVersion: CONTRACT_VERSION,
      answerId: 'answer-1',
      analysisRunId: 'run-1',
      createdAt: timestamp,
      content: 'The result is positive.',
      generatedBy: 'model',
      isCanonicalResult: true,
      resultReference: 'run-1',
    });

    expect(capability.success).toBe(false);
    expect(answer.success).toBe(false);
  });

  it('requires the policy fields needed by every execution surface', () => {
    const capability = CapabilitySchema.safeParse({
      contractVersion: CONTRACT_VERSION,
      id: 'business.cash-flow',
      version: '1.0.0',
      name: 'Cash flow',
      description: 'Calculates cash flow',
      lifecycle: 'stable',
      executionScope: 'stateless',
      allowedDataClassifications: ['public'],
      inputSchemaRef: 'schemas/cash-flow-input',
      outputSchemaRef: 'schemas/cash-flow-output',
      sideEffects: 'none',
      requiredScope: 'financial.calculate',
      resourceScope: 'stateless',
      budgetClass: 'deterministic',
      approvalRequired: false,
      auditEvent: 'capability.business.cash-flow.execute',
      killSwitch: 'ANALYSIS_CAPABILITIES_ENABLED',
      owner: 'analysis-team',
      inputLimitBytes: 10000,
      outputLimitBytes: 10000,
    });

    const incomplete = { ...capability.data };
    delete incomplete.requiredScope;

    expect(capability.success).toBe(true);
    expect(CapabilitySchema.safeParse(incomplete).success).toBe(false);
  });

  it('requires versioned, data-only provenance and freshness metadata', () => {
    const envelope = EvidenceEnvelopeSchema.safeParse({
      id: 'evidence-1',
      artifactId: 'artifact-1',
      ownerScope: 'stateless',
      kind: 'document',
      title: 'Public filing',
      source: 'SEC filing',
      sourceUri: 'https://example.com/filing',
      retrievedAt: timestamp,
      contentHash: `sha256:${'a'.repeat(64)}`,
      parserVersion: '1.0.0',
      indexVersion: '1.0.0',
      trustClass: 'source-fact',
      freshness: 'current',
      conflict: 'none',
      instructionAuthority: 'data-only',
      dataClassification: 'public',
    });
    const injected = EvidenceEnvelopeSchema.safeParse({
      id: 'evidence-2',
      artifactId: 'artifact-2',
      ownerScope: 'stateless',
      kind: 'external',
      title: 'Untrusted page',
      source: 'Web content',
      retrievedAt: timestamp,
      contentHash: `sha256:${'b'.repeat(64)}`,
      parserVersion: '1.0.0',
      indexVersion: '1.0.0',
      trustClass: 'untrusted-content',
      freshness: 'unknown',
      conflict: 'unresolved',
      instructionAuthority: 'tool-grant',
      dataClassification: 'external',
    });

    expect(envelope.success).toBe(true);
    expect(injected.success).toBe(false);
  });

  it('verifies structured model claims against deterministic outputs', () => {
    const claims = NumericClaimSchema.array().parse([
      { id: 'payment', outputKey: 'monthlyPayment', value: 1000.004, unit: 'USD' },
    ]);
    const result = verifyNumericClaims(
      claims,
      { monthlyPayment: 1000 },
      { absoluteTolerance: 0.01 }
    );

    expect(result.status).toBe('verified');
    expect(result.numericClaims[0]?.status).toBe('matched');
    expect(
      ResponseVerificationSchema.safeParse({
        contractVersion: CONTRACT_VERSION,
        verificationId: 'verification-1',
        analysisRunId: 'run-1',
        verifiedAt: timestamp,
        verifierVersion: result.verifierVersion,
        status: result.status,
        numericClaims: result.numericClaims,
        issues: result.issues,
      }).success
    ).toBe(true);
  });

  it('rejects contradictory claims and does not mutate canonical outputs', () => {
    const canonicalOutputs = { totalInterest: 2500 };
    const claims = NumericClaimSchema.array().parse([
      { id: 'interest', outputKey: 'totalInterest', value: 3500, unit: 'USD' },
    ]);
    const result = verifyNumericClaims(claims, canonicalOutputs);

    expect(result.status).toBe('rejected');
    expect(result.issues[0]?.code).toBe('NUMERIC_MISMATCH');
    expect(canonicalOutputs).toEqual({ totalInterest: 2500 });
  });

  it('marks claims for unavailable outputs as partially verified', () => {
    const claims = NumericClaimSchema.array().parse([
      { id: 'unknown', outputKey: 'futureValue', value: 10 },
    ]);
    const result = verifyNumericClaims(claims, {});

    expect(result.status).toBe('partially-verified');
    expect(result.numericClaims[0]?.status).toBe('unsupported');
  });
});
