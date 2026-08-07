/**
 * MCP capability policy.
 *
 * This is intentionally separate from model tool selection. A tool may be
 * registered for first-party application use without being exposed to remote
 * MCP clients.
 *
 * Transport adapters own the mapping from MCP OAuth scopes (`analysis:read`)
 * to product scopes (`financial.calculate`). Manifest exposure, kill switches,
 * and byte limits remain MCP-local; product authorization is a second
 * fail-closed gate via `authorizeCapability`.
 */

import {
  CAPABILITY_SCOPES,
  authorizeCapability,
  type AuthzRequest,
  type CapabilityGrant,
  type CapabilityScope,
  type ClientSurface,
  type Principal,
} from '@financial-analysis/capabilities';

export const MCP_SCOPES = {
  ANALYSIS_READ: 'analysis:read',
  DOCUMENTS_READ: 'documents:read',
  DOCUMENTS_WRITE: 'documents:write',
  ADMIN: 'admin',
} as const;

/** Deployment evidence identifiers; these do not grant authorization. */
export const MCP_PROTOCOL_VERSION = '2024-11-05';
export const MCP_SERVER_VERSION = '1.0.0';
export const MCP_CAPABILITY_POLICY_VERSION = '1.0.0';

export type MCPPolicyScope = (typeof MCP_SCOPES)[keyof typeof MCP_SCOPES];

export type MCPCapabilityStatus = 'stable' | 'preview' | 'deprecated' | 'disabled';
export type MCPPolicyDecisionState =
  | 'allow'
  | 'deny'
  | 'consent-required'
  | 'approval-required'
  | 'budget-exceeded'
  | 'unavailable'
  | 'degraded';

export type MCPAuthorizationSource = 'api-key' | 'oauth' | 'internal' | 'development';
export type MCPBudgetDecision = 'not-evaluated' | 'reserved' | 'denied' | 'committed' | 'released';

export interface MCPAuthorizationContext {
  source: MCPAuthorizationSource;
  subject?: string;
  scopes: readonly string[];
  /** Optional runtime kill switch; omitted means enabled for compatibility. */
  mcpAnalysisEnabled?: boolean;
  /** Request/run correlation from the host boundary; never supplied by model output. */
  auditCorrelationId?: string;
  /** Budget lifecycle state supplied by the host reservation adapter. */
  budgetDecision?: MCPBudgetDecision;
}

export interface MCPCapabilityPolicy {
  name: string;
  exposed: boolean;
  status: MCPCapabilityStatus;
  formulaVersion: string;
  policyVersion: string;
  owner: string;
  readOnly: boolean;
  resourceScope: 'caller' | 'workspace' | 'case' | 'system';
  budgetClass: 'deterministic' | 'model' | 'external';
  approvalRequired: boolean;
  killSwitch: string;
  scope: MCPPolicyScope;
  dataClasses: readonly string[];
  maxInputBytes: number;
  maxOutputBytes: number;
  auditEvent: string;
  reason?: string;
}

export interface MCPAuthorizationDecision {
  allowed: boolean;
  state: MCPPolicyDecisionState;
  capability: string;
  principalId: string;
  resourceScope: MCPCapabilityPolicy['resourceScope'];
  budgetDecision: MCPBudgetDecision;
  auditCorrelationId: string;
  policyVersion: string;
  policy: MCPCapabilityPolicy;
  reason?: string;
}

export const MCP_POLICY_ERROR_CODE = -32004;
export const MCP_PAYLOAD_TOO_LARGE_ERROR_CODE = -32005;

/**
 * Stable error used for both undisclosed and unauthorized capabilities. The
 * caller receives no information about disabled or unreviewed tools beyond a
 * consistent policy error.
 */
export class MCPAuthorizationError extends Error {
  readonly code = MCP_POLICY_ERROR_CODE;

  constructor(readonly toolName: string) {
    super(`MCP capability ${toolName} is not authorized`);
    this.name = 'MCPAuthorizationError';
  }
}

export class MCPPayloadLimitError extends Error {
  readonly code = MCP_PAYLOAD_TOO_LARGE_ERROR_CODE;

  constructor(
    readonly toolName: string,
    readonly direction: 'input' | 'output'
  ) {
    super(`MCP ${direction} exceeds the capability limit for ${toolName}`);
    this.name = 'MCPPayloadLimitError';
  }
}

