/**
 * Provider-neutral policy for future Cloudflare Code Mode execution.
 *
 * Code Mode is an orchestration surface, not an authorization boundary. The
 * host must authorize every underlying capability, keep credentials outside
 * generated code, and use a separate connector egress policy for network
 * access. This module is intentionally pure so another sandbox implementation
 * can replace Cloudflare's runtime without changing the policy contract.
 */

import {
  authorizeMCPCapability,
  type MCPAuthorizationContext,
  type MCPAuthorizationDecision,
} from '@financial-analysis/tools';

export const CODE_MODE_POLICY_VERSION = '1.0.0';

const DEFAULT_MAX_TOOL_CALLS = 25;
const DEFAULT_MAX_OUTPUT_BYTES = 262_144;
const DEFAULT_MAX_WALL_TIME_MS = 15_000;
const MAX_TOOL_CALLS = 100;
const MAX_OUTPUT_BYTES = 1_048_576;
const MAX_WALL_TIME_MS = 60_000;

export interface CodeModePolicyConfig {
  enabled?: string | undefined;
  allowedCapabilities?: string | undefined;
  connectorEgressEnabled?: string | undefined;
  maxToolCalls?: string | undefined;
  maxOutputBytes?: string | undefined;
  maxWallTimeMs?: string | undefined;
}

export interface CodeModePolicy {
  enabled: boolean;
  allowedCapabilities: readonly string[];
  connectorEgressEnabled: boolean;
  maxToolCalls: number;
  maxOutputBytes: number;
  maxWallTimeMs: number;
  /** Generated code never receives these authorities from this policy. */
  ambientCredentials: false;
  filesystem: false;
}

export interface CodeModeExecutionRequest {
  capabilities: readonly string[];
  /** Optional host-measured generated request size for shared budget accounting. */
  requestBytes?: number;
  toolCalls?: number;
  outputBytes?: number;
  wallTimeMs?: number;
  requestsExternalNetwork?: boolean;
  requestsFilesystem?: boolean;
  requestsAmbientCredentials?: boolean;
  requestsWrite?: boolean;
  requestsMemory?: boolean;
  /** Must be a server-side approval receipt, never an LLM-provided boolean. */
  approvalGranted?: boolean;
}

export type CodeModeDecisionCode =
  | 'ALLOW'
  | 'CODE_MODE_DISABLED'
  | 'CAPABILITY_NOT_ALLOWED'
  | 'CAPABILITY_REGISTRY_PENDING'
  | 'BUDGET_EXCEEDED'
  | 'CONNECTORS_DISABLED'
  | 'SANDBOX_AUTHORITY_DENIED'
  | 'APPROVAL_REQUIRED';

export interface CodeModeDecision {
  allowed: boolean;
  code: CodeModeDecisionCode;
  policyVersion: typeof CODE_MODE_POLICY_VERSION;
  reason: string;
}

export interface CodeModeCapabilityDecision extends CodeModeDecision {
  capability: string;
  mcpDecision: MCPAuthorizationDecision;
}

function parseBoundedInteger(value: string | undefined, fallback: number, maximum: number): number {
  const parsed = value?.trim() ? Number(value) : fallback;
  return Number.isInteger(parsed) && parsed > 0 && parsed <= maximum ? parsed : fallback;
}

export function parseAllowedCodeModeCapabilities(value?: string): string[] {
  return [
    ...new Set(
      (value ?? '')
        .split(',')
        .map((capability) => capability.trim().toLowerCase())
        .filter((capability) => /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/.test(capability))
    ),
  ].sort();
}

export function codeModePolicyFromConfig(config: CodeModePolicyConfig): CodeModePolicy {
  const maxToolCalls = parseBoundedInteger(
    config.maxToolCalls,
    DEFAULT_MAX_TOOL_CALLS,
    MAX_TOOL_CALLS
  );
  const maxOutputBytes = parseBoundedInteger(
    config.maxOutputBytes,
    DEFAULT_MAX_OUTPUT_BYTES,
    MAX_OUTPUT_BYTES
  );
  const maxWallTimeMs = parseBoundedInteger(
    config.maxWallTimeMs,
    DEFAULT_MAX_WALL_TIME_MS,
    MAX_WALL_TIME_MS
  );

  return {
    enabled: config.enabled?.trim().toLowerCase() === 'true',
    allowedCapabilities: parseAllowedCodeModeCapabilities(config.allowedCapabilities),
    connectorEgressEnabled: config.connectorEgressEnabled?.trim().toLowerCase() === 'true',
    maxToolCalls,
    maxOutputBytes,
    maxWallTimeMs,
    ambientCredentials: false,
    filesystem: false,
  };
}

