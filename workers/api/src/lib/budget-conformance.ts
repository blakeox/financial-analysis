/**
 * Synthetic identity rules for the hosted budget-conformance probe.
 *
 * The probe uses a dedicated authentication key, but its budget identity is
 * bucketed by UTC day so scheduled checks cannot exhaust one monthly window
 * or create an unbounded number of D1 budget windows.
 */
export const BUDGET_CONFORMANCE_KEY_ID = -2;

export function getMcpBudgetClientId(apiKeyId: number, now = new Date()): string {
  if (apiKeyId !== BUDGET_CONFORMANCE_KEY_ID) {
    return `api-key:${apiKeyId}`;
  }

  return `budget-conformance:${now.toISOString().slice(0, 10)}`;
}