const DEFAULT_INPUT_LIMIT_BYTES = 64 * 1024;
const DEFAULT_OUTPUT_LIMIT_BYTES = 256 * 1024;

const EXTERNAL_ANALYSIS_CAPABILITIES = [
  'analyze_lease',
  'analyze_enhanced_lease',
  'analyze_amortization',
  'ebitda_forecasting',
  'ebitda_scenario_comparison',
  'analyze_bond_pricing',
  'analyze_options_pricing',
  'analyze_cash_flow',
  'analyze_auto_loan',
  'analyze_auto_loan_analysis',
  'analyze_debt_payoff',
  'analyze_savings_goal',
  'analyze_student_loans',
  'analyze_retirement_savings',
  'analyze_retirement_planning',
  'optimize_budget',
  'populate_lease_form',
  'analyze_college_savings',
  'analyze_home_buying_affordability',
  'analyze_tax_optimization',
  'analyze_insurance_needs',
  'analyze_investment_portfolio',
  'analyze_financial_journey',
  'multi_model_scenario_analysis',
  'analyze_business_expansion_loan',
  'analyze_social_security',
  'analyze_heloc',
  'analyze_refinancing',
  'analyze_fire_calculator',
  'analyze_capital_structure',
  'analyze_project_finance',
  'analyze_real_estate_investment',
  'analyze_lbo',
  'analyze_credit_risk',
  'analyze_working_capital',
  'analyze_var',
  'calculate_capm',
  'analyze_risk_adjusted_returns',
  'calculate_npv_irr',
  'analyze_break_even',
  'simulate_investment_monte_carlo',
  'calculate_dividend_reinvestment',
  'analyze_fx_hedge',
  'calculate_esg_score',
  'analyze_p2p_lending',
  'value_carbon_credits',
  'analyze_portfolio_optimization',
  'analyze_estate_planning',
  'analyze_emergency_fund',
  'analyze_net_worth',
  'analyze_401k_match',
  'analyze_ma_deal',
  'analyze_dcf_valuation',
  'calculate_wacc',
  'analyze_cca_valuation',
  'analyze_rent_vs_buy',
  'analyze_hsa_optimization',
  'analyze_roth_vs_traditional_ira',
  'analyze_tax_loss_harvesting',
  'analyze_charitable_giving',
  'analyze_car_lease_vs_buy',
  'analyze_long_term_care',
  'analyze_disability_insurance',
  'analyze_life_insurance_reassessment',
  'analyze_529_optimizer',
  'analyze_credit_score_impact',
  'analyze_inventory_optimization',
  'analyze_accounts_receivable_aging',
  'analyze_financial_ratios',
  'analyze_depreciation',
  'analyze_equipment_lease_vs_buy',
  'analyze_revenue_recognition',
  'analyze_employee_stock_options',
  'analyze_franchise_roi',
  'analyze_startup_financial_model',
  'analyze_accounts_payable_optimization',
  'analyze_cryptocurrency_tax',
  'analyze_international_tax_planning',
  'analyze_1031_exchange',
  'analyze_business_succession_planning',
  'analyze_supply_chain_finance',
] as const;

const INTERNAL_ONLY_CAPABILITIES: Record<string, { scope: MCPPolicyScope; reason: string }> = {
  interactive_financial_model: {
    scope: MCP_SCOPES.ANALYSIS_READ,
    reason: 'Interactive model state is not part of stateless external MCP.',
  },
  cache_document: {
    scope: MCP_SCOPES.DOCUMENTS_WRITE,
    reason: 'Document writes require a separate data-access policy.',
  },
  search_documents: {
    scope: MCP_SCOPES.DOCUMENTS_READ,
    reason: 'Document retrieval requires a separate data-access policy.',
  },
  get_document: {
    scope: MCP_SCOPES.DOCUMENTS_READ,
    reason: 'Document retrieval requires a separate data-access policy.',
  },
  clear_expired_documents: {
    scope: MCP_SCOPES.ADMIN,
    reason: 'Document cleanup is an administrative operation.',
  },
};

function createStablePolicy(name: string): MCPCapabilityPolicy {
  return {
    name,
    exposed: true,
    status: 'stable',
    formulaVersion: '1.0.0',
    policyVersion: MCP_CAPABILITY_POLICY_VERSION,
    owner: 'MCP/platform',
    readOnly: true,
    resourceScope: 'caller',
    budgetClass: 'deterministic',
    approvalRequired: false,
    killSwitch: 'MCP_ANALYSIS_ENABLED',
    scope: MCP_SCOPES.ANALYSIS_READ,
    dataClasses: ['caller-provided-analysis-input'],
    maxInputBytes: DEFAULT_INPUT_LIMIT_BYTES,
    maxOutputBytes: DEFAULT_OUTPUT_LIMIT_BYTES,
    auditEvent: 'mcp.analysis.execute',
  };
}

