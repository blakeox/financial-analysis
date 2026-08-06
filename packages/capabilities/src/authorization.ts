import { z } from 'zod';

/**
 * Provider-neutral capability authorization control plane (#437).
 *
 * This module decides whether a principal may invoke a capability against a
 * resource. It does not perform authentication, store grants, or talk to
 * Cloudflare. Adapters supply a server-resolved grant snapshot and must never
 * put secrets or tokens into the request or decision.
 *
 * Product scopes (dotted) are intentionally distinct from MCP OAuth scopes
 * (`analysis:read`, …). Mapping between them belongs in transport adapters.
 */

export const AUTHZ_POLICY_VERSION = '1.0.0';

export const CAPABILITY_SCOPES = {
  FINANCIAL_CALCULATE: 'financial.calculate',
  WORKSPACE_READ: 'workspace.read',
  WORKSPACE_WRITE: 'workspace.write',
  MEMORY_SEARCH: 'memory.search',
  MEMORY_SAVE: 'memory.save',
  MEMORY_FORGET: 'memory.forget',
} as const;

export type CapabilityScope = (typeof CAPABILITY_SCOPES)[keyof typeof CAPABILITY_SCOPES];

const IdentifierSchema = z.string().trim().min(1).max(128);

export const PrincipalKindSchema = z.enum(['user', 'service', 'external-mcp']);
export type PrincipalKind = z.infer<typeof PrincipalKindSchema>;

export const CapabilityScopeSchema = z.enum([
  CAPABILITY_SCOPES.FINANCIAL_CALCULATE,
  CAPABILITY_SCOPES.WORKSPACE_READ,
  CAPABILITY_SCOPES.WORKSPACE_WRITE,
  CAPABILITY_SCOPES.MEMORY_SEARCH,
  CAPABILITY_SCOPES.MEMORY_SAVE,
  CAPABILITY_SCOPES.MEMORY_FORGET,
]);

export const ClientSurfaceSchema = z.enum([
  'first-party-agent',
  'external-mcp',
  'rest',
  'code-mode',
]);
export type ClientSurface = z.infer<typeof ClientSurfaceSchema>;

export const AuthzDecisionStateSchema = z.enum([
  'allow',
  'deny',
  'consent-required',
  'approval-required',
]);
export type AuthzDecisionState = z.infer<typeof AuthzDecisionStateSchema>;

export const AuthzResourceScopeSchema = z.enum(['stateless', 'user', 'workspace', 'case']);
export type AuthzResourceScope = z.infer<typeof AuthzResourceScopeSchema>;

export const PrincipalSchema = z.object({
  principalId: IdentifierSchema,
  kind: PrincipalKindSchema,
  userId: IdentifierSchema.optional(),
  workspaceId: IdentifierSchema.optional(),
  caseId: IdentifierSchema.optional(),
});
export type Principal = z.infer<typeof PrincipalSchema>;

/**
 * Server-resolved grant snapshot. Never include raw tokens, API keys, or OIDC
 * secrets in this object — only opaque identifiers and status.
 */
export const CapabilityGrantSchema = z.object({
  scope: CapabilityScopeSchema,
  workspaceId: IdentifierSchema.optional(),
  caseId: IdentifierSchema.optional(),
  userId: IdentifierSchema.optional(),
  status: z.enum(['active', 'revoked']),
  /** Empty / omitted means any capability that requires this scope. */
  capabilityIds: z.array(IdentifierSchema).optional(),
});
export type CapabilityGrant = z.infer<typeof CapabilityGrantSchema>;

export const AuthzResourceSchema = z.object({
  userId: IdentifierSchema.optional(),
  workspaceId: IdentifierSchema.optional(),
  caseId: IdentifierSchema.optional(),
});
export type AuthzResource = z.infer<typeof AuthzResourceSchema>;

export const AuthzRequestSchema = z.object({
  capabilityId: IdentifierSchema,
  requiredScope: CapabilityScopeSchema,
  principal: PrincipalSchema,
  resource: AuthzResourceSchema.optional(),
  grants: z.array(CapabilityGrantSchema),
  clientSurface: ClientSurfaceSchema,
  sideEffects: z.enum(['none', 'writes-state', 'external-action']).default('none'),
  /** Host-only approval receipt; never derived from model output. */
  approvalGranted: z.boolean().optional(),
});
export type AuthzRequest = z.infer<typeof AuthzRequestSchema>;

export const AuthzDecisionSchema = z.object({
  allowed: z.boolean(),
  state: AuthzDecisionStateSchema,
  policyVersion: z.literal(AUTHZ_POLICY_VERSION),
  principalId: IdentifierSchema,
  capabilityId: IdentifierSchema,
  requiredScope: CapabilityScopeSchema,
  resourceScope: AuthzResourceScopeSchema,
  reason: z.string().trim().min(1).max(512).optional(),
});
export type AuthzDecision = z.infer<typeof AuthzDecisionSchema>;

const MEMORY_SCOPES: ReadonlySet<CapabilityScope> = new Set([
  CAPABILITY_SCOPES.MEMORY_SEARCH,
  CAPABILITY_SCOPES.MEMORY_SAVE,
  CAPABILITY_SCOPES.MEMORY_FORGET,
]);

