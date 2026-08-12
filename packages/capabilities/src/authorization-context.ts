import {
  AuthzRequestSchema,
  CapabilityGrantSchema,
  ClientSurfaceSchema,
  PrincipalSchema,
  type AuthzRequest,
  type AuthzResource,
  type CapabilityGrant,
  type CapabilityScope,
  type ClientSurface,
  type Principal,
} from './authorization.js';
import { z } from 'zod';

/**
 * Provider-neutral authentication provenance.
 *
 * This is metadata about a server-verified credential, never the credential
 * itself. API keys, OAuth/OIDC, and Cloudflare Access must converge on the
 * same opaque-principal and grant contract before policy evaluation.
 */
export const AuthenticationMethodSchema = z.enum([
  'api-key',
  'oauth',
  'cloudflare-access',
  'internal',
  'development',
]);
export type AuthenticationMethod = z.infer<typeof AuthenticationMethodSchema>;

const CorrelationIdSchema = z.string().trim().min(1).max(128);

/**
 * Strict by design: passing a token, secret, API key, or unrecognized field is
 * a contract error rather than something silently carried downstream.
 */
export const CapabilityAuthorizationContextSchema = z.strictObject({
  authenticationMethod: AuthenticationMethodSchema,
  principal: PrincipalSchema,
  grants: z.array(CapabilityGrantSchema).max(128),
  clientSurface: ClientSurfaceSchema,
  auditCorrelationId: CorrelationIdSchema.optional(),
  issuer: z.string().url().max(512).optional(),
});

export type CapabilityAuthorizationContext = z.infer<typeof CapabilityAuthorizationContextSchema>;

export interface CreateCapabilityAuthorizationContextInput {
  authenticationMethod: AuthenticationMethod;
  principal: Principal;
  grants: readonly CapabilityGrant[];
  clientSurface: ClientSurface;
  auditCorrelationId?: string;
  issuer?: string;
}

/**
 * Parse a server-resolved identity and grant snapshot.
 *
 * No raw credential is accepted by this API. Callers must authenticate first,
 * then pass only opaque identifiers and active/revoked grant metadata.
 */
export function createCapabilityAuthorizationContext(
  input: CreateCapabilityAuthorizationContextInput
): CapabilityAuthorizationContext {
  return CapabilityAuthorizationContextSchema.parse({
    ...input,
    grants: [...input.grants],
  });
}

/**
 * Normalize an external MCP principal regardless of whether its credential
 * came from an API key, OAuth/OIDC, or Cloudflare Access.
 */
export function createExternalMcpAuthorizationContext(input: {
  authenticationMethod: Extract<AuthenticationMethod, 'api-key' | 'oauth' | 'cloudflare-access'>;
  principalId: string;
  grants: readonly CapabilityGrant[];
  auditCorrelationId?: string;
  issuer?: string;
}): CapabilityAuthorizationContext {
  return createCapabilityAuthorizationContext({
    authenticationMethod: input.authenticationMethod,
    principal: { principalId: input.principalId, kind: 'external-mcp' },
    grants: input.grants,
    clientSurface: 'external-mcp',
    ...(input.auditCorrelationId ? { auditCorrelationId: input.auditCorrelationId } : {}),
    ...(input.issuer ? { issuer: input.issuer } : {}),
  });
}

export interface BuildAuthzRequestOptions {
  capabilityId: string;
  requiredScope: CapabilityScope;
  resource?: AuthzResource;
  sideEffects?: AuthzRequest['sideEffects'];
  approvalGranted?: boolean;
}

/**
 * Build the canonical policy request used by every execution surface.
 * Resource binding is explicit; it is never inferred from a credential.
 */
export function buildAuthzRequestFromContext(
  context: CapabilityAuthorizationContext,
  options: BuildAuthzRequestOptions
): AuthzRequest {
  return AuthzRequestSchema.parse({
    capabilityId: options.capabilityId,
    requiredScope: options.requiredScope,
    principal: context.principal,
    ...(options.resource ? { resource: options.resource } : {}),
    grants: context.grants,
    clientSurface: context.clientSurface,
    sideEffects: options.sideEffects ?? 'none',
    ...(options.approvalGranted !== undefined ? { approvalGranted: options.approvalGranted } : {}),
  });
}

export function assertCapabilityAuthorizationContext(
  input: unknown
): CapabilityAuthorizationContext {
  return CapabilityAuthorizationContextSchema.parse(input);
}