function createDisabledPolicy(
  name: string,
  scope: MCPPolicyScope,
  reason: string
): MCPCapabilityPolicy {
  return {
    name,
    exposed: false,
    status: 'disabled',
    formulaVersion: '1.0.0',
    policyVersion: MCP_CAPABILITY_POLICY_VERSION,
    owner: 'MCP/platform',
    readOnly: true,
    resourceScope: 'caller',
    budgetClass: 'deterministic',
    approvalRequired: false,
    killSwitch: 'MCP_ANALYSIS_ENABLED',
    scope,
    dataClasses: ['user-or-external-data'],
    maxInputBytes: DEFAULT_INPUT_LIMIT_BYTES,
    maxOutputBytes: DEFAULT_OUTPUT_LIMIT_BYTES,
    auditEvent: 'mcp.capability.denied',
    reason,
  };
}

/** Explicit reviewed manifest. New registrations are not exposed by default. */
export const MCP_CAPABILITY_MANIFEST: Readonly<Record<string, MCPCapabilityPolicy>> = {
  ...Object.fromEntries(
    EXTERNAL_ANALYSIS_CAPABILITIES.map((name) => [name, createStablePolicy(name)])
  ),
  ...Object.fromEntries(
    Object.entries(INTERNAL_ONLY_CAPABILITIES).map(([name, definition]) => [
      name,
      createDisabledPolicy(name, definition.scope, definition.reason),
    ])
  ),
};

/** Return a safe default-deny policy for an unreviewed registration. */
export function getMCPCapabilityPolicy(toolName: string): MCPCapabilityPolicy {
  return (
    MCP_CAPABILITY_MANIFEST[toolName] ??
    createDisabledPolicy(toolName, MCP_SCOPES.ANALYSIS_READ, 'Capability is not reviewed.')
  );
}

function toClientSurface(source: MCPAuthorizationSource): ClientSurface {
  switch (source) {
    case 'api-key':
    case 'oauth':
      return 'external-mcp';
    case 'internal':
      return 'first-party-agent';
    case 'development':
      return 'rest';
    default: {
      const _exhaustive: never = source;
      return _exhaustive;
    }
  }
}

function toPrincipal(authorization: MCPAuthorizationContext): Principal {
  const principalId = authorization.subject?.trim() || 'anonymous';
  switch (authorization.source) {
    case 'api-key':
    case 'oauth':
      return { principalId, kind: 'external-mcp' };
    case 'internal':
      return { principalId, kind: 'service' };
    case 'development':
      return { principalId, kind: 'user' };
    default: {
      const _exhaustive: never = authorization.source;
      return _exhaustive;
    }
  }
}

/**
 * Map MCP OAuth / API-key scopes onto product capability grants.
 * `analysis:read` ≈ `financial.calculate`. Document/admin scopes do not mint
 * product grants until those product scopes are explicitly modeled for MCP.
 */
export function buildProductGrantsFromMCPScopes(
  scopes: readonly string[]
): readonly CapabilityGrant[] {
  const grants: CapabilityGrant[] = [];
  if (scopes.includes(MCP_SCOPES.ANALYSIS_READ)) {
    grants.push({
      scope: CAPABILITY_SCOPES.FINANCIAL_CALCULATE,
      status: 'active',
    });
  }
  return grants;
}

export function mcpPolicyScopeToProductScope(scope: MCPPolicyScope): CapabilityScope {
  switch (scope) {
    case MCP_SCOPES.ANALYSIS_READ:
      return CAPABILITY_SCOPES.FINANCIAL_CALCULATE;
    case MCP_SCOPES.DOCUMENTS_READ:
      return CAPABILITY_SCOPES.WORKSPACE_READ;
    case MCP_SCOPES.DOCUMENTS_WRITE:
    case MCP_SCOPES.ADMIN:
      return CAPABILITY_SCOPES.WORKSPACE_WRITE;
    default: {
      const _exhaustive: never = scope;
      return _exhaustive;
    }
  }
}

