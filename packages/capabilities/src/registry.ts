import {
  CERTIFIED_FORMULA_CATALOG,
  assertStableFormulaPublication,
  getCertifiedFormulaMetadata,
  type FormulaSemanticMetadata,
} from '@financial-analysis/analysis';

import { CAPABILITY_SCOPES } from './authorization.js';
import { CONTRACT_VERSION, CapabilitySchema, type Capability } from './contracts.js';

const DEFAULT_INPUT_LIMIT_BYTES = 64 * 1024;
const DEFAULT_OUTPUT_LIMIT_BYTES = 256 * 1024;
const CAPABILITY_OWNER = 'packages.analysis';

function toCapabilityName(formulaId: string): string {
  const leaf = formulaId.includes('.')
    ? formulaId.slice(formulaId.lastIndexOf('.') + 1)
    : formulaId;
  return leaf
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function toIsoCurrency(currency: string): string | undefined {
  return /^[A-Z]{3}$/.test(currency) ? currency : undefined;
}

function buildCapabilityFromFormula(metadata: FormulaSemanticMetadata): Capability {
  assertStableFormulaPublication(metadata.formulaId, metadata.formulaVersion);

  const currency = toIsoCurrency(metadata.currency);
  const capability = {
    contractVersion: CONTRACT_VERSION,
    id: metadata.formulaId,
    version: metadata.formulaVersion,
    name: toCapabilityName(metadata.formulaId),
    description: metadata.description,
    lifecycle: metadata.publicationStatus,
    executionScope: 'stateless' as const,
    allowedDataClassifications: ['public' as const],
    inputSchemaRef: `${metadata.formulaId}.input`,
    outputSchemaRef: `${metadata.formulaId}.output`,
    formula: {
      formulaVersion: metadata.formulaVersion,
      precision: {
        decimalPlaces: metadata.rounding.decimalPlaces,
        rounding: metadata.rounding.mode,
      },
      ...(currency ? { currency } : {}),
      rateConvention: metadata.rateConvention.slice(0, 128),
      dateBasis: metadata.dateBasis.slice(0, 128),
    },
    sideEffects: 'none' as const,
    requiredScope: CAPABILITY_SCOPES.FINANCIAL_CALCULATE,
    resourceScope: 'stateless' as const,
    budgetClass: 'deterministic' as const,
    approvalRequired: false,
    auditEvent: `capability.${metadata.formulaId}.execute`,
    killSwitch: 'ANALYSIS_CAPABILITIES_ENABLED',
    owner: CAPABILITY_OWNER,
    inputLimitBytes: DEFAULT_INPUT_LIMIT_BYTES,
    outputLimitBytes: DEFAULT_OUTPUT_LIMIT_BYTES,
  };

  return CapabilitySchema.parse(capability);
}

/**
 * Canonical deterministic capability registry for formulas that have completed
 * semantic certification. Unreviewed formulas are absent and fail closed.
 */
export const CAPABILITY_REGISTRY: readonly Capability[] = CERTIFIED_FORMULA_CATALOG.map(
  (metadata) => buildCapabilityFromFormula(metadata)
);

export function listCapabilities(): readonly Capability[] {
  return CAPABILITY_REGISTRY;
}

export function listStableCapabilities(): readonly Capability[] {
  return CAPABILITY_REGISTRY.filter((capability) => capability.lifecycle === 'stable');
}

export function getCapability(
  capabilityId: string,
  capabilityVersion?: string
): Capability | undefined {
  return CAPABILITY_REGISTRY.find(
    (capability) =>
      capability.id === capabilityId &&
      (capabilityVersion === undefined || capability.version === capabilityVersion)
  );
}

export function isStableCapabilityPublication(
  capabilityId: string,
  capabilityVersion?: string
): boolean {
  const capability = getCapability(capabilityId, capabilityVersion);
  return capability?.lifecycle === 'stable';
}

export function assertStableCapabilityPublication(
  capabilityId: string,
  capabilityVersion?: string
): Capability {
  const certifiedFormula = getCertifiedFormulaMetadata(capabilityId, capabilityVersion);
  if (!certifiedFormula) {
    throw new Error(
      `Capability ${capabilityId}${capabilityVersion ? `@${capabilityVersion}` : ''} is not backed by a certified formula and cannot be published as stable`
    );
  }

  assertStableFormulaPublication(capabilityId, capabilityVersion);

  const capability = getCapability(capabilityId, capabilityVersion);
  if (!capability) {
    throw new Error(
      `Capability ${capabilityId}${capabilityVersion ? `@${capabilityVersion}` : ''} is missing from the canonical registry`
    );
  }
  if (capability.lifecycle !== 'stable') {
    throw new Error(
      `Capability ${capability.id}@${capability.version} has lifecycle=${capability.lifecycle} and cannot enter the stable catalog`
    );
  }
  return capability;
}