function deny(code: Exclude<CodeModeDecisionCode, 'ALLOW'>, reason: string): CodeModeDecision {
  return { allowed: false, code, policyVersion: CODE_MODE_POLICY_VERSION, reason };
}

export function evaluateCodeModeExecution(
  policy: CodeModePolicy,
  request: CodeModeExecutionRequest
): CodeModeDecision {
  if (!policy.enabled) {
    return deny('CODE_MODE_DISABLED', 'Code Mode is disabled by the environment kill switch.');
  }

  if (
    request.requestsFilesystem ||
    request.requestsAmbientCredentials ||
    policy.filesystem ||
    policy.ambientCredentials
  ) {
    return deny(
      'SANDBOX_AUTHORITY_DENIED',
      'Generated code cannot receive filesystem access or ambient credentials.'
    );
  }

  const requestedCapabilities = [
    ...new Set(request.capabilities.map((name) => name.trim().toLowerCase())),
  ];
  if (
    requestedCapabilities.some(
      (capability) => !capability || !policy.allowedCapabilities.includes(capability)
    )
  ) {
    return deny(
      'CAPABILITY_NOT_ALLOWED',
      'Every Code Mode capability must be explicitly allowlisted.'
    );
  }

  if (
    (request.toolCalls ?? 0) > policy.maxToolCalls ||
    (request.outputBytes ?? 0) > policy.maxOutputBytes ||
    (request.wallTimeMs ?? 0) > policy.maxWallTimeMs
  ) {
    return deny('BUDGET_EXCEEDED', 'Code Mode execution exceeds its bounded resource policy.');
  }

  if (request.requestsExternalNetwork && !policy.connectorEgressEnabled) {
    return deny(
      'CONNECTORS_DISABLED',
      'External network access requires the connector kill switch.'
    );
  }

  if ((request.requestsWrite || request.requestsMemory) && !request.approvalGranted) {
    return deny(
      'APPROVAL_REQUIRED',
      'Writes and persistent memory changes require a trusted human approval receipt.'
    );
  }

  return {
    allowed: true,
    code: 'ALLOW',
    policyVersion: CODE_MODE_POLICY_VERSION,
    reason: 'Code Mode execution satisfies the bounded host policy.',
  };
}

/**
 * Authorize one underlying capability through the shared MCP manifest before
 * applying the Code Mode sandbox policy. A generated program cannot use this
 * adapter to bypass the normal scope, kill-switch, or resource checks.
 */
export function authorizeCodeModeCapability(
  policy: CodeModePolicy,
  capability: string,
  request: CodeModeExecutionRequest,
  authorization: MCPAuthorizationContext
): CodeModeCapabilityDecision {
  const mcpDecision = authorizeMCPCapability(capability, authorization);
  if (!mcpDecision.allowed) {
    return {
      allowed: false,
      code: 'CAPABILITY_NOT_ALLOWED',
      policyVersion: CODE_MODE_POLICY_VERSION,
      reason: 'The shared capability policy denied the underlying Code Mode capability.',
      capability,
      mcpDecision,
    };
  }

  if (mcpDecision.policy.registryStatus !== 'canonical') {
    return {
      allowed: false,
      code: 'CAPABILITY_REGISTRY_PENDING',
      policyVersion: CODE_MODE_POLICY_VERSION,
      reason:
        'Code Mode may invoke only capabilities with canonical registry provenance; this capability is still transitional.',
      capability,
      mcpDecision,
    };
  }

  const codeModeDecision = evaluateCodeModeExecution(policy, {
    ...request,
    capabilities: request.capabilities.includes(capability)
      ? request.capabilities
      : [...request.capabilities, capability],
  });
  return { ...codeModeDecision, capability, mcpDecision };
}