/**
 * Build the provider-neutral authz request for an MCP capability call.
 * Never includes secrets or tokens — only opaque principal IDs and grants.
 */
export function buildProductAuthzRequestFromMCP(
  toolName: string,
  authorization: MCPAuthorizationContext,
  policy: MCPCapabilityPolicy = getMCPCapabilityPolicy(toolName)
): AuthzRequest {
  const requiredScope = mcpPolicyScopeToProductScope(policy.scope);
  const request: AuthzRequest = {
    capabilityId: toolName,
    requiredScope,
    principal: toPrincipal(authorization),
    grants: [...buildProductGrantsFromMCPScopes(authorization.scopes)],
    clientSurface: toClientSurface(authorization.source),
    sideEffects: policy.readOnly ? 'none' : 'writes-state',
  };

  if (
    requiredScope === CAPABILITY_SCOPES.WORKSPACE_READ ||
    requiredScope === CAPABILITY_SCOPES.WORKSPACE_WRITE ||
    requiredScope === CAPABILITY_SCOPES.MEMORY_SEARCH ||
    requiredScope === CAPABILITY_SCOPES.MEMORY_SAVE ||
    requiredScope === CAPABILITY_SCOPES.MEMORY_FORGET
  ) {
    // Stateless MCP analysis must not ambiently bind workspace/case memory.
    // Resource-bound scopes without an explicit resource fail closed in authz.
    return request;
  }

  return request;
}

export function authorizeMCPCapability(
  toolName: string,
  authorization: MCPAuthorizationContext
): MCPAuthorizationDecision {
  const policy = getMCPCapabilityPolicy(toolName);
  const killSwitchEnabled =
    policy.killSwitch === 'MCP_ANALYSIS_ENABLED'
      ? authorization.mcpAnalysisEnabled !== false
      : true;

  const principalId = authorization.subject?.trim() || 'anonymous';
  const baseDecision = {
    capability: policy.name,
    principalId,
    resourceScope: policy.resourceScope,
    budgetDecision: authorization.budgetDecision ?? ('not-evaluated' as const),
    auditCorrelationId:
      authorization.auditCorrelationId?.trim() || `missing-correlation:${policy.name}`,
    policyVersion: policy.policyVersion,
    policy,
  };

  if (!killSwitchEnabled) {
    return {
      ...baseDecision,
      allowed: false,
      state: 'unavailable',
      reason: policy.reason ?? 'Required capability scope is missing.',
    };
  }

  const manifestAllowed =
    policy.exposed && policy.status === 'stable' && authorization.scopes.includes(policy.scope);

  if (!manifestAllowed) {
    return {
      ...baseDecision,
      allowed: false,
      state: 'deny',
      reason: policy.reason ?? 'Required capability scope is missing.',
    };
  }

  const productDecision = authorizeCapability(
    buildProductAuthzRequestFromMCP(toolName, authorization, policy)
  );

  if (!productDecision.allowed) {
    const state =
      productDecision.state === 'approval-required' || productDecision.state === 'consent-required'
        ? productDecision.state
        : 'deny';
    return {
      ...baseDecision,
      allowed: false,
      state,
      reason: productDecision.reason ?? 'Product authorization denied the capability.',
    };
  }

  return {
    ...baseDecision,
    allowed: true,
    state: 'allow',
  };
}

export function assertMCPCapabilityAuthorized(
  toolName: string,
  authorization: MCPAuthorizationContext
): MCPCapabilityPolicy {
  const decision = authorizeMCPCapability(toolName, authorization);
  if (!decision.allowed) {
    throw new MCPAuthorizationError(toolName);
  }
  return decision.policy;
}

function serializedByteLength(value: unknown): number {
  const serialized = JSON.stringify(value ?? null);
  return encodeURIComponent(serialized).replace(/%[0-9A-F]{2}/gi, 'x').length;
}

export function assertMCPInputWithinPolicy(policy: MCPCapabilityPolicy, input: unknown): void {
  if (serializedByteLength(input) > policy.maxInputBytes) {
    throw new MCPPayloadLimitError(policy.name, 'input');
  }
}

export function assertMCPOutputWithinPolicy(policy: MCPCapabilityPolicy, output: unknown): void {
  if (serializedByteLength(output) > policy.maxOutputBytes) {
    throw new MCPPayloadLimitError(policy.name, 'output');
  }
}

export function getMCPExternalCapabilityNames(): readonly string[] {
  return EXTERNAL_ANALYSIS_CAPABILITIES;
}
