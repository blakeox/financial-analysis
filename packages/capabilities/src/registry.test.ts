import { describe, expect, it } from 'vitest';

import { CERTIFIED_FORMULA_CATALOG } from '@financial-analysis/analysis';

import { CapabilitySchema } from './contracts.js';
import {
  CAPABILITY_REGISTRY,
  assertStableCapabilityPublication,
  getCapability,
  isStableCapabilityPublication,
  listStableCapabilities,
} from './registry.js';

describe('canonical capability registry', () => {
  it('registers every certified formula as a stable stateless capability', () => {
    expect(CAPABILITY_REGISTRY).toHaveLength(CERTIFIED_FORMULA_CATALOG.length);
    expect(listStableCapabilities()).toHaveLength(CERTIFIED_FORMULA_CATALOG.length);

    for (const capability of CAPABILITY_REGISTRY) {
      expect(CapabilitySchema.safeParse(capability).success).toBe(true);
      expect(capability.lifecycle).toBe('stable');
      expect(capability.executionScope).toBe('stateless');
      expect(capability.sideEffects).toBe('none');
      expect(capability.formula?.formulaVersion).toBe(capability.version);
      expect(getCapability(capability.id, capability.version)).toEqual(capability);
      expect(isStableCapabilityPublication(capability.id, capability.version)).toBe(true);
      expect(assertStableCapabilityPublication(capability.id, capability.version)).toEqual(
        capability
      );
    }
  });

  it('blocks unreviewed capabilities from stable publication', () => {
    expect(getCapability('analysis.unreviewed-placeholder')).toBeUndefined();
    expect(isStableCapabilityPublication('analysis.unreviewed-placeholder')).toBe(false);
    expect(() => assertStableCapabilityPublication('analysis.unreviewed-placeholder')).toThrow(
      /not backed by a certified formula/
    );
  });
});
