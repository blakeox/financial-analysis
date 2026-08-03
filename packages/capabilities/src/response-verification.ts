import type { NumericClaim, NumericClaimCheck, ResponseVerificationStatus } from './contracts.js';

export const RESPONSE_VERIFIER_VERSION = '1.0.0';

export interface ResponseVerificationIssue {
  code: 'NO_CLAIMS' | 'UNSUPPORTED_OUTPUT' | 'NUMERIC_MISMATCH';
  message: string;
  severity: 'warning' | 'error';
}

export interface NumericVerificationResult {
  status: ResponseVerificationStatus;
  numericClaims: NumericClaimCheck[];
  issues: ResponseVerificationIssue[];
  verifierVersion: string;
}

export interface NumericVerificationOptions {
  /** Absolute tolerance floor used for rounded currency and percentage claims. */
  absoluteTolerance?: number;
  /** Relative tolerance applied to values larger than one unit. */
  relativeTolerance?: number;
}

function toleranceFor(expectedValue: number, options: NumericVerificationOptions): number {
  const absoluteTolerance = options.absoluteTolerance ?? 0.01;
  const relativeTolerance = options.relativeTolerance ?? 0.0001;
  return Math.max(absoluteTolerance, Math.abs(expectedValue) * relativeTolerance);
}

/**
 * Reconcile structured model claims against deterministic output values.
 *
 * This function is deliberately pure: it cannot mutate inputs, memory, policy,
 * or capability state. Callers may attach its receipt to an Answer envelope.
 */
export function verifyNumericClaims(
  claims: readonly NumericClaim[],
  canonicalOutputs: Readonly<Record<string, number>>,
  options: NumericVerificationOptions = {}
): NumericVerificationResult {
  const numericClaims: NumericClaimCheck[] = [];
  const issues: ResponseVerificationIssue[] = [];

  if (claims.length === 0) {
    return {
      status: 'unverified',
      numericClaims,
      issues: [
        {
          code: 'NO_CLAIMS',
          message: 'No structured numeric claims were supplied for verification.',
          severity: 'warning',
        },
      ],
      verifierVersion: RESPONSE_VERIFIER_VERSION,
    };
  }

  for (const claim of claims) {
    const expectedValue = canonicalOutputs[claim.outputKey];
    if (expectedValue === undefined || !Number.isFinite(expectedValue)) {
      numericClaims.push({
        id: claim.id,
        outputKey: claim.outputKey,
        observedValue: claim.value,
        unit: claim.unit,
        tolerance: 0,
        status: 'unsupported',
      });
      issues.push({
        code: 'UNSUPPORTED_OUTPUT',
        message: `No deterministic output is available for ${claim.outputKey}.`,
        severity: 'warning',
      });
      continue;
    }

    const tolerance = toleranceFor(expectedValue, options);
    const status = Math.abs(claim.value - expectedValue) <= tolerance ? 'matched' : 'mismatch';
    numericClaims.push({
      id: claim.id,
      outputKey: claim.outputKey,
      observedValue: claim.value,
      expectedValue,
      unit: claim.unit,
      tolerance,
      status,
    });

    if (status === 'mismatch') {
      issues.push({
        code: 'NUMERIC_MISMATCH',
        message: `Claim ${claim.outputKey} does not reconcile with the deterministic output.`,
        severity: 'error',
      });
    }
  }

  const hasMismatch = numericClaims.some((claim) => claim.status === 'mismatch');
  const hasUnsupported = numericClaims.some((claim) => claim.status === 'unsupported');
  return {
    status: hasMismatch ? 'rejected' : hasUnsupported ? 'partially-verified' : 'verified',
    numericClaims,
    issues,
    verifierVersion: RESPONSE_VERIFIER_VERSION,
  };
}
