import type { Warning, WarningCategory } from './contracts.js';
import {
  WORKBENCH_CONTRACT_VERSION,
  WorkbenchResultViewSchema,
  WorkbenchRunDiffSchema,
  WorkbenchScenarioComparisonSchema,
  type WorkbenchChangedField,
  type WorkbenchResultView,
  type WorkbenchRunDiff,
  type WorkbenchScenarioComparison,
} from './workbench-contracts.js';

/**
 * Evidence-first result projection and compare helpers (#454).
 * Pure functions only — no Agent, MCP host, or Cloudflare dependencies.
 */

export interface WorkbenchResultRenderModel {
  analysisRunId: string;
  resultId: string;
  capabilityId: string;
  formulaVersion: string;
  scenarioId: string;
  scenarioName: string;
  status: WorkbenchResultView['status'];
  inputs: Record<string, unknown>;
  assumptions: WorkbenchResultView['assumptions'];
  outputs: Record<string, unknown>;
  warnings: Warning[];
  evidenceIds: string[];
  /** Explanatory answer links only — never canonical outputs. */
  answerIds: string[];
  uiState: WorkbenchResultView['uiState'];
}

function sortedRecord(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
  );
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(',')}}`;
}

function valuesEqual(left: unknown, right: unknown): boolean {
  return stableStringify(left) === stableStringify(right);
}

/**
 * Project a deterministic, key-sorted render model from a WorkbenchResultView.
 * Answer IDs are carried as links only and never folded into outputs.
 */
export function projectWorkbenchResultRenderModel(
  viewInput: WorkbenchResultView
): WorkbenchResultRenderModel {
  const view = WorkbenchResultViewSchema.parse(viewInput);
  return {
    analysisRunId: view.analysisRunId,
    resultId: view.resultId,
    capabilityId: view.capabilityId,
    formulaVersion: view.formulaVersion,
    scenarioId: view.scenario.id,
    scenarioName: view.scenario.name,
    status: view.status,
    inputs: sortedRecord(view.inputs),
    assumptions: [...view.assumptions].sort((left, right) => left.id.localeCompare(right.id)),
    outputs: sortedRecord(view.outputs),
    warnings: [...view.warnings].sort((left, right) => left.code.localeCompare(right.code)),
    evidenceIds: view.evidence.map((item) => item.id).sort(),
    answerIds: [...view.answerIds].sort(),
    uiState: view.uiState,
  };
}

export function warningsByCategory(
  warnings: readonly Warning[]
): Record<WarningCategory, Warning[]> {
  const buckets: Record<WarningCategory, Warning[]> = {
    validation: [],
    'missing-evidence': [],
    'stale-evidence': [],
    'model-uncertainty': [],
  };
  for (const warning of warnings) {
    buckets[warning.category].push(warning);
  }
  return buckets;
}

function assumptionMap(
  assumptions: WorkbenchResultView['assumptions']
): Map<string, WorkbenchResultView['assumptions'][number]> {
  return new Map(assumptions.map((assumption) => [assumption.id, assumption]));
}

/**
 * Field-level diff between two result views. Empty when views are identical.
 */
export function diffWorkbenchResultViews(
  fromInput: WorkbenchResultView,
  toInput: WorkbenchResultView
): WorkbenchRunDiff {
  const from = WorkbenchResultViewSchema.parse(fromInput);
  const to = WorkbenchResultViewSchema.parse(toInput);
  const changedFields: WorkbenchChangedField[] = [];

  const inputKeys = new Set([...Object.keys(from.inputs), ...Object.keys(to.inputs)]);
  for (const key of [...inputKeys].sort()) {
    const before = from.inputs[key];
    const after = to.inputs[key];
    if (!valuesEqual(before, after)) {
      changedFields.push({ path: `inputs.${key}`, section: 'inputs', before, after });
    }
  }

  const outputKeys = new Set([...Object.keys(from.outputs), ...Object.keys(to.outputs)]);
  for (const key of [...outputKeys].sort()) {
    const before = from.outputs[key];
    const after = to.outputs[key];
    if (!valuesEqual(before, after)) {
      changedFields.push({ path: `outputs.${key}`, section: 'outputs', before, after });
    }
  }

  const fromAssumptions = assumptionMap(from.assumptions);
  const toAssumptions = assumptionMap(to.assumptions);
  const assumptionIds = new Set([...fromAssumptions.keys(), ...toAssumptions.keys()]);
  for (const id of [...assumptionIds].sort()) {
    const before = fromAssumptions.get(id)?.value;
    const after = toAssumptions.get(id)?.value;
    if (!valuesEqual(before, after)) {
      changedFields.push({
        path: `assumptions.${id}`,
        section: 'assumptions',
        before,
        after,
      });
    }
  }

  return WorkbenchRunDiffSchema.parse({
    contractVersion: WORKBENCH_CONTRACT_VERSION,
    fromRunId: from.analysisRunId,
    toRunId: to.analysisRunId,
    fromResultId: from.resultId,
    toResultId: to.resultId,
    changedFields,
  });
}

/**
 * Compare two or more named scenario result views.
 * Requires matching capabilityId and formulaVersion; otherwise returns
 * incompatibleReason and empty diffs (fail closed for mixed units/versions).
 */
export function compareWorkbenchScenarios(
  viewsInput: readonly WorkbenchResultView[]
): WorkbenchScenarioComparison {
  if (viewsInput.length < 2) {
    throw new Error('compareWorkbenchScenarios requires at least two WorkbenchResultView entries');
  }

  const views = viewsInput.map((view) => WorkbenchResultViewSchema.parse(view));
  const capabilityId = views[0]?.capabilityId;
  const formulaVersion = views[0]?.formulaVersion;
  if (!capabilityId || !formulaVersion) {
    throw new Error('compareWorkbenchScenarios requires capabilityId and formulaVersion');
  }

  const incompatible = views.some(
    (view) => view.capabilityId !== capabilityId || view.formulaVersion !== formulaVersion
  );

  if (incompatible) {
    return WorkbenchScenarioComparisonSchema.parse({
      contractVersion: WORKBENCH_CONTRACT_VERSION,
      capabilityId,
      formulaVersion,
      scenarioNames: views.map((view) => view.scenario.name),
      resultIds: views.map((view) => view.resultId),
      diffs: [],
      incompatibleReason: 'Scenario comparison requires matching capabilityId and formulaVersion',
    });
  }

  const diffs: WorkbenchRunDiff[] = [];
  const baseline = views[0];
  if (!baseline) {
    throw new Error('compareWorkbenchScenarios missing baseline view');
  }
  for (let index = 1; index < views.length; index += 1) {
    const next = views[index];
    if (!next) continue;
    diffs.push(diffWorkbenchResultViews(baseline, next));
  }

  return WorkbenchScenarioComparisonSchema.parse({
    contractVersion: WORKBENCH_CONTRACT_VERSION,
    capabilityId,
    formulaVersion,
    scenarioNames: views.map((view) => view.scenario.name),
    resultIds: views.map((view) => view.resultId),
    diffs,
  });
}
