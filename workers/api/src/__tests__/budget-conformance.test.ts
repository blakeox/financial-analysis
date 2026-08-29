import { describe, expect, it } from 'vitest';

import { BUDGET_CONFORMANCE_KEY_ID, getMcpBudgetClientId } from '../lib/budget-conformance';

describe('budget conformance identity', () => {
  it('uses a bounded UTC daily bucket for the synthetic probe', () => {
    expect(
      getMcpBudgetClientId(BUDGET_CONFORMANCE_KEY_ID, new Date('2026-08-29T23:59:59.000Z'))
    ).toBe('budget-conformance:2026-08-29');
    expect(
      getMcpBudgetClientId(BUDGET_CONFORMANCE_KEY_ID, new Date('2026-08-30T00:00:00.000Z'))
    ).toBe('budget-conformance:2026-08-30');
  });

  it('does not alter real API-key budget identities', () => {
    expect(getMcpBudgetClientId(17, new Date('2026-08-29T00:00:00.000Z'))).toBe('api-key:17');
  });
});