const WRITE_SCOPES: ReadonlySet<CapabilityScope> = new Set([
  CAPABILITY_SCOPES.WORKSPACE_WRITE,
  CAPABILITY_SCOPES.MEMORY_SAVE,
  CAPABILITY_SCOPES.MEMORY_FORGET,
]);

function resolveResourceScope(request: AuthzRequest): AuthzResourceScope {
  // Financial calculate is stateless by default: principal workspace/case IDs
  // must not ambiently widen the resource scope of a calculation call.
  if (
    request.requiredScope === CAPABILITY_SCOPES.FINANCIAL_CALCULATE &&
    !request.resource?.userId &&
    !request.resource?.workspaceId &&
    !request.resource?.caseId
  ) {
    return 'stateless';
  }
  if (request.resource?.caseId) {
    return 'case';
  }
  if (request.resource?.workspaceId) {
    return 'workspace';
  }
  return 'user';
}

function deny(
  request: AuthzRequest,
  reason: string,
  state: Exclude<AuthzDecisionState, 'allow'> = 'deny'
): AuthzDecision {
  return AuthzDecisionSchema.parse({
    allowed: false,
    state,
    policyVersion: AUTHZ_POLICY_VERSION,
    principalId: request.principal.principalId,
    capabilityId: request.capabilityId,
    requiredScope: request.requiredScope,
    resourceScope: resolveResourceScope(request),
    reason,
  });
}

function allow(request: AuthzRequest): AuthzDecision {
  return AuthzDecisionSchema.parse({
    allowed: true,
    state: 'allow',
    policyVersion: AUTHZ_POLICY_VERSION,
    principalId: request.principal.principalId,
    capabilityId: request.capabilityId,
    requiredScope: request.requiredScope,
    resourceScope: resolveResourceScope(request),
  });
}

function grantMatchesCapability(grant: CapabilityGrant, capabilityId: string): boolean {
  if (!grant.capabilityIds || grant.capabilityIds.length === 0) {
    return true;
  }
  return grant.capabilityIds.includes(capabilityId);
}

function grantMatchesResource(
  grant: CapabilityGrant,
  resource: AuthzResource | undefined
): boolean {
  if (grant.userId && resource?.userId && grant.userId !== resource.userId) {
    return false;
  }
  if (grant.workspaceId && resource?.workspaceId && grant.workspaceId !== resource.workspaceId) {
    return false;
  }
  if (grant.caseId && resource?.caseId && grant.caseId !== resource.caseId) {
    return false;
  }

  // Scoped grants require the matching resource dimension to be present.
  if (grant.workspaceId && !resource?.workspaceId) {
    return false;
  }
  if (grant.caseId && !resource?.caseId) {
    return false;
  }
  if (grant.userId && !resource?.userId) {
    return false;
  }

  return true;
}

function findMatchingGrants(request: AuthzRequest): CapabilityGrant[] {
  return request.grants.filter(
    (grant) =>
      grant.scope === request.requiredScope &&
      grantMatchesCapability(grant, request.capabilityId) &&
      grantMatchesResource(grant, request.resource)
  );
}

/**
 * Authorize a capability invocation against a server-resolved grant snapshot.
 * Fail closed. Decision payloads never carry secrets or tokens.
 */
export function authorizeCapability(input: AuthzRequest): AuthzDecision {
  const request = AuthzRequestSchema.parse(input);

  if (MEMORY_SCOPES.has(request.requiredScope) && request.clientSurface === 'external-mcp') {
    const memoryGrants = findMatchingGrants(request).filter((grant) => grant.status === 'active');
    if (memoryGrants.length === 0) {
      return deny(request, 'External MCP clients cannot access memory unless explicitly granted');
    }
  }

  const matching = findMatchingGrants(request);
  if (matching.length === 0) {
    return deny(request, 'No matching capability grant for the requested scope and resource');
  }

  const active = matching.filter((grant) => grant.status === 'active');
  if (active.length === 0) {
    return deny(request, 'Matching capability grant is revoked');
  }

  if (
    (WRITE_SCOPES.has(request.requiredScope) || request.sideEffects !== 'none') &&
    request.approvalGranted !== true &&
    (request.sideEffects === 'writes-state' ||
      request.sideEffects === 'external-action' ||
      WRITE_SCOPES.has(request.requiredScope))
  ) {
    // Read-only financial.calculate with sideEffects none never hits this branch.
    if (request.requiredScope !== CAPABILITY_SCOPES.FINANCIAL_CALCULATE) {
      return deny(
        request,
        'Persistent changes and consequential actions require host approval',
        'approval-required'
      );
    }
  }

  if (
    MEMORY_SCOPES.has(request.requiredScope) ||
    request.requiredScope === CAPABILITY_SCOPES.WORKSPACE_READ ||
    request.requiredScope === CAPABILITY_SCOPES.WORKSPACE_WRITE
  ) {
    const resource = request.resource;
    if (!resource?.userId && !resource?.workspaceId && !resource?.caseId) {
      return deny(
        request,
        'Memory and workspace capabilities require an explicit resource binding'
      );
    }
  }

  return allow(request);
}

export function assertCapabilityAuthorized(input: AuthzRequest): AuthzDecision {
  const decision = authorizeCapability(input);
  if (!decision.allowed) {
    throw new Error(
      `Capability ${decision.capabilityId} is not authorized for principal ${decision.principalId}: ${decision.reason ?? decision.state}`
    );
  }
  return decision;
}
